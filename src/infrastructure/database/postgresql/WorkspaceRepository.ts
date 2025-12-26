import pgDatabase from './connection';
import { IWorkspace, IWorkspaceCreate, IWorkspaceUpdate } from '../../../shared/types';
import logger from '../../observability/logger';

export class WorkspaceRepository {
  async findById(id: string): Promise<IWorkspace | null> {
    try {
      const result = await pgDatabase.query(
        `SELECT id, project_id as "projectId", name, settings, created_at as "createdAt", updated_at as "updatedAt" 
         FROM workspaces WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding workspace by ID', { id, error });
      throw error;
    }
  }

  async findByProjectId(projectId: string): Promise<IWorkspace[]> {
    try {
      const result = await pgDatabase.query(
        `SELECT id, project_id as "projectId", name, settings, created_at as "createdAt", updated_at as "updatedAt" 
         FROM workspaces WHERE project_id = $1 ORDER BY created_at DESC`,
        [projectId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error finding workspaces by project ID', { projectId, error });
      throw error;
    }
  }

  async create(workspaceData: IWorkspaceCreate, projectId: string): Promise<IWorkspace> {
    try {
      const result = await pgDatabase.query(
        `INSERT INTO workspaces (project_id, name, settings) 
         VALUES ($1, $2, $3) 
         RETURNING id, project_id as "projectId", name, settings, created_at as "createdAt", updated_at as "updatedAt"`,
        [projectId, workspaceData.name, JSON.stringify(workspaceData.settings || {})]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating workspace', { workspaceData, projectId, error });
      throw error;
    }
  }

  async update(id: string, updates: IWorkspaceUpdate): Promise<IWorkspace | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }

      if (updates.settings !== undefined) {
        fields.push(`settings = $${paramCount++}`);
        values.push(JSON.stringify(updates.settings));
      }

      if (fields.length === 0) {
        return this.findById(id);
      }

      values.push(id);
      const query = `UPDATE workspaces SET ${fields.join(', ')} WHERE id = $${paramCount} 
                     RETURNING id, project_id as "projectId", name, settings, created_at as "createdAt", updated_at as "updatedAt"`;

      const result = await pgDatabase.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating workspace', { id, updates, error });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await pgDatabase.query('DELETE FROM workspaces WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Error deleting workspace', { id, error });
      throw error;
    }
  }
}

export default new WorkspaceRepository();

