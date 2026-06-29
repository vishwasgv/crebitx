import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@/database/database.service';
import { LoggerService } from '@/common/services/logger.service';
import { NotificationSenderService } from './notification-sender.service';

type ReminderJobRow = {
  id: string;
  customer_id: string;
  receivable_item_id?: string;
  status: string;
  scheduled_for: Date;
  message: string;
  channel?: string;
  attempts?: number;
  name: string;
  phone?: string;
  email?: string;
};

@Injectable()
export class ReminderDispatchService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly sender: NotificationSenderService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    const enabled = this.config.get<string>('REMINDER_WORKER_ENABLED') !== 'false';
    if (!enabled) {
      this.logger.log('Reminder worker disabled by REMINDER_WORKER_ENABLED=false', 'ReminderDispatchService');
      return;
    }

    const intervalMs = Number(this.config.get<string>('REMINDER_WORKER_INTERVAL_MS') || 60000);
    this.timer = setInterval(() => {
      this.dispatchDue().catch((error) => {
        this.logger.error('Reminder dispatch loop failed', error?.stack || error?.message, 'ReminderDispatchService');
      });
    }, intervalMs);

    this.dispatchDue().catch((error) => {
      this.logger.error('Initial reminder dispatch failed', error?.stack || error?.message, 'ReminderDispatchService');
    });
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async listTenantJobs(tenantId: string, status?: string) {
    const result = await this.db.query(
      `SELECT r.id, r.customer_id, r.receivable_item_id, r.status, r.scheduled_for, r.sent_at,
              r.message, r.channel, r.attempts, r.provider_message_id, r.last_error, r.created_at,
              c.name AS customer_name, c.phone
       FROM reminder_jobs r
       INNER JOIN customers c ON c.id = r.customer_id
       WHERE c.tenant_id = $1 AND ($2::text IS NULL OR r.status = $2)
       ORDER BY r.scheduled_for DESC
       LIMIT 100`,
      [tenantId, status || null],
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      customerId: row.customer_id,
      receivableItemId: row.receivable_item_id,
      status: row.status,
      scheduledFor: row.scheduled_for,
      sentAt: row.sent_at,
      message: row.message,
      channel: row.channel,
      attempts: row.attempts,
      providerMessageId: row.provider_message_id,
      lastError: row.last_error,
      customerName: row.customer_name,
      phone: row.phone,
      createdAt: row.created_at,
    }));
  }

  async dispatchDueForTenant(tenantId: string, limit = 20) {
    const jobs = await this.claimDueJobs(limit, tenantId);
    return this.dispatchClaimedJobs(jobs);
  }

  async dispatchDue(limit = Number(this.config.get<string>('REMINDER_WORKER_BATCH_SIZE') || 20)) {
    if (this.running) return { processed: 0, skipped: true };
    this.running = true;
    try {
      const jobs = await this.claimDueJobs(limit);
      return await this.dispatchClaimedJobs(jobs);
    } finally {
      this.running = false;
    }
  }

  private async claimDueJobs(limit: number, tenantId?: string): Promise<ReminderJobRow[]> {
    const result = await this.db.query<ReminderJobRow>(
      `WITH due AS (
         SELECT r.id
         FROM reminder_jobs r
         INNER JOIN customers c ON c.id = r.customer_id
         WHERE r.status = 'PENDING'
           AND r.scheduled_for <= NOW()
           AND ($2::uuid IS NULL OR c.tenant_id = $2)
         ORDER BY r.scheduled_for ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       )
       UPDATE reminder_jobs r
       SET status = 'PROCESSING',
           attempts = COALESCE(r.attempts, 0) + 1,
           locked_at = NOW(),
           last_error = NULL
       FROM due, customers c
       WHERE r.id = due.id AND c.id = r.customer_id
       RETURNING r.id, r.customer_id, r.receivable_item_id, r.status, r.scheduled_for,
                 r.message, COALESCE(r.channel, 'WHATSAPP') AS channel, r.attempts,
                 c.name, c.phone, c.email`,
      [limit, tenantId || null],
    );

    return result.rows;
  }

  private async dispatchClaimedJobs(jobs: ReminderJobRow[]) {
    const results: Array<{ jobId: string; status: string; provider?: string; error?: string }> = [];

    for (const job of jobs) {
      const result = await this.sender.sendReminder({
        jobId: job.id,
        channel: job.channel || 'WHATSAPP',
        message: job.message,
        recipient: {
          name: job.name,
          phone: job.phone,
          email: job.email,
        },
      });

      if (result.success) {
        await this.db.query(
          `UPDATE reminder_jobs
           SET status = 'SENT', sent_at = NOW(), provider_message_id = $2, last_error = NULL
           WHERE id = $1`,
          [job.id, result.providerMessageId || result.provider],
        );
        await this.recordOutcome(job, result.provider);
        results.push({ jobId: job.id, status: 'SENT', provider: result.provider });
      } else {
        await this.db.query(
          `UPDATE reminder_jobs
           SET status = CASE WHEN attempts >= $2 THEN 'FAILED' ELSE 'PENDING' END,
               last_error = $3
           WHERE id = $1`,
          [job.id, Number(this.config.get<string>('REMINDER_MAX_ATTEMPTS') || 3), result.error || 'Unknown reminder error'],
        );
        results.push({ jobId: job.id, status: 'FAILED', provider: result.provider, error: result.error });
      }
    }

    return { processed: jobs.length, results };
  }

  private async recordOutcome(job: ReminderJobRow, provider: string) {
    await this.db.query(
      `INSERT INTO collection_outcomes (customer_id, action_type, channel, tone, outcome_status, note, tenant_id)
       SELECT $1, 'REMINDER', $2, 'BALANCED', 'SENT', $3, c.tenant_id
       FROM customers c
       WHERE c.id = $1`,
      [job.customer_id, job.channel || 'WHATSAPP', `Automated reminder sent via ${provider}`],
    );
  }
}
