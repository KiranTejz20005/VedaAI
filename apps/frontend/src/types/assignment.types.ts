export type QuestionType =
  | 'short-answer'
  | 'long-answer'
  | 'mcq'
  | 'true-false'
  | 'fill-blank';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type AssignmentStatus =
  | 'draft'
  | 'queued'
  | 'generating'
  | 'completed'
  | 'failed';

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface QuestionConfig {
  types: QuestionType[];
  count: number;
  difficulty: DifficultyDistribution;
}

export interface FileRef {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  duration: number;
  totalMarks: number;
  questionConfig: QuestionConfig;
  uploadedFiles: FileRef[];
  additionalInstructions: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentFormData {
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  duration: number;
  totalMarks: number;
  questionConfig: QuestionConfig;
  additionalInstructions: string;
  files: File[];
}
