import { apiClient } from './api.client';
import type { GeneratedPaper } from '../types/paper.types';

export async function fetchPaper(assignmentId: string): Promise<GeneratedPaper> {
  const res = await apiClient.get<{ data: GeneratedPaper }>(`/papers/assignment/${assignmentId}`);
  return res.data.data;
}

export async function fetchJobStatus(assignmentId: string) {
  const res = await apiClient.get<{ data: { status: string; progress: number } }>(
    `/papers/job/${assignmentId}`
  );
  return res.data.data;
}
