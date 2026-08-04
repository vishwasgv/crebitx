import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  error?: string;
}

/**
 * Sends email via SMTP (e.g. Gmail) when SMTP_HOST/SMTP_USERNAME/SMTP_PASSWORD
 * are configured. Falls back to logging the message (dev/local, or if the
 * account isn't set up yet) so the OTP flow never hard-fails just because a
 * provider isn't wired up.
 */
@Injectable()
export class EmailProviderService {
  private readonly logger = new Logger(EmailProviderService.name);
  private transporter: nodemailer.Transporter | null = null;
  private transporterInitAttempted = false;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporterInitAttempted) return this.transporter;
    this.transporterInitAttempted = true;

    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const username = this.config.get<string>('SMTP_USERNAME')?.trim();
    // Gmail displays App Passwords in space-separated groups of 4 for
    // readability, but the actual secret has no spaces — strip them so a
    // copy-pasted "abcd efgh ijkl mnop" still authenticates correctly.
    const password = this.config.get<string>('SMTP_PASSWORD')?.replace(/\s+/g, '');

    if (!host || !username || !password) {
      return null;
    }

    try {
      const port = parseInt(this.config.get<string>('SMTP_PORT') || '587', 10);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: username, pass: password },
      });
    } catch (error: any) {
      this.logger.warn(`Failed to initialize SMTP transporter: ${error.message}`);
      this.transporter = null;
    }

    return this.transporter;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
    const transporter = this.getTransporter();
    const fromEmail =
      this.config.get<string>('SMTP_FROM_EMAIL')?.trim() ||
      this.config.get<string>('SMTP_USERNAME')?.trim();

    if (!transporter) {
      this.logger.log(`[Email fallback] to=${to} subject="${subject}" body="${html}"`);
      return {
        success: true,
        provider: 'CONSOLE_FALLBACK',
        providerMessageId: `local-email-${Date.now()}`,
      };
    }

    try {
      const info = await transporter.sendMail({ from: fromEmail, to, subject, html });
      return { success: true, provider: 'SMTP', providerMessageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`SMTP send failed: ${error.message}`);
      return { success: false, provider: 'SMTP', error: error.message || 'Failed to send email' };
    }
  }
}
