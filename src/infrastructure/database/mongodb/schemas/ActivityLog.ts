import mongoose, { Schema, Document } from 'mongoose';
import { IActivityLog } from '../../../shared/types';
import { APP_CONSTANTS } from '../../../shared/constants';

export interface IActivityLogDocument extends IActivityLog, Document {}

const ActivityLogSchema = new Schema<IActivityLogDocument>(
  {
    workspaceId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      expires: APP_CONSTANTS.MONGODB_ACTIVITY_LOG_TTL_DAYS * 24 * 60 * 60, // TTL index
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient queries
ActivityLogSchema.index({ workspaceId: 1, timestamp: -1 });
ActivityLogSchema.index({ userId: 1, timestamp: -1 });

export const ActivityLogModel = mongoose.model<IActivityLogDocument>('ActivityLog', ActivityLogSchema);

export default ActivityLogModel;

