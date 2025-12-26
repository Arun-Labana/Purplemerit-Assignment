import mongoose, { Schema, Document } from 'mongoose';

export interface IJobResultDocument extends Document {
  jobId: string;
  inputPayload: any;
  outputResult: any;
  logs: string[];
  errorMessages: string[];
}

const JobResultSchema = new Schema<IJobResultDocument>(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    inputPayload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    outputResult: {
      type: Schema.Types.Mixed,
      default: null,
    },
    logs: {
      type: [String],
      default: [],
    },
    errorMessages: {
      type: [String],
      default: [],
    },
  } as any,
  {
    timestamps: true,
  }
);

// Index for efficient queries
JobResultSchema.index({ jobId: 1 });
JobResultSchema.index({ createdAt: -1 });

export const JobResultModel = mongoose.model<IJobResultDocument>('JobResult', JobResultSchema);

export default JobResultModel;
