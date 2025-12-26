import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import SubmitJob from '../../application/use-cases/jobs/SubmitJob';
import GetJobStatus from '../../application/use-cases/jobs/GetJobStatus';
import JobRepository from '../../infrastructure/database/postgresql/JobRepository';
import { HttpStatus } from '../../shared/constants/enums';
import { SUCCESS_MESSAGES } from '../../shared/constants';

export class JobController {
  async submit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await SubmitJob.execute(req.body, req.user!.userId);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.JOB_SUBMITTED,
        data: job.toResponse(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { job, result } = await GetJobStatus.execute(req.params.id, req.user!.userId);

      res.status(HttpStatus.OK).json({
        success: true,
        data: {
          job: job.toResponse(),
          result,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async listByWorkspace(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const jobs = await JobRepository.findByWorkspaceId(workspaceId, limit, offset);

      res.status(HttpStatus.OK).json({
        success: true,
        data: jobs,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new JobController();

