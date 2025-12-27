import fs from 'fs';
import path from 'path';
import pgDatabase from '../src/infrastructure/database/postgresql/connection';
import logger from '../src/infrastructure/observability/logger';

async function addIdempotencyKeyColumn() {
  try {
    logger.info('Checking for idempotency_key column migration...');

    // Check if column already exists
    const checkColumn = await pgDatabase.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' AND column_name = 'idempotency_key'
    `);

    if (checkColumn.rows.length > 0) {
      logger.info('Column idempotency_key already exists, skipping migration');
      return;
    }

    // Add idempotency_key column
    await pgDatabase.query(`
      ALTER TABLE jobs 
      ADD COLUMN idempotency_key VARCHAR(255) UNIQUE
    `);

    // Create index on idempotency_key
    await pgDatabase.query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_idempotency_key ON jobs(idempotency_key)
    `);

    logger.info('Migration completed successfully: Added idempotency_key column and index');
  } catch (error) {
    logger.error('Idempotency key migration failed', error);
    throw error;
  }
}

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');

    // Run schema migrations (creates tables if they don't exist)
    try {
      const schemaPath = path.join(__dirname, '../src/infrastructure/database/postgresql/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pgDatabase.query(schema);
      logger.info('Schema migrations completed');
    } catch (error: any) {
      // Log but don't fail - schema might have partial errors (e.g., triggers already exist)
      // This is okay as long as tables exist
      logger.warn('Schema migration had some errors (this is okay if tables already exist)', { error: error.message });
    }

    // Always run idempotency key migration (adds column to existing tables if needed)
    // This is critical and should always run regardless of schema migration status
    await addIdempotencyKeyColumn();

    logger.info('Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database migration failed', error);
    process.exit(1);
  }
}

runMigrations();

