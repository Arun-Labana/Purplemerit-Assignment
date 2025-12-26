import mongoose from 'mongoose';
import config from '../../../../../src/config';
import logger from '../../../../../src/infrastructure/observability/logger';

jest.mock('mongoose');
jest.mock('../../../../../src/config');
jest.mock('../../../../../src/infrastructure/observability/logger');

// Mock mongoose.connection before importing MongoDatabase
const mockConnection = {
  on: jest.fn(),
  readyState: 0,
  close: jest.fn(),
};

Object.defineProperty(mongoose, 'connection', {
  value: mockConnection,
  writable: true,
  configurable: true,
});

// Import after setting up mocks
import MongoDatabase from '../../../../../src/infrastructure/database/mongodb/connection';

describe('MongoDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (config.database.mongodb.uri as any) = 'mongodb://localhost:27017/test';
    mockConnection.on.mockClear();
    mockConnection.readyState = 0;
  });

  describe('connect', () => {
    it('should connect to MongoDB successfully', async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      (mongoose.connect as any) = mockConnect;
      mockConnection.readyState = 1;

      // Access the instance (already created on import)
      const db = MongoDatabase;
      // Create a new connection promise for this test
      (db as any).connectionPromise = (db as any).connect();
      await (db as any).connectionPromise;

      expect(mockConnect).toHaveBeenCalled();
      expect(mockConnection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockConnection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockConnection.on).toHaveBeenCalledWith('reconnected', expect.any(Function));
    });

    it('should replace localhost with 127.0.0.1', async () => {
      (config.database.mongodb.uri as any) = 'mongodb://localhost:27017/test';
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      (mongoose.connect as any) = mockConnect;
      mockConnection.readyState = 1;

      const db = MongoDatabase;
      (db as any).connectionPromise = (db as any).connect();
      await (db as any).connectionPromise;

      expect(mockConnect).toHaveBeenCalledWith(
        'mongodb://127.0.0.1:27017/test',
        expect.objectContaining({
          serverSelectionTimeoutMS: 10000,
        })
      );
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      (mongoose.connect as any) = jest.fn().mockRejectedValue(error);
      mockConnection.readyState = 0;

      // Access the instance (already created on import)
      const db = MongoDatabase;
      (db as any).connectionPromise = (db as any).connect();
      await expect((db as any).connectionPromise).rejects.toThrow('Connection failed');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close MongoDB connection', async () => {
      const mockClose = jest.fn().mockResolvedValue(undefined);
      mockConnection.close = mockClose;
      mockConnection.readyState = 1;

      const db = MongoDatabase;
      await db.close();

      expect(mockClose).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('MongoDB connection closed');
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is ready', async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      (mongoose.connect as any) = mockConnect;
      mockConnection.readyState = 1;

      const db = MongoDatabase;
      (db as any).connectionPromise = (db as any).connect();
      await (db as any).connectionPromise;

      const result = await db.testConnection();

      expect(result).toBe(true);
    });

    it('should wait for connection to be ready', async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      (mongoose.connect as any) = mockConnect;
      mockConnection.readyState = 0;

      const db = MongoDatabase;
      (db as any).connectionPromise = (db as any).connect();
      await (db as any).connectionPromise;

      // Simulate connection becoming ready after delay
      setTimeout(() => {
        mockConnection.readyState = 1;
      }, 100);

      const result = await db.testConnection();

      expect(result).toBe(true);
    });

    it('should return false when connection test fails', async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      (mongoose.connect as any) = mockConnect;
      mockConnection.readyState = 0;

      const db = MongoDatabase;
      (db as any).connectionPromise = Promise.resolve(); // Resolve immediately
      
      // Mock setTimeout to resolve immediately
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: any, delay: number) => {
        return originalSetTimeout(fn, 0);
      }) as any;

      const result = await db.testConnection();
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;

      expect(result).toBe(false);
    });
  });
});
