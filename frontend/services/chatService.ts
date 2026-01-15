import { Message } from '../types';
import { api } from './api';

interface ChatMessageFromAPI {
  id: string;
  project_id: string;
  user_id: string;
  user_name?: string;
  role: string;
  content: string;
  context: any;
  created_at: number;
}

export const chatService = {
  sendMessage: async (
    projectId: string,
    stepId: string,
    message: string,
    context?: any
  ): Promise<Message> => {
    return api.post(`/api/projects/${projectId}/chat`, {
      project_id: projectId,
      node_id: stepId,
      message,
      context: context || {},
    });
  },
  getChatHistory: async (projectId: string, stepId?: string): Promise<Message[]> => {
    const data: ChatMessageFromAPI[] = await api.get(
      `/api/projects/${projectId}/chat${stepId ? `?step_id=${stepId}` : ''}`
    );
    // 轉換為前端的 Message 格式
    return data.map((msg) => ({
      id: msg.id,
      role: msg.role as any,
      content: msg.content,
      timestamp: msg.created_at,
      nodeId: msg.context?.node_id,
      evidenceIds: msg.context?.evidence_ids || [],
    }));
  },
};
