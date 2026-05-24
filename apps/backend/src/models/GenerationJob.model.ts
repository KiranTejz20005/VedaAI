import mongoose, { type Document, Schema } from 'mongoose';
import type { GenerationStage } from '../types/socket.types';

export interface IGenerationJob extends Document {
  assignmentId: mongoose.Types.ObjectId;
  bullmqJobId: string;
  // Monotonic generation sequence copied from Assignment at enqueue time.
  generationSeq: number;
  // Monotonic progress event sequence for this job. Used to order websocket/poll updates.
  progressVersion: number;
  // Monotonic stage index (numeric) to prevent stage regression.
  stageIndex: number;
  status: GenerationStage;
  progress: number;
  error: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const GenerationJobSchema = new Schema<IGenerationJob>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    bullmqJobId: { type: String, default: '' },
    generationSeq: { type: Number, default: 0, min: 0, index: true },
    progressVersion: { type: Number, default: 0, min: 0, index: true },
    stageIndex: { type: Number, default: 0, min: 0, index: true },
    status: {
      type: String,
      enum: ['queued', 'extracting_content', 'topic_preprocessing', 'generation_planning', 'batch_generating', 'provider_retry', 'validation_retry', 'recovering_batches', 'validating', 'answer_key_generating', 'pdf_composing', 'persisting', 'pdf-generating', 'completed', 'failed'],
      default: 'queued',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    error: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

GenerationJobSchema.index({ assignmentId: 1, status: 1 });
GenerationJobSchema.index({ assignmentId: 1, generationSeq: -1, createdAt: -1 });
GenerationJobSchema.index({ status: 1, createdAt: -1 });

export const GenerationJob = mongoose.model<IGenerationJob>('GenerationJob', GenerationJobSchema);
