import mongoose, { type Document, Schema } from 'mongoose';
import type { Question, Section } from '../types/paper.types';

export interface IGeneratedPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  title: string;
  totalMarks: number;
  duration: number;
  sections: Section[];
  pdfPath: string | null;
  pdfUrl: string | null;
  generatedAt: Date;
}

const QuestionSchema = new Schema<Question>(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    type: {
      type: String,
      enum: ['short-answer', 'long-answer', 'mcq', 'true-false', 'fill-blank'],
      required: true,
    },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    marks: { type: Number, required: true, min: 1 },
    options: [{ key: String, text: String }],
    blanks: Number,
  },
  { _id: false }
);

const SectionSchema = new Schema<Section>(
  {
    title: { type: String, required: true },
    instruction: { type: String, default: '' },
    questions: [QuestionSchema],
  },
  { _id: false }
);

const GeneratedPaperSchema = new Schema<IGeneratedPaper>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    title: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    duration: { type: Number, default: 45 },
    sections: [SectionSchema],
    pdfPath: { type: String, default: null },
    pdfUrl: { type: String, default: null },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

GeneratedPaperSchema.index({ assignmentId: 1, generatedAt: -1 });

export const GeneratedPaper = mongoose.model<IGeneratedPaper>('GeneratedPaper', GeneratedPaperSchema);
