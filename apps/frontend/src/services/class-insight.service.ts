import { api } from '@/lib/api';

export const classInsightService = {
  generateProactiveInsights: async (subject: string) => {
    const response = await api.post('/insights/class', { subject });
    return response.data.data;
  },

  listReports: async () => {
    const response = await api.get('/insights/reports');
    return response.data.data;
  },
};
