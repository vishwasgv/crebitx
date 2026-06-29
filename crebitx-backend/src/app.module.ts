import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { HealthModule } from '@/modules/health/health.module';
import { CustomersModule } from '@/modules/customers/customers.module';
import { DashboardModule } from '@/modules/dashboard/dashboard.module';
import { SettingsModule } from '@/modules/settings/settings.module';
import { RiskEngineModule } from '@/modules/risk-engine/risk-engine.module';
import { OperatingIntelligenceModule } from '@/modules/operating-intelligence/operating-intelligence.module';
import { RemindersModule } from '@/modules/reminders/reminders.module';
import configuration from '@/config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per TTL
      },
    ]),

    // Core Modules
    CommonModule,
    DatabaseModule,

    // Feature Modules
    HealthModule,
    AuthModule,
    CustomersModule,
    DashboardModule,
    SettingsModule,
    RiskEngineModule,
    OperatingIntelligenceModule,
    RemindersModule,
  ],
})
export class AppModule {}

