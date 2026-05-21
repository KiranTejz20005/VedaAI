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
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface GeneratedPaperData {
  title: string;
  totalMarks: number;
  sections: Section[];
}
