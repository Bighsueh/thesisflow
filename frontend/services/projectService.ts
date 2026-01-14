import { Project } from '../types';
import { api } from './api';

export const projectService = {
  loadProjects: async (cohortId?: string): Promise<Project[]> => {
    const params = cohortId ? `?cohort_id=${cohortId}` : '';
    return api.get(`/api/projects${params}`);
  },
  saveProject: async (payload: any): Promise<Project> => {
    return api.post('/api/projects', payload);
  },
  updateProject: async (projectId: string, payload: any): Promise<Project> => {
    return api.put(`/api/projects/${projectId}`, payload);
  },
  deleteProject: async (projectId: string): Promise<void> => {
    return api.delete(`/api/projects/${projectId}`);
  },
  // 舊的 workflow 端點 - 保留以向後相容
  loadWorkflowState: async (projectId: string): Promise<any> => {
    return api.get(`/api/projects/${projectId}/workflow`);
  },
  saveWorkflowState: async (projectId: string, payload: any): Promise<any> => {
    return api.post(`/api/projects/${projectId}/workflow`, payload);
  },
  // 新的簡化任務狀態端點
  loadTaskState: async (projectId: string): Promise<any> => {
    return api.get(`/api/projects/${projectId}/task-state`);
  },
  saveTaskState: async (projectId: string, payload: any): Promise<any> => {
    return api.post(`/api/projects/${projectId}/task-state`, payload);
  },
};
