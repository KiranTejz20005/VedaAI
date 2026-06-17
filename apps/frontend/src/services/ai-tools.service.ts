import { apiClient } from './api.client';

export async function generateRubric(title: string) {
  const res = await apiClient.post<{ success: boolean; data: { title: string; criteria: any[] } }>('/ai-tools/rubric', { title });
  return res.data.data;
}

export async function generateLessonPlan(data: { topic: string; subject: string; grade: string; duration?: string }) {
  const res = await apiClient.post<{ success: boolean; data: any }>('/ai-tools/lesson-plan', data);
  return res.data.data;
}

export async function generateFeedback(data: { studentName: string; assignmentTitle?: string; strengths?: string[]; improvements?: string[]; tone?: string; customNotes?: string }) {
  const res = await apiClient.post<{ success: boolean; data: { feedback: string; studentName: string; tone: string } }>('/ai-tools/feedback', data);
  return res.data.data;
}

export async function generateDiagram(topic: string, type: string) {
  const res = await apiClient.post<{ success: boolean; data: { topic: string; type: string; diagram: string } }>('/ai-tools/diagram', { topic, type });
  return res.data.data;
}
