import { User } from '../../../src/domain/entities/User';
import { UserRole } from '../../../src/shared/constants/enums';

describe('User Entity', () => {
  const validUserData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('constructor', () => {
    it('should create a User instance with valid data', () => {
      const user = new User(
        validUserData.id,
        validUserData.email,
        validUserData.name,
        validUserData.passwordHash,
        validUserData.createdAt,
        validUserData.updatedAt
      );

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(validUserData.id);
      expect(user.email).toBe(validUserData.email);
      expect(user.name).toBe(validUserData.name);
      expect(user.passwordHash).toBe(validUserData.passwordHash);
    });
  });

  describe('fromDatabase', () => {
    it('should create User from database record', () => {
      const user = User.fromDatabase(validUserData);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(validUserData.id);
      expect(user.email).toBe(validUserData.email);
    });
  });

  describe('toResponse', () => {
    it('should return user data without password', () => {
      const user = User.fromDatabase(validUserData);
      const response = user.toResponse();

      expect(response).toBeDefined();
      expect(response.id).toBe(validUserData.id);
      expect(response.email).toBe(validUserData.email);
      expect(response.name).toBe(validUserData.name);
      expect(response).not.toHaveProperty('passwordHash');
    });
  });
});

