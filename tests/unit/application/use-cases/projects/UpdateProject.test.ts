import UpdateProject from '../../../../../src/application/use-cases/projects/UpdateProject';
import ProjectRepository from '../../../../../src/infrastructure/database/postgresql/ProjectRepository';
import CacheService from '../../../../../src/infrastructure/database/redis/CacheService';
import ActivityLogRepository from '../../../../../src/infrastructure/database/mongodb/ActivityLogRepository';
import { NotFoundError, ForbiddenError } from '../../../../../src/shared/errors';

jest.mock('../../../../../src/infrastructure/database/postgresql/ProjectRepository');
jest.mock('../../../../../src/infrastructure/database/redis/CacheService');
jest.mock('../../../../../src/infrastructure/database/mongodb/ActivityLogRepository');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('UpdateProject', () => {
  const projectId = 'project-123';
  const userId = 'user-123';
  const updates = { name: 'Updated Project', description: 'Updated Description' };

  const mockProjectRecord = {
    id: projectId,
    name: 'Original Project',
    description: 'Original Description',
    ownerId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUpdatedRecord = {
    ...mockProjectRecord,
    ...updates,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update project successfully', async () => {
    (ProjectRepository.findById as jest.Mock).mockResolvedValue(mockProjectRecord);
    (ProjectRepository.update as jest.Mock).mockResolvedValue(mockUpdatedRecord);
    (CacheService.invalidateProject as jest.Mock).mockResolvedValue(undefined);
    (ActivityLogRepository.create as jest.Mock).mockResolvedValue(undefined);

    const result = await UpdateProject.execute(projectId, updates, userId);

    expect(ProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(ProjectRepository.update).toHaveBeenCalledWith(projectId, updates);
    expect(CacheService.invalidateProject).toHaveBeenCalledWith(projectId);
    expect(result.name).toBe('Updated Project');
  });

  it('should throw NotFoundError when project not found', async () => {
    (ProjectRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(UpdateProject.execute(projectId, updates, userId)).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when user is not owner', async () => {
    const nonOwnerProject = { ...mockProjectRecord, ownerId: 'other-user' };
    (ProjectRepository.findById as jest.Mock).mockResolvedValue(nonOwnerProject);

    await expect(UpdateProject.execute(projectId, updates, userId)).rejects.toThrow(ForbiddenError);
  });

  it('should throw NotFoundError when update returns null', async () => {
    (ProjectRepository.findById as jest.Mock).mockResolvedValue(mockProjectRecord);
    (ProjectRepository.update as jest.Mock).mockResolvedValue(null);

    await expect(UpdateProject.execute(projectId, updates, userId)).rejects.toThrow(NotFoundError);
  });
});

