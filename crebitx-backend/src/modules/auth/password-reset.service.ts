import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { DatabaseService } from '@/database/database.service';
import { EmailProviderService } from './providers/email-provider.service';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESEND_COOLDOWN_MS = 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly emailProvider: EmailProviderService,
    private readonly config: ConfigService,
  ) {}

  private frontendUrl(): string {
    return (
      this.config.get<string>('FRONTEND_URL') ||
      this.config.get<string>('CORS_ORIGIN') ||
      'http://localhost:3002'
    );
  }

  /**
   * Always returns a generic success shape regardless of whether the email
   * exists, to avoid leaking account existence to an unauthenticated caller.
   */
  async requestReset(email: string) {
    const user = await this.db.queryOne<{ id: string; first_name: string | null }>(
      'SELECT id, first_name FROM users WHERE email = $1 AND deleted_at IS NULL AND status = $2',
      [email, 'ACTIVE'],
    );

    if (!user) {
      return { success: true };
    }

    const recent = await this.db.queryOne<{ created_at: string }>(
      `SELECT created_at FROM password_reset_tokens
       WHERE user_id = $1 AND consumed_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [user.id],
    );

    if (recent && Date.now() - new Date(recent.created_at).getTime() < RESEND_COOLDOWN_MS) {
      return { success: true };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await this.db.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt],
    );

    const link = `${this.frontendUrl()}/reset-password?token=${rawToken}`;

    const result = await this.emailProvider.sendEmail(
      email,
      'Reset your CREBITX password',
      `<p>Hi ${user.first_name || 'there'},</p>
       <p>We received a request to reset your CREBITX password. Click the link below to choose a new one:</p>
       <p><a href="${link}">${link}</a></p>
       <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
    );

    if (!result.success) {
      this.logger.error(`Failed to send password reset email to ${email}: ${result.error}`);
    }

    return { success: true };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = hashToken(rawToken);

    const record = await this.db.queryOne<{ id: string; user_id: string; expires_at: string }>(
      `SELECT id, user_id, expires_at FROM password_reset_tokens
       WHERE token_hash = $1 AND consumed_at IS NULL`,
      [tokenHash],
    );

    if (!record) {
      throw new BadRequestException('Invalid or already-used reset link');
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('This reset link has expired. Request a new one.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      passwordHash,
      record.user_id,
    ]);
    await this.db.query('UPDATE password_reset_tokens SET consumed_at = NOW() WHERE id = $1', [
      record.id,
    ]);

    this.logger.log(`User ${record.user_id} reset their password`);

    return { success: true };
  }
}
