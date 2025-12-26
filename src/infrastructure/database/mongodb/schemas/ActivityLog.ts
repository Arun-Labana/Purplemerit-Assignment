import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLogDocument extends Document {
  workspaceId: string;
  userId: string;
  action: string;
  details: any;
  timestamp: Date;
}

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
      expires: 90 * 24 * 60 * 60, // 90 days TTL
    },
  } as any,
  {
    timestamps: false,
  }
);

// Compound index for efficient queries
ActivityLogSchema.index({ workspaceId: 1, timestamp: -1 });
ActivityLogSchema.index({ userId: 1, timestamp: -1 });

export const ActivityLogModel = mongoose.model<IActivityLogDocument>('ActivityLog', ActivityLogSchema);

export default ActivityLogModel;
