import { IWorkspace } from '../../shared/types';
import { ValidationError } from '../../shared/errors';

export class Workspace {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly settings: Record<string, any>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.trim().length < 3) {
      throw new ValidationError('Workspace name must be at least 3 characters');
    }

    if (this.name.length > 100) {
      throw new ValidationError('Workspace name must not exceed 100 characters');
    }

    if (!this.projectId) {
      throw new ValidationError('Project ID is required');
    }
  }

  static fromDatabase(data: IWorkspace): Workspace {
    return new Workspace(
      data.id,
      data.projectId,
      data.name,
      data.settings,
      data.createdAt,
      data.updatedAt
    );
  }

  toResponse() {
    return {
      id: this.id,
      projectId: this.projectId,
      name: this.name,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default Workspace;

