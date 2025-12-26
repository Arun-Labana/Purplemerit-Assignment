import GetProject from '../../../../../src/application/use-cases/projects/GetProject';
import ProjectRepository from '../../../../../src/infrastructure/database/postgresql/ProjectRepository';
import ProjectMemberRepository from '../../../../../src/infrastructure/database/postgresql/ProjectMemberRepository';
import CacheService from '../../../../../src/infrastructure/database/redis/CacheService';
import { NotFoundError, ForbiddenError } from '../../../../../src/shared/errors';
import logger from '../../../../../src/infrastructure/observability/logger';

jest.mock('../../../../../src/infrastructure/database/postgresql/ProjectRepository');
jest.mock('../../../../../src/infrastructure/database/postgresql/ProjectMemberRepository');
jest.mock('../../../../../src/infrastructure/database/redis/CacheService');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('GetProject', () => {
  const projectId = 'project-123';
  const userId = 'user-123';

  const mockProjectRecord = {
    id: projectId,
    name: 'Test Project',
    description: 'Test Description',
    ownerId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get project from cache when available', async () => {
    (CacheService.getCachedProject as jest.Mock).mockResolvedValue(mockProjectRecord);
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue({ id: 'member-123' });

    const result = await GetProject.execute(projectId, userId);

    expect(CacheService.getCachedProject).toHaveBeenCalledWith(projectId);
    expect(ProjectRepository.findById).not.toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.id).toBe(projectId);
  });

  it('should get project from database when not in cache', async () => {
    (CacheService.getCachedProject as jest.Mock).mockResolvedValue(null);
    (ProjectRepository.findById as jest.Mock).mockResolvedValue(mockProjectRecord);
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue({ id: 'member-123' });
    (CacheService.cacheProject as jest.Mock).mockResolvedValue(undefined);

    const result = await GetProject.execute(projectId, userId);

    expect(ProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(CacheService.cacheProject).toHaveBeenCalledWith(projectId, mockProjectRecord);
    expect(result).toBeDefined();
    expect(result.id).toBe(projectId);
  });

  it('should throw NotFoundError when project not found', async () => {
    (CacheService.getCachedProject as jest.Mock).mockResolvedValue(null);
    (ProjectRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(GetProject.execute(projectId, userId)).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when user has no access', async () => {
    (CacheService.getCachedProject as jest.Mock).mockResolvedValue(null);
    (ProjectRepository.findById as jest.Mock).mockResolvedValue(mockProjectRecord);
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue(null);

    await expect(GetProject.execute(projectId, userId)).rejects.toThrow(ForbiddenError);
  });

  it('should verify access even when project is cached', async () => {
    (CacheService.getCachedProject as jest.Mock).mockResolvedValue(mockProjectRecord);
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue(null);

    await expect(GetProject.execute(projectId, userId)).rejects.toThrow(ForbiddenError);
  });
});

