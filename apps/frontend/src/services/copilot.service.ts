import { api } from '@/lib/api';

export interface LessonPlanRequest {
  subject: string;
  topic: string;
  duration: number;
  learningOutcomes?: string[];
}

export interface CopilotWorkflowRequest {
  workflowName: string;
  tasks: any[];
}

export const copilotService = {
  getLessonPlans: async () => {
    const response = await api.get('/copilot/lesson-plans');
    return response.data.data;
  },

  generateLessonPlan: async (data: LessonPlanRequest) => {
    const response = await api.post('/copilot/lesson-plan', data);
    return response.data.data;
  },

  deleteLessonPlan: async (id: string) => {
    const response = await api.delete(`/copilot/lesson-plan/${id}`);
    return response.data;
  },

  executeWorkflow: async (data: CopilotWorkflowRequest) => {
    const response = await api.post('/copilot/workflow', data);
    return response.data.data;
  },

  listWorkflows: async () => {
    const response = await api.get('/copilot/workflows');
    return response.data.data;
  },
};
