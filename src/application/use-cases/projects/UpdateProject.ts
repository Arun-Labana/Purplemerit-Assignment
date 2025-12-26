import ProjectRepository from '../../../infrastructure/database/postgresql/ProjectRepository';
import CacheService from '../../../infrastructure/database/redis/CacheService';
import ActivityLogRepository from '../../../infrastructure/database/mongodb/ActivityLogRepository';
import { IProjectUpdate } from '../../../shared/types';
import { Project } from '../../../domain/entities/Project';
import { NotFoundError, ForbiddenError } from '../../../shared/errors';
import { ERROR_MESSAGES } from '../../../shared/constants';
import { ActivityType } from '../../../shared/constants/enums';
import logger from '../../../infrastructure/observability/logger';

export class UpdateProject {
  async execute(projectId: string, updates: IProjectUpdate, userId: string): Promise<Project> {
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

      // Update project
      const updatedRecord = await ProjectRepository.update(projectId, updates);
      if (!updatedRecord) {
        throw new NotFoundError(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      // Invalidate cache
      await CacheService.invalidateProject(projectId);

      // Log activity
      await ActivityLogRepository.create({
        workspaceId: projectId,
        userId,
        action: ActivityType.PROJECT_UPDATED,
        details: { updates },
        timestamp: new Date(),
      });

      logger.info('Project updated successfully', { projectId, userId });

      return Project.fromDatabase(updatedRecord);
    } catch (error) {
      logger.error('Error updating project', { projectId, updates, userId, error });
      throw error;
    }
  }
}

export default new UpdateProject();

