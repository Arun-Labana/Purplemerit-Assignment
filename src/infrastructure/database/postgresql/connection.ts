import { Pool, PoolClient } from 'pg';
import config from '../../../config';
import logger from '../../observability/logger';

class PostgresDatabase {
  private pool: Pool;
  private static instance: PostgresDatabase;

  private constructor() {
    this.pool = new Pool({
      connectionString: config.database.postgres.url,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('connect', () => {
      logger.info('PostgreSQL client connected');
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  public static getInstance(): PostgresDatabase {
    if (!PostgresDatabase.instance) {
      PostgresDatabase.instance = new PostgresDatabase();
    }
    return PostgresDatabase.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Error executing query', { text, error });
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async close(): Promise<void> {
    await this.pool.end();
    logger.info('PostgreSQL pool closed');
  }

  // Test connection
  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      logger.info('PostgreSQL connection test successful', { time: result.rows[0].now });
      return true;
    } catch (error) {
      logger.error('PostgreSQL connection test failed', error);
      return false;
    }
  }
}

export default PostgresDatabase.getInstance();

