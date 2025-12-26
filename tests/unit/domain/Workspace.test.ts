import { Workspace } from '../../../src/domain/entities/Workspace';
import { ValidationError } from '../../../src/shared/errors';

describe('Workspace Entity', () => {
  const validWorkspaceData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    projectId: 'project-123',
    name: 'Test Workspace',
    settings: { theme: 'dark', language: 'typescript' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('constructor', () => {
    it('should create a Workspace instance with valid data', () => {
      const workspace = new Workspace(
        validWorkspaceData.id,
        validWorkspaceData.projectId,
        validWorkspaceData.name,
        validWorkspaceData.settings,
        validWorkspaceData.createdAt,
        validWorkspaceData.updatedAt
      );

      expect(workspace).toBeInstanceOf(Workspace);
      expect(workspace.id).toBe(validWorkspaceData.id);
      expect(workspace.name).toBe(validWorkspaceData.name);
      expect(workspace.projectId).toBe(validWorkspaceData.projectId);
    });

    it('should throw ValidationError for name shorter than 3 characters', () => {
      expect(() => {
        new Workspace(
          validWorkspaceData.id,
          validWorkspaceData.projectId,
          'AB',
          validWorkspaceData.settings,
          validWorkspaceData.createdAt,
          validWorkspaceData.updatedAt
        );
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for name longer than 100 characters', () => {
      const longName = 'A'.repeat(101);
      expect(() => {
        new Workspace(
          validWorkspaceData.id,
          validWorkspaceData.projectId,
          longName,
          validWorkspaceData.settings,
          validWorkspaceData.createdAt,
          validWorkspaceData.updatedAt
        );
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty projectId', () => {
      expect(() => {
        new Workspace(
          validWorkspaceData.id,
          '',
          validWorkspaceData.name,
          validWorkspaceData.settings,
          validWorkspaceData.createdAt,
          validWorkspaceData.updatedAt
        );
      }).toThrow(ValidationError);
    });
  });

  describe('fromDatabase', () => {
    it('should create Workspace from database record', () => {
      const workspace = Workspace.fromDatabase(validWorkspaceData);

      expect(workspace).toBeInstanceOf(Workspace);
      expect(workspace.id).toBe(validWorkspaceData.id);
      expect(workspace.name).toBe(validWorkspaceData.name);
      expect(workspace.projectId).toBe(validWorkspaceData.projectId);
    });
  });

  describe('toResponse', () => {
    it('should return workspace data', () => {
      const workspace = Workspace.fromDatabase(validWorkspaceData);
      const response = workspace.toResponse();

      expect(response).toBeDefined();
      expect(response.id).toBe(validWorkspaceData.id);
      expect(response.name).toBe(validWorkspaceData.name);
      expect(response.projectId).toBe(validWorkspaceData.projectId);
      expect(response.settings).toEqual(validWorkspaceData.settings);
      expect(response.createdAt).toBe(validWorkspaceData.createdAt);
      expect(response.updatedAt).toBe(validWorkspaceData.updatedAt);
    });
  });
});

