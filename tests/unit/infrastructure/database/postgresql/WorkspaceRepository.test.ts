import WorkspaceRepository from '../../../../../src/infrastructure/database/postgresql/WorkspaceRepository';
import pgDatabase from '../../../../../src/infrastructure/database/postgresql/connection';

jest.mock('../../../../../src/infrastructure/database/postgresql/connection');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('WorkspaceRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find workspace by id', async () => {
      const mockWorkspace = {
        id: 'workspace-123',
        projectId: 'project-123',
        name: 'Test Workspace',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockWorkspace] });

      const result = await WorkspaceRepository.findById('workspace-123');

      expect(result).toEqual(mockWorkspace);
      expect(pgDatabase.query).toHaveBeenCalled();
    });

    it('should return null when workspace not found', async () => {
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await WorkspaceRepository.findById('workspace-123');

      expect(result).toBeNull();
    });
  });

  describe('findByProjectId', () => {
    it('should find workspaces by project id', async () => {
      const mockWorkspaces = [
        { id: 'workspace-1', projectId: 'project-123', name: 'Workspace 1' },
        { id: 'workspace-2', projectId: 'project-123', name: 'Workspace 2' },
      ];
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: mockWorkspaces });

      const result = await WorkspaceRepository.findByProjectId('project-123');

      expect(result).toEqual(mockWorkspaces);
    });
  });

  describe('create', () => {
    it('should create workspace', async () => {
      const workspaceData = { name: 'New Workspace', settings: {} };
      const mockWorkspace = {
        id: 'workspace-123',
        projectId: 'project-123',
        name: 'New Workspace',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockWorkspace] });

      const result = await WorkspaceRepository.create(workspaceData, 'project-123');

      expect(result).toEqual(mockWorkspace);
      expect(pgDatabase.query).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update workspace', async () => {
      const updates = { name: 'Updated Workspace' };
      const mockWorkspace = {
        id: 'workspace-123',
        projectId: 'project-123',
        name: 'Updated Workspace',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockWorkspace] });

      const result = await WorkspaceRepository.update('workspace-123', updates);

      expect(result).toEqual(mockWorkspace);
    });

    it('should return existing workspace when no updates provided', async () => {
      const mockWorkspace = { id: 'workspace-123', name: 'Test' };
      jest.spyOn(WorkspaceRepository, 'findById').mockResolvedValue(mockWorkspace as any);

      await WorkspaceRepository.update('workspace-123', {});

      expect(WorkspaceRepository.findById).toHaveBeenCalledWith('workspace-123');
    });
  });

  describe('delete', () => {
    it('should delete workspace', async () => {
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rowCount: 1 });

      const result = await WorkspaceRepository.delete('workspace-123');

      expect(result).toBe(true);
    });

    it('should return false when workspace not found', async () => {
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

      const result = await WorkspaceRepository.delete('workspace-123');

      expect(result).toBe(false);
    });
  });
});

