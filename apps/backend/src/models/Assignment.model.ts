import mongoose, { type Document, Schema } from 'mongoose';
import type {
  AssignmentStatus,
  QuestionType,
  DifficultyDistribution,
  FileRef,
} from '../types/assignment.types';

export interface IAssignment extends Document {
  title: string;
  subject: string;
  description: string;
  dueDate: Date;
  duration: number;
  totalMarks: number;
  questionConfig: {
    types: QuestionType[];
    count: number;
    difficulty: DifficultyDistribution;
  };
  uploadedFiles: FileRef[];
  additionalInstructions: string;
  status: AssignmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subject: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 2000 },
    dueDate: { type: Date, required: true },
    duration: { type: Number, required: true, min: 1, max: 600 },
    totalMarks: { type: Number, required: true, min: 1, max: 1000 },
    questionConfig: {
      types: [{ type: String, enum: ['short-answer', 'long-answer', 'mcq', 'true-false', 'fill-blank'] }],
      count: { type: Number, required: true, min: 1, max: 100 },
      difficulty: {
        easy: { type: Number, default: 33 },
        medium: { type: Number, default: 34 },
        hard: { type: Number, default: 33 },
      },
    },
    uploadedFiles: [{
      originalName: String,
      storedName: String,
      mimeType: String,
      size: Number,
      path: String,
    }],
    additionalInstructions: { type: String, default: '', maxlength: 2000 },
    status: {
      type: String,
      enum: ['draft', 'queued', 'generating', 'completed', 'failed'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

AssignmentSchema.index({ status: 1, createdAt: -1 });
AssignmentSchema.index({ subject: 1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
