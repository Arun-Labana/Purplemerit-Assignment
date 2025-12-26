import redisClient from './connection';
import logger from '../../observability/logger';

export interface IFeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
}

export class FeatureFlagService {
  private prefix = 'feature:';

  private getKey(flagName: string): string {
    return `${this.prefix}${flagName}`;
  }

  async isEnabled(flagName: string): Promise<boolean> {
    try {
      const key = this.getKey(flagName);
      const data = await redisClient.get(key);

      if (data) {
        const flag: IFeatureFlag = JSON.parse(data);
        return flag.enabled;
      }

      // If flag doesn't exist, return false
      return false;
    } catch (error) {
      logger.error('Error checking feature flag', { flagName, error });
      return false; // Default to disabled on error
    }
  }

  async setFlag(flagName: string, enabled: boolean, description?: string): Promise<void> {
    try {
      const key = this.getKey(flagName);
      const flag: IFeatureFlag = {
        name: flagName,
        enabled,
        description,
      };
      await redisClient.set(key, JSON.stringify(flag));
      logger.info('Feature flag updated', { flagName, enabled });
    } catch (error) {
      logger.error('Error setting feature flag', { flagName, enabled, error });
      throw error;
    }
  }

  async getFlag(flagName: string): Promise<IFeatureFlag | null> {
    try {
      const key = this.getKey(flagName);
      const data = await redisClient.get(key);

      if (data) {
        return JSON.parse(data) as IFeatureFlag;
      }

      return null;
    } catch (error) {
      logger.error('Error getting feature flag', { flagName, error });
      return null;
    }
  }

  async getAllFlags(): Promise<IFeatureFlag[]> {
    try {
      const pattern = this.getKey('*');
      const keys = await redisClient.keys(pattern);

      const flags: IFeatureFlag[] = [];
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          flags.push(JSON.parse(data));
        }
      }

      return flags;
    } catch (error) {
      logger.error('Error getting all feature flags', error);
      return [];
    }
  }

  async deleteFlag(flagName: string): Promise<void> {
    try {
      const key = this.getKey(flagName);
      await redisClient.del(key);
      logger.info('Feature flag deleted', { flagName });
    } catch (error) {
      logger.error('Error deleting feature flag', { flagName, error });
      throw error;
    }
  }

  // Initialize default flags
  async initializeDefaults(): Promise<void> {
    const defaultFlags: IFeatureFlag[] = [
      {
        name: 'realtime_collaboration',
        enabled: true,
        description: 'Enable real-time collaboration features',
      },
      {
        name: 'job_processing',
        enabled: true,
        description: 'Enable background job processing',
      },
      {
        name: 'advanced_analytics',
        enabled: false,
        description: 'Enable advanced analytics dashboard',
      },
      {
        name: 'ai_code_completion',
        enabled: false,
        description: 'Enable AI-powered code completion',
      },
    ];

    for (const flag of defaultFlags) {
      const existing = await this.getFlag(flag.name);
      if (!existing) {
        await this.setFlag(flag.name, flag.enabled, flag.description);
      }
    }

    logger.info('Feature flags initialized');
  }
}

export default new FeatureFlagService();

