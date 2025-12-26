import ProjectRepository from '../../../infrastructure/database/postgresql/ProjectRepository';
import { Project } from '../../../domain/entities/Project';
import { IPaginatedResponse } from '../../../shared/types';
import { APP_CONSTANTS } from '../../../shared/constants';
import logger from '../../../infrastructure/observability/logger';

export class ListUserProjects {
  async execute(
    userId: string,
    page: number = 1,
    limit: number = APP_CONSTANTS.DEFAULT_PAGE_SIZE
  ): Promise<IPaginatedResponse<Project>> {
    try {
      // Ensure limits
      const safeLimit = Math.min(limit, APP_CONSTANTS.MAX_PAGE_SIZE);
      const offset = (page - 1) * safeLimit;

      // Get projects
      const projectRecords = await ProjectRepository.findByUserId(userId, safeLimit, offset);
      const total = await ProjectRepository.countByUserId(userId);

      const projects = projectRecords.map((record) => Project.fromDatabase(record));

      logger.info('User projects listed successfully', { userId, count: projects.length });

      return {
        success: true,
        data: projects,
        pagination: {
          page,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit),
        },
      };
    } catch (error) {
      logger.error('Error listing user projects', { userId, error });
      throw error;
    }
  }
}

export default new ListUserProjects();

