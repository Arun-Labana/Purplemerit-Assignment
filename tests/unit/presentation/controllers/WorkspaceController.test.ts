import { Response, NextFunction } from 'express';
import WorkspaceController from '../../../../src/presentation/controllers/WorkspaceController';
import CreateWorkspace from '../../../../src/application/use-cases/workspaces/CreateWorkspace';
import GetWorkspace from '../../../../src/application/use-cases/workspaces/GetWorkspace';
import WorkspaceRepository from '../../../../src/infrastructure/database/postgresql/WorkspaceRepository';
import { AuthRequest } from '../../../../src/presentation/middleware/authMiddleware';
import { Workspace } from '../../../../src/domain/entities/Workspace';

jest.mock('../../../../src/application/use-cases/workspaces/CreateWorkspace');
jest.mock('../../../../src/application/use-cases/workspaces/GetWorkspace');
jest.mock('../../../../src/infrastructure/database/postgresql/WorkspaceRepository');

describe('WorkspaceController', () => {
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
      params: { projectId: 'project-123', id: 'workspace-123' },
      body: { name: 'Test Workspace', settings: {} },
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

  describe('create', () => {
    it('should create workspace successfully', async () => {
      const mockWorkspace = new Workspace(
        'workspace-123',
        'project-123',
        'Test Workspace',
        {},
        new Date(),
        new Date()
      );
      (CreateWorkspace.execute as jest.Mock).mockResolvedValue(mockWorkspace);

      await WorkspaceController.create(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(CreateWorkspace.execute).toHaveBeenCalledWith(
        mockRequest.body,
        'project-123',
        'user-123'
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should get workspace by id successfully', async () => {
      const mockWorkspace = new Workspace(
        'workspace-123',
        'project-123',
        'Test Workspace',
        {},
        new Date(),
        new Date()
      );
      (GetWorkspace.execute as jest.Mock).mockResolvedValue(mockWorkspace);

      await WorkspaceController.getById(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(GetWorkspace.execute).toHaveBeenCalledWith('workspace-123', 'user-123');
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('listByProject', () => {
    it('should list workspaces by project successfully', async () => {
      const mockWorkspaces = [
        {
          id: 'workspace-1',
          projectId: 'project-123',
          name: 'Workspace 1',
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (WorkspaceRepository.findByProjectId as jest.Mock).mockResolvedValue(mockWorkspaces);

      await WorkspaceController.listByProject(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(WorkspaceRepository.findByProjectId).toHaveBeenCalledWith('project-123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });
  });
});

