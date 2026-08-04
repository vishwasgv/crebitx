import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { DatabaseService } from '@/database/database.service';
import { SmsProviderService } from './providers/sms-provider.service';

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function maskPhone(target: string): string {
  return target.length > 4 ? `${'*'.repeat(target.length - 4)}${target.slice(-4)}` : target;
}

/**
 * Phone verification via SMS OTP. Email verification is handled separately
 * by EmailVerificationService (link-based, since it also gates login and
 * must work for an unauthenticated caller who clicks the link).
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly sms: SmsProviderService,
  ) {}

  async sendOtp(userId: string) {
    const user = await this.db.queryOne<{ phone: string | null; is_phone_verified: boolean }>(
      'SELECT phone, is_phone_verified FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId],
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.phone) {
      throw new BadRequestException('No phone number on file for this account');
    }

    if (user.is_phone_verified) {
      return { success: true, alreadyVerified: true, target: maskPhone(user.phone) };
    }

    const recent = await this.db.queryOne<{ created_at: string }>(
      `SELECT created_at FROM otp_codes
       WHERE user_id = $1 AND channel = 'PHONE' AND consumed_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );

    if (recent && Date.now() - new Date(recent.created_at).getTime() < RESEND_COOLDOWN_MS) {
      throw new BadRequestException('Please wait a minute before requesting another code');
    }

    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await this.db.query(
      `INSERT INTO otp_codes (user_id, channel, target, code_hash, expires_at)
       VALUES ($1, 'PHONE', $2, $3, $4)`,
      [userId, user.phone, codeHash, expiresAt],
    );

    const result = await this.sms.sendSms(
      user.phone,
      `Your CREBITX verification code is ${code}. It expires in 10 minutes.`,
    );

    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to send code via SMS');
    }

    this.logger.log(`OTP sent to user ${userId} via PHONE (provider=${result.provider})`);

    return {
      success: true,
      alreadyVerified: false,
      target: maskPhone(user.phone),
      expiresInSeconds: CODE_TTL_MS / 1000,
    };
  }

  async confirmOtp(userId: string, code: string) {
    const otp = await this.db.queryOne<{
      id: string;
      code_hash: string;
      expires_at: string;
      attempts: number;
    }>(
      `SELECT id, code_hash, expires_at, attempts FROM otp_codes
       WHERE user_id = $1 AND channel = 'PHONE' AND consumed_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );

    if (!otp) {
      throw new BadRequestException('No pending verification code. Request a new one.');
    }

    if (new Date(otp.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('Code expired. Request a new one.');
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Too many incorrect attempts. Request a new one.');
    }

    const matches = await bcrypt.compare(code, otp.code_hash);

    if (!matches) {
      await this.db.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [otp.id]);
      throw new BadRequestException('Incorrect code');
    }

    await this.db.query('UPDATE otp_codes SET consumed_at = NOW() WHERE id = $1', [otp.id]);
    await this.db.query(
      'UPDATE users SET is_phone_verified = TRUE, phone_verified_at = NOW() WHERE id = $1',
      [userId],
    );

    this.logger.log(`User ${userId} verified their phone`);

    return { success: true, verified: true };
  }

  async getStatus(userId: string) {
    const user = await this.db.queryOne<{
      is_phone_verified: boolean;
      is_email_verified: boolean;
      phone: string | null;
      email: string;
    }>(
      'SELECT is_phone_verified, is_email_verified, phone, email FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId],
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      isPhoneVerified: user.is_phone_verified,
      isEmailVerified: user.is_email_verified,
      phone: user.phone ? maskPhone(user.phone) : null,
      email: user.email,
    };
  }
}
