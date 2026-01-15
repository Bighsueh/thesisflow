import { create } from 'zustand';

export interface UploadTask {
  id: string;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadStore {
  tasks: UploadTask[];
  addTask: (id: string, fileName: string) => void;
  updateProgress: (id: string, progress: number) => void;
  setStatus: (id: string, status: UploadTask['status'], error?: string) => void;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  tasks: [],

  addTask: (id: string, fileName: string) => {
    set((state) => ({
      tasks: [...state.tasks, { id, fileName, progress: 0, status: 'pending' }],
    }));
  },

  updateProgress: (id: string, progress: number) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, progress, status: 'uploading' } : task
      ),
    }));
  },

  setStatus: (id: string, status: UploadTask['status'], error?: string) => {
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? { ...task, status, error } : task)),
    }));
  },

  removeTask: (id: string) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));
  },

  clearCompleted: () => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.status !== 'success'),
    }));
  },

  clearAll: () => {
    set({ tasks: [] });
  },
}));
