import { User } from '../../../src/domain/entities/User';
import { ValidationError } from '../../../src/shared/errors';

describe('User Entity', () => {
  const validUserData = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('constructor', () => {
    it('should create a valid user', () => {
      const user = new User(
        validUserData.id,
        validUserData.email,
        validUserData.name,
        validUserData.passwordHash,
        validUserData.createdAt,
        validUserData.updatedAt
      );

      expect(user.id).toBe(validUserData.id);
      expect(user.email).toBe(validUserData.email);
      expect(user.name).toBe(validUserData.name);
    });

    it('should throw ValidationError for invalid email', () => {
      expect(() => {
        new User(
          validUserData.id,
          'invalid-email',
          validUserData.name,
          validUserData.passwordHash,
          validUserData.createdAt,
          validUserData.updatedAt
        );
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for short name', () => {
      expect(() => {
        new User(
          validUserData.id,
          validUserData.email,
          'A',
          validUserData.passwordHash,
          validUserData.createdAt,
          validUserData.updatedAt
        );
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for missing password hash', () => {
      expect(() => {
        new User(
          validUserData.id,
          validUserData.email,
          validUserData.name,
          '',
          validUserData.createdAt,
          validUserData.updatedAt
        );
      }).toThrow(ValidationError);
    });
  });

  describe('fromDatabase', () => {
    it('should create user from database record', () => {
      const user = User.fromDatabase(validUserData);

      expect(user.id).toBe(validUserData.id);
      expect(user.email).toBe(validUserData.email);
      expect(user.name).toBe(validUserData.name);
    });
  });

  describe('toResponse', () => {
    it('should return user response without password hash', () => {
      const user = new User(
        validUserData.id,
        validUserData.email,
        validUserData.name,
        validUserData.passwordHash,
        validUserData.createdAt,
        validUserData.updatedAt
      );

      const response = user.toResponse();

      expect(response.id).toBe(validUserData.id);
      expect(response.email).toBe(validUserData.email);
      expect(response.name).toBe(validUserData.name);
      expect(response.createdAt).toBe(validUserData.createdAt);
      expect(response).not.toHaveProperty('passwordHash');
      expect(response).not.toHaveProperty('updatedAt');
    });
  });
});
