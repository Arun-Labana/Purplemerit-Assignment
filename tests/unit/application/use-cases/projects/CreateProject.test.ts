import CreateProject from '../../../../../src/application/use-cases/projects/CreateProject';
import ProjectRepository from '../../../../../src/infrastructure/database/postgresql/ProjectRepository';
import ActivityLogRepository from '../../../../../src/infrastructure/database/mongodb/ActivityLogRepository';
import logger from '../../../../../src/infrastructure/observability/logger';

jest.mock('../../../../../src/infrastructure/database/postgresql/ProjectRepository');
jest.mock('../../../../../src/infrastructure/database/mongodb/ActivityLogRepository');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('CreateProject', () => {
  const userId = 'user-123';
  const projectData = {
    name: 'Test Project',
    description: 'Test Description',
  };

  const mockProjectRecord = {
    id: 'project-123',
    name: 'Test Project',
    description: 'Test Description',
    ownerId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a project successfully', async () => {
    (ProjectRepository.create as jest.Mock).mockResolvedValue(mockProjectRecord);
    (ActivityLogRepository.create as jest.Mock).mockResolvedValue(undefined);

    const result = await CreateProject.execute(projectData, userId);

    expect(ProjectRepository.create).toHaveBeenCalledWith(projectData, userId);
    expect(ActivityLogRepository.create).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.id).toBe('project-123');
    expect(result.name).toBe('Test Project');
  });

  it('should handle activity log failure gracefully', async () => {
    (ProjectRepository.create as jest.Mock).mockResolvedValue(mockProjectRecord);
    (ActivityLogRepository.create as jest.Mock).mockRejectedValue(new Error('Log failed'));

    const result = await CreateProject.execute(projectData, userId);

    expect(result).toBeDefined();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should throw error when project creation fails', async () => {
    const error = new Error('Database error');
    (ProjectRepository.create as jest.Mock).mockRejectedValue(error);

    await expect(CreateProject.execute(projectData, userId)).rejects.toThrow('Database error');
    expect(logger.error).toHaveBeenCalled();
  });
});

