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
      index: true, // unique: true already creates an index, but we keep this for clarity
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
// Note: jobId index is already created by unique: true, so we don't duplicate it
JobResultSchema.index({ createdAt: -1 });

export const JobResultModel = mongoose.model<IJobResultDocument>('JobResult', JobResultSchema);

export default JobResultModel;
