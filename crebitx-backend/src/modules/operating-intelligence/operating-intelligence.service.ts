import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

type ActionEvent = 'ACCEPTED' | 'POSTPONED' | 'DISMISSED';
type CreditDecision = 'APPROVED' | 'OVERRIDDEN' | 'BLOCKED';

@Injectable()
export class OperatingIntelligenceService {
  private readonly logger = new Logger(OperatingIntelligenceService.name);

  constructor(private readonly db: DatabaseService) {}

  async getDailyBrief(tenantId: string) {
    const today = this.todayKey();
    const briefId = `brief-${tenantId}-${today}`;
    const [kpis, actions] = await Promise.all([
      this.getKpiSnapshot(tenantId),
      this.getNextBestActions(tenantId, 3),
    ]);

    const items = [
      {
        id: `${briefId}-risk`,
        type: 'TOP_RISK',
        title: `${kpis.redCustomers} red-risk customer${kpis.redCustomers === 1 ? '' : 's'}`,
        detail:
          kpis.redCustomers > 0
            ? 'Pause fresh credit and follow up with high-risk accounts first.'
            : 'No red-risk customers found today.',
        priority: 1,
      },
      {
        id: `${briefId}-overdue`,
        type: 'TOP_OVERDUE',
        title: `Rs. ${kpis.overdueAmount.toLocaleString()} overdue`,
        detail: `${kpis.overdueCustomers} customer${kpis.overdueCustomers === 1 ? '' : 's'} need overdue follow-up.`,
        priority: 2,
      },
      {
        id: `${briefId}-action`,
        type: 'NEXT_ACTION',
        title: actions[0]?.title || 'No urgent action needed',
        detail: actions[0]?.reason || 'Collections are currently under control.',
        priority: 3,
      },
    ];

    const summary = `Rs. ${kpis.overdueAmount.toLocaleString()} overdue, ${kpis.overdueCustomers} follow-up${kpis.overdueCustomers === 1 ? '' : 's'}, ${kpis.redCustomers} red-risk customer${kpis.redCustomers === 1 ? '' : 's'}.`;

    await this.upsertDailyBrief(tenantId, briefId, today, summary, kpis.overdueAmount, items);

    return {
      id: briefId,
      businessDate: today,
      summary,
      moneyAtRisk: kpis.overdueAmount,
      items,
      generatedAt: new Date().toISOString(),
    };
  }

