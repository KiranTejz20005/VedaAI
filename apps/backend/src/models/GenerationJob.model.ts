import mongoose, { type Document, Schema } from 'mongoose';
import type { GenerationStage } from '../types/socket.types';

export interface IGenerationJob extends Document {
  assignmentId: mongoose.Types.ObjectId;
  bullmqJobId: string;
  status: GenerationStage;
  progress: number;
  error: string | null;
  startedAt: Date;
  completedAt: Date | null;
}

const GenerationJobSchema = new Schema<IGenerationJob>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    bullmqJobId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['queued', 'processing', 'generating', 'parsing', 'saving', 'pdf-generating', 'completed', 'failed'],
      default: 'queued',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    error: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const GenerationJob = mongoose.model<IGenerationJob>('GenerationJob', GenerationJobSchema);
