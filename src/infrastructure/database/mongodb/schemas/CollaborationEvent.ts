import mongoose, { Schema, Document } from 'mongoose';

export interface ICollaborationEventDocument extends Document {
  workspaceId: string;
  userId: string;
  eventType: string;
  payload: any;
  timestamp: Date;
}

const CollaborationEventSchema = new Schema<ICollaborationEventDocument>(
  {
    workspaceId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 7 * 24 * 60 * 60, // 7 days TTL
    },
  } as any,
  {
    timestamps: false,
  }
);

// Index for efficient queries
CollaborationEventSchema.index({ workspaceId: 1, timestamp: -1 });
CollaborationEventSchema.index({ workspaceId: 1, eventType: 1 });

export const CollaborationEventModel = mongoose.model<ICollaborationEventDocument>(
  'CollaborationEvent',
  CollaborationEventSchema
);

export default CollaborationEventModel;
