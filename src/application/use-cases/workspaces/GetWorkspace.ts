import WorkspaceRepository from '../../../infrastructure/database/postgresql/WorkspaceRepository';
import ProjectMemberRepository from '../../../infrastructure/database/postgresql/ProjectMemberRepository';
import CacheService from '../../../infrastructure/database/redis/CacheService';
import { Workspace } from '../../../domain/entities/Workspace';
import { NotFoundError, ForbiddenError } from '../../../shared/errors';
import { ERROR_MESSAGES } from '../../../shared/constants';
import logger from '../../../infrastructure/observability/logger';

export class GetWorkspace {
  async execute(workspaceId: string, userId: string): Promise<Workspace> {
    try {
      // Try cache first
      const cached = await CacheService.getCachedWorkspace(workspaceId);
      if (cached) {
        logger.debug('Workspace fetched from cache', { workspaceId });
        return Workspace.fromDatabase(cached);
      }

      // Get from database
      const workspaceRecord = await WorkspaceRepository.findById(workspaceId);
      if (!workspaceRecord) {
        throw new NotFoundError(ERROR_MESSAGES.WORKSPACE_NOT_FOUND);
      }

      // Verify user has access to the project
      const member = await ProjectMemberRepository.findByProjectAndUser(
        workspaceRecord.projectId,
        userId
      );
      if (!member) {
        throw new ForbiddenError(ERROR_MESSAGES.WORKSPACE_ACCESS_DENIED);
      }

      // Cache workspace
      await CacheService.cacheWorkspace(workspaceId, workspaceRecord);

      logger.info('Workspace fetched successfully', { workspaceId, userId });

      return Workspace.fromDatabase(workspaceRecord);
    } catch (error) {
      logger.error('Error getting workspace', { workspaceId, userId, error });
      throw error;
    }
  }
}

export default new GetWorkspace();

