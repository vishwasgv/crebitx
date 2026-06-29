import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { LoggerService } from '@/common/services/logger.service';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.initializePool();
  }

  private initializePool() {
    const dbConfig = this.configService.get('database');

    this.pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.name,
  user: dbConfig.user,
  password: dbConfig.password,
  min: dbConfig.poolMin,
  max: dbConfig.poolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
});
    // Handle pool errors
    this.pool.on('error', (err) => {
      this.logger.error('Unexpected database pool error', err.stack, 'DatabaseService');
    });

    // Log connection events
    this.pool.on('connect', () => {
      this.logger.debug('New database connection established', 'DatabaseService');
    });

    this.pool.on('remove', () => {
      this.logger.debug('Database connection removed from pool', 'DatabaseService');
    });
  }

  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.logger.log('✅ Database connection established successfully', 'DatabaseService');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error.message, 'DatabaseService');
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.pool.end();
      this.logger.log('Database pool closed', 'DatabaseService');
    } catch (error) {
      this.logger.error('Error closing database pool', error.message, 'DatabaseService');
    }
  }

  /**
   * Execute a single query
   */
  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      this.logger.debug(
        `Query executed in ${duration}ms - Rows: ${result.rowCount}`,
        'DatabaseService',
      );
      return result;
    } catch (error) {
      this.logger.error(`Query error: ${error.message}`, error.stack, 'DatabaseService');
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Get the pool instance (for advanced use cases)
   */
  getPool(): Pool {
    return this.pool;
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Transaction rolled back', error.message, 'DatabaseService');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Helper: Query single row
   */
  async queryOne<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result.rows[0] || null;
  }

  /**
   * Helper: Query multiple rows
   */
  async queryMany<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await this.query<T>(text, params);
    return result.rows;
  }

  /**
   * Helper: Check if record exists
   */
  async exists(text: string, params?: any[]): Promise<boolean> {
    const result = await this.query<{ exists: boolean }>(
      `SELECT EXISTS(${text}) as exists`,
      params,
    );
    return result.rows[0]?.exists || false;
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }
}
