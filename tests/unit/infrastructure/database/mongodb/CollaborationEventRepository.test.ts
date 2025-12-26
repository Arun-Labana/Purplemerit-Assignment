import CollaborationEventRepository from '../../../../../src/infrastructure/database/mongodb/CollaborationEventRepository';
import { CollaborationEventModel } from '../../../../../src/infrastructure/database/mongodb/schemas/CollaborationEvent';

jest.mock('../../../../../src/infrastructure/database/mongodb/schemas/CollaborationEvent');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('CollaborationEventRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create collaboration event', async () => {
      const eventData = {
        workspaceId: 'workspace-123',
        userId: 'user-123',
        eventType: 'file:change',
        payload: { fileId: 'file-123', changes: [] },
        timestamp: new Date(),
      };
      (CollaborationEventModel.create as jest.Mock).mockResolvedValue(undefined);

      await CollaborationEventRepository.create(eventData);

      expect(CollaborationEventModel.create).toHaveBeenCalledWith({
        workspaceId: eventData.workspaceId,
        userId: eventData.userId,
        eventType: eventData.eventType,
        payload: eventData.payload,
        timestamp: eventData.timestamp,
      });
    });

    it('should handle errors when creating event', async () => {
      const eventData = {
        workspaceId: 'workspace-123',
        userId: 'user-123',
        eventType: 'file:change',
        payload: {},
        timestamp: new Date(),
      };
      const error = new Error('Database error');
      (CollaborationEventModel.create as jest.Mock).mockRejectedValue(error);

      await expect(CollaborationEventRepository.create(eventData)).rejects.toThrow('Database error');
    });
  });

  describe('findByWorkspaceId', () => {
    it('should find collaboration events by workspace id', async () => {
      const mockEvents = [
        {
          workspaceId: 'workspace-123',
          userId: 'user-123',
          eventType: 'file:change',
          payload: {},
          timestamp: new Date(),
        },
      ];
      (CollaborationEventModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockEvents),
      });

      const result = await CollaborationEventRepository.findByWorkspaceId('workspace-123', 50, 0);

      expect(CollaborationEventModel.find).toHaveBeenCalledWith({ workspaceId: 'workspace-123' });
      expect(result).toEqual(mockEvents);
    });

    it('should use default limit and skip values', async () => {
      (CollaborationEventModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      await CollaborationEventRepository.findByWorkspaceId('workspace-123');

      expect(CollaborationEventModel.find).toHaveBeenCalled();
    });

    it('should handle errors when finding events', async () => {
      const error = new Error('Database error');
      (CollaborationEventModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(error),
      });

      await expect(
        CollaborationEventRepository.findByWorkspaceId('workspace-123')
      ).rejects.toThrow('Database error');
    });
  });

  describe('deleteOldEvents', () => {
    it('should delete old collaboration events', async () => {
      const olderThan = new Date('2024-01-01');
      const mockResult = { deletedCount: 5 };
      (CollaborationEventModel.deleteMany as jest.Mock).mockResolvedValue(mockResult);

      const result = await CollaborationEventRepository.deleteOldEvents('workspace-123', olderThan);

      expect(CollaborationEventModel.deleteMany).toHaveBeenCalledWith({
        workspaceId: 'workspace-123',
        timestamp: { $lt: olderThan },
      });
      expect(result).toBe(5);
    });

    it('should return 0 when no events deleted', async () => {
      const olderThan = new Date('2024-01-01');
      const mockResult = { deletedCount: 0 };
      (CollaborationEventModel.deleteMany as jest.Mock).mockResolvedValue(mockResult);

      const result = await CollaborationEventRepository.deleteOldEvents('workspace-123', olderThan);

      expect(result).toBe(0);
    });

    it('should handle errors when deleting events', async () => {
      const olderThan = new Date('2024-01-01');
      const error = new Error('Database error');
      (CollaborationEventModel.deleteMany as jest.Mock).mockRejectedValue(error);

      await expect(
        CollaborationEventRepository.deleteOldEvents('workspace-123', olderThan)
      ).rejects.toThrow('Database error');
    });
  });
});

