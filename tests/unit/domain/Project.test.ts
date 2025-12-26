import { Project } from '../../../src/domain/entities/Project';
import { ValidationError } from '../../../src/shared/errors';

describe('Project Entity', () => {
  const validProjectData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Project',
    description: 'Test Description',
    ownerId: 'owner-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('constructor', () => {
    it('should create a Project instance with valid data', () => {
      const project = new Project(
        validProjectData.id,
        validProjectData.name,
        validProjectData.description,
        validProjectData.ownerId,
        validProjectData.createdAt,
        validProjectData.updatedAt
      );

      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe(validProjectData.id);
      expect(project.name).toBe(validProjectData.name);
      expect(project.ownerId).toBe(validProjectData.ownerId);
    });

    it('should throw ValidationError for name shorter than 3 characters', () => {
      expect(() => {
        new Project(
          validProjectData.id,
          'AB',
          validProjectData.description,
          validProjectData.ownerId,
          validProjectData.createdAt,
          validProjectData.updatedAt
        );
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for name longer than 100 characters', () => {
      const longName = 'A'.repeat(101);
      expect(() => {
        new Project(
          validProjectData.id,
          longName,
          validProjectData.description,
          validProjectData.ownerId,
          validProjectData.createdAt,
          validProjectData.updatedAt
        );
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty ownerId', () => {
      expect(() => {
        new Project(
          validProjectData.id,
          validProjectData.name,
          validProjectData.description,
          '',
          validProjectData.createdAt,
          validProjectData.updatedAt
        );
      }).toThrow(ValidationError);
    });

    it('should accept null description', () => {
      const project = new Project(
        validProjectData.id,
        validProjectData.name,
        null,
        validProjectData.ownerId,
        validProjectData.createdAt,
        validProjectData.updatedAt
      );

      expect(project.description).toBeNull();
    });
  });

  describe('fromDatabase', () => {
    it('should create Project from database record', () => {
      const project = Project.fromDatabase(validProjectData);

      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe(validProjectData.id);
      expect(project.name).toBe(validProjectData.name);
      expect(project.ownerId).toBe(validProjectData.ownerId);
    });
  });

  describe('isOwner', () => {
    it('should return true for the owner', () => {
      const project = Project.fromDatabase(validProjectData);
      expect(project.isOwner(validProjectData.ownerId)).toBe(true);
    });

    it('should return false for non-owner', () => {
      const project = Project.fromDatabase(validProjectData);
      expect(project.isOwner('different-user')).toBe(false);
    });
  });

  describe('toResponse', () => {
    it('should return project data without internal methods', () => {
      const project = Project.fromDatabase(validProjectData);
      const response = project.toResponse();

      expect(response).toBeDefined();
      expect(response.id).toBe(validProjectData.id);
      expect(response.name).toBe(validProjectData.name);
      expect(response.description).toBe(validProjectData.description);
      expect(response.ownerId).toBe(validProjectData.ownerId);
      expect(response.createdAt).toBe(validProjectData.createdAt);
      expect(response.updatedAt).toBe(validProjectData.updatedAt);
    });
  });
});

