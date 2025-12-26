import { createClient, RedisClientType } from 'redis';
import config from '../../../config';
import logger from '../../observability/logger';

class RedisDatabase {
  private client: RedisClientType;
  private static instance: RedisDatabase;

  private constructor() {
    // Force IPv4 to avoid IPv6 connection issues
    const redisUrl = config.database.redis.url.replace('localhost', '127.0.0.1');
    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('connect', () => {
      logger.info('Redis client connecting');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (err) => {
      logger.error('Redis client error', err);
    });

    this.client.on('reconnecting', () => {
      logger.warn('Redis client reconnecting');
    });

    this.connect();
  }

  public static getInstance(): RedisDatabase {
    if (!RedisDatabase.instance) {
      RedisDatabase.instance = new RedisDatabase();
    }
    return RedisDatabase.instance;
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Redis connection failed', error);
      throw error;
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Error getting key from Redis', { key, error });
      throw error;
    }
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Error setting key in Redis', { key, error });
      throw error;
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Error deleting key from Redis', { key, error });
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Error checking key existence in Redis', { key, error });
      throw error;
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Error getting keys from Redis', { pattern, error });
      throw error;
    }
  }

  public async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.client.del(keys);
    } catch (error) {
      logger.error('Error deleting keys by pattern from Redis', { pattern, error });
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.client.quit();
    logger.info('Redis connection closed');
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.client.ping();
      logger.info('Redis connection test successful');
      return true;
    } catch (error) {
      logger.error('Redis connection test failed', error);
      return false;
    }
  }
}

export default RedisDatabase.getInstance();

