import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { UpdateSettingsDto } from './dto/settings.dto';

export interface BusinessConfig {
  id: string;
  tenantId: string;
  defaultCycle: number;
  defaultGrace: number;
  riskWeightDelay: number;
  riskWeightLimit: number;
  reminderTone: string;
  autoApproveLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Get business settings for a tenant
   */
  async getSettings(tenantId: string): Promise<BusinessConfig> {
    this.logger.log(`Fetching settings for tenant: ${tenantId}`);

    const query = `
      SELECT 
        id,
        tenant_id,
        default_cycle,
        default_grace,
        risk_weight_delay,
        risk_weight_limit,
        reminder_tone,
        auto_approve_limit,
        created_at,
        updated_at
      FROM business_configs
      WHERE tenant_id = $1
    `;

    const result = await this.db.query(query, [tenantId]);

    if (result.rows.length === 0) {
      // Create default config if doesn't exist
      return await this.createDefaultSettings(tenantId);
    }

    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      defaultCycle: row.default_cycle,
      defaultGrace: row.default_grace,
      riskWeightDelay: parseFloat(row.risk_weight_delay),
      riskWeightLimit: parseFloat(row.risk_weight_limit),
      reminderTone: row.reminder_tone,
      autoApproveLimit: parseFloat(row.auto_approve_limit),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Update business settings
   */
  async updateSettings(tenantId: string, dto: UpdateSettingsDto): Promise<BusinessConfig> {
    this.logger.log(`Updating settings for tenant: ${tenantId}`);

    const fields: string[] = [];
    const values: any[] = [tenantId];
    let paramIndex = 2;

    if (dto.defaultCycle !== undefined) {
      fields.push(`default_cycle = $${paramIndex++}`);
      values.push(dto.defaultCycle);
    }
    if (dto.defaultGrace !== undefined) {
      fields.push(`default_grace = $${paramIndex++}`);
      values.push(dto.defaultGrace);
    }
    if (dto.riskWeightDelay !== undefined) {
      fields.push(`risk_weight_delay = $${paramIndex++}`);
      values.push(dto.riskWeightDelay);
    }
    if (dto.riskWeightLimit !== undefined) {
      fields.push(`risk_weight_limit = $${paramIndex++}`);
      values.push(dto.riskWeightLimit);
    }
    if (dto.reminderTone !== undefined) {
      fields.push(`reminder_tone = $${paramIndex++}`);
      values.push(dto.reminderTone);
    }
    if (dto.autoApproveLimit !== undefined) {
      fields.push(`auto_approve_limit = $${paramIndex++}`);
      values.push(dto.autoApproveLimit);
    }

    if (fields.length === 0) {
      return await this.getSettings(tenantId);
    }

    const query = `
      UPDATE business_configs
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE tenant_id = $1
      RETURNING 
        id,
        tenant_id,
        default_cycle,
        default_grace,
        risk_weight_delay,
        risk_weight_limit,
        reminder_tone,
        auto_approve_limit,
        created_at,
        updated_at
    `;

    const result = await this.db.query(query, values);

    if (result.rows.length === 0) {
      // Settings don't exist, create them
      await this.createDefaultSettings(tenantId);
      return await this.updateSettings(tenantId, dto);
    }

    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      defaultCycle: row.default_cycle,
      defaultGrace: row.default_grace,
      riskWeightDelay: parseFloat(row.risk_weight_delay),
      riskWeightLimit: parseFloat(row.risk_weight_limit),
      reminderTone: row.reminder_tone,
      autoApproveLimit: parseFloat(row.auto_approve_limit),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Create default settings for a new tenant
   */
  private async createDefaultSettings(tenantId: string): Promise<BusinessConfig> {
    this.logger.log(`Creating default settings for tenant: ${tenantId}`);

    const query = `
      INSERT INTO business_configs (
        tenant_id,
        default_cycle,
        default_grace,
        risk_weight_delay,
        risk_weight_limit,
        reminder_tone,
        auto_approve_limit
      )
      VALUES ($1, 30, 7, 0.6, 0.4, 'FRIENDLY', 0)
      ON CONFLICT (tenant_id) DO NOTHING
      RETURNING 
        id,
        tenant_id,
        default_cycle,
        default_grace,
        risk_weight_delay,
        risk_weight_limit,
        reminder_tone,
        auto_approve_limit,
        created_at,
        updated_at
    `;

    const result = await this.db.query(query, [tenantId]);

    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      defaultCycle: row.default_cycle,
      defaultGrace: row.default_grace,
      riskWeightDelay: parseFloat(row.risk_weight_delay),
      riskWeightLimit: parseFloat(row.risk_weight_limit),
      reminderTone: row.reminder_tone,
      autoApproveLimit: parseFloat(row.auto_approve_limit),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
