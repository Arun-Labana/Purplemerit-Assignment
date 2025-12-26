import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import CreateProject from '../../application/use-cases/projects/CreateProject';
import GetProject from '../../application/use-cases/projects/GetProject';
import UpdateProject from '../../application/use-cases/projects/UpdateProject';
import DeleteProject from '../../application/use-cases/projects/DeleteProject';
import ListUserProjects from '../../application/use-cases/projects/ListUserProjects';
import ProjectMemberRepository from '../../infrastructure/database/postgresql/ProjectMemberRepository';
import { HttpStatus } from '../../shared/constants/enums';
import { SUCCESS_MESSAGES } from '../../shared/constants';

export class ProjectController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await CreateProject.execute(req.body, req.user!.userId);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.PROJECT_CREATED,
        data: project.toResponse(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await GetProject.execute(req.params.id, req.user!.userId);

      res.status(HttpStatus.OK).json({
        success: true,
        data: project.toResponse(),
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await UpdateProject.execute(req.params.id, req.body, req.user!.userId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.PROJECT_UPDATED,
        data: project.toResponse(),
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await DeleteProject.execute(req.params.id, req.user!.userId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.PROJECT_DELETED,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await ListUserProjects.execute(req.user!.userId, page, limit);

      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMembers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await ProjectMemberRepository.findByProjectId(req.params.id);

      res.status(HttpStatus.OK).json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProjectController();

