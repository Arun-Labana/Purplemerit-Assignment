import pgDatabase from '../src/infrastructure/database/postgresql/connection';
import logger from '../src/infrastructure/observability/logger';

async function addIdempotencyKeyColumn() {
  try {
    logger.info('Starting migration: Add idempotency_key column to jobs table');

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
    logger.error('Migration failed', error);
    throw error;
  }
}

// Run migration
addIdempotencyKeyColumn()
  .then(() => {
    logger.info('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration script failed', error);
    process.exit(1);
  });

