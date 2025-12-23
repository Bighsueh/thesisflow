import { api } from './api';
import { UsageRecord } from '../types';

export const usageService = {
  loadUsageRecords: async (filters: { cohortId?: string; projectId?: string; userId?: string }): Promise<UsageRecord[]> => {
    const params = new URLSearchParams();
    if (filters.cohortId) params.append('cohort_id', filters.cohortId);
    if (filters.projectId) params.append('project_id', filters.projectId);
    if (filters.userId) params.append('user_id', filters.userId);
    const query = params.toString();
    return api.get(`/api/usage${query ? `?${query}` : ''}`);
  },
  recordUsage: async (payload: { action: string; resource: string; metadata?: any }): Promise<void> => {
    return api.post('/api/usage', payload);
  },
};
