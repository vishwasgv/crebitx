import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class HealthService {
  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {}

  async check() {
    const [database, redis] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const isHealthy =
      database.status === 'fulfilled' &&
      database.value.status === 'up' &&
      redis.status === 'fulfilled' &&
      redis.value.status === 'up';

    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('nodeEnv'),
      services: {
        database: database.status === 'fulfilled' ? database.value : { status: 'down' },
        redis: redis.status === 'fulfilled' ? redis.value : { status: 'down' },
      },
    };
  }

  async checkDatabase() {
    try {
      const result = await this.databaseService.query('SELECT NOW() as now, version() as version');
      const poolStats = this.databaseService.getPoolStats();

      return {
        status: 'up',
        timestamp: result.rows[0].now,
        version: result.rows[0].version,
        pool: poolStats,
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
      };
    }
  }

  async checkRedis() {
    try {
      // Redis check will be implemented when Redis module is added
      return {
        status: 'up',
        message: 'Redis check pending implementation',
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
      };
    }
  }
}
