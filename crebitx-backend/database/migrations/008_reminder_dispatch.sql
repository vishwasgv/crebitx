-- Migration 008: reminder dispatch worker support

ALTER TABLE reminder_jobs
  ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'WHATSAPP',
  ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

ALTER TABLE reminder_jobs DROP CONSTRAINT IF EXISTS chk_reminder_status;
ALTER TABLE reminder_jobs
  ADD CONSTRAINT chk_reminder_status
  CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED'));

CREATE INDEX IF NOT EXISTS idx_reminder_dispatch_due ON reminder_jobs(status, scheduled_for, attempts);
