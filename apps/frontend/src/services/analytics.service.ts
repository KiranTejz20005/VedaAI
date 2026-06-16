import { apiClient } from './api.client';

export interface DashboardStats {
  totals: {
    questions: number;
    assessments: number;
    pendingReviews: number;
  };
  bloomDistribution: Array<{ level: string; count: number }>;
  difficultyDistribution: Array<{ level: string; count: number }>;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<{ success: boolean; data: DashboardStats }>('/analytics/stats');
  return res.data.data;
}
