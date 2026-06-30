export interface Question {
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

export interface CreateQuestionData {
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

export interface UpdateQuestionData {
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

export interface QuestionVersion {
  id: string;
  questionId: string;
  versionNumber: number;
  content: string;
  options?: any;
  answer?: string;
  updatedBy: string;
  createdAt: string;
}

export interface QuestionBankStats {
  totalQuestions: number;
  approved: number;
  pending: number;
  rejected: number;
  byDifficulty: Record<string, number>;
  byBloomLevel: Record<string, number>;
  bySubject: Record<string, number>;
}

export interface BulkImportResult {
  imported: number;
  failed: number;
  errors?: string[];
}
