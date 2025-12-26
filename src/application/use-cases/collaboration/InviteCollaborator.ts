import UserRepository from '../../../infrastructure/database/postgresql/UserRepository';
import ProjectMemberRepository from '../../../infrastructure/database/postgresql/ProjectMemberRepository';
import ActivityLogRepository from '../../../infrastructure/database/mongodb/ActivityLogRepository';
import { Role } from '../../../domain/value-objects/Role';
import { UserRole } from '../../../shared/constants/enums';
import { NotFoundError, ValidationError } from '../../../shared/errors';
import { ERROR_MESSAGES } from '../../../shared/constants';
import { ActivityType } from '../../../shared/constants/enums';
import logger from '../../../infrastructure/observability/logger';

export class InviteCollaborator {
  async execute(
    projectId: string,
    email: string,
    role: UserRole,
    invitedBy: string
  ): Promise<void> {
    try {
      // Verify inviter is owner
      const inviterMember = await ProjectMemberRepository.findByProjectAndUser(projectId, invitedBy);
      if (!inviterMember) {
        throw new NotFoundError(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      const inviterRole = new Role(inviterMember.role);
      inviterRole.assertPermission('manage');

      // Find user to invite
      const userToInvite = await UserRepository.findByEmail(email);
      if (!userToInvite) {
        throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      // Check if already a member
      const existingMember = await ProjectMemberRepository.findByProjectAndUser(
        projectId,
        userToInvite.id
      );
      if (existingMember) {
        throw new ValidationError(ERROR_MESSAGES.MEMBER_ALREADY_EXISTS);
      }

      // Add member
      await ProjectMemberRepository.create({
        projectId,
        userId: userToInvite.id,
        role,
        invitedBy,
      });

      // Log activity
      await ActivityLogRepository.create({
        workspaceId: projectId,
        userId: invitedBy,
        action: ActivityType.MEMBER_INVITED,
        details: { email, role, invitedUserId: userToInvite.id },
        timestamp: new Date(),
      });

      logger.info('Collaborator invited successfully', { projectId, email, role });
    } catch (error) {
      logger.error('Error inviting collaborator', { projectId, email, error });
      throw error;
    }
  }
}

export default new InviteCollaborator();

