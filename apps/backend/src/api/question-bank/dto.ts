export interface QuestionDto {
  id: string;
  content: string;
  options?: any;
  answer?: string;
  hint?: string;
  subject: string;
  topic: string;
  organizationId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  tags: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionDto {
  content: string;
  options?: any;
  answer?: string;
  hint?: string;
  subject: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  tags?: string[];
}

export interface UpdateQuestionDto {
  content?: string;
  options?: any;
  answer?: string;
  hint?: string;
  subject?: string;
  topic?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  bloomLevel?: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  tags?: string[];
}

export interface QuestionVersionDto {
  id: string;
  questionId: string;
  versionNumber: number;
  content: string;
  options?: any;
  answer?: string;
  updatedBy: string;
  createdAt: string;
}

export interface QuestionBankStatsDto {
  totalQuestions: number;
  approved: number;
  pending: number;
  rejected: number;
  byDifficulty: Record<string, number>;
  byBloomLevel: Record<string, number>;
  bySubject: Record<string, number>;
}

export interface BulkImportResultDto {
  imported: number;
  failed: number;
  errors?: string[];
}
