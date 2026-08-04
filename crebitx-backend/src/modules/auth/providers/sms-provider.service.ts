import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

export interface SendResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  error?: string;
}

/**
 * Sends SMS via Twilio when TWILIO_* env vars are configured. Falls back to
 * logging the message (dev/local, or if the account isn't set up yet) so the
 * OTP flow never hard-fails just because a provider isn't wired up.
 */
@Injectable()
export class SmsProviderService {
  private readonly logger = new Logger(SmsProviderService.name);
  private client: Twilio | null = null;
  private clientInitAttempted = false;

  constructor(private readonly config: ConfigService) {}

  private getClient(): Twilio | null {
    if (this.clientInitAttempted) return this.client;
    this.clientInitAttempted = true;

    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID')?.trim();
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN')?.trim();

    if (!accountSid || !authToken) {
      return null;
    }

    try {
      this.client = new Twilio(accountSid, authToken);
    } catch (error: any) {
      this.logger.warn(`Failed to initialize Twilio client: ${error.message}`);
      this.client = null;
    }

    return this.client;
  }

  async sendSms(to: string, body: string): Promise<SendResult> {
    const client = this.getClient();
    const fromNumber = this.config.get<string>('TWILIO_FROM_NUMBER');

    if (!client || !fromNumber) {
      this.logger.log(`[SMS fallback] to=${to} body="${body}"`);
      return {
        success: true,
        provider: 'CONSOLE_FALLBACK',
        providerMessageId: `local-sms-${Date.now()}`,
      };
    }

    try {
      const message = await client.messages.create({ to, from: fromNumber, body });
      return { success: true, provider: 'TWILIO', providerMessageId: message.sid };
    } catch (error: any) {
      this.logger.error(`Twilio send failed: ${error.message}`);
      return { success: false, provider: 'TWILIO', error: error.message || 'Failed to send SMS' };
    }
  }
}
