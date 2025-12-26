import mongoose from 'mongoose';
import config from '../../../config';
import logger from '../../observability/logger';

class MongoDatabase {
  private static instance: MongoDatabase;
  private connectionPromise: Promise<void>;

  private constructor() {
    this.connectionPromise = this.connect();
  }

  public static getInstance(): MongoDatabase {
    if (!MongoDatabase.instance) {
      MongoDatabase.instance = new MongoDatabase();
    }
    return MongoDatabase.instance;
  }

  private async connect(): Promise<void> {
    try {
      // Force IPv4 to avoid IPv6 connection issues
      const mongoUri = config.database.mongodb.uri.replace('localhost', '127.0.0.1');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
      });
      
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
      // Wait for initial connection to complete
      await this.connectionPromise;
      
      // Wait for connection to be ready (state 1 = connected)
      let attempts = 0;
      while (mongoose.connection.readyState !== 1 && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      const state = mongoose.connection.readyState;
      logger.info('MongoDB connection state', { state });
      return state === 1;
    } catch (error) {
      logger.error('MongoDB connection test failed', error);
      return false;
    }
  }
}

export default MongoDatabase.getInstance();

