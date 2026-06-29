import { NotificationSenderService } from './notification-sender.service';

describe('NotificationSenderService', () => {
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(), verbose: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses console fallback when no provider is configured', async () => {
    const config = { get: jest.fn().mockReturnValue(undefined) } as any;
    const service = new NotificationSenderService(config, logger);

    const result = await service.sendReminder({
      jobId: 'job-1',
      channel: 'WHATSAPP',
      message: 'Payment due today',
      recipient: { name: 'Test Customer', phone: '9876543210' },
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe('CONSOLE_FALLBACK');
    expect(result.providerMessageId).toBe('local-job-1');
    expect(logger.log).toHaveBeenCalled();
  });

  it('returns a clear failure when WhatsApp is configured without a phone number id', async () => {
    const config = {
      get: jest.fn((key: string) => (key === 'WHATSAPP_CLOUD_TOKEN' ? 'token' : undefined)),
    } as any;
    const service = new NotificationSenderService(config, logger);

    const result = await service.sendReminder({
      jobId: 'job-2',
      channel: 'WHATSAPP',
      message: 'Payment due today',
      recipient: { name: 'Test Customer', phone: '9876543210' },
    });

    expect(result.success).toBe(false);
    expect(result.provider).toBe('WHATSAPP_CLOUD');
    expect(result.error).toContain('Missing WhatsApp phone number id');
  });
});
