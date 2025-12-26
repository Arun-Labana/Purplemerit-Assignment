import { IProject } from '../../shared/types';
import { ValidationError } from '../../shared/errors';

export class Project {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly ownerId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.trim().length < 3) {
      throw new ValidationError('Project name must be at least 3 characters');
    }

    if (this.name.length > 100) {
      throw new ValidationError('Project name must not exceed 100 characters');
    }

    if (!this.ownerId) {
      throw new ValidationError('Owner ID is required');
    }
  }

  static fromDatabase(data: IProject): Project {
    return new Project(
      data.id,
      data.name,
      data.description,
      data.ownerId,
      data.createdAt,
      data.updatedAt
    );
  }

  isOwner(userId: string): boolean {
    return this.ownerId === userId;
  }

  toResponse() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      ownerId: this.ownerId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default Project;

