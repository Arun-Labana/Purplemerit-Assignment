import UserRepository from '../../../../../src/infrastructure/database/postgresql/UserRepository';
import pgDatabase from '../../../../../src/infrastructure/database/postgresql/connection';

jest.mock('../../../../../src/infrastructure/database/postgresql/connection');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });

      const result = await UserRepository.findById('user-123');

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await UserRepository.findById('user-123');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });

      const result = await UserRepository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create user', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
        passwordHash: 'hashed-password',
      };
      const mockUser = {
        id: 'user-123',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });

      const result = await UserRepository.create(userData);

      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updates = { name: 'Updated Name' };
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Updated Name',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });

      const result = await UserRepository.update('user-123', updates);

      expect(result).toEqual(mockUser);
    });

    it('should return existing user when no updates provided', async () => {
      const mockUser = { id: 'user-123', name: 'Test' };
      jest.spyOn(UserRepository, 'findById').mockResolvedValue(mockUser as any);

      await UserRepository.update('user-123', {});

      expect(UserRepository.findById).toHaveBeenCalledWith('user-123');
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rowCount: 1 });

      const result = await UserRepository.delete('user-123');

      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

      const result = await UserRepository.delete('user-123');

      expect(result).toBe(false);
    });
  });
});

