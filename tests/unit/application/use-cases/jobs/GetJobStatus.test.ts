import GetJobStatus from '../../../../../src/application/use-cases/jobs/GetJobStatus';
import JobRepository from '../../../../../src/infrastructure/database/postgresql/JobRepository';
import JobResultRepository from '../../../../../src/infrastructure/database/mongodb/JobResultRepository';
import WorkspaceRepository from '../../../../../src/infrastructure/database/postgresql/WorkspaceRepository';
import ProjectMemberRepository from '../../../../../src/infrastructure/database/postgresql/ProjectMemberRepository';
import { NotFoundError, ForbiddenError } from '../../../../../src/shared/errors';
import { JobType, JobStatus } from '../../../../../src/shared/constants/enums';

jest.mock('../../../../../src/infrastructure/database/postgresql/JobRepository');
jest.mock('../../../../../src/infrastructure/database/mongodb/JobResultRepository');
jest.mock('../../../../../src/infrastructure/database/postgresql/WorkspaceRepository');
jest.mock('../../../../../src/infrastructure/database/postgresql/ProjectMemberRepository');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('GetJobStatus', () => {
  const jobId = 'job-123';
  const userId = 'user-123';
  const workspaceId = 'workspace-123';
  const projectId = 'project-123';

  const mockJobRecord = {
    id: jobId,
    workspaceId,
    type: JobType.CODE_EXECUTION,
    status: JobStatus.PENDING,
    payload: {},
    createdAt: new Date(),
    updatedAt: new Date(),
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
    role: 'member',
  };

  const mockJobResult = {
    jobId,
    inputPayload: {},
    outputResult: { result: 'success' },
    logs: [],
    errors: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get job status successfully', async () => {
    (JobRepository.findById as jest.Mock).mockResolvedValue(mockJobRecord);
    (WorkspaceRepository.findById as jest.Mock).mockResolvedValue(mockWorkspace);
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue(mockMember);
    (JobResultRepository.findByJobId as jest.Mock).mockResolvedValue(mockJobResult);

    const result = await GetJobStatus.execute(jobId, userId);

    expect(JobRepository.findById).toHaveBeenCalledWith(jobId);
    expect(WorkspaceRepository.findById).toHaveBeenCalledWith(workspaceId);
    expect(ProjectMemberRepository.findByProjectAndUser).toHaveBeenCalledWith(projectId, userId);
    expect(result.job.id).toBe(jobId);
    expect(result.result).toEqual(mockJobResult);
  });

  it('should return null result when job result not found', async () => {
    (JobRepository.findById as jest.Mock).mockResolvedValue(mockJobRecord);
    (WorkspaceRepository.findById as jest.Mock).mockResolvedValue(mockWorkspace);
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue(mockMember);
    (JobResultRepository.findByJobId as jest.Mock).mockResolvedValue(null);

    const result = await GetJobStatus.execute(jobId, userId);

    expect(result.result).toBeNull();
  });

  it('should throw NotFoundError when job not found', async () => {
    (JobRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(GetJobStatus.execute(jobId, userId)).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when workspace not found', async () => {
    (JobRepository.findById as jest.Mock).mockResolvedValue(mockJobRecord);
    (WorkspaceRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(GetJobStatus.execute(jobId, userId)).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when user is not a member', async () => {
    (JobRepository.findById as jest.Mock).mockResolvedValue(mockJobRecord);
    (WorkspaceRepository.findById as jest.Mock).mockResolvedValue(mockWorkspace);
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue(null);

    await expect(GetJobStatus.execute(jobId, userId)).rejects.toThrow(ForbiddenError);
  });
});

