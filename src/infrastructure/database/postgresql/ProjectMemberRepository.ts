import pgDatabase from './connection';
import { IProjectMember, IProjectMemberCreate } from '../../../shared/types';
import { UserRole } from '../../../shared/constants/enums';
import logger from '../../observability/logger';

export class ProjectMemberRepository {
  async findByProjectId(projectId: string): Promise<IProjectMember[]> {
    try {
      const result = await pgDatabase.query(
        `SELECT pm.id, pm.project_id as "projectId", pm.user_id as "userId", pm.role, 
                pm.invited_at as "invitedAt", pm.invited_by as "invitedBy",
                u.id as "user.id", u.email as "user.email", u.name as "user.name", 
                u.created_at as "user.createdAt"
         FROM project_members pm
         JOIN users u ON pm.user_id = u.id
         WHERE pm.project_id = $1
         ORDER BY pm.invited_at DESC`,
        [projectId]
      );

      return result.rows.map(row => ({
        id: row.id,
        projectId: row.projectId,
        userId: row.userId,
        role: row.role as UserRole,
        invitedAt: row.invitedAt,
        invitedBy: row.invitedBy,
        user: {
          id: row['user.id'],
          email: row['user.email'],
          name: row['user.name'],
          createdAt: row['user.createdAt'],
        },
      }));
    } catch (error) {
      logger.error('Error finding project members', { projectId, error });
      throw error;
    }
  }

  async findByProjectAndUser(projectId: string, userId: string): Promise<IProjectMember | null> {
    try {
      const result = await pgDatabase.query(
        `SELECT id, project_id as "projectId", user_id as "userId", role, 
                invited_at as "invitedAt", invited_by as "invitedBy"
         FROM project_members 
         WHERE project_id = $1 AND user_id = $2`,
        [projectId, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding project member', { projectId, userId, error });
      throw error;
    }
  }

  async create(memberData: IProjectMemberCreate): Promise<IProjectMember> {
    try {
      const result = await pgDatabase.query(
        `INSERT INTO project_members (project_id, user_id, role, invited_by) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, project_id as "projectId", user_id as "userId", role, 
                   invited_at as "invitedAt", invited_by as "invitedBy"`,
        [memberData.projectId, memberData.userId, memberData.role, memberData.invitedBy]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating project member', { memberData, error });
      throw error;
    }
  }

  async updateRole(projectId: string, userId: string, role: UserRole): Promise<IProjectMember | null> {
    try {
      const result = await pgDatabase.query(
        `UPDATE project_members SET role = $1 
         WHERE project_id = $2 AND user_id = $3
         RETURNING id, project_id as "projectId", user_id as "userId", role, 
                   invited_at as "invitedAt", invited_by as "invitedBy"`,
        [role, projectId, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating member role', { projectId, userId, role, error });
      throw error;
    }
  }

  async delete(projectId: string, userId: string): Promise<boolean> {
    try {
      const result = await pgDatabase.query(
        'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Error deleting project member', { projectId, userId, error });
      throw error;
    }
  }
}

export default new ProjectMemberRepository();

