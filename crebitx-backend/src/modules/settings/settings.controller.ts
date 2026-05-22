import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get business settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getSettings(@CurrentTenant() tenantId: string) {
    return await this.settingsService.getSettings(tenantId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update business settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(@CurrentTenant() tenantId: string, @Body() dto: UpdateSettingsDto) {
    return await this.settingsService.updateSettings(tenantId, dto);
  }
}
