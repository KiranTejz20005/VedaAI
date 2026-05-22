import { apiClient, deduplicateRequest } from './api.client';
import type { Assignment } from '../types/assignment.types';
import type { CreateAssignmentFormValues } from '../schemas/create-assignment.schema';

export interface AssignmentListResponse {
  data: Assignment[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function fetchAssignments(
  page = 1,
  limit = 10,
  status?: string
): Promise<AssignmentListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  const res = await apiClient.get<AssignmentListResponse>(`/assignments?${params}`);
  return res.data;
}

export async function fetchAssignment(id: string): Promise<Assignment> {
  return deduplicateRequest(`fetch-assignment-${id}`, async () => {
    const res = await apiClient.get<{ data: { assignment: Assignment } }>(`/assignments/${id}`);
    return res.data.data.assignment;
  });
}

export async function createAssignment(
  data: CreateAssignmentFormValues & { typeBreakdown?: string },
  files: File[]
): Promise<{ assignment: Assignment; jobId: string }> {
  const formData = new FormData();

  formData.append('title', data.title);
  formData.append('subject', data.subject);
  formData.append('description', data.description ?? '');
  formData.append('dueDate', data.dueDate);
  formData.append('duration', String(data.duration));
  formData.append('totalMarks', String(data.totalMarks));
  formData.append('questionConfig', JSON.stringify(data.questionConfig));
  formData.append('additionalInstructions', data.additionalInstructions ?? '');
  if (data.typeBreakdown) {
    formData.append('typeBreakdown', data.typeBreakdown);
  }

  files.forEach((file) => formData.append('files', file));

  const res = await apiClient.post<{ data: { assignment: Assignment; jobId: string } }>(
    '/assignments',
    formData,
    { headers: { 'Content-Type': null as unknown as string } }
  );
  return res.data.data;
}

export async function deleteAssignment(id: string): Promise<void> {
  await apiClient.delete(`/assignments/${id}`);
}

export async function generateAssignment(id: string): Promise<{ jobId: string; position: number }> {
  const res = await apiClient.post<{ data: { jobId: string; position: number } }>(`/assignments/${id}/generate`);
  return res.data.data;
}

export interface JobStatusResponse {
  status: string;
  progress: number;
  error?: string | null;
}

export async function fetchJobStatus(id: string): Promise<JobStatusResponse | null> {
  return deduplicateRequest(`job-status-${id}`, async () => {
    const res = await apiClient.get<{ success: boolean; data: JobStatusResponse }>(`/papers/job/${id}`);
    return res.data.data;
  });
}
