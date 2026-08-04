import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface DashboardKPIs {
  outstandingAmount: number;
  overdueAmount: number;
  inflowAmount: number;
  topCustomers: Array<{ name: string; amount: number }>;
  alerts: Array<{ customerId: string; name: string; amount: number; overdue: string; phone: string }>;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Get dashboard KPIs for a tenant
   */
  async getDashboardKPIs(tenantId: string): Promise<DashboardKPIs> {
    this.logger.log(`Fetching dashboard KPIs for tenant: ${tenantId}`);

    try {
      const now = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(now.getDate() + 7);

      // 1. Total Outstanding Receivables
      const outstandingQuery = `
        SELECT COALESCE(SUM(r.amount - r.paid_amount), 0) AS total
        FROM receivable_items r
        INNER JOIN customers c ON r.customer_id = c.id
        WHERE c.tenant_id = $1 AND r.is_paid = FALSE AND c.deleted_at IS NULL
      `;

      const outstandingResult = await this.db.query(outstandingQuery, [tenantId]);
      const outstandingAmount = parseFloat(outstandingResult.rows[0].total);

      // 2. Overdue Amount
      const overdueQuery = `
        SELECT COALESCE(SUM(r.amount - r.paid_amount), 0) AS total
        FROM receivable_items r
        INNER JOIN customers c ON r.customer_id = c.id
        WHERE c.tenant_id = $1 AND r.is_paid = FALSE AND r.due_date < $2 AND c.deleted_at IS NULL
      `;

      const overdueResult = await this.db.query(overdueQuery, [tenantId, now.toISOString()]);
      const overdueAmount = parseFloat(overdueResult.rows[0].total);

      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(now.getDate() + 30);

      // 3. Expected Inflow (30 Days) — includes both upcoming AND overdue unpaid invoices
      // Overdue invoices are still "expected inflow" since they're being collected.
      // We look at invoices due within the last 90 days (overdue) + next 30 days (upcoming).
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(now.getDate() - 90);

      const inflowQuery = `
        SELECT COALESCE(SUM(r.amount - r.paid_amount), 0) AS total
        FROM receivable_items r
        INNER JOIN customers c ON r.customer_id = c.id
        WHERE c.tenant_id = $1 
          AND r.is_paid = FALSE 
          AND r.due_date >= $2 
          AND r.due_date <= $3
          AND c.deleted_at IS NULL
      `;

      const inflowResult = await this.db.query(inflowQuery, [
        tenantId,
        ninetyDaysAgo.toISOString(),
        thirtyDaysLater.toISOString(),
      ]);
      const inflowAmount = parseFloat(inflowResult.rows[0].total);

      // 4. Top 5 Outstanding Customers
      const topCustomersQuery = `
        SELECT 
          c.name,
          COALESCE(SUM(r.amount - r.paid_amount), 0) AS amount
        FROM customers c
        LEFT JOIN receivable_items r ON c.id = r.customer_id AND r.is_paid = FALSE
        WHERE c.tenant_id = $1 AND c.deleted_at IS NULL
        GROUP BY c.id, c.name
        HAVING COALESCE(SUM(r.amount - r.paid_amount), 0) > 0
        ORDER BY amount DESC
        LIMIT 5
      `;

      const topCustomersResult = await this.db.query(topCustomersQuery, [tenantId]);
      const topCustomers = topCustomersResult.rows.map((row: any) => ({
        name: row.name,
        amount: parseFloat(row.amount),
      }));

      // 5. Critical Alerts (HIGH RISK customers with overdue amounts)
      const alertsQuery = `
        SELECT
          c.id AS customer_id,
          c.name,
          c.phone,
          COALESCE(SUM(r.amount - r.paid_amount), 0) AS amount,
          COUNT(r.id) AS overdue_count
        FROM customers c
        INNER JOIN LATERAL (
          SELECT score, level
          FROM risk_score_snapshots
          WHERE customer_id = c.id
          ORDER BY snapshot_date DESC
          LIMIT 1
        ) rs ON TRUE
        LEFT JOIN receivable_items r ON c.id = r.customer_id AND r.is_paid = FALSE AND r.due_date < $2
        WHERE c.tenant_id = $1 AND c.deleted_at IS NULL AND rs.level = 'RED'
        GROUP BY c.id, c.name, c.phone
        HAVING COUNT(r.id) > 0
        ORDER BY amount DESC
        LIMIT 10
      `;

      const alertsResult = await this.db.query(alertsQuery, [tenantId, now.toISOString()]);
      const alerts = alertsResult.rows.map((row: any) => ({
        customerId: row.customer_id,
        name: row.name,
        amount: parseFloat(row.amount),
        overdue: `${row.overdue_count} item${row.overdue_count > 1 ? 's' : ''} overdue`,
        phone: row.phone,
      }));

      return {
        outstandingAmount,
        overdueAmount,
        inflowAmount,
        topCustomers,
        alerts,
      };
    } catch (error) {
      this.logger.error('Failed to fetch dashboard KPIs', error);
      // Return default values instead of failing
      return {
        outstandingAmount: 0,
        overdueAmount: 0,
        inflowAmount: 0,
        topCustomers: [],
        alerts: [],
      };
    }
  }

  /**
   * Get collection chart data (monthly trends)
   */
  async getCollectionChartData(tenantId: string, months: number = 6) {
    const query = `
      WITH month_series AS (
        SELECT generate_series(
          DATE_TRUNC('month', NOW() - INTERVAL '${months} months'),
          DATE_TRUNC('month', NOW()),
          '1 month'::interval
        ) AS month
      ),
      payments_by_month AS (
        SELECT 
          DATE_TRUNC('month', le.event_date) AS month,
          SUM(le.amount) AS amount
        FROM ledger_events le
        INNER JOIN customers c ON le.customer_id = c.id
        WHERE c.tenant_id = $1 AND le.tag = 'PAYMENT'
        GROUP BY DATE_TRUNC('month', le.event_date)
      )
      SELECT 
        TO_CHAR(ms.month, 'Mon YYYY') AS month_label,
        COALESCE(pbm.amount, 0) AS collected
      FROM month_series ms
      LEFT JOIN payments_by_month pbm ON ms.month = pbm.month
      ORDER BY ms.month ASC
    `;

    const result = await this.db.query(query, [tenantId]);

    return result.rows.map((row: any) => ({
      month: row.month_label,
      collected: parseFloat(row.collected),
    }));
  }

  /**
   * Get recent activity timeline
   */
  async getRecentActivity(tenantId: string, limit: number = 20) {
    const query = `
      SELECT
        le.id,
        le.customer_id,
        le.amount,
        le.tag,
        le.note,
        le.event_date,
        c.name AS customer_name
      FROM ledger_events le
      INNER JOIN customers c ON le.customer_id = c.id
      WHERE c.tenant_id = $1 AND c.deleted_at IS NULL
      ORDER BY le.event_date DESC
      LIMIT $2
    `;

    const result = await this.db.query(query, [tenantId, limit]);

    return result.rows.map((row: any) => ({
      id: row.id,
      customerId: row.customer_id,
      amount: parseFloat(row.amount),
      tag: row.tag,
      note: row.note,
      eventDate: row.event_date,
      customerName: row.customer_name,
    }));
  }
}
