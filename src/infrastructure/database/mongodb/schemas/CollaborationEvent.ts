import mongoose, { Schema, Document } from 'mongoose';
import { ICollaborationEvent } from '../../../shared/types';

export interface ICollaborationEventDocument extends ICollaborationEvent, Document {}

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
      index: true,
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
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient queries
CollaborationEventSchema.index({ workspaceId: 1, timestamp: -1 });

export const CollaborationEventModel = mongoose.model<ICollaborationEventDocument>(
  'CollaborationEvent',
  CollaborationEventSchema
);

export default CollaborationEventModel;

