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
  generateLessonPlan: async (data: LessonPlanRequest) => {
    const response = await api.post('/copilot/lesson-plan', data);
    return response.data.data;
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