  async acknowledgeDailyBrief(tenantId: string, briefId: string) {
    await this.db.query(
      `UPDATE daily_briefs
       SET status = 'ACKNOWLEDGED', acknowledged_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [briefId, tenantId],
    );
    return { success: true };
  }

  async completeDailyBriefItem(tenantId: string, itemId: string) {
    await this.db.query(
      `UPDATE daily_brief_items i
       SET status = 'COMPLETED', completed_at = NOW()
       FROM daily_briefs b
       WHERE i.brief_id = b.id AND i.id = $1 AND b.tenant_id = $2`,
      [itemId, tenantId],
    );
    return { success: true };
  }

  async getNextBestActions(tenantId: string, limit = 5) {
    const result = await this.db.query(
      `SELECT
         c.id AS customer_id,
         c.name,
         c.phone,
         COALESCE(SUM(r.amount - r.paid_amount), 0) AS outstanding,
         COALESCE(MAX(EXTRACT(DAY FROM (NOW() - r.due_date))), 0) AS max_days_overdue,
         rs.level AS risk_level,
         COALESCE(pp.broken_count, 0) AS broken_promises
       FROM customers c
       LEFT JOIN receivable_items r ON r.customer_id = c.id AND r.is_paid = FALSE
       LEFT JOIN LATERAL (
         SELECT level
         FROM risk_score_snapshots
         WHERE customer_id = c.id
         ORDER BY snapshot_date DESC
         LIMIT 1
       ) rs ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS broken_count
         FROM payment_promises
         WHERE customer_id = c.id AND status = 'BROKEN'
       ) pp ON TRUE
       WHERE c.tenant_id = $1 AND c.deleted_at IS NULL
       GROUP BY c.id, c.name, c.phone, rs.level, pp.broken_count
       HAVING COALESCE(SUM(r.amount - r.paid_amount), 0) > 0
       ORDER BY
         CASE WHEN rs.level = 'RED' THEN 1 WHEN rs.level = 'YELLOW' THEN 2 ELSE 3 END,
         COALESCE(MAX(EXTRACT(DAY FROM (NOW() - r.due_date))), 0) DESC,
         COALESCE(SUM(r.amount - r.paid_amount), 0) DESC
       LIMIT $2`,
      [tenantId, limit],
    );

    const actions = result.rows.map((row: any, index: number) => {
      const overdueDays = Math.max(0, Math.floor(parseFloat(row.max_days_overdue || 0)));
      const outstanding = parseFloat(row.outstanding || 0);
      const riskLevel = row.risk_level || 'GREEN';
      const brokenPromises = parseInt(row.broken_promises || '0', 10);
      const actionType =
        riskLevel === 'RED' || brokenPromises > 0 ? 'HOLD_CREDIT_AND_CALL' : overdueDays > 7 ? 'SEND_STRICT_REMINDER' : 'SEND_FRIENDLY_REMINDER';
      const title =
        actionType === 'HOLD_CREDIT_AND_CALL'
          ? `Call ${row.name} and hold new credit`
          : actionType === 'SEND_STRICT_REMINDER'
            ? `Send strict reminder to ${row.name}`
            : `Send friendly reminder to ${row.name}`;
      const reason = `${riskLevel} risk, Rs. ${outstanding.toLocaleString()} outstanding${overdueDays > 0 ? `, ${overdueDays} days overdue` : ''}${brokenPromises > 0 ? `, ${brokenPromises} broken promise${brokenPromises > 1 ? 's' : ''}` : ''}.`;

      return {
        id: `action-${row.customer_id}`,
        customerId: row.customer_id,
        customerName: row.name,
        phone: row.phone,
        actionType,
        title,
        reason,
        priority: index + 1,
      };
    });

    await this.upsertRecommendedActions(tenantId, actions);
    return await this.filterOpenRecommendedActions(tenantId, actions);
  }

  async recordActionEvent(tenantId: string, actionId: string, eventType: ActionEvent, note?: string) {
    await this.db.query(
      `INSERT INTO recommended_action_events (action_id, tenant_id, event_type, note)
       VALUES ($1, $2, $3, $4)`,
      [actionId, tenantId, eventType, note || null],
    );

    await this.db.query(
      `UPDATE recommended_actions
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [eventType, actionId, tenantId],
    );

