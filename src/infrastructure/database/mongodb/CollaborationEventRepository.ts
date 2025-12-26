import { CollaborationEventModel } from './schemas/CollaborationEvent';
import { ICollaborationEvent } from '../../../shared/types';
import logger from '../../observability/logger';

export class CollaborationEventRepository {
  async create(eventData: ICollaborationEvent): Promise<void> {
    try {
      await CollaborationEventModel.create({
        workspaceId: eventData.workspaceId,
        userId: eventData.userId,
        eventType: eventData.eventType,
        payload: eventData.payload,
        timestamp: eventData.timestamp,
      } as any);
    } catch (error) {
      logger.error('Error creating collaboration event', { eventData, error });
      throw error;
    }
  }

  async findByWorkspaceId(
    workspaceId: string,
    limit: number = 100,
    skip: number = 0
  ): Promise<ICollaborationEvent[]> {
    try {
      const events = await CollaborationEventModel.find({ workspaceId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
      return events as any as ICollaborationEvent[];
    } catch (error) {
      logger.error('Error finding collaboration events', { workspaceId, error });
      throw error;
    }
  }

  async deleteOldEvents(workspaceId: string, olderThan: Date): Promise<number> {
    try {
      const result = await CollaborationEventModel.deleteMany({
        workspaceId,
        timestamp: { $lt: olderThan },
      });
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('Error deleting old collaboration events', { workspaceId, error });
      throw error;
    }
  }
}

export default new CollaborationEventRepository();

