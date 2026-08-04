import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '@/database/database.service';
import { LoggerService } from '@/common/services/logger.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AuthTokens, JwtPayload, RegisterResult } from './interfaces/auth.interface';
import { EmailVerificationService } from './email-verification.service';

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: LoggerService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResult> {
    const { email, password, firstName, lastName, phone, tenantName, tenantSlug } = registerDto;

    // Check if user exists
    const existingUser = await this.databaseService.queryOne(
      'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email],
    );

    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    // Hash password
    const bcryptRounds = this.configService.get('security.bcryptRounds', 10);
    const passwordHash = await bcrypt.hash(password, bcryptRounds);

    // Generate tenant slug if not provided
    const slug = tenantSlug || tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Create user and tenant in transaction
    const result = await this.databaseService.transaction(async (client) => {
      // Create tenant
      const tenantResult = await client.query(
        `INSERT INTO tenants (name, slug, status, subscription_plan)
         VALUES ($1, $2, 'ACTIVE', 'FREE')
         RETURNING id, name, slug`,
        [tenantName, slug],
      );
      const tenant = tenantResult.rows[0];

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, status)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
         RETURNING id, email, first_name, last_name, phone`,
        [email, passwordHash, firstName, lastName, phone],
      );
      const user = userResult.rows[0];

      // Get TENANT_OWNER role
      const roleResult = await client.query(
        `SELECT id FROM roles WHERE name = 'TENANT_OWNER' LIMIT 1`,
      );
      const role = roleResult.rows[0];

      // Assign user to tenant with OWNER role
      await client.query(
        `INSERT INTO tenant_users (tenant_id, user_id, role_id, status)
         VALUES ($1, $2, $3, 'ACTIVE')`,
        [tenant.id, user.id, role.id],
      );

      // Create audit log
      await client.query(
        `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, 'USER_REGISTERED', 'USER', $2, $3)`,
        [tenant.id, user.id, JSON.stringify({ source: 'registration' })],
      );

      return { user, tenant, role: 'TENANT_OWNER' };
    });

    this.logger.log(`User registered: ${email}`, 'AuthService');

    // Send verification email; login is blocked until the link is confirmed.
    await this.emailVerificationService.sendVerificationEmail(
      result.user.id,
      result.user.email,
      result.user.first_name,
    );

    return { success: true, requiresVerification: true, email: result.user.email };
  }

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    const { email, password } = loginDto;

    // Get user with tenant and role info
    const user = await this.databaseService.queryOne(
      `SELECT
        u.id, u.email, u.password_hash, u.status, u.is_email_verified,
        tu.tenant_id, r.name as role
       FROM users u
       INNER JOIN tenant_users tu ON u.id = tu.user_id
       INNER JOIN roles r ON tu.role_id = r.id
       WHERE u.email = $1 AND u.deleted_at IS NULL
       LIMIT 1`,
      [email],
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_email_verified) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before logging in.',
      });
    }

    // Update last login
    await this.databaseService.query(
      `UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id],
    );

    // Create audit log
    await this.databaseService.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'USER_LOGIN', 'USER', $2)`,
      [user.tenant_id, user.id],
    );

    this.logger.log(`User logged in: ${email}`, 'AuthService');

    // Generate tokens
    return this.generateTokens({
      sub: user.id,
      email: user.email,
      tenantId: user.tenant_id,
      role: user.role,
    });
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);

      // Verify user still exists and is active
      const user = await this.databaseService.queryOne(
        `SELECT id, email, status FROM users WHERE id = $1 AND deleted_at IS NULL`,
        [payload.sub],
      );

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      return this.generateTokens({
        sub: payload.sub,
        email: payload.email,
        tenantId: payload.tenantId,
        role: payload.role,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.databaseService.queryOne(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.status,
        tu.tenant_id, r.name as role
       FROM users u
       INNER JOIN tenant_users tu ON u.id = tu.user_id
       INNER JOIN roles r ON tu.role_id = r.id
       WHERE u.id = $1 AND u.deleted_at IS NULL
       LIMIT 1`,
      [payload.sub],
    );

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      tenantId: user.tenant_id,
      role: user.role,
    };
  }

  private generateTokens(payload: JwtPayload): AuthTokens {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.accessTokenExpiry', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.refreshTokenExpiry', '7d'),
    });

    return { accessToken, refreshToken };
  }
}
