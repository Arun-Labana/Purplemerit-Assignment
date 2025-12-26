import WorkspaceRepository from '../../../infrastructure/database/postgresql/WorkspaceRepository';
import ProjectMemberRepository from '../../../infrastructure/database/postgresql/ProjectMemberRepository';
import ActivityLogRepository from '../../../infrastructure/database/mongodb/ActivityLogRepository';
import { IWorkspaceCreate } from '../../../shared/types';
import { Workspace } from '../../../domain/entities/Workspace';
import { Role } from '../../../domain/value-objects/Role';
import { ForbiddenError } from '../../../shared/errors';
import { ERROR_MESSAGES } from '../../../shared/constants';
import { ActivityType } from '../../../shared/constants/enums';
import logger from '../../../infrastructure/observability/logger';

export class CreateWorkspace {
  async execute(
    workspaceData: IWorkspaceCreate,
    projectId: string,
    userId: string
  ): Promise<Workspace> {
    try {
      // Verify user has write permission
      const member = await ProjectMemberRepository.findByProjectAndUser(projectId, userId);
      if (!member) {
        throw new ForbiddenError(ERROR_MESSAGES.PROJECT_ACCESS_DENIED);
      }

      const role = new Role(member.role);
      role.assertPermission('write');

      // Create workspace
      const workspaceRecord = await WorkspaceRepository.create(workspaceData, projectId);

      // Log activity
      await ActivityLogRepository.create({
        workspaceId: workspaceRecord.id,
        userId,
        action: ActivityType.WORKSPACE_CREATED,
        details: { workspaceName: workspaceData.name, projectId },
        timestamp: new Date(),
      });

      logger.info('Workspace created successfully', { workspaceId: workspaceRecord.id, userId });

      return Workspace.fromDatabase(workspaceRecord);
    } catch (error) {
      logger.error('Error creating workspace', { workspaceData, projectId, userId, error });
      throw error;
    }
  }
}

export default new CreateWorkspace();

