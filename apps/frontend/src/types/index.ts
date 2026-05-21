// Re-export all types from individual files
export type {
  QuestionType,
  DifficultyLevel,
  AssignmentStatus,
  DifficultyDistribution,
  QuestionConfig,
  FileRef,
  Assignment,
  CreateAssignmentFormData,
} from './assignment.types';

export type { MCQOption, Question, Section, GeneratedPaper } from './paper.types';
export type { GenerationStage, GenerationProgressPayload, GenerationCompletedPayload, GenerationFailedPayload } from './socket.types';


// ─── Extended types used by components ───────────────────────────

/** For AssignmentCard — adds fields used from backend response */
export type { Assignment as default } from './assignment.types';

/** Normalized paper section shape for PaperSectionCard */
export interface PaperSection {
  title: string;
  type: string; // short_answer | long_answer | mcq | true_false | fill_blank
  instructions?: string;
  questions: PaperQuestion[];
}

export interface PaperQuestion {
  id: string;
  question: string;
  difficulty: string;
  marks: number;
  options?: string[]; // plain string array for rendering
  answer?: string; // teacher view
}

/** For paper viewer */
export interface GeneratedPaperFull {
  _id: string;
  assignmentId: string;
  title: string;
  subject: string;
  instructions?: string;
  difficulty: string;
  duration: number;
  totalMarks: number;
  sections: PaperSection[];
  pdfUrl: string | null;
  generatedAt: string;
}

/** Generation status for progress component */
export type GenerationStatus = 'queued' | 'processing' | 'generating' | 'parsing' | 'saving' | 'completed' | 'failed';
