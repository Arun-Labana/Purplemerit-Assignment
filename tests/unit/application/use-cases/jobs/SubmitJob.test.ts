import SubmitJob from '../../../../../src/application/use-cases/jobs/SubmitJob';
import JobRepository from '../../../../../src/infrastructure/database/postgresql/JobRepository';
import JobResultRepository from '../../../../../src/infrastructure/database/mongodb/JobResultRepository';
import WorkspaceRepository from '../../../../../src/infrastructure/database/postgresql/WorkspaceRepository';
import ProjectMemberRepository from '../../../../../src/infrastructure/database/postgresql/ProjectMemberRepository';
import rabbitmqPublisher from '../../../../../src/infrastructure/messaging/rabbitmq/publisher';
import { NotFoundError, ForbiddenError } from '../../../../../src/shared/errors';
import { JobType, JobStatus } from '../../../../../src/shared/constants/enums';

jest.mock('../../../../../src/infrastructure/database/postgresql/JobRepository');
jest.mock('../../../../../src/infrastructure/database/mongodb/JobResultRepository');
jest.mock('../../../../../src/infrastructure/database/postgresql/WorkspaceRepository');
jest.mock('../../../../../src/infrastructure/database/postgresql/ProjectMemberRepository');
jest.mock('../../../../../src/infrastructure/messaging/rabbitmq/publisher');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('SubmitJob', () => {
  const userId = 'user-123';
  const workspaceId = 'workspace-123';
  const projectId = 'project-123';

  const jobData = {
    workspaceId,
    type: JobType.CODE_EXECUTION,
    payload: { code: 'console.log("test")' },
  };

  const mockWorkspace = {
    id: workspaceId,
    projectId,
    name: 'Test Workspace',
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMember = {
    id: 'member-1',
    projectId,
    userId,
    role: 'collaborator',
  };

  const mockJobRecord = {
    id: 'job-123',
    workspaceId,
    type: JobType.CODE_EXECUTION,
    status: JobStatus.PENDING,
    payload: jobData.payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should submit job successfully', async () => {
    (WorkspaceRepository.findById as jest.Mock).mockResolvedValue(mockWorkspace);
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue(mockMember);
    (JobRepository.create as jest.Mock).mockResolvedValue(mockJobRecord);
    (JobResultRepository.create as jest.Mock).mockResolvedValue(undefined);
    (rabbitmqPublisher.publishJob as jest.Mock).mockResolvedValue(undefined);

    const result = await SubmitJob.execute(jobData, userId);

    expect(WorkspaceRepository.findById).toHaveBeenCalledWith(workspaceId);
    expect(ProjectMemberRepository.findByProjectAndUser).toHaveBeenCalledWith(projectId, userId);
    expect(JobRepository.create).toHaveBeenCalledWith(jobData);
    expect(JobResultRepository.create).toHaveBeenCalled();
    expect(rabbitmqPublisher.publishJob).toHaveBeenCalled();
    expect(result.id).toBe('job-123');
  });

  it('should throw NotFoundError when workspace not found', async () => {
    (WorkspaceRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(SubmitJob.execute(jobData, userId)).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when user is not a member', async () => {
    (WorkspaceRepository.findById as jest.Mock).mockResolvedValue(mockWorkspace);
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue(null);

    await expect(SubmitJob.execute(jobData, userId)).rejects.toThrow(ForbiddenError);
  });
});

