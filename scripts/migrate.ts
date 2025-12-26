import fs from 'fs';
import path from 'path';
import pgDatabase from '../src/infrastructure/database/postgresql/connection';
import logger from '../src/infrastructure/observability/logger';

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');

    const schemaPath = path.join(__dirname, '../src/infrastructure/database/postgresql/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pgDatabase.query(schema);

    logger.info('Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database migration failed', error);
    process.exit(1);
  }
}

runMigrations();

