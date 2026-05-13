import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check() {
    return await this.healthService.check();
  }

  @Get('database')
  @ApiOperation({ summary: 'Database health check' })
  async checkDatabase() {
    return await this.healthService.checkDatabase();
  }

  @Get('redis')
  @ApiOperation({ summary: 'Redis health check' })
  async checkRedis() {
    return await this.healthService.checkRedis();
  }
}
