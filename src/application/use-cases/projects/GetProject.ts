import ProjectRepository from '../../../infrastructure/database/postgresql/ProjectRepository';
import ProjectMemberRepository from '../../../infrastructure/database/postgresql/ProjectMemberRepository';
import CacheService from '../../../infrastructure/database/redis/CacheService';
import { Project } from '../../../domain/entities/Project';
import { NotFoundError, ForbiddenError } from '../../../shared/errors';
import { ERROR_MESSAGES } from '../../../shared/constants';
import logger from '../../../infrastructure/observability/logger';

export class GetProject {
  async execute(projectId: string, userId: string): Promise<Project> {
    try {
      // Try to get from cache
      const cached = await CacheService.getCachedProject(projectId);
      if (cached) {
        logger.debug('Project fetched from cache', { projectId });
        // Still need to verify access
        await this.verifyAccess(projectId, userId);
        return Project.fromDatabase(cached);
      }

      // Get from database
      const projectRecord = await ProjectRepository.findById(projectId);
      if (!projectRecord) {
        throw new NotFoundError(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      // Verify user has access
      await this.verifyAccess(projectId, userId);

      // Cache the project
      await CacheService.cacheProject(projectId, projectRecord);

      logger.info('Project fetched successfully', { projectId, userId });

      return Project.fromDatabase(projectRecord);
    } catch (error) {
      logger.error('Error getting project', { projectId, userId, error });
      throw error;
    }
  }

  private async verifyAccess(projectId: string, userId: string): Promise<void> {
    const member = await ProjectMemberRepository.findByProjectAndUser(projectId, userId);
    if (!member) {
      throw new ForbiddenError(ERROR_MESSAGES.PROJECT_ACCESS_DENIED);
    }
  }
}

export default new GetProject();

