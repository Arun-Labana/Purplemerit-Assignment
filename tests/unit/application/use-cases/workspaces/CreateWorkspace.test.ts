import CreateWorkspace from '../../../../../src/application/use-cases/workspaces/CreateWorkspace';
import WorkspaceRepository from '../../../../../src/infrastructure/database/postgresql/WorkspaceRepository';
import ProjectMemberRepository from '../../../../../src/infrastructure/database/postgresql/ProjectMemberRepository';
import ActivityLogRepository from '../../../../../src/infrastructure/database/mongodb/ActivityLogRepository';
import { ForbiddenError } from '../../../../../src/shared/errors';

jest.mock('../../../../../src/infrastructure/database/postgresql/WorkspaceRepository');
jest.mock('../../../../../src/infrastructure/database/postgresql/ProjectMemberRepository');
jest.mock('../../../../../src/infrastructure/database/mongodb/ActivityLogRepository');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('CreateWorkspace', () => {
  const userId = 'user-123';
  const projectId = 'project-123';
  const workspaceData = {
    name: 'Test Workspace',
    settings: { theme: 'dark' },
  };

  const mockWorkspaceRecord = {
    id: 'workspace-123',
    projectId,
    name: 'Test Workspace',
    settings: { theme: 'dark' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a workspace successfully with write permission', async () => {
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue({
      id: 'member-123',
      role: 'collaborator',
    });
    (WorkspaceRepository.create as jest.Mock).mockResolvedValue(mockWorkspaceRecord);
    (ActivityLogRepository.create as jest.Mock).mockResolvedValue(undefined);

    const result = await CreateWorkspace.execute(workspaceData, projectId, userId);

    expect(ProjectMemberRepository.findByProjectAndUser).toHaveBeenCalledWith(projectId, userId);
    expect(WorkspaceRepository.create).toHaveBeenCalledWith(workspaceData, projectId);
    expect(result).toBeDefined();
    expect(result.id).toBe('workspace-123');
  });

  it('should throw ForbiddenError when user is not a member', async () => {
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue(null);

    await expect(CreateWorkspace.execute(workspaceData, projectId, userId)).rejects.toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError when user has viewer role', async () => {
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue({
      id: 'member-123',
      role: 'viewer',
    });

    await expect(CreateWorkspace.execute(workspaceData, projectId, userId)).rejects.toThrow(ForbiddenError);
  });
});

