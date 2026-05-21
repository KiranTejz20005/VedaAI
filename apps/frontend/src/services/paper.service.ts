import { apiClient } from './api.client';
import type { GeneratedPaper } from '../types/paper.types';

export async function fetchPaper(assignmentId: string): Promise<GeneratedPaper> {
  const res = await apiClient.get<{ data: { paper: GeneratedPaper } }>(`/papers/${assignmentId}`);
  return res.data.data.paper;
}
