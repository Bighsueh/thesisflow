import { api } from './api';
import { TaskAContent } from '../types';

export const taskService = {
  submitTaskA: async (projectId: string, docId: string, content: TaskAContent): Promise<{ id: string; feedback: string; is_valid: boolean; validation_errors: string[] }> => {
    return api.post(`/api/projects/${projectId}/tasks/A`, { target_doc_id: docId, content });
  },
  submitTaskB: async (projectId: string, data: any): Promise<any> => {
    return api.post(`/api/projects/${projectId}/tasks/B`, data);
  },
  submitTaskC: async (projectId: string, data: any): Promise<any> => {
    return api.post(`/api/projects/${projectId}/tasks/C`, data);
  },
};
