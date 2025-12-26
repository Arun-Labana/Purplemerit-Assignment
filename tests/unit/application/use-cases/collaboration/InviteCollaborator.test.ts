import InviteCollaborator from '../../../../../src/application/use-cases/collaboration/InviteCollaborator';
import UserRepository from '../../../../../src/infrastructure/database/postgresql/UserRepository';
import ProjectMemberRepository from '../../../../../src/infrastructure/database/postgresql/ProjectMemberRepository';
import ActivityLogRepository from '../../../../../src/infrastructure/database/mongodb/ActivityLogRepository';
import { NotFoundError, ValidationError } from '../../../../../src/shared/errors';
import { UserRole } from '../../../../../src/shared/constants/enums';

jest.mock('../../../../../src/infrastructure/database/postgresql/UserRepository');
jest.mock('../../../../../src/infrastructure/database/postgresql/ProjectMemberRepository');
jest.mock('../../../../../src/infrastructure/database/mongodb/ActivityLogRepository');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('InviteCollaborator', () => {
  const projectId = 'project-123';
  const email = 'newuser@example.com';
  const role = UserRole.COLLABORATOR;
  const invitedBy = 'user-123';

  const mockInviterMember = {
    id: 'member-1',
    projectId,
    userId: invitedBy,
    role: UserRole.OWNER,
  };

  const mockUserToInvite = {
    id: 'user-456',
    email,
    name: 'New User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should invite collaborator successfully', async () => {
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock)
      .mockResolvedValueOnce(mockInviterMember) // For inviter check
      .mockResolvedValueOnce(null); // For existing member check
    (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUserToInvite);
    (ProjectMemberRepository.create as jest.Mock).mockResolvedValue(undefined);
    (ActivityLogRepository.create as jest.Mock).mockResolvedValue(undefined);

    await InviteCollaborator.execute(projectId, email, role, invitedBy);

    expect(ProjectMemberRepository.findByProjectAndUser).toHaveBeenCalledWith(projectId, invitedBy);
    expect(UserRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(ProjectMemberRepository.create).toHaveBeenCalledWith({
      projectId,
      userId: mockUserToInvite.id,
      role,
      invitedBy,
    });
  });

  it('should throw NotFoundError when inviter is not a member', async () => {
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue(null);

    await expect(InviteCollaborator.execute(projectId, email, role, invitedBy)).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when user to invite not found', async () => {
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock).mockResolvedValue(mockInviterMember);
    (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);

    await expect(InviteCollaborator.execute(projectId, email, role, invitedBy)).rejects.toThrow(NotFoundError);
  });

  it('should throw ValidationError when user is already a member', async () => {
    (ProjectMemberRepository.findByProjectAndUser as jest.Mock)
      .mockResolvedValueOnce(mockInviterMember)
      .mockResolvedValueOnce({ id: 'member-2', projectId, userId: mockUserToInvite.id });
    (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUserToInvite);

    await expect(InviteCollaborator.execute(projectId, email, role, invitedBy)).rejects.toThrow(ValidationError);
  });
});

