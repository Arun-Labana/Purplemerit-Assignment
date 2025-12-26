import { IUser } from '../../shared/types';
import { ValidationError } from '../../shared/errors';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.email || !this.email.includes('@')) {
      throw new ValidationError('Invalid email format');
    }

    if (!this.name || this.name.trim().length < 2) {
      throw new ValidationError('Name must be at least 2 characters');
    }

    if (!this.passwordHash) {
      throw new ValidationError('Password hash is required');
    }
  }

  static fromDatabase(data: IUser): User {
    return new User(
      data.id,
      data.email,
      data.name,
      data.passwordHash,
      data.createdAt,
      data.updatedAt
    );
  }

  toResponse() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      createdAt: this.createdAt,
    };
  }
}

export default User;

