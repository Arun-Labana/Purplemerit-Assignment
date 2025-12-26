import ActivityLogRepository from '../../../../../src/infrastructure/database/mongodb/ActivityLogRepository';
import { ActivityLogModel } from '../../../../../src/infrastructure/database/mongodb/schemas/ActivityLog';
import { ActivityType } from '../../../../../src/shared/constants/enums';

jest.mock('../../../../../src/infrastructure/database/mongodb/schemas/ActivityLog');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('ActivityLogRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create activity log', async () => {
      const activityData = {
        workspaceId: 'workspace-123',
        userId: 'user-123',
        action: ActivityType.PROJECT_CREATED,
        details: {},
        timestamp: new Date(),
      };
      (ActivityLogModel.create as jest.Mock).mockResolvedValue(undefined);

      await ActivityLogRepository.create(activityData);

      expect(ActivityLogModel.create).toHaveBeenCalled();
    });
  });

  describe('findByWorkspaceId', () => {
    it('should find activity logs by workspace id', async () => {
      const mockLogs = [
        {
          workspaceId: 'workspace-123',
          userId: 'user-123',
          action: ActivityType.PROJECT_CREATED,
          details: {},
          timestamp: new Date(),
        },
      ];
      (ActivityLogModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockLogs),
      });

      const result = await ActivityLogRepository.findByWorkspaceId('workspace-123', 50, 0);

      expect(result).toEqual(mockLogs);
    });
  });

  describe('findByUserId', () => {
    it('should find activity logs by user id', async () => {
      const mockLogs = [
        {
          workspaceId: 'workspace-123',
          userId: 'user-123',
          action: ActivityType.PROJECT_CREATED,
          details: {},
          timestamp: new Date(),
        },
      ];
      (ActivityLogModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockLogs),
      });

      const result = await ActivityLogRepository.findByUserId('user-123', 50, 0);

      expect(result).toEqual(mockLogs);
    });
  });

  describe('countByWorkspaceId', () => {
    it('should count activity logs by workspace id', async () => {
      (ActivityLogModel.countDocuments as jest.Mock).mockResolvedValue(10);

      const result = await ActivityLogRepository.countByWorkspaceId('workspace-123');

      expect(result).toBe(10);
    });
  });
});

