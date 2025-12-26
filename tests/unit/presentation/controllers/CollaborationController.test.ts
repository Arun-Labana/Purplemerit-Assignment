import { Response, NextFunction } from 'express';
import CollaborationController from '../../../../src/presentation/controllers/CollaborationController';
import InviteCollaborator from '../../../../src/application/use-cases/collaboration/InviteCollaborator';
import ProjectMemberRepository from '../../../../src/infrastructure/database/postgresql/ProjectMemberRepository';
import { AuthRequest } from '../../../../src/presentation/middleware/authMiddleware';
import { UserRole } from '../../../../src/shared/constants/enums';

jest.mock('../../../../src/application/use-cases/collaboration/InviteCollaborator');
jest.mock('../../../../src/infrastructure/database/postgresql/ProjectMemberRepository');

describe('CollaborationController', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      user: {
        userId: 'user-123',
        email: 'test@example.com',
      },
      params: { projectId: 'project-123', userId: 'user-456' },
      body: { email: 'newuser@example.com', role: UserRole.COLLABORATOR },
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('invite', () => {
    it('should invite collaborator successfully', async () => {
      (InviteCollaborator.execute as jest.Mock).mockResolvedValue(undefined);

      await CollaborationController.invite(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(InviteCollaborator.execute).toHaveBeenCalledWith(
        'project-123',
        'newuser@example.com',
        UserRole.COLLABORATOR,
        'user-123'
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Invite failed');
      (InviteCollaborator.execute as jest.Mock).mockRejectedValue(error);

      await CollaborationController.invite(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      mockRequest.body = { role: UserRole.COLLABORATOR };
      (ProjectMemberRepository.updateRole as jest.Mock).mockResolvedValue(undefined);

      await CollaborationController.updateRole(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(ProjectMemberRepository.updateRole).toHaveBeenCalledWith('project-123', 'user-456', UserRole.COLLABORATOR);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Update role failed');
      (ProjectMemberRepository.updateRole as jest.Mock).mockRejectedValue(error);

      await CollaborationController.updateRole(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      (ProjectMemberRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await CollaborationController.removeMember(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(ProjectMemberRepository.delete).toHaveBeenCalledWith('project-123', 'user-456');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Remove member failed');
      (ProjectMemberRepository.delete as jest.Mock).mockRejectedValue(error);

      await CollaborationController.removeMember(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

