import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '@/modules/auth/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/modules/auth/guards/tenant.guard';
import { ReminderDispatchService } from './reminder-dispatch.service';

@ApiTags('Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminderDispatch: ReminderDispatchService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'List reminder jobs for the current tenant' })
  listJobs(@CurrentTenant() tenantId: string, @Query('status') status?: string) {
    return this.reminderDispatch.listTenantJobs(tenantId, status);
  }

  @Post('dispatch-due')
  @ApiOperation({ summary: 'Manually dispatch due reminder jobs now' })
  dispatchDue(@CurrentTenant() tenantId: string, @Body() body: { limit?: number }) {
    return this.reminderDispatch.dispatchDueForTenant(tenantId, body?.limit || 20);
  }
}
