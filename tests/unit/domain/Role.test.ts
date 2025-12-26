import { Role } from '../../../src/domain/value-objects/Role';
import { ValidationError, ForbiddenError } from '../../../src/shared/errors';
import { UserRole } from '../../../src/shared/constants/enums';

describe('Role Value Object', () => {
  describe('constructor', () => {
    it('should create Role with valid role', () => {
      const role = new Role(UserRole.OWNER);
      expect(role.getValue()).toBe(UserRole.OWNER);
    });

    it('should throw ValidationError for invalid role', () => {
      expect(() => new Role('INVALID_ROLE')).toThrow(ValidationError);
    });
  });

  describe('isOwner', () => {
    it('should return true for OWNER role', () => {
      const role = new Role(UserRole.OWNER);
      expect(role.isOwner()).toBe(true);
    });

    it('should return false for non-OWNER roles', () => {
      const collaboratorRole = new Role(UserRole.COLLABORATOR);
      const viewerRole = new Role(UserRole.VIEWER);
      expect(collaboratorRole.isOwner()).toBe(false);
      expect(viewerRole.isOwner()).toBe(false);
    });
  });

  describe('isCollaborator', () => {
    it('should return true for COLLABORATOR role', () => {
      const role = new Role(UserRole.COLLABORATOR);
      expect(role.isCollaborator()).toBe(true);
    });

    it('should return false for non-COLLABORATOR roles', () => {
      const ownerRole = new Role(UserRole.OWNER);
      const viewerRole = new Role(UserRole.VIEWER);
      expect(ownerRole.isCollaborator()).toBe(false);
      expect(viewerRole.isCollaborator()).toBe(false);
    });
  });

  describe('isViewer', () => {
    it('should return true for VIEWER role', () => {
      const role = new Role(UserRole.VIEWER);
      expect(role.isViewer()).toBe(true);
    });

    it('should return false for non-VIEWER roles', () => {
      const ownerRole = new Role(UserRole.OWNER);
      const collaboratorRole = new Role(UserRole.COLLABORATOR);
      expect(ownerRole.isViewer()).toBe(false);
      expect(collaboratorRole.isViewer()).toBe(false);
    });
  });

  describe('canWrite', () => {
    it('should return true for OWNER', () => {
      const role = new Role(UserRole.OWNER);
      expect(role.canWrite()).toBe(true);
    });

    it('should return true for COLLABORATOR', () => {
      const role = new Role(UserRole.COLLABORATOR);
      expect(role.canWrite()).toBe(true);
    });

    it('should return false for VIEWER', () => {
      const role = new Role(UserRole.VIEWER);
      expect(role.canWrite()).toBe(false);
    });
  });

  describe('canManageMembers', () => {
    it('should return true for OWNER', () => {
      const role = new Role(UserRole.OWNER);
      expect(role.canManageMembers()).toBe(true);
    });

    it('should return false for non-OWNER roles', () => {
      const collaboratorRole = new Role(UserRole.COLLABORATOR);
      const viewerRole = new Role(UserRole.VIEWER);
      expect(collaboratorRole.canManageMembers()).toBe(false);
      expect(viewerRole.canManageMembers()).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('should return true for OWNER', () => {
      const role = new Role(UserRole.OWNER);
      expect(role.canDelete()).toBe(true);
    });

    it('should return false for non-OWNER roles', () => {
      const collaboratorRole = new Role(UserRole.COLLABORATOR);
      const viewerRole = new Role(UserRole.VIEWER);
      expect(collaboratorRole.canDelete()).toBe(false);
      expect(viewerRole.canDelete()).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true for read permission for all roles', () => {
      const ownerRole = new Role(UserRole.OWNER);
      const collaboratorRole = new Role(UserRole.COLLABORATOR);
      const viewerRole = new Role(UserRole.VIEWER);
      expect(ownerRole.hasPermission('read')).toBe(true);
      expect(collaboratorRole.hasPermission('read')).toBe(true);
      expect(viewerRole.hasPermission('read')).toBe(true);
    });

    it('should return true for write permission for OWNER and COLLABORATOR', () => {
      const ownerRole = new Role(UserRole.OWNER);
      const collaboratorRole = new Role(UserRole.COLLABORATOR);
      const viewerRole = new Role(UserRole.VIEWER);
      expect(ownerRole.hasPermission('write')).toBe(true);
      expect(collaboratorRole.hasPermission('write')).toBe(true);
      expect(viewerRole.hasPermission('write')).toBe(false);
    });

    it('should return true for delete permission only for OWNER', () => {
      const ownerRole = new Role(UserRole.OWNER);
      const collaboratorRole = new Role(UserRole.COLLABORATOR);
      const viewerRole = new Role(UserRole.VIEWER);
      expect(ownerRole.hasPermission('delete')).toBe(true);
      expect(collaboratorRole.hasPermission('delete')).toBe(false);
      expect(viewerRole.hasPermission('delete')).toBe(false);
    });

    it('should return true for manage permission only for OWNER', () => {
      const ownerRole = new Role(UserRole.OWNER);
      const collaboratorRole = new Role(UserRole.COLLABORATOR);
      const viewerRole = new Role(UserRole.VIEWER);
      expect(ownerRole.hasPermission('manage')).toBe(true);
      expect(collaboratorRole.hasPermission('manage')).toBe(false);
      expect(viewerRole.hasPermission('manage')).toBe(false);
    });
  });

  describe('assertPermission', () => {
    it('should not throw for OWNER with any permission', () => {
      const role = new Role(UserRole.OWNER);
      expect(() => role.assertPermission('read')).not.toThrow();
      expect(() => role.assertPermission('write')).not.toThrow();
      expect(() => role.assertPermission('delete')).not.toThrow();
      expect(() => role.assertPermission('manage')).not.toThrow();
    });

    it('should throw ForbiddenError for VIEWER without write permission', () => {
      const role = new Role(UserRole.VIEWER);
      expect(() => role.assertPermission('write')).toThrow(ForbiddenError);
      expect(() => role.assertPermission('delete')).toThrow(ForbiddenError);
      expect(() => role.assertPermission('manage')).toThrow(ForbiddenError);
    });

    it('should not throw for COLLABORATOR with write permission', () => {
      const role = new Role(UserRole.COLLABORATOR);
      expect(() => role.assertPermission('read')).not.toThrow();
      expect(() => role.assertPermission('write')).not.toThrow();
      expect(() => role.assertPermission('delete')).toThrow(ForbiddenError);
      expect(() => role.assertPermission('manage')).toThrow(ForbiddenError);
    });
  });

  describe('equals', () => {
    it('should return true for same role', () => {
      const role1 = new Role(UserRole.OWNER);
      const role2 = new Role(UserRole.OWNER);
      expect(role1.equals(role2)).toBe(true);
    });

    it('should return false for different roles', () => {
      const role1 = new Role(UserRole.OWNER);
      const role2 = new Role(UserRole.COLLABORATOR);
      expect(role1.equals(role2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return role string', () => {
      const role = new Role(UserRole.OWNER);
      expect(role.toString()).toBe(UserRole.OWNER);
    });
  });
});

