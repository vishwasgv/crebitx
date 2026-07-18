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
   * Calls the ML engine's /api/ml/predict for a customer. Throws if the
   * engine is unreachable, errors, or returns a payload without a risk_score.
   */
  async fetchMlPrediction(tenantId: string, customerId: string): Promise<any> {
    const mlUrl = process.env.ML_ENGINE_URL || 'http://localhost:8000/api/ml/predict';
    const mlApiKey = process.env.ML_API_KEY || 'crebitx-secret-key-for-dev';

    const mlResponse = await fetch(mlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': mlApiKey,
      },
      body: JSON.stringify({ tenantId, customerId }),
    });

    if (!mlResponse.ok) {
      throw new Error(`ML Engine HTTP error status=${mlResponse.status}`);
    }

    const mlData = await mlResponse.json();
    if (!mlData || !mlData.risk_score) {
      throw new Error('ML Engine response missing risk_score');
    }

    return mlData;
  }

  /**
   * Persists an ML engine prediction as the customer's latest risk snapshot,
   * so any successful ML call (detail-page view, worker tick, manual
   * recalculation) becomes the canonical score read by list/dashboard views.
   */
  async persistMlSnapshot(customerId: string, mlData: any): Promise<RiskScoreResult> {
    const score = mlData.risk_score.score;
    const level = mlData.risk_score.level;
    let reason = 'AI Risk Prediction';
    if (mlData.explanations && mlData.explanations.length > 0) {
      reason = mlData.explanations.map((exp: any) => exp.reason).join(' | ');
    }

    await this.db.query(
      `INSERT INTO risk_score_snapshots (customer_id, score, level, reason, snapshot_date)
       VALUES ($1, $2, $3, $4, NOW())`,
      [customerId, score, level, reason],
    );

    this.logger.log(`ML Risk score calculated: Customer=${customerId}, Score=${score}, Level=${level}`);
    return { score, level, reason };
  }

  /**
   * Calculate risk score for a customer. Tries the ML Engine first; falls
   * back to a hand-coded heuristic (overdue days / credit overage / broken
   * promises) only if the ML Engine is unreachable or errors.
   */
  async calculateRiskScore(customerId: string): Promise<RiskScoreResult> {
    this.logger.log(`Calculating risk score for customer: ${customerId}`);

    // Try fetching from the ML Engine first
    try {
      const tenantResult = await this.db.query('SELECT tenant_id FROM customers WHERE id = $1 AND deleted_at IS NULL', [customerId]);
      if (tenantResult.rows.length === 0) {
        throw new Error('Customer not found');
      }
      const tenantId = tenantResult.rows[0].tenant_id;

      this.logger.log(`Fetching risk score from ML Engine for customer ${customerId}`);
      const mlData = await this.fetchMlPrediction(tenantId, customerId);
      return await this.persistMlSnapshot(customerId, mlData);
    } catch (err) {
      this.logger.warn(`Failed to connect to ML Engine: ${err.message}. Falling back to heuristics.`);
    }

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

      const brokenPromisesResult = await this.db.query(
        `SELECT COUNT(*) AS broken_count
         FROM payment_promises
         WHERE customer_id = $1 AND status = 'BROKEN'`,
        [customerId],
      );
      const brokenPromiseCount = parseInt(brokenPromisesResult.rows[0]?.broken_count || '0', 10);

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

      // Factor 3: Promise-to-pay reliability
      if (brokenPromiseCount > 0) {
        const penalty = Math.min(brokenPromiseCount * 15, 30);
        score -= penalty;

        if (brokenPromiseCount >= 2) {
          level = 'RED';
        } else if (level !== 'RED') {
          level = 'YELLOW';
        }

        reason += `. ${brokenPromiseCount} broken payment promise${brokenPromiseCount > 1 ? 's' : ''}`;
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

  /**
   * Customer ids whose latest risk snapshot is missing or older than
   * `olderThanMs`. Used by the background worker to refresh stale scores
   * without recalculating every customer on every tick.
   */
  async getCustomersWithStaleRisk(olderThanMs: number, limit: number): Promise<string[]> {
    const result = await this.db.query(
      `SELECT c.id
       FROM customers c
       LEFT JOIN LATERAL (
         SELECT snapshot_date
         FROM risk_score_snapshots
         WHERE customer_id = c.id
         ORDER BY snapshot_date DESC
         LIMIT 1
       ) rs ON TRUE
       WHERE c.deleted_at IS NULL
         AND (rs.snapshot_date IS NULL OR rs.snapshot_date < NOW() - ($1 || ' milliseconds')::interval)
       ORDER BY rs.snapshot_date ASC NULLS FIRST
       LIMIT $2`,
      [olderThanMs, limit],
    );

    return result.rows.map((row: any) => row.id);
  }
}
