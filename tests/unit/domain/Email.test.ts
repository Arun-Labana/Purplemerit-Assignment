import { Email } from '../../../src/domain/value-objects/Email';
import { ValidationError } from '../../../src/shared/errors';

describe('Email Value Object', () => {
  describe('constructor', () => {
    it('should create Email with valid email', () => {
      const email = new Email('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = new Email('TEST@EXAMPLE.COM');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = new Email('  test@example.com  ');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should throw ValidationError for invalid email format', () => {
      expect(() => new Email('invalid-email')).toThrow(ValidationError);
      expect(() => new Email('@example.com')).toThrow(ValidationError);
      expect(() => new Email('test@')).toThrow(ValidationError);
      expect(() => new Email('test.example.com')).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty email', () => {
      expect(() => new Email('')).toThrow(ValidationError);
    });
  });

  describe('equals', () => {
    it('should return true for same email', () => {
      const email1 = new Email('test@example.com');
      const email2 = new Email('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for emails with different case', () => {
      const email1 = new Email('TEST@EXAMPLE.COM');
      const email2 = new Email('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = new Email('test1@example.com');
      const email2 = new Email('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return email string', () => {
      const email = new Email('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });
});

