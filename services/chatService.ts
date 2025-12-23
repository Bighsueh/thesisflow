import { api } from './api';
import { Message } from '../types';

export const chatService = {
  sendMessage: async (projectId: string, stepId: string, message: string, context?: any): Promise<Message> => {
    return api.post(`/api/projects/${projectId}/chat`, { 
      project_id: projectId,
      node_id: stepId, 
      message, 
      context: context || {} 
    });
  },
  getChatHistory: async (projectId: string, stepId: string): Promise<Message[]> => {
    return api.get(`/api/projects/${projectId}/chat?step_id=${stepId}`);
  },
};
