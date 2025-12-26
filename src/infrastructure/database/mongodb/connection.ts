import mongoose from 'mongoose';
import config from '../../config';
import logger from '../observability/logger';

class MongoDatabase {
  private static instance: MongoDatabase;

  private constructor() {
    this.connect();
  }

  public static getInstance(): MongoDatabase {
    if (!MongoDatabase.instance) {
      MongoDatabase.instance = new MongoDatabase();
    }
    return MongoDatabase.instance;
  }

  private async connect(): Promise<void> {
    try {
      await mongoose.connect(config.database.mongodb.uri);
      
      logger.info('MongoDB connected successfully');

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });
    } catch (error) {
      logger.error('MongoDB connection failed', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }

  public async testConnection(): Promise<boolean> {
    try {
      const state = mongoose.connection.readyState;
      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      logger.info('MongoDB connection state', { state });
      return state === 1;
    } catch (error) {
      logger.error('MongoDB connection test failed', error);
      return false;
    }
  }
}

export default MongoDatabase.getInstance();

