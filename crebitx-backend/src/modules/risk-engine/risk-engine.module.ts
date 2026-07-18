import { Module } from '@nestjs/common';
import { RiskEngineService } from './risk-engine.service';
import { RiskRecalcWorker } from './risk-recalc.worker';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [RiskEngineService, RiskRecalcWorker],
  exports: [RiskEngineService],
})
export class RiskEngineModule {}
