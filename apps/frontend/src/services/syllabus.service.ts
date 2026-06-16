import { apiClient, deduplicateRequest } from './api.client';
import type { Syllabus, SyllabusListResponse, SyllabusDetailResponse } from '@/types/syllabus.types';

export async function fetchSyllabuses(): Promise<Syllabus[]> {
  const res = await apiClient.get<SyllabusListResponse>('/syllabus');
  return res.data.data;
}

export async function fetchSyllabus(id: string): Promise<Syllabus> {
  return deduplicateRequest(`syllabus-${id}`, async () => {
    const res = await apiClient.get<SyllabusDetailResponse>(`/syllabus/${id}`);
    return res.data.data;
  });
}

export async function createSyllabus(data: { title: string; subject: string; grade: string }): Promise<Syllabus> {
  const res = await apiClient.post<{ success: boolean; data: Syllabus }>('/syllabus', data);
  return res.data.data;
}

export async function updateSyllabus(id: string, data: Partial<Syllabus>): Promise<Syllabus> {
  const res = await apiClient.put<{ success: boolean; data: Syllabus }>(`/syllabus/${id}`, data);
  return res.data.data;
}

export async function deleteSyllabus(id: string): Promise<void> {
  await apiClient.delete(`/syllabus/${id}`);
}
