import { ActivityLogModel } from './schemas/ActivityLog';
import { IActivityLog } from '../../../shared/types';
import logger from '../../observability/logger';

export class ActivityLogRepository {
  async create(activityData: IActivityLog): Promise<void> {
    try {
      await ActivityLogModel.create(activityData);
    } catch (error) {
      logger.error('Error creating activity log', { activityData, error });
      throw error;
    }
  }

  async findByWorkspaceId(
    workspaceId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<IActivityLog[]> {
    try {
      const logs = await ActivityLogModel.find({ workspaceId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
      return logs;
    } catch (error) {
      logger.error('Error finding activity logs by workspace', { workspaceId, error });
      throw error;
    }
  }

  async findByUserId(userId: string, limit: number = 50, skip: number = 0): Promise<IActivityLog[]> {
    try {
      const logs = await ActivityLogModel.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
      return logs;
    } catch (error) {
      logger.error('Error finding activity logs by user', { userId, error });
      throw error;
    }
  }

  async countByWorkspaceId(workspaceId: string): Promise<number> {
    try {
      return await ActivityLogModel.countDocuments({ workspaceId });
    } catch (error) {
      logger.error('Error counting activity logs', { workspaceId, error });
      throw error;
    }
  }
}

export default new ActivityLogRepository();

