import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditTrailDocument extends Document {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

const AuditTrailSchema = new Schema<IAuditTrailDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
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

// Compound indexes
AuditTrailSchema.index({ userId: 1, timestamp: -1 });
AuditTrailSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });

export const AuditTrailModel = mongoose.model<IAuditTrailDocument>('AuditTrail', AuditTrailSchema);

export default AuditTrailModel;

