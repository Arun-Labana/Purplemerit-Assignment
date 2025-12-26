import ProjectRepository from '../../../../../src/infrastructure/database/postgresql/ProjectRepository';
import pgDatabase from '../../../../../src/infrastructure/database/postgresql/connection';

jest.mock('../../../../../src/infrastructure/database/postgresql/connection');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('ProjectRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find project by id', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        description: 'Test Description',
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockProject] });

      const result = await ProjectRepository.findById('project-123');

      expect(result).toEqual(mockProject);
    });
  });

  describe('findByUserId', () => {
    it('should find projects by user id', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          ownerId: 'user-123',
        },
      ];
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: mockProjects });

      const result = await ProjectRepository.findByUserId('user-123', 20, 0);

      expect(result).toEqual(mockProjects);
    });
  });

  describe('countByUserId', () => {
    it('should count projects by user id', async () => {
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [{ count: '5' }] });

      const result = await ProjectRepository.countByUserId('user-123');

      expect(result).toBe(5);
    });
  });

  describe('create', () => {
    it('should create project', async () => {
      const projectData = { name: 'New Project', description: 'Description' };
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [{ id: 'project-123', ...projectData }] }),
        release: jest.fn(),
      };
      (pgDatabase.getClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await ProjectRepository.create(projectData, 'user-123');

      expect(result).toBeDefined();
      expect(mockClient.query).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const projectData = { name: 'New Project' };
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce(undefined) // BEGIN
          .mockRejectedValueOnce(new Error('Database error')),
        release: jest.fn(),
      };
      (pgDatabase.getClient as jest.Mock).mockResolvedValue(mockClient);

      await expect(ProjectRepository.create(projectData, 'user-123')).rejects.toThrow();
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('update', () => {
    it('should update project', async () => {
      const updates = { name: 'Updated Project' };
      const mockProject = {
        id: 'project-123',
        name: 'Updated Project',
        description: 'Description',
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockProject] });

      const result = await ProjectRepository.update('project-123', updates);

      expect(result).toEqual(mockProject);
    });

    it('should return existing project when no updates provided', async () => {
      const mockProject = { id: 'project-123', name: 'Test' };
      jest.spyOn(ProjectRepository, 'findById').mockResolvedValue(mockProject as any);

      await ProjectRepository.update('project-123', {});

      expect(ProjectRepository.findById).toHaveBeenCalledWith('project-123');
    });
  });

  describe('delete', () => {
    it('should delete project', async () => {
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rowCount: 1 });

      const result = await ProjectRepository.delete('project-123');

      expect(result).toBe(true);
    });

    it('should return false when project not found', async () => {
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

      const result = await ProjectRepository.delete('project-123');

      expect(result).toBe(false);
    });
  });
});

