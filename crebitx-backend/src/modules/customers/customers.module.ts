import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { DatabaseModule } from '@/database/database.module';
import { RiskEngineModule } from '@/modules/risk-engine/risk-engine.module';

@Module({
  imports: [DatabaseModule, RiskEngineModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
