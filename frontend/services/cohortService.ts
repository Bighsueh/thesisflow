import { Cohort, CohortMember } from '../types';
import { api } from './api';

export const cohortService = {
  loadCohorts: async (): Promise<Cohort[]> => {
    return api.get('/api/cohorts');
  },
  createCohort: async (payload: {
    name: string;
    code?: string;
    project_id?: string | null;
  }): Promise<Cohort> => {
    return api.post('/api/cohorts', payload);
  },
  updateCohort: async (
    cohortId: string,
    payload: { name?: string; code?: string | null; project_id?: string | null }
  ): Promise<Cohort> => {
    return api.put(`/api/cohorts/${cohortId}`, payload);
  },
  deleteCohort: async (cohortId: string): Promise<void> => {
    return api.delete(`/api/cohorts/${cohortId}`);
  },
  loadCohortMembers: async (cohortId: string): Promise<CohortMember[]> => {
    return api.get(`/api/cohorts/${cohortId}/members`);
  },
  addCohortMember: async (cohortId: string, userId: string): Promise<void> => {
    return api.post(`/api/cohorts/${cohortId}/members`, { user_id: userId });
  },
  removeCohortMember: async (cohortId: string, userId: string): Promise<void> => {
    return api.delete(`/api/cohorts/${cohortId}/members/${userId}`);
  },
  updateCohortMember: async (
    cohortId: string,
    userId: string,
    payload: { status?: string; progress?: number }
  ): Promise<void> => {
    return api.put(`/api/cohorts/${cohortId}/members/${userId}`, payload);
  },
  joinCohortByCode: async (code: string): Promise<void> => {
    return api.post('/api/cohorts/join', { code });
  },
};
