import { Student } from '../types';
import { api } from './api';

export const studentService = {
  loadStudents: async (): Promise<Student[]> => {
    return api.get('/api/students');
  },
  createStudent: async (payload: {
    email: string;
    name: string;
    password: string;
  }): Promise<Student> => {
    return api.post('/api/students', payload);
  },
  bulkCreateStudents: async (payload: {
    start_no: number;
    end_no: number;
    name_prefix: string;
    email_prefix: string;
    email_domain: string;
    password: string;
    zero_pad?: number;
  }): Promise<Student[]> => {
    return api.post('/api/students/bulk', payload);
  },
  updateStudent: async (
    studentId: string,
    payload: { email?: string; name?: string; password?: string }
  ): Promise<Student> => {
    return api.put(`/api/students/${studentId}`, payload);
  },
  deleteStudent: async (studentId: string): Promise<void> => {
    return api.delete(`/api/students/${studentId}`);
  },
};
