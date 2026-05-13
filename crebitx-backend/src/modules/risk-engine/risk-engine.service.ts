import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface RiskScoreResult {
  score: number;
  level: 'GREEN' | 'YELLOW' | 'RED';
  reason: string;
}

@Injectable()
export class RiskEngineService {
  private readonly logger = new Logger(RiskEngineService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Calculate risk score for a customer based on:
   * 1. Overdue days (60% weight)
   * 2. Credit limit exceeded (40% weight)
   */
  async calculateRiskScore(customerId: string): Promise<RiskScoreResult> {
    this.logger.log(`Calculating risk score for customer: ${customerId}`);

    try {
      // Get customer details
      const customerQuery = `
        SELECT 
          c.id,
          c.name,
          cp.credit_limit,
          COALESCE(SUM(CASE WHEN r.is_paid = FALSE THEN r.amount - r.paid_amount ELSE 0 END), 0) AS total_outstanding
        FROM customers c
        LEFT JOIN customer_credit_profiles cp ON c.id = cp.customer_id
        LEFT JOIN receivable_items r ON c.id = r.customer_id
        WHERE c.id = $1 AND c.deleted_at IS NULL
        GROUP BY c.id, c.name, cp.credit_limit
      `;

      const customerResult = await this.db.query(customerQuery, [customerId]);

      if (customerResult.rows.length === 0) {
        throw new Error('Customer not found');
      }

      const customer = customerResult.rows[0];
      const creditLimit = parseFloat(customer.credit_limit) || 0;
      const totalOutstanding = parseFloat(customer.total_outstanding) || 0;

      // Get oldest overdue receivable
      const overdueQuery = `
        SELECT 
          id,
          due_date,
          amount,
          paid_amount,
          EXTRACT(DAY FROM (NOW() - due_date)) AS days_overdue
        FROM receivable_items
        WHERE customer_id = $1 AND is_paid = FALSE AND due_date < NOW()
        ORDER BY due_date ASC
        LIMIT 1
      `;

      const overdueResult = await this.db.query(overdueQuery, [customerId]);

      let score = 100; // Start with perfect score
      let level: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
      let reason = 'Healthy payment history';

      // Factor 1: Overdue Days (60% weight)
      if (overdueResult.rows.length > 0) {
        const daysOverdue = parseInt(overdueResult.rows[0].days_overdue);

        if (daysOverdue > 30) {
          score -= 60;
          level = 'RED';
          reason = `Critical: Overdue by ${daysOverdue} days`;
        } else if (daysOverdue > 7) {
          score -= 30;
          level = 'YELLOW';
          reason = `Warning: Overdue by ${daysOverdue} days`;
        } else {
          score -= 10;
          reason = `Minor: Overdue by ${daysOverdue} days`;
        }
      }

      // Factor 2: Credit Limit Exceeded (40% weight)
      if (creditLimit > 0 && totalOutstanding > creditLimit) {
        const excessAmount = totalOutstanding - creditLimit;
        const excessPercent = (excessAmount / creditLimit) * 100;

        if (excessPercent > 50) {
          score -= 40;
          if (level !== 'RED') level = 'RED';
          reason += `. Credit limit exceeded by ${excessPercent.toFixed(1)}% (₹${excessAmount.toLocaleString()})`;
        } else if (excessPercent > 20) {
          score -= 20;
          if (level === 'GREEN') level = 'YELLOW';
          reason += `. Credit limit exceeded by ${excessPercent.toFixed(1)}%`;
        } else {
          score -= 10;
          reason += `. Slightly over credit limit`;
        }
      }

      // Ensure score stays within 0-100
      score = Math.max(0, Math.min(100, score));

      // Adjust level based on final score if not already set by critical condition
      if (score < 40) {
        level = 'RED';
      } else if (score < 75) {
        level = 'YELLOW';
      }

      // Save snapshot
      await this.db.query(
        `INSERT INTO risk_score_snapshots (customer_id, score, level, reason, snapshot_date)
         VALUES ($1, $2, $3, $4, NOW())`,
        [customerId, score, level, reason],
      );

      this.logger.log(`Risk score calculated: Customer=${customerId}, Score=${score}, Level=${level}`);

      return { score, level, reason };
    } catch (error) {
      this.logger.error(`Failed to calculate risk score for customer ${customerId}`, error);
      throw error;
    }
  }

  /**
   * Get risk score history for a customer
   */
  async getRiskScoreHistory(customerId: string, limit: number = 10) {
    const query = `
      SELECT score, level, reason, snapshot_date
      FROM risk_score_snapshots
      WHERE customer_id = $1
      ORDER BY snapshot_date DESC
      LIMIT $2
    `;

    const result = await this.db.query(query, [customerId, limit]);

    return result.rows.map((row: any) => ({
      score: row.score,
      level: row.level,
      reason: row.reason,
      snapshotDate: row.snapshot_date,
    }));
  }

  /**
   * Get all high-risk customers for a tenant
   */
  async getHighRiskCustomers(tenantId: string) {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.phone,
        rs.score,
        rs.level,
        rs.reason,
        COALESCE(SUM(CASE WHEN r.is_paid = FALSE THEN r.amount - r.paid_amount ELSE 0 END), 0) AS outstanding_amount
      FROM customers c
      INNER JOIN LATERAL (
        SELECT score, level, reason
        FROM risk_score_snapshots
        WHERE customer_id = c.id
        ORDER BY snapshot_date DESC
        LIMIT 1
      ) rs ON TRUE
      LEFT JOIN receivable_items r ON c.id = r.customer_id
      WHERE c.tenant_id = $1 AND c.deleted_at IS NULL AND rs.level = 'RED'
      GROUP BY c.id, c.name, c.phone, rs.score, rs.level, rs.reason
      ORDER BY rs.score ASC
    `;

    const result = await this.db.query(query, [tenantId]);

    return result.rows.map((row: any) => ({
      customerId: row.id,
      name: row.name,
      phone: row.phone,
      score: row.score,
      level: row.level,
      reason: row.reason,
      outstandingAmount: parseFloat(row.outstanding_amount),
    }));
  }
}
