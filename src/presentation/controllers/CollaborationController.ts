import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import InviteCollaborator from '../../application/use-cases/collaboration/InviteCollaborator';
import ProjectMemberRepository from '../../infrastructure/database/postgresql/ProjectMemberRepository';
import { HttpStatus } from '../../shared/constants/enums';
import { SUCCESS_MESSAGES } from '../../shared/constants';

export class CollaborationController {
  async invite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const { email, role } = req.body;

      await InviteCollaborator.execute(projectId, email, role, req.user!.userId);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.MEMBER_INVITED,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId, userId } = req.params;
      const { role } = req.body;

      await ProjectMemberRepository.updateRole(projectId, userId, role);

      res.status(HttpStatus.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.ROLE_UPDATED,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId, userId } = req.params;

      await ProjectMemberRepository.delete(projectId, userId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.MEMBER_REMOVED,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CollaborationController();

