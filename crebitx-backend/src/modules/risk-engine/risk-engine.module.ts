import { Module } from '@nestjs/common';
import { RiskEngineService } from './risk-engine.service';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [RiskEngineService],
  exports: [RiskEngineService],
})
export class RiskEngineModule {}