    return { success: true };
  }

  async checkCredit(tenantId: string, dto: { customerId: string; amount: number }) {
    const result = await this.db.query(
      `SELECT
         c.id,
         c.name,
         cp.credit_limit,
         COALESCE(SUM(CASE WHEN r.is_paid = FALSE THEN r.amount - r.paid_amount ELSE 0 END), 0) AS outstanding,
         COALESCE(MAX(CASE WHEN r.is_paid = FALSE AND r.due_date < NOW() THEN EXTRACT(DAY FROM (NOW() - r.due_date)) ELSE 0 END), 0) AS overdue_days,
         COALESCE(pp.broken_count, 0) AS broken_promises,
         rs.level AS risk_level
       FROM customers c
       LEFT JOIN customer_credit_profiles cp ON cp.customer_id = c.id
       LEFT JOIN receivable_items r ON r.customer_id = c.id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS broken_count
         FROM payment_promises
         WHERE customer_id = c.id AND status = 'BROKEN'
       ) pp ON TRUE
       LEFT JOIN LATERAL (
         SELECT level
         FROM risk_score_snapshots
         WHERE customer_id = c.id
         ORDER BY snapshot_date DESC
         LIMIT 1
       ) rs ON TRUE
       WHERE c.id = $1 AND c.tenant_id = $2 AND c.deleted_at IS NULL
       GROUP BY c.id, c.name, cp.credit_limit, pp.broken_count, rs.level`,
      [dto.customerId, tenantId],
    );

    if (result.rows.length === 0) {
      return { error: 'Customer not found' };
    }

    const row = result.rows[0];
    const creditLimit = parseFloat(row.credit_limit || 0);
    const outstanding = parseFloat(row.outstanding || 0);
    const requestedAmount = Number(dto.amount || 0);
    const projectedOutstanding = outstanding + requestedAmount;
    const overdueDays = Math.max(0, Math.floor(parseFloat(row.overdue_days || 0)));
    const brokenPromises = parseInt(row.broken_promises || '0', 10);
    const reasons: string[] = [];

    if (overdueDays > 0) reasons.push(`${overdueDays} overdue day${overdueDays === 1 ? '' : 's'}`);
    if (brokenPromises > 0) reasons.push(`${brokenPromises} broken promise${brokenPromises === 1 ? '' : 's'}`);
    if (creditLimit > 0 && projectedOutstanding > creditLimit) {
      reasons.push(`projected outstanding exceeds credit limit by Rs. ${(projectedOutstanding - creditLimit).toLocaleString()}`);
    }

    const recommendation =
      overdueDays > 14 || brokenPromises >= 2 || (creditLimit > 0 && projectedOutstanding > creditLimit * 1.2)
        ? 'BLOCK'
        : overdueDays > 0 || brokenPromises > 0 || (creditLimit > 0 && projectedOutstanding > creditLimit)
          ? 'REQUIRE_PART_PAYMENT'
          : 'APPROVE';
    const checkId = `credit-${dto.customerId}-${Date.now()}`;

    await this.db.query(
      `INSERT INTO credit_decision_checks (id, tenant_id, customer_id, requested_amount, recommendation, reasons)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [checkId, tenantId, dto.customerId, requestedAmount, recommendation, JSON.stringify(reasons)],
    );

    return {
      id: checkId,
      customerId: dto.customerId,
      customerName: row.name,
      requestedAmount,
      outstanding,
      projectedOutstanding,
      creditLimit,
      recommendation,
      reasons: reasons.length > 0 ? reasons : ['Customer is within current credit policy.'],
    };
  }

  async resolveCreditCheck(tenantId: string, checkId: string, decision: CreditDecision, reason?: string) {
    await this.db.query(
      `UPDATE credit_decision_checks
       SET status = $1, resolved_at = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [decision, checkId, tenantId],
    );
    await this.db.query(
      `INSERT INTO credit_overrides (check_id, tenant_id, decision, reason)
       VALUES ($1, $2, $3, $4)`,
      [checkId, tenantId, decision, reason || null],
    );
    return { success: true };
  }

  async recordCollectionOutcome(tenantId: string, dto: any) {
    const result = await this.db.query(
      `INSERT INTO collection_outcomes (
         tenant_id, customer_id, action_type, channel, tone, outcome_status, response_hours, note
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at`,
      [
        tenantId,
        dto.customerId || null,
        dto.actionType || 'REMINDER',
        dto.channel || 'WHATSAPP',
        dto.tone || 'BALANCED',
        dto.outcomeStatus || 'NO_RESPONSE',
        dto.responseHours || null,
        dto.note || null,
      ],
    );
    return { id: result.rows[0].id, createdAt: result.rows[0].created_at };
  }

  async getCollectionPattern(tenantId: string, customerId: string) {
    const result = await this.db.query(
      `SELECT channel, tone, outcome_status, COUNT(*) AS count
       FROM collection_outcomes
       WHERE tenant_id = $1 AND customer_id = $2
       GROUP BY channel, tone, outcome_status
       ORDER BY count DESC
       LIMIT 5`,
      [tenantId, customerId],
    );

    const promiseResult = await this.db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'KEPT') AS kept,
         COUNT(*) FILTER (WHERE status = 'BROKEN') AS broken
       FROM payment_promises
       WHERE customer_id = $1`,
      [customerId],
    );

    const kept = parseInt(promiseResult.rows[0]?.kept || '0', 10);
    const broken = parseInt(promiseResult.rows[0]?.broken || '0', 10);
    const promiseKeptRatio = kept + broken === 0 ? null : Math.round((kept / (kept + broken)) * 100);

    return {
      customerId,
      promiseKeptRatio,
      bestFollowUpPattern:
        result.rows[0] ?
          `${result.rows[0].tone} ${result.rows[0].channel} usually leads to ${result.rows[0].outcome_status}.` :
          'Not enough outcome history yet. Start tracking reminder/call results.',
      patterns: result.rows.map((row: any) => ({
        channel: row.channel,
        tone: row.tone,
        outcomeStatus: row.outcome_status,
        count: parseInt(row.count, 10),
      })),
    };
  }

  async getRecoveryWins(tenantId: string) {
    const result = await this.db.query(
      `SELECT
         le.id,
         c.name,
         le.amount,
         le.event_date
       FROM ledger_events le
       INNER JOIN customers c ON c.id = le.customer_id
       WHERE le.tenant_id = $1 AND le.tag = 'PAYMENT'
       ORDER BY le.event_date DESC
       LIMIT 5`,
      [tenantId],
    );

    const wins = result.rows.map((row: any) => ({
      id: `win-${row.id}`,
      title: `Recovered Rs. ${parseFloat(row.amount).toLocaleString()} from ${row.name}`,
      detail: 'Payment recovery recorded after follow-up activity.',
      amount: parseFloat(row.amount),
      createdAt: row.event_date,
    }));

    if (wins.length === 0) {
      return [
        {
          id: 'win-empty',
          title: 'Recovery tracking is ready',
          detail: 'Record payments and CREBITX will show meaningful recovery wins here.',
          amount: 0,
          createdAt: new Date().toISOString(),
        },
      ];
    }

    return wins;
  }

  async getDisciplineSummary(tenantId: string) {
    const result = await this.db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'SENT') AS completed,
         COUNT(*) FILTER (WHERE status = 'PENDING' AND scheduled_for >= NOW()) AS pending,
         COUNT(*) FILTER (WHERE status = 'PENDING' AND scheduled_for < NOW()) AS missed
       FROM reminder_jobs r
       INNER JOIN customers c ON c.id = r.customer_id
       WHERE c.tenant_id = $1`,
      [tenantId],
    );

    const completed = parseInt(result.rows[0]?.completed || '0', 10);
    const pending = parseInt(result.rows[0]?.pending || '0', 10);
    const missed = parseInt(result.rows[0]?.missed || '0', 10);
    const total = completed + pending + missed;
    const completionRate = total === 0 ? 100 : Math.round((completed / total) * 100);

    return {
      completionRate,
      completed,
      pending,
      missed,
      coaching:
        missed > 0
          ? 'Clear missed follow-ups first; overdue recovery is sensitive to delay.'
          : 'Follow-up discipline is healthy for the current schedule.',
    };
  }

  async getWeeklyReview(tenantId: string) {
    const kpis = await this.getKpiSnapshot(tenantId);
    const wins = await this.getRecoveryWins(tenantId);
    const discipline = await this.getDisciplineSummary(tenantId);
    const weekStart = this.weekStartKey();
    const reviewId = `review-${tenantId}-${weekStart}`;

    const findings = [
      {
        id: `${reviewId}-risk`,
        title: `${kpis.redCustomers} red-risk customers need policy attention`,
        detail: kpis.redCustomers > 0 ? 'Review credit limits before approving fresh sales.' : 'Risk spread is currently stable.',
        severity: kpis.redCustomers > 0 ? 'HIGH' : 'INFO',
      },
      {
        id: `${reviewId}-discipline`,
        title: `${discipline.completionRate}% follow-up completion`,
        detail: discipline.coaching,
        severity: discipline.missed > 0 ? 'MEDIUM' : 'INFO',
      },
    ];

    const suggestions = [
      {
        id: `${reviewId}-limit`,
        title: 'Tighten credit for red-risk accounts',
        detail: 'Require part payment before new SALE entries when overdue or broken promises exist.',
      },
      {
        id: `${reviewId}-tone`,
        title: 'Escalate reminder tone after missed promise',
        detail: 'Use strict reminder wording when a promise-to-pay date is missed.',
      },
    ];

    return {
      id: reviewId,
      weekStart,
      weekEnd: this.todayKey(),
      summary: `This week: Rs. ${kpis.overdueAmount.toLocaleString()} overdue, ${wins.length} recovery signal${wins.length === 1 ? '' : 's'}, ${discipline.completionRate}% follow-up completion.`,
      findings,
      suggestions,
    };
  }

  async applyWeeklySuggestion(_tenantId: string, _reviewId: string, suggestionId: string) {
    return { success: true, suggestionId, status: 'APPLIED' };
  }

  async dismissWeeklySuggestion(_tenantId: string, _reviewId: string, suggestionId: string) {
    return { success: true, suggestionId, status: 'DISMISSED' };
  }

  async dismissRecoveryWin(tenantId: string, winId: string) {
    await this.db.query(
      `UPDATE recovery_wins
       SET status = 'DISMISSED'
       WHERE id = $1 AND tenant_id = $2`,
      [winId, tenantId],
    );
    return { success: true };
  }

  private async getKpiSnapshot(tenantId: string) {
    const result = await this.db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN r.is_paid = FALSE THEN r.amount - r.paid_amount ELSE 0 END), 0) AS outstanding,
         COALESCE(SUM(CASE WHEN r.is_paid = FALSE AND r.due_date < NOW() THEN r.amount - r.paid_amount ELSE 0 END), 0) AS overdue,
         COUNT(DISTINCT CASE WHEN r.is_paid = FALSE AND r.due_date < NOW() THEN c.id END) AS overdue_customers,
         COUNT(DISTINCT CASE WHEN rs.level = 'RED' THEN c.id END) AS red_customers
       FROM customers c
       LEFT JOIN receivable_items r ON r.customer_id = c.id
       LEFT JOIN LATERAL (
         SELECT level
         FROM risk_score_snapshots
         WHERE customer_id = c.id
         ORDER BY snapshot_date DESC
         LIMIT 1
       ) rs ON TRUE
       WHERE c.tenant_id = $1 AND c.deleted_at IS NULL`,
      [tenantId],
    );

    return {
      outstandingAmount: parseFloat(result.rows[0]?.outstanding || 0),
      overdueAmount: parseFloat(result.rows[0]?.overdue || 0),
      overdueCustomers: parseInt(result.rows[0]?.overdue_customers || '0', 10),
      redCustomers: parseInt(result.rows[0]?.red_customers || '0', 10),
    };
  }

  private async upsertDailyBrief(tenantId: string, briefId: string, date: string, summary: string, moneyAtRisk: number, items: any[]) {
    await this.db.query(
      `INSERT INTO daily_briefs (id, tenant_id, business_date, summary, money_at_risk)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, business_date)
       DO UPDATE SET summary = EXCLUDED.summary, money_at_risk = EXCLUDED.money_at_risk, generated_at = NOW()`,
      [briefId, tenantId, date, summary, moneyAtRisk],
    );

    for (const item of items) {
      await this.db.query(
        `INSERT INTO daily_brief_items (id, brief_id, type, title, detail, priority)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id)
         DO UPDATE SET title = EXCLUDED.title, detail = EXCLUDED.detail, priority = EXCLUDED.priority`,
        [item.id, briefId, item.type, item.title, item.detail, item.priority],
      );
    }
  }

  private async filterOpenRecommendedActions(tenantId: string, actions: any[]) {
    if (actions.length === 0) return actions;

    const result = await this.db.query(
      `SELECT id, status
       FROM recommended_actions
       WHERE tenant_id = $1 AND id = ANY($2::text[])`,
      [tenantId, actions.map((action) => action.id)],
    );

    const statusById = new Map(result.rows.map((row: any) => [row.id, row.status || 'OPEN']));
    const hiddenStatuses = new Set(['ACCEPTED', 'DISMISSED', 'POSTPONED']);

    return actions
      .map((action) => ({ ...action, status: statusById.get(action.id) || 'OPEN' }))
      .filter((action) => !hiddenStatuses.has(action.status));
  }
  private async upsertRecommendedActions(tenantId: string, actions: any[]) {
    for (const action of actions) {
      await this.db.query(
        `INSERT INTO recommended_actions (id, tenant_id, customer_id, action_type, title, reason, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id)
         DO UPDATE SET title = EXCLUDED.title, reason = EXCLUDED.reason, priority = EXCLUDED.priority, updated_at = NOW()`,
        [action.id, tenantId, action.customerId, action.actionType, action.title, action.reason, action.priority],
      );
    }
  }

  private todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  private weekStartKey() {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return date.toISOString().slice(0, 10);
  }
}

