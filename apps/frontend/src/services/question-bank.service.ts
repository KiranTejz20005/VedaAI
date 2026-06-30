import { api } from '@/lib/api';
import type {
  Question, CreateQuestionData, UpdateQuestionData,
  QuestionVersion, QuestionBankStats, BulkImportResult,
} from '@/types/question-bank.types';

export interface QuestionListResponse {
  data: Question[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function listQuestions(
  page = 1, limit = 20, filters?: { subject?: string; difficulty?: string; bloomLevel?: string; status?: string }
): Promise<QuestionListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.subject) params.set('subject', filters.subject);
  if (filters?.difficulty) params.set('difficulty', filters.difficulty);
  if (filters?.bloomLevel) params.set('bloomLevel', filters.bloomLevel);
  if (filters?.status) params.set('status', filters.status);
  const res = await api.get(`/question-bank?${params}`);
  return res.data;
}

export async function getQuestion(id: string): Promise<Question> {
  const res = await api.get(`/question-bank/${id}`);
  return res.data.data;
}

export async function createQuestion(data: CreateQuestionData): Promise<Question> {
  const res = await api.post('/question-bank', data);
  return res.data.data;
}

export async function updateQuestion(id: string, data: UpdateQuestionData): Promise<Question> {
  const res = await api.put(`/question-bank/${id}`, data);
  return res.data.data;
}

export async function deleteQuestion(id: string): Promise<void> {
  await api.delete(`/question-bank/${id}`);
}

export async function approveQuestion(id: string): Promise<Question> {
  const res = await api.post(`/question-bank/${id}/approve`);
  return res.data.data;
}

export async function rejectQuestion(id: string): Promise<Question> {
  const res = await api.post(`/question-bank/${id}/reject`);
  return res.data.data;
}

export async function listQuestionVersions(id: string): Promise<QuestionVersion[]> {
  const res = await api.get(`/question-bank/versions/${id}`);
  return res.data.data;
}

export async function bulkImportQuestions(data: { questions: CreateQuestionData[] }): Promise<BulkImportResult> {
  const res = await api.post('/question-bank/bulk-import', data);
  return res.data.data;
}

export async function getQuestionBankStats(): Promise<QuestionBankStats> {
  const res = await api.get('/question-bank/stats');
  return res.data.data;
}
