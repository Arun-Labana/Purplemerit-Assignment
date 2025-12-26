import DeleteProject from '../../../../../src/application/use-cases/projects/DeleteProject';
import ProjectRepository from '../../../../../src/infrastructure/database/postgresql/ProjectRepository';
import CacheService from '../../../../../src/infrastructure/database/redis/CacheService';
import ActivityLogRepository from '../../../../../src/infrastructure/database/mongodb/ActivityLogRepository';
import { NotFoundError, ForbiddenError } from '../../../../../src/shared/errors';

jest.mock('../../../../../src/infrastructure/database/postgresql/ProjectRepository');
jest.mock('../../../../../src/infrastructure/database/redis/CacheService');
jest.mock('../../../../../src/infrastructure/database/mongodb/ActivityLogRepository');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('DeleteProject', () => {
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

  it('should delete project successfully', async () => {
    (ProjectRepository.findById as jest.Mock).mockResolvedValue(mockProjectRecord);
    (ProjectRepository.delete as jest.Mock).mockResolvedValue(undefined);
    (CacheService.invalidateProject as jest.Mock).mockResolvedValue(undefined);
    (CacheService.invalidateProjectPermissions as jest.Mock).mockResolvedValue(undefined);
    (ActivityLogRepository.create as jest.Mock).mockResolvedValue(undefined);

    await DeleteProject.execute(projectId, userId);

    expect(ProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(ProjectRepository.delete).toHaveBeenCalledWith(projectId);
    expect(CacheService.invalidateProject).toHaveBeenCalledWith(projectId);
    expect(CacheService.invalidateProjectPermissions).toHaveBeenCalledWith(projectId);
  });

  it('should throw NotFoundError when project not found', async () => {
    (ProjectRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(DeleteProject.execute(projectId, userId)).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when user is not owner', async () => {
    const nonOwnerProject = { ...mockProjectRecord, ownerId: 'other-user' };
    (ProjectRepository.findById as jest.Mock).mockResolvedValue(nonOwnerProject);

    await expect(DeleteProject.execute(projectId, userId)).rejects.toThrow(ForbiddenError);
  });
});

