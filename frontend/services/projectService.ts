import { Project } from '../types';
import { api } from './api';

export const projectService = {
  loadProjects: async (): Promise<Project[]> => {
    return api.get('/api/projects');
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
  loadWorkflowState: async (projectId: string): Promise<any> => {
    return api.get(`/api/projects/${projectId}/workflow`);
  },
  saveWorkflowState: async (projectId: string, payload: any): Promise<any> => {
    return api.post(`/api/projects/${projectId}/workflow`, payload);
  },
};
