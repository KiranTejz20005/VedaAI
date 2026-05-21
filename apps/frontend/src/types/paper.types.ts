import type { QuestionType, DifficultyLevel } from './assignment.types';

export interface MCQOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  options?: MCQOption[];
  blanks?: number;
  answer?: string;
}



export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface GeneratedPaper {
  _id: string;
  assignmentId: string;
  title: string;
  totalMarks: number;
  duration?: number;
  sections: Section[];
  pdfUrl: string | null;
  generatedAt: string;
}
