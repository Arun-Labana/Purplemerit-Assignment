import ProjectRepository from '../../../infrastructure/database/postgresql/ProjectRepository';
import ActivityLogRepository from '../../../infrastructure/database/mongodb/ActivityLogRepository';
import { IProjectCreate } from '../../../shared/types';
import { Project } from '../../../domain/entities/Project';
import { ActivityType } from '../../../shared/constants/enums';
import logger from '../../../infrastructure/observability/logger';

export class CreateProject {
  async execute(projectData: IProjectCreate, userId: string): Promise<Project> {
    try {
      // Create project
      const projectRecord = await ProjectRepository.create(projectData, userId);

      // Log activity
      await ActivityLogRepository.create({
        workspaceId: projectRecord.id, // Using project as workspace context
        userId,
        action: ActivityType.PROJECT_CREATED,
        details: { projectName: projectData.name },
        timestamp: new Date(),
      });

      logger.info('Project created successfully', { projectId: projectRecord.id, userId });

      return Project.fromDatabase(projectRecord);
    } catch (error) {
      logger.error('Error creating project', { projectData, userId, error });
      throw error;
    }
  }
}

export default new CreateProject();

