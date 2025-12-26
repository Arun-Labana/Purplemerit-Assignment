import { ValidationError } from '../../shared/errors';

export class Email {
  private readonly value: string;

  constructor(email: string) {
    this.value = this.validate(email);
  }

  private validate(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || !emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    return email.toLowerCase().trim();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export default Email;

