import mongoose, { Schema, Document } from 'mongoose';
import { IJobResult } from '../../../shared/types';

export interface IJobResultDocument extends IJobResult, Document {}

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
    errors: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const JobResultModel = mongoose.model<IJobResultDocument>('JobResult', JobResultSchema);

export default JobResultModel;

