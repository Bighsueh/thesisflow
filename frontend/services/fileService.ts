import { api } from './api';

export const fileService = {
  uploadFile: async (file: File, path?: string): Promise<{ url: string; path: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (path) {
      formData.append('path', path);
    }
    const token = localStorage.getItem('thesisflow_token');
    const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:8000';
    const res = await fetch(`${API_BASE}/api/uploads`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json();
  },
  deleteFile: async (path: string): Promise<void> => {
    return api.delete(`/api/uploads?path=${encodeURIComponent(path)}`);
  },
  getFileUrl: async (objectKey: string): Promise<string> => {
    // 獲取 MinIO presigned URL 用於下載/預覽文件
    const response = await api.get(
      `/api/uploads/presign/get?object_key=${encodeURIComponent(objectKey)}`
    );
    // 後端返回 { download_url: string, url?: string }
    return response.download_url || response.url || '';
  },
};
