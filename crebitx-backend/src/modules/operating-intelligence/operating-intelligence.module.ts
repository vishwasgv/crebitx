import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { OperatingIntelligenceController } from './operating-intelligence.controller';
import { OperatingIntelligenceService } from './operating-intelligence.service';

@Module({
  imports: [DatabaseModule],
  controllers: [OperatingIntelligenceController],
  providers: [OperatingIntelligenceService],
})
export class OperatingIntelligenceModule {}
