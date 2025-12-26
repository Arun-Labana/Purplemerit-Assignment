import pgDatabase from './connection';
import { IProject, IProjectCreate, IProjectUpdate } from '../../../shared/types';
import logger from '../../observability/logger';

export class ProjectRepository {
  async findById(id: string): Promise<IProject | null> {
    try {
      const result = await pgDatabase.query(
        `SELECT id, name, description, owner_id as "ownerId", created_at as "createdAt", updated_at as "updatedAt" 
         FROM projects WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding project by ID', { id, error });
      throw error;
    }
  }

  async findByUserId(userId: string, limit: number = 20, offset: number = 0): Promise<IProject[]> {
    try {
      const result = await pgDatabase.query(
        `SELECT DISTINCT p.id, p.name, p.description, p.owner_id as "ownerId", 
                p.created_at as "createdAt", p.updated_at as "updatedAt"
         FROM projects p
         LEFT JOIN project_members pm ON p.id = pm.project_id
         WHERE p.owner_id = $1 OR pm.user_id = $1
         ORDER BY p.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error finding projects by user ID', { userId, error });
      throw error;
    }
  }

  async countByUserId(userId: string): Promise<number> {
    try {
      const result = await pgDatabase.query(
        `SELECT COUNT(DISTINCT p.id) as count
         FROM projects p
         LEFT JOIN project_members pm ON p.id = pm.project_id
         WHERE p.owner_id = $1 OR pm.user_id = $1`,
        [userId]
      );
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting projects by user ID', { userId, error });
      throw error;
    }
  }

  async create(projectData: IProjectCreate, ownerId: string): Promise<IProject> {
    const client = await pgDatabase.getClient();
    try {
      await client.query('BEGIN');

      // Create project
      const projectResult = await client.query(
        `INSERT INTO projects (name, description, owner_id) 
         VALUES ($1, $2, $3) 
         RETURNING id, name, description, owner_id as "ownerId", created_at as "createdAt", updated_at as "updatedAt"`,
        [projectData.name, projectData.description || null, ownerId]
      );

      const project = projectResult.rows[0];

      // Add owner as project member
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role, invited_by) 
         VALUES ($1, $2, $3, $4)`,
        [project.id, ownerId, 'owner', ownerId]
      );

      await client.query('COMMIT');
      return project;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating project', { projectData, ownerId, error });
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: string, updates: IProjectUpdate): Promise<IProject | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }

      if (updates.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(updates.description);
      }

      if (fields.length === 0) {
        return this.findById(id);
      }

      values.push(id);
      const query = `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramCount} 
                     RETURNING id, name, description, owner_id as "ownerId", created_at as "createdAt", updated_at as "updatedAt"`;

      const result = await pgDatabase.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating project', { id, updates, error });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await pgDatabase.query('DELETE FROM projects WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Error deleting project', { id, error });
      throw error;
    }
  }
}

export default new ProjectRepository();

