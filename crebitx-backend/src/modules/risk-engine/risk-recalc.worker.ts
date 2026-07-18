import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@/common/services/logger.service';
import { RiskEngineService } from './risk-engine.service';

@Injectable()
export class RiskRecalcWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly riskEngine: RiskEngineService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    const enabled = this.config.get<string>('RISK_WORKER_ENABLED') !== 'false';
    if (!enabled) {
      this.logger.log('Risk recalculation worker disabled by RISK_WORKER_ENABLED=false', 'RiskRecalcWorker');
      return;
    }

    const intervalMs = Number(this.config.get<string>('RISK_WORKER_INTERVAL_MS') || 15 * 60 * 1000);
    this.timer = setInterval(() => {
      this.recalculateStale().catch((error) => {
        this.logger.error('Risk recalculation loop failed', error?.stack || error?.message, 'RiskRecalcWorker');
      });
    }, intervalMs);

    this.recalculateStale().catch((error) => {
      this.logger.error('Initial risk recalculation failed', error?.stack || error?.message, 'RiskRecalcWorker');
    });
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async recalculateStale() {
    if (this.running) return { processed: 0, skipped: true };
    this.running = true;
    try {
      const intervalMs = Number(this.config.get<string>('RISK_WORKER_INTERVAL_MS') || 15 * 60 * 1000);
      const batchSize = Number(this.config.get<string>('RISK_WORKER_BATCH_SIZE') || 25);
      const customerIds = await this.riskEngine.getCustomersWithStaleRisk(intervalMs, batchSize);

      let processed = 0;
      for (const customerId of customerIds) {
        try {
          await this.riskEngine.calculateRiskScore(customerId);
          processed += 1;
        } catch (error) {
          this.logger.warn(`Risk recalculation failed for customer ${customerId}: ${error?.message}`, 'RiskRecalcWorker');
        }
      }

      if (processed > 0) {
        this.logger.log(`Risk recalculation worker refreshed ${processed} customer(s)`, 'RiskRecalcWorker');
      }

      return { processed };
    } finally {
      this.running = false;
    }
  }
}
