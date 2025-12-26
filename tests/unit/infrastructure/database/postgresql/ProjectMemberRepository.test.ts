import ProjectMemberRepository from '../../../../../src/infrastructure/database/postgresql/ProjectMemberRepository';
import pgDatabase from '../../../../../src/infrastructure/database/postgresql/connection';
import { UserRole } from '../../../../../src/shared/constants/enums';

jest.mock('../../../../../src/infrastructure/database/postgresql/connection');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('ProjectMemberRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByProjectId', () => {
    it('should find project members', async () => {
      const mockRows = [
        {
          id: 'member-1',
          projectId: 'project-123',
          userId: 'user-1',
          role: UserRole.OWNER,
          invitedAt: new Date(),
          invitedBy: 'user-1',
          'user.id': 'user-1',
          'user.email': 'user1@example.com',
          'user.name': 'User 1',
          'user.createdAt': new Date(),
        },
      ];
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: mockRows });

      const result = await ProjectMemberRepository.findByProjectId('project-123');

      expect(result).toHaveLength(1);
      expect(result[0].user).toBeDefined();
    });
  });

  describe('findByProjectAndUser', () => {
    it('should find project member', async () => {
      const mockMember = {
        id: 'member-1',
        projectId: 'project-123',
        userId: 'user-1',
        role: UserRole.OWNER,
        invitedAt: new Date(),
        invitedBy: 'user-1',
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockMember] });

      const result = await ProjectMemberRepository.findByProjectAndUser('project-123', 'user-1');

      expect(result).toEqual(mockMember);
    });

    it('should return null when member not found', async () => {
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await ProjectMemberRepository.findByProjectAndUser('project-123', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create project member', async () => {
      const memberData = {
        projectId: 'project-123',
        userId: 'user-1',
        role: UserRole.COLLABORATOR,
        invitedBy: 'user-2',
      };
      const mockMember = { ...memberData, id: 'member-1', invitedAt: new Date() };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockMember] });

      const result = await ProjectMemberRepository.create(memberData);

      expect(result).toEqual(mockMember);
    });
  });

  describe('updateRole', () => {
    it('should update member role', async () => {
      const mockMember = {
        id: 'member-1',
        projectId: 'project-123',
        userId: 'user-1',
        role: UserRole.COLLABORATOR,
        invitedAt: new Date(),
        invitedBy: 'user-2',
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockMember] });

      const result = await ProjectMemberRepository.updateRole('project-123', 'user-1', UserRole.COLLABORATOR);

      expect(result).toEqual(mockMember);
    });
  });

  describe('delete', () => {
    it('should delete project member', async () => {
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rowCount: 1 });

      const result = await ProjectMemberRepository.delete('project-123', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false when member not found', async () => {
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

      const result = await ProjectMemberRepository.delete('project-123', 'user-1');

      expect(result).toBe(false);
    });
  });
});

