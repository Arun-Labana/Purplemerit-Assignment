import GetWorkspace from '../../../../../src/application/use-cases/workspaces/GetWorkspace';
import WorkspaceRepository from '../../../../../src/infrastructure/database/postgresql/WorkspaceRepository';
import ProjectMemberRepository from '../../../../../src/infrastructure/database/postgresql/ProjectMemberRepository';
import CacheService from '../../../../../src/infrastructure/database/redis/CacheService';
import { NotFoundError, ForbiddenError } from '../../../../../src/shared/errors';

jest.mock('../../../../../src/infrastructure/database/postgresql/WorkspaceRepository');
jest.mock('../../../../../src/infrastructure/database/postgresql/ProjectMemberRepository');
jest.mock('../../../../../src/infrastructure/database/redis/CacheService');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('GetWorkspace', () => {
  const workspaceId = 'workspace-123';
  const userId = 'user-123';
  const projectId = 'project-123';

  const mockWorkspaceRecord = {
    id: workspaceId,
    projectId,
    name: 'Test Workspace',
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get workspace from cache when available', async () => {
    (CacheService.getCachedWorkspace as jest.Mock).mockResolvedValue(mockWorkspaceRecord);

    const result = await GetWorkspace.execute(workspaceId, userId);

    expect(CacheService.getCachedWorkspace).toHaveBeenCalledWith(workspaceId);
    expect(result).toBeDefined();
    expect(result.id).toBe(workspaceId);
  });

  it('should get workspace from database when not in cache', async () => {
    (CacheService.getCachedWorkspace as jest.Mock).mockResolvedValue(null);
    (WorkspaceRepository.findById as jest.Mock).mockResolvedValue(mockWorkspaceRecord);
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue({ id: 'member-123' });
    (CacheService.cacheWorkspace as jest.Mock).mockResolvedValue(undefined);

    const result = await GetWorkspace.execute(workspaceId, userId);

    expect(WorkspaceRepository.findById).toHaveBeenCalledWith(workspaceId);
    expect(CacheService.cacheWorkspace).toHaveBeenCalledWith(workspaceId, mockWorkspaceRecord);
    expect(result).toBeDefined();
  });

  it('should throw NotFoundError when workspace not found', async () => {
    (CacheService.getCachedWorkspace as jest.Mock).mockResolvedValue(null);
    (WorkspaceRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(GetWorkspace.execute(workspaceId, userId)).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when user has no access', async () => {
    (CacheService.getCachedWorkspace as jest.Mock).mockResolvedValue(null);
    (WorkspaceRepository.findById as jest.Mock).mockResolvedValue(mockWorkspaceRecord);
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue(null);

    await expect(GetWorkspace.execute(workspaceId, userId)).rejects.toThrow(ForbiddenError);
  });
});

