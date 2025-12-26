import { UserRole as UserRoleEnum } from '../../shared/constants/enums';
import { ValidationError, ForbiddenError } from '../../shared/errors';

export class Role {
  private readonly value: UserRoleEnum;

  constructor(role: string) {
    this.value = this.validate(role);
  }

  private validate(role: string): UserRoleEnum {
    if (!Object.values(UserRoleEnum).includes(role as UserRoleEnum)) {
      throw new ValidationError(`Invalid role: ${role}`);
    }

    return role as UserRoleEnum;
  }

  getValue(): UserRoleEnum {
    return this.value;
  }

  isOwner(): boolean {
    return this.value === UserRoleEnum.OWNER;
  }

  isCollaborator(): boolean {
    return this.value === UserRoleEnum.COLLABORATOR;
  }

  isViewer(): boolean {
    return this.value === UserRoleEnum.VIEWER;
  }

  canWrite(): boolean {
    return this.value === UserRoleEnum.OWNER || this.value === UserRoleEnum.COLLABORATOR;
  }

  canManageMembers(): boolean {
    return this.value === UserRoleEnum.OWNER;
  }

  canDelete(): boolean {
    return this.value === UserRoleEnum.OWNER;
  }

  hasPermission(permission: 'read' | 'write' | 'delete' | 'manage'): boolean {
    switch (permission) {
      case 'read':
        return true; // All roles can read
      case 'write':
        return this.canWrite();
      case 'delete':
        return this.canDelete();
      case 'manage':
        return this.canManageMembers();
      default:
        return false;
    }
  }

  assertPermission(permission: 'read' | 'write' | 'delete' | 'manage'): void {
    if (!this.hasPermission(permission)) {
      throw new ForbiddenError(`Role ${this.value} does not have ${permission} permission`);
    }
  }

  equals(other: Role): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export default Role;

