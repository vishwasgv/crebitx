import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@/common/services/logger.service';

export type SendReminderInput = {
  jobId: string;
  channel: string;
  message: string;
  recipient: {
    name: string;
    phone?: string | null;
    email?: string | null;
  };
};

export type SendReminderResult = {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  error?: string;
};

@Injectable()
export class NotificationSenderService {
  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async sendReminder(input: SendReminderInput): Promise<SendReminderResult> {
    const channel = (input.channel || 'WHATSAPP').toUpperCase();

    if (channel === 'WHATSAPP' && this.config.get<string>('WHATSAPP_CLOUD_TOKEN')) {
      return this.sendWhatsAppCloud(input);
    }

    if (this.config.get<string>('REMINDER_WEBHOOK_URL')) {
      return this.sendWebhook(input);
    }

    this.logger.log(
      `Reminder ${input.jobId} ready for ${input.recipient.phone || input.recipient.email || input.recipient.name}: ${input.message}`,
      'NotificationSenderService',
    );

    return {
      success: true,
      provider: 'CONSOLE_FALLBACK',
      providerMessageId: `local-${input.jobId}`,
    };
  }

  private async sendWhatsAppCloud(input: SendReminderInput): Promise<SendReminderResult> {
    const token = this.config.get<string>('WHATSAPP_CLOUD_TOKEN');
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const to = this.normalizePhone(input.recipient.phone || '');

    if (!phoneNumberId || !to) {
      return {
        success: false,
        provider: 'WHATSAPP_CLOUD',
        error: 'Missing WhatsApp phone number id or customer phone number',
      };
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            preview_url: false,
            body: input.message,
          },
        }),
      });

      const payload: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          provider: 'WHATSAPP_CLOUD',
          error: payload?.error?.message || `WhatsApp API failed with ${response.status}`,
        };
      }

      return {
        success: true,
        provider: 'WHATSAPP_CLOUD',
        providerMessageId: payload?.messages?.[0]?.id,
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'WHATSAPP_CLOUD',
        error: error?.message || 'WhatsApp API request failed',
      };
    }
  }

  private async sendWebhook(input: SendReminderInput): Promise<SendReminderResult> {
    const webhookUrl = this.config.get<string>('REMINDER_WEBHOOK_URL');
    const webhookToken = this.config.get<string>('REMINDER_WEBHOOK_TOKEN');

    try {
      const response = await fetch(webhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookToken ? { Authorization: `Bearer ${webhookToken}` } : {}),
        },
        body: JSON.stringify(input),
      });

      const payload: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          provider: 'WEBHOOK',
          error: payload?.message || `Reminder webhook failed with ${response.status}`,
        };
      }

      return {
        success: true,
        provider: 'WEBHOOK',
        providerMessageId: payload?.id || payload?.messageId,
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'WEBHOOK',
        error: error?.message || 'Reminder webhook request failed',
      };
    }
  }

  private normalizePhone(phone: string) {
    const digits = phone.replace(/\D/g, '');
    if (!digits) return '';
    return digits.startsWith('91') || digits.length > 10 ? digits : `91${digits}`;
  }
}
