import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '@/modules/auth/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/modules/auth/guards/tenant.guard';
import { OperatingIntelligenceService } from './operating-intelligence.service';

@ApiTags('Operating Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller()
export class OperatingIntelligenceController {
  constructor(private readonly intelligenceService: OperatingIntelligenceService) {}

  @Get('dashboard/daily-brief')
  @ApiOperation({ summary: 'Get today daily action brief' })
  getDailyBrief(@CurrentTenant() tenantId: string) {
    return this.intelligenceService.getDailyBrief(tenantId);
  }

  @Post('dashboard/daily-brief/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge daily brief' })
  acknowledgeDailyBrief(@CurrentTenant() tenantId: string, @Param('id') briefId: string) {
    return this.intelligenceService.acknowledgeDailyBrief(tenantId, briefId);
  }

  @Post('dashboard/daily-brief/:id/complete-item')
  @ApiOperation({ summary: 'Complete a daily brief item' })
  completeDailyBriefItem(@CurrentTenant() tenantId: string, @Param('id') itemId: string) {
    return this.intelligenceService.completeDailyBriefItem(tenantId, itemId);
  }

  @Get('actions/next-best')
  @ApiOperation({ summary: 'Get next-best collection actions' })
  getNextBestActions(@CurrentTenant() tenantId: string, @Query('limit') limit?: string) {
    return this.intelligenceService.getNextBestActions(tenantId, Number(limit || 5));
  }

  @Post('actions/:id/accept')
  @ApiOperation({ summary: 'Accept a recommended action' })
  acceptAction(
    @CurrentTenant() tenantId: string,
    @Param('id') actionId: string,
    @Body() body: any,
  ) {
    return this.intelligenceService.recordActionEvent(tenantId, actionId, 'ACCEPTED', body?.note);
  }

  @Post('actions/:id/postpone')
  @ApiOperation({ summary: 'Postpone a recommended action' })
  postponeAction(
    @CurrentTenant() tenantId: string,
    @Param('id') actionId: string,
    @Body() body: any,
  ) {
    return this.intelligenceService.recordActionEvent(tenantId, actionId, 'POSTPONED', body?.note);
  }

  @Post('actions/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss a recommended action' })
  dismissAction(
    @CurrentTenant() tenantId: string,
    @Param('id') actionId: string,
    @Body() body: any,
  ) {
    return this.intelligenceService.recordActionEvent(tenantId, actionId, 'DISMISSED', body?.note);
  }

  @Post('credit/check')
  @ApiOperation({ summary: 'Run credit decision checkpoint before new SALE' })
  checkCredit(
    @CurrentTenant() tenantId: string,
    @Body() body: { customerId: string; amount: number },
  ) {
    return this.intelligenceService.checkCredit(tenantId, body);
  }

  @Post('credit/check/:id/approve')
  @ApiOperation({ summary: 'Approve a credit decision check' })
  approveCreditCheck(
    @CurrentTenant() tenantId: string,
    @Param('id') checkId: string,
    @Body() body: any,
  ) {
    return this.intelligenceService.resolveCreditCheck(tenantId, checkId, 'APPROVED', body?.reason);
  }

  @Post('credit/check/:id/override')
  @ApiOperation({ summary: 'Override a credit decision check' })
  overrideCreditCheck(
    @CurrentTenant() tenantId: string,
    @Param('id') checkId: string,
    @Body() body: any,
  ) {
    return this.intelligenceService.resolveCreditCheck(
      tenantId,
      checkId,
      'OVERRIDDEN',
      body?.reason,
    );
  }

  @Post('credit/check/:id/block')
  @ApiOperation({ summary: 'Block a credit decision check' })
  blockCreditCheck(
    @CurrentTenant() tenantId: string,
    @Param('id') checkId: string,
    @Body() body: any,
  ) {
    return this.intelligenceService.resolveCreditCheck(tenantId, checkId, 'BLOCKED', body?.reason);
  }

  @Post('collection-outcomes')
  @ApiOperation({ summary: 'Record collection action outcome' })
  recordCollectionOutcome(@CurrentTenant() tenantId: string, @Body() body: any) {
    return this.intelligenceService.recordCollectionOutcome(tenantId, body);
  }

  @Get('customers/:id/collection-patterns')
  @ApiOperation({ summary: 'Get customer collection outcome memory' })
  getCollectionPattern(@CurrentTenant() tenantId: string, @Param('id') customerId: string) {
    return this.intelligenceService.getCollectionPattern(tenantId, customerId);
  }

  @Get('dashboard/recovery-wins')
  @ApiOperation({ summary: 'Get recovery wins feed' })
  getRecoveryWins(@CurrentTenant() tenantId: string) {
    return this.intelligenceService.getRecoveryWins(tenantId);
  }

  @Post('recovery-wins/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss a recovery win' })
  dismissRecoveryWin(@CurrentTenant() tenantId: string, @Param('id') winId: string) {
    return this.intelligenceService.dismissRecoveryWin(tenantId, winId);
  }

  @Get('discipline/summary')
  @ApiOperation({ summary: 'Get follow-up discipline summary' })
  getDisciplineSummary(@CurrentTenant() tenantId: string) {
    return this.intelligenceService.getDisciplineSummary(tenantId);
  }

  @Get('discipline/activity-journal')
  @ApiOperation({ summary: 'Get per-event completed/missed follow-up activity journal' })
  getActivityJournal(
    @CurrentTenant() tenantId: string,
    @Query('filter') filter?: 'all' | 'missed',
  ) {
    return this.intelligenceService.getActivityJournal(
      tenantId,
      filter === 'missed' ? 'missed' : 'all',
    );
  }

  @Get('reviews/weekly/current')
  @ApiOperation({ summary: 'Get current weekly review with rule suggestions' })
  getWeeklyReview(@CurrentTenant() tenantId: string) {
    return this.intelligenceService.getWeeklyReview(tenantId);
  }

  @Post('reviews/weekly/:id/apply-suggestion')
  @ApiOperation({ summary: 'Apply weekly rule suggestion' })
  applyWeeklySuggestion(
    @CurrentTenant() tenantId: string,
    @Param('id') reviewId: string,
    @Body() body: any,
  ) {
    return this.intelligenceService.applyWeeklySuggestion(tenantId, reviewId, body?.suggestionId);
  }

  @Post('reviews/weekly/:id/dismiss-suggestion')
  @ApiOperation({ summary: 'Dismiss weekly rule suggestion' })
  dismissWeeklySuggestion(
    @CurrentTenant() tenantId: string,
    @Param('id') reviewId: string,
    @Body() body: any,
  ) {
    return this.intelligenceService.dismissWeeklySuggestion(tenantId, reviewId, body?.suggestionId);
  }
}
