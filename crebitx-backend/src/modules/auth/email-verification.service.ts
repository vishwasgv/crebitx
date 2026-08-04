import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { DatabaseService } from '@/database/database.service';
import { EmailProviderService } from './providers/email-provider.service';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESEND_COOLDOWN_MS = 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Link-based email verification (gates login until complete), separate from
 * the SMS OTP flow in otp.service.ts. Tokens are looked up by their hash
 * directly — there is no authenticated session yet when the link is opened.
 */
@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

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
   * Generates a new token and emails the verification link. Used both right
   * after registration and for resend requests.
   */
  async sendVerificationEmail(userId: string, email: string, firstName?: string) {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await this.db.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );

    const link = `${this.frontendUrl()}/verify-email?token=${rawToken}`;

    const result = await this.emailProvider.sendEmail(
      email,
      'Verify your CREBITX email address',
      `<p>Hi ${firstName || 'there'},</p>
       <p>Please confirm your email address to activate your CREBITX account:</p>
       <p><a href="${link}">${link}</a></p>
       <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>`,
    );

    if (!result.success) {
      this.logger.error(`Failed to send verification email to ${email}: ${result.error}`);
    }

    return result;
  }

  /**
   * Resend, keyed only by email since the caller isn't authenticated yet.
   * Always returns a generic success shape regardless of whether the email
   * exists or is already verified, to avoid leaking account existence.
   */
  async resend(email: string) {
    const user = await this.db.queryOne<{
      id: string;
      first_name: string | null;
      is_email_verified: boolean;
    }>(
      'SELECT id, first_name, is_email_verified FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email],
    );

    if (!user || user.is_email_verified) {
      return { success: true };
    }

    const recent = await this.db.queryOne<{ created_at: string }>(
      `SELECT created_at FROM email_verification_tokens
       WHERE user_id = $1 AND consumed_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [user.id],
    );

    if (recent && Date.now() - new Date(recent.created_at).getTime() < RESEND_COOLDOWN_MS) {
      return { success: true };
    }

    await this.sendVerificationEmail(user.id, email, user.first_name || undefined);
    return { success: true };
  }

  async verifyToken(rawToken: string) {
    const tokenHash = hashToken(rawToken);

    const record = await this.db.queryOne<{ id: string; user_id: string; expires_at: string }>(
      `SELECT id, user_id, expires_at FROM email_verification_tokens
       WHERE token_hash = $1 AND consumed_at IS NULL`,
      [tokenHash],
    );

    if (!record) {
      throw new BadRequestException('Invalid or already-used verification link');
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('This verification link has expired. Request a new one.');
    }

    const user = await this.db.queryOne<{ id: string }>(
      'SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL',
      [record.user_id],
    );
    if (!user) {
      throw new NotFoundException('Account not found');
    }

    await this.db.query('UPDATE email_verification_tokens SET consumed_at = NOW() WHERE id = $1', [
      record.id,
    ]);
    await this.db.query(
      'UPDATE users SET is_email_verified = TRUE, email_verified_at = NOW() WHERE id = $1',
      [record.user_id],
    );

    this.logger.log(`User ${record.user_id} verified their email`);

    return { success: true, verified: true };
  }
}
