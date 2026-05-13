import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from './dto/customer.dto';
import { AddLedgerEntryDto, LedgerQueryDto, EntryTag } from './dto/ledger.dto';
import { RiskEngineService } from '../risk-engine/risk-engine.service';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly riskEngine: RiskEngineService,
  ) {}

  /**
   * Create a new customer with credit profile
   */
  async createCustomer(tenantId: string, dto: CreateCustomerDto) {
    this.logger.log(`Creating customer for tenant: ${tenantId}`);

    const client = await this.db.getPool().connect();
    try {
      await client.query('BEGIN');

      // Insert customer
      const customerResult = await client.query(
        `INSERT INTO customers (tenant_id, name, phone, email, address)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, tenant_id, name, phone, email, address, created_at, updated_at`,
        [tenantId, dto.name, dto.phone, dto.email, dto.address],
      );

      const customer = customerResult.rows[0];

      // Insert credit profile
      const creditProfileResult = await client.query(
        `INSERT INTO customer_credit_profiles 
         (customer_id, credit_limit, payment_cycle, grace_period, late_fee_percent, reminder_freq)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, credit_limit, payment_cycle, grace_period, late_fee_percent, reminder_freq`,
        [
          customer.id,
          dto.creditLimit ?? 0,
          dto.paymentCycle ?? 30,
          dto.gracePeriod ?? 0,
          dto.lateFeePercent ?? 0,
          dto.reminderFreq ?? 7,
        ],
      );

      await client.query('COMMIT');

      return {
        ...customer,
        creditProfile: creditProfileResult.rows[0],
      };
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to create customer', error);
      throw new BadRequestException('Failed to create customer');
    } finally {
      client.release();
    }
  }

  /**
   * Get all customers for a tenant with pagination and search
   */
  async getCustomers(tenantId: string, query: CustomerQueryDto) {
    const { search, page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE c.tenant_id = $1 AND c.deleted_at IS NULL';
    const params: any[] = [tenantId];

    if (search) {
      whereClause += ` AND (c.name ILIKE $2 OR c.phone ILIKE $2 OR c.email ILIKE $2)`;
      params.push(`%${search}%`);
    }

    const orderByClause = `ORDER BY c.${sortBy} ${sortOrder.toUpperCase()}`;

    const customersQuery = `
      SELECT 
        c.id,
        c.tenant_id,
        c.name,
        c.phone,
        c.email,
        c.address,
        c.created_at,
        c.updated_at,
        cp.credit_limit,
        cp.payment_cycle,
        cp.grace_period,
        cp.late_fee_percent,
        cp.reminder_freq,
        COALESCE(SUM(CASE WHEN r.is_paid = FALSE THEN r.amount - r.paid_amount ELSE 0 END), 0) AS outstanding_balance,
        COUNT(CASE WHEN r.is_paid = FALSE THEN 1 END) AS unpaid_count,
        rs.level AS risk_level,
        rs.score AS risk_score
      FROM customers c
      LEFT JOIN customer_credit_profiles cp ON c.id = cp.customer_id
      LEFT JOIN receivable_items r ON c.id = r.customer_id
      LEFT JOIN LATERAL (
        SELECT level, score 
        FROM risk_score_snapshots 
        WHERE customer_id = c.id 
        ORDER BY snapshot_date DESC 
        LIMIT 1
      ) rs ON TRUE
      ${whereClause}
      GROUP BY c.id, cp.credit_limit, cp.payment_cycle, cp.grace_period, cp.late_fee_percent, cp.reminder_freq, rs.level, rs.score
      ${orderByClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM customers c
      ${whereClause}
    `;

    const [customersResult, countResult] = await Promise.all([
      this.db.query(customersQuery, [...params, limit, offset]),
      this.db.query(countQuery, params),
    ]);

    const total = parseInt(countResult.rows[0].total);

    return {
      data: customersResult.rows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        creditProfile: {
          creditLimit: parseFloat(row.credit_limit),
          paymentCycle: row.payment_cycle,
          gracePeriod: row.grace_period,
          lateFeePercent: parseFloat(row.late_fee_percent),
          reminderFreq: row.reminder_freq,
        },
        outstandingBalance: parseFloat(row.outstanding_balance),
        unpaidCount: parseInt(row.unpaid_count),
        riskLevel: row.risk_level || 'GREEN',
        riskScore: row.risk_score || 100,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get customer by ID with full details
   */
  async getCustomerById(tenantId: string, customerId: string) {
    const customerQuery = `
      SELECT 
        c.id,
        c.tenant_id,
        c.name,
        c.phone,
        c.email,
        c.address,
        c.created_at,
        c.updated_at,
        cp.credit_limit,
        cp.payment_cycle,
        cp.grace_period,
        cp.late_fee_percent,
        cp.reminder_freq,
        rs.level AS risk_level,
        rs.score AS risk_score,
        rs.reason AS risk_reason
      FROM customers c
      LEFT JOIN customer_credit_profiles cp ON c.id = cp.customer_id
      LEFT JOIN LATERAL (
        SELECT level, score, reason
        FROM risk_score_snapshots 
        WHERE customer_id = c.id 
        ORDER BY snapshot_date DESC 
        LIMIT 1
      ) rs ON TRUE
      WHERE c.id = $1 AND c.tenant_id = $2 AND c.deleted_at IS NULL
    `;

    const result = await this.db.query(customerQuery, [customerId, tenantId]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Customer not found');
    }

    const customer = result.rows[0];

    // Get receivables
    const receivablesQuery = `
      SELECT id, amount, paid_amount, description, due_date, is_paid, created_at, updated_at
      FROM receivable_items
      WHERE customer_id = $1 AND is_paid = FALSE
      ORDER BY due_date ASC
    `;

    const receivablesResult = await this.db.query(receivablesQuery, [customerId]);

    // Get ledger events
    const ledgerQuery = `
      SELECT id, amount, tag, note, event_date, created_at
      FROM ledger_events
      WHERE customer_id = $1
      ORDER BY event_date DESC
      LIMIT 50
    `;

    const ledgerResult = await this.db.query(ledgerQuery, [customerId]);

    return {
      id: customer.id,
      tenantId: customer.tenant_id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
      creditProfile: {
        creditLimit: parseFloat(customer.credit_limit),
        paymentCycle: customer.payment_cycle,
        gracePeriod: customer.grace_period,
        lateFeePercent: parseFloat(customer.late_fee_percent),
        reminderFreq: customer.reminder_freq,
      },
      riskSnapshot: {
        level: customer.risk_level || 'GREEN',
        score: customer.risk_score || 100,
        reason: customer.risk_reason,
      },
      receivables: receivablesResult.rows.map((r) => ({
        id: r.id,
        amount: parseFloat(r.amount),
        paidAmount: parseFloat(r.paid_amount),
        description: r.description,
        dueDate: r.due_date,
        isPaid: r.is_paid,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      ledgerEvents: ledgerResult.rows.map((l) => ({
        id: l.id,
        amount: parseFloat(l.amount),
        tag: l.tag,
        note: l.note,
        eventDate: l.event_date,
        createdAt: l.created_at,
      })),
    };
  }

  /**
   * Update customer details
   */
  async updateCustomer(tenantId: string, customerId: string, dto: UpdateCustomerDto) {
    const client = await this.db.getPool().connect();
    try {
      await client.query('BEGIN');

      // Update customer basic info
      const customerFields: string[] = [];
      const customerValues: any[] = [customerId, tenantId];
      let paramIndex = 3;

      if (dto.name !== undefined) {
        customerFields.push(`name = $${paramIndex++}`);
        customerValues.push(dto.name);
      }
      if (dto.phone !== undefined) {
        customerFields.push(`phone = $${paramIndex++}`);
        customerValues.push(dto.phone);
      }
      if (dto.email !== undefined) {
        customerFields.push(`email = $${paramIndex++}`);
        customerValues.push(dto.email);
      }
      if (dto.address !== undefined) {
        customerFields.push(`address = $${paramIndex++}`);
        customerValues.push(dto.address);
      }

      if (customerFields.length > 0) {
        const customerQuery = `
          UPDATE customers 
          SET ${customerFields.join(', ')}, updated_at = NOW()
          WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
          RETURNING id
        `;
        const result = await client.query(customerQuery, customerValues);
        if (result.rows.length === 0) {
          throw new NotFoundException('Customer not found');
        }
      }

      // Update credit profile
      const creditFields: string[] = [];
      const creditValues: any[] = [customerId];
      paramIndex = 2;

      if (dto.creditLimit !== undefined) {
        creditFields.push(`credit_limit = $${paramIndex++}`);
        creditValues.push(dto.creditLimit);
      }
      if (dto.paymentCycle !== undefined) {
        creditFields.push(`payment_cycle = $${paramIndex++}`);
        creditValues.push(dto.paymentCycle);
      }
      if (dto.gracePeriod !== undefined) {
        creditFields.push(`grace_period = $${paramIndex++}`);
        creditValues.push(dto.gracePeriod);
      }
      if (dto.lateFeePercent !== undefined) {
        creditFields.push(`late_fee_percent = $${paramIndex++}`);
        creditValues.push(dto.lateFeePercent);
      }
      if (dto.reminderFreq !== undefined) {
        creditFields.push(`reminder_freq = $${paramIndex++}`);
        creditValues.push(dto.reminderFreq);
      }

      if (creditFields.length > 0) {
        const creditQuery = `
          UPDATE customer_credit_profiles 
          SET ${creditFields.join(', ')}, updated_at = NOW()
          WHERE customer_id = $1
        `;
        await client.query(creditQuery, creditValues);
      }

      await client.query('COMMIT');

      return await this.getCustomerById(tenantId, customerId);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to update customer', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(tenantId: string, customerId: string) {
    const result = await this.db.query(
      `UPDATE customers 
       SET deleted_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [customerId, tenantId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Customer not found');
    }

    return { message: 'Customer deleted successfully' };
  }

  /**
   * Add ledger entry (SALE, PAYMENT, RETURN, ADJUSTMENT)
   */
  async addLedgerEntry(tenantId: string, dto: AddLedgerEntryDto) {
    const client = await this.db.getPool().connect();
    try {
      await client.query('BEGIN');

      // Verify customer exists and belongs to tenant
      const customerCheck = await client.query(
        'SELECT id FROM customers WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
        [dto.customerId, tenantId],
      );

      if (customerCheck.rows.length === 0) {
        throw new NotFoundException('Customer not found');
      }

      // Insert ledger event
      const ledgerResult = await client.query(
        `INSERT INTO ledger_events (tenant_id, customer_id, amount, tag, note, event_date)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, tenant_id, customer_id, amount, tag, note, event_date, created_at`,
        [tenantId, dto.customerId, dto.amount, dto.tag, dto.note],
      );

      const ledgerEvent = ledgerResult.rows[0];

      // Handle SALE: Create receivable
      if (dto.tag === EntryTag.SALE) {
        const creditProfile = await client.query(
          'SELECT payment_cycle FROM customer_credit_profiles WHERE customer_id = $1',
          [dto.customerId],
        );

        const paymentCycle = creditProfile.rows[0]?.payment_cycle || 30;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + paymentCycle);

        await client.query(
          `INSERT INTO receivable_items (customer_id, amount, description, due_date)
           VALUES ($1, $2, $3, $4)`,
          [dto.customerId, dto.amount, dto.note, dueDate.toISOString().split('T')[0]],
        );
      }

      // Handle PAYMENT: Allocate to oldest receivables (FIFO)
      if (dto.tag === EntryTag.PAYMENT) {
        let remainingPayment = dto.amount;

        const unpaidReceivables = await client.query(
          `SELECT id, amount, paid_amount
           FROM receivable_items
           WHERE customer_id = $1 AND is_paid = FALSE
           ORDER BY due_date ASC`,
          [dto.customerId],
        );

        for (const receivable of unpaidReceivables.rows) {
          if (remainingPayment <= 0) break;

          const needed = receivable.amount - receivable.paid_amount;
          const allocation = Math.min(remainingPayment, needed);

          // Record payment allocation
          await client.query(
            `INSERT INTO payment_allocations (receivable_item_id, amount, payment_date)
             VALUES ($1, $2, NOW())`,
            [receivable.id, allocation],
          );

          // Update receivable
          const newPaidAmount = parseFloat(receivable.paid_amount) + allocation;
          const isPaid = newPaidAmount >= parseFloat(receivable.amount);

          await client.query(
            `UPDATE receivable_items
             SET paid_amount = $1, is_paid = $2, updated_at = NOW()
             WHERE id = $3`,
            [newPaidAmount, isPaid, receivable.id],
          );

          remainingPayment -= allocation;
        }
      }

      await client.query('COMMIT');

      // Trigger risk score recalculation (async)
      this.riskEngine.calculateRiskScore(dto.customerId).catch((err) => {
        this.logger.warn(`Risk calculation failed for customer ${dto.customerId}`, err);
      });

      return {
        id: ledgerEvent.id,
        tenantId: ledgerEvent.tenant_id,
        customerId: ledgerEvent.customer_id,
        amount: parseFloat(ledgerEvent.amount),
        tag: ledgerEvent.tag,
        note: ledgerEvent.note,
        eventDate: ledgerEvent.event_date,
        createdAt: ledgerEvent.created_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to add ledger entry', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get ledger history for a customer
   */
  async getLedgerHistory(tenantId: string, query: LedgerQueryDto) {
    const { customerId, page = 1, limit = 50 } = query;
    const offset = (page - 1) * limit;

    // Verify customer belongs to tenant
    const customerCheck = await this.db.query(
      'SELECT id FROM customers WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [customerId, tenantId],
    );

    if (customerCheck.rows.length === 0) {
      throw new NotFoundException('Customer not found');
    }

    const ledgerQuery = `
      SELECT id, amount, tag, note, event_date, created_at
      FROM ledger_events
      WHERE customer_id = $1
      ORDER BY event_date DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ledger_events
      WHERE customer_id = $1
    `;

    const [ledgerResult, countResult] = await Promise.all([
      this.db.query(ledgerQuery, [customerId, limit, offset]),
      this.db.query(countQuery, [customerId]),
    ]);

    const total = parseInt(countResult.rows[0].total);

    return {
      data: ledgerResult.rows.map((row) => ({
        id: row.id,
        amount: parseFloat(row.amount),
        tag: row.tag,
        note: row.note,
        eventDate: row.event_date,
        createdAt: row.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
