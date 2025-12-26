import { Response, NextFunction } from 'express';
import ProjectController from '../../../../src/presentation/controllers/ProjectController';
import CreateProject from '../../../../src/application/use-cases/projects/CreateProject';
import GetProject from '../../../../src/application/use-cases/projects/GetProject';
import UpdateProject from '../../../../src/application/use-cases/projects/UpdateProject';
import DeleteProject from '../../../../src/application/use-cases/projects/DeleteProject';
import ListUserProjects from '../../../../src/application/use-cases/projects/ListUserProjects';
import ProjectMemberRepository from '../../../../src/infrastructure/database/postgresql/ProjectMemberRepository';
import { AuthRequest } from '../../../../src/presentation/middleware/authMiddleware';
import { Project } from '../../../../src/domain/entities/Project';

jest.mock('../../../../src/application/use-cases/projects/CreateProject');
jest.mock('../../../../src/application/use-cases/projects/GetProject');
jest.mock('../../../../src/application/use-cases/projects/UpdateProject');
jest.mock('../../../../src/application/use-cases/projects/DeleteProject');
jest.mock('../../../../src/application/use-cases/projects/ListUserProjects');
jest.mock('../../../../src/infrastructure/database/postgresql/ProjectMemberRepository');

describe('ProjectController', () => {
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
      params: { id: 'project-123' },
      body: { name: 'Test Project' },
      query: {},
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
    it('should create a project successfully', async () => {
      const mockProject = new Project(
        'project-123',
        'Test Project',
        'Description',
        'user-123',
        new Date(),
        new Date()
      );
      (CreateProject.execute as jest.Mock).mockResolvedValue(mockProject);

      await ProjectController.create(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(CreateProject.execute).toHaveBeenCalledWith(mockRequest.body, 'user-123');
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Creation failed');
      (CreateProject.execute as jest.Mock).mockRejectedValue(error);

      await ProjectController.create(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('should get project by id successfully', async () => {
      const mockProject = new Project(
        'project-123',
        'Test Project',
        'Description',
        'user-123',
        new Date(),
        new Date()
      );
      (GetProject.execute as jest.Mock).mockResolvedValue(mockProject);

      await ProjectController.getById(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(GetProject.execute).toHaveBeenCalledWith('project-123', 'user-123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should list projects with default pagination', async () => {
      const mockResult = {
        success: true,
        data: {
          projects: [],
          pagination: { page: 1, limit: 20, total: 0 },
        },
      };
      (ListUserProjects.execute as jest.Mock).mockResolvedValue(mockResult);

      await ProjectController.list(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(ListUserProjects.execute).toHaveBeenCalledWith('user-123', 1, 20);
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
    });

    it('should list projects with custom pagination', async () => {
      mockRequest.query = { page: '2', limit: '10' };
      const mockResult = {
        success: true,
        data: {
          projects: [],
          pagination: { page: 2, limit: 10, total: 0 },
        },
      };
      (ListUserProjects.execute as jest.Mock).mockResolvedValue(mockResult);

      await ProjectController.list(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(ListUserProjects.execute).toHaveBeenCalledWith('user-123', 2, 10);
    });
  });

  describe('getMembers', () => {
    it('should get project members successfully', async () => {
      const mockMembers = [{ id: 'member-1', userId: 'user-123', role: 'owner' }];
      (ProjectMemberRepository.findByProjectId as jest.Mock).mockResolvedValue(mockMembers);

      await ProjectController.getMembers(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(ProjectMemberRepository.findByProjectId).toHaveBeenCalledWith('project-123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });
  });
});

