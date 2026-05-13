import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Get key performance indicators' })
  @ApiResponse({ status: 200, description: 'KPIs retrieved successfully' })
  async getDashboardKPIs(@CurrentTenant() tenantId: string) {
    return await this.dashboardService.getDashboardKPIs(tenantId);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get collection chart data' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months (default: 6)' })
  @ApiResponse({ status: 200, description: 'Chart data retrieved successfully' })
  async getCollectionChartData(
    @CurrentTenant() tenantId: string,
    @Query('months', new ParseIntPipe({ optional: true })) months?: number,
  ) {
    return await this.dashboardService.getCollectionChartData(tenantId, months || 6);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent activity timeline' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of activities (default: 20)' })
  @ApiResponse({ status: 200, description: 'Activity retrieved successfully' })
  async getRecentActivity(
    @CurrentTenant() tenantId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return await this.dashboardService.getRecentActivity(tenantId, limit || 20);
  }
}
