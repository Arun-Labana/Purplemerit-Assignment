import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import CreateWorkspace from '../../application/use-cases/workspaces/CreateWorkspace';
import GetWorkspace from '../../application/use-cases/workspaces/GetWorkspace';
import WorkspaceRepository from '../../infrastructure/database/postgresql/WorkspaceRepository';
import { HttpStatus } from '../../shared/constants/enums';
import { SUCCESS_MESSAGES } from '../../shared/constants';

export class WorkspaceController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const workspace = await CreateWorkspace.execute(req.body, projectId, req.user!.userId);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.WORKSPACE_CREATED,
        data: workspace.toResponse(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspace = await GetWorkspace.execute(req.params.id, req.user!.userId);

      res.status(HttpStatus.OK).json({
        success: true,
        data: workspace.toResponse(),
      });
    } catch (error) {
      next(error);
    }
  }

  async listByProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const workspaces = await WorkspaceRepository.findByProjectId(projectId);

      res.status(HttpStatus.OK).json({
        success: true,
        data: workspaces,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new WorkspaceController();

