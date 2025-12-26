import ProjectRepository from '../../../infrastructure/database/postgresql/ProjectRepository';
import CacheService from '../../../infrastructure/database/redis/CacheService';
import ActivityLogRepository from '../../../infrastructure/database/mongodb/ActivityLogRepository';
import { Project } from '../../../domain/entities/Project';
import { NotFoundError, ForbiddenError } from '../../../shared/errors';
import { ERROR_MESSAGES } from '../../../shared/constants';
import { ActivityType } from '../../../shared/constants/enums';
import logger from '../../../infrastructure/observability/logger';

export class DeleteProject {
  async execute(projectId: string, userId: string): Promise<void> {
    try {
      // Get project
      const projectRecord = await ProjectRepository.findById(projectId);
      if (!projectRecord) {
        throw new NotFoundError(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      const project = Project.fromDatabase(projectRecord);

      // Verify ownership
      if (!project.isOwner(userId)) {
        throw new ForbiddenError(ERROR_MESSAGES.PROJECT_NOT_OWNER);
      }

      // Delete project (cascade will delete workspaces, members, etc.)
      await ProjectRepository.delete(projectId);

      // Invalidate cache
      await CacheService.invalidateProject(projectId);
      await CacheService.invalidateProjectPermissions(projectId);

      // Log activity
      await ActivityLogRepository.create({
        workspaceId: projectId,
        userId,
        action: ActivityType.PROJECT_DELETED,
        details: { projectName: project.name },
        timestamp: new Date(),
      });

      logger.info('Project deleted successfully', { projectId, userId });
    } catch (error) {
      logger.error('Error deleting project', { projectId, userId, error });
      throw error;
    }
  }
}

export default new DeleteProject();

