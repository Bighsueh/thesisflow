import { LearningTask } from '../types';
import { api } from './api';

export const learningTaskService = {
  loadLearningTasks: async (cohortId?: string): Promise<LearningTask[]> => {
    const params = cohortId ? `?cohort_id=${cohortId}` : '';
    return api.get(`/api/learning_tasks${params}`);
  },
  saveLearningTask: async (payload: any): Promise<LearningTask> => {
    return api.post('/api/learning_tasks', payload);
  },
  updateLearningTask: async (learningTaskId: string, payload: any): Promise<LearningTask> => {
    return api.put(`/api/learning_tasks/${learningTaskId}`, payload);
  },
  deleteLearningTask: async (learningTaskId: string): Promise<void> => {
    return api.delete(`/api/learning_tasks/${learningTaskId}`);
  },
  // 向後相容：舊版介面仍使用 projects 命名
  loadProjects: async (cohortId?: string): Promise<LearningTask[]> => {
    return learningTaskService.loadLearningTasks(cohortId);
  },
  saveProject: async (payload: any): Promise<LearningTask> => {
    return learningTaskService.saveLearningTask(payload);
  },
  updateProject: async (learningTaskId: string, payload: any): Promise<LearningTask> => {
    return learningTaskService.updateLearningTask(learningTaskId, payload);
  },
  deleteProject: async (learningTaskId: string): Promise<void> => {
    return learningTaskService.deleteLearningTask(learningTaskId);
  },
  // 舊的 workflow 端點 - 保留以向後相容
  loadWorkflowState: async (learningTaskId: string): Promise<any> => {
    return api.get(`/api/learning_tasks/${learningTaskId}/workflow`);
  },
  saveWorkflowState: async (learningTaskId: string, payload: any): Promise<any> => {
    return api.post(`/api/learning_tasks/${learningTaskId}/workflow`, payload);
  },
  // 新的簡化任務狀態端點
  loadTaskState: async (learningTaskId: string): Promise<any> => {
    return api.get(`/api/learning_tasks/${learningTaskId}/task-state`);
  },
  saveTaskState: async (learningTaskId: string, payload: any): Promise<any> => {
    return api.post(`/api/learning_tasks/${learningTaskId}/task-state`, payload);
  },
};
