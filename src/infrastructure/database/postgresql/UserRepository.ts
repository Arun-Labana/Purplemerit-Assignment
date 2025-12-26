import pgDatabase from './connection';
import { IUser, IUserCreate } from '../../../shared/types';
import logger from '../../observability/logger';

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    try {
      const result = await pgDatabase.query(
        'SELECT id, email, name, password_hash as "passwordHash", created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID', { id, error });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      const result = await pgDatabase.query(
        'SELECT id, email, name, password_hash as "passwordHash", created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email', { email, error });
      throw error;
    }
  }

  async create(userData: IUserCreate & { passwordHash: string }): Promise<IUser> {
    try {
      const result = await pgDatabase.query(
        `INSERT INTO users (email, name, password_hash) 
         VALUES ($1, $2, $3) 
         RETURNING id, email, name, password_hash as "passwordHash", created_at as "createdAt", updated_at as "updatedAt"`,
        [userData.email, userData.name, userData.passwordHash]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user', { email: userData.email, error });
      throw error;
    }
  }

  async update(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.name) {
        fields.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }

      if (updates.email) {
        fields.push(`email = $${paramCount++}`);
        values.push(updates.email);
      }

      if (fields.length === 0) {
        return this.findById(id);
      }

      values.push(id);
      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} 
                     RETURNING id, email, name, password_hash as "passwordHash", created_at as "createdAt", updated_at as "updatedAt"`;

      const result = await pgDatabase.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating user', { id, error });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await pgDatabase.query('DELETE FROM users WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Error deleting user', { id, error });
      throw error;
    }
  }
}

export default new UserRepository();

