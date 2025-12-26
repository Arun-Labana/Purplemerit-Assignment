import ListUserProjects from '../../../../../src/application/use-cases/projects/ListUserProjects';
import ProjectRepository from '../../../../../src/infrastructure/database/postgresql/ProjectRepository';
import logger from '../../../../../src/infrastructure/observability/logger';

jest.mock('../../../../../src/infrastructure/database/postgresql/ProjectRepository');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('ListUserProjects', () => {
  const userId = 'user-123';

  const mockProjectRecords = [
    {
      id: 'project-1',
      name: 'Project 1',
      description: 'Description 1',
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'project-2',
      name: 'Project 2',
      description: 'Description 2',
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list user projects with default pagination', async () => {
    (ProjectRepository.findByUserId as jest.Mock).mockResolvedValue(mockProjectRecords);
    (ProjectRepository.countByUserId as jest.Mock).mockResolvedValue(2);

    const result = await ListUserProjects.execute(userId);

    expect(ProjectRepository.findByUserId).toHaveBeenCalledWith(userId, 20, 0);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
    expect(result.pagination.total).toBe(2);
  });

  it('should list user projects with custom pagination', async () => {
    (ProjectRepository.findByUserId as jest.Mock).mockResolvedValue(mockProjectRecords);
    (ProjectRepository.countByUserId as jest.Mock).mockResolvedValue(10);

    const result = await ListUserProjects.execute(userId, 2, 10);

    expect(ProjectRepository.findByUserId).toHaveBeenCalledWith(userId, 10, 10);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('should handle empty project list', async () => {
    (ProjectRepository.findByUserId as jest.Mock).mockResolvedValue([]);
    (ProjectRepository.countByUserId as jest.Mock).mockResolvedValue(0);

    const result = await ListUserProjects.execute(userId);

    expect(result.data).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });

  it('should handle errors', async () => {
    const error = new Error('Database error');
    (ProjectRepository.findByUserId as jest.Mock).mockRejectedValue(error);

    await expect(ListUserProjects.execute(userId)).rejects.toThrow('Database error');
    expect(logger.error).toHaveBeenCalled();
  });
});

