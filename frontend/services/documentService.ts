import { Document, Highlight, RagProcessingLog } from '../types';
import { api } from './api';

export const documentService = {
  loadDocuments: async (projectId?: string | null): Promise<Document[]> => {
    const endpoint = projectId ? `/api/documents?learning_task_id=${projectId}` : '/api/documents';
    return api.get(endpoint);
  },
  // 取得單一文檔（用於輪詢 RAG 狀態，避免載入所有文檔）
  getDocument: async (docId: string): Promise<Document> => {
    return api.get(`/api/documents/${docId}`);
  },
  bindDocumentsToProject: async (documentIds: string[], projectId: string): Promise<void> => {
    return api.post(`/api/documents/bind`, {
      document_ids: documentIds,
      learning_task_id: projectId,
    });
  },
  unbindDocumentsFromProject: async (documentIds: string[], projectId: string): Promise<void> => {
    return api.post(`/api/documents/unbind`, {
      document_ids: documentIds,
      learning_task_id: projectId,
    });
  },
  uploadDocument: async (title: string, content: string): Promise<Document> => {
    return api.post('/api/documents', { title, content });
  },
  uploadFileDocument: async (
    title: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Document> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem('thesisflow_token');
      const API_BASE =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:8000';

      // 追蹤上傳進度
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      // 上傳完成
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (_e) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`API Error: ${xhr.statusText}`));
        }
      };

      // 上傳錯誤
      xhr.onerror = () => {
        reject(new Error('Network error occurred'));
      };

      // 上傳中止
      xhr.onabort = () => {
        reject(new Error('Upload aborted'));
      };

      xhr.open('POST', `${API_BASE}/api/documents/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  },
  getRagLogs: async (docId: string): Promise<RagProcessingLog[]> => {
    return api.get(`/api/documents/${docId}/rag-logs`);
  },
  removeDocument: async (id: string): Promise<void> => {
    return api.delete(`/api/documents/${id}`);
  },
  addHighlight: async (
    docId: string,
    text: string,
    options?: {
      name?: string;
      page?: number;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      evidence_type?: string;
    }
  ): Promise<Highlight> => {
    return api.post(`/api/documents/${docId}/highlights`, { snippet: text, ...options });
  },
  removeHighlight: async (highlightId: string): Promise<void> => {
    return api.delete(`/api/highlights/${highlightId}`);
  },
  updateHighlight: async (
    highlightId: string,
    payload: {
      snippet?: string;
      name?: string;
      page?: number;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      evidence_type?: string;
    }
  ): Promise<Highlight> => {
    return api.put(`/api/highlights/${highlightId}`, payload);
  },
  removeAllHighlights: async (docId: string): Promise<void> => {
    return api.delete(`/api/documents/${docId}/highlights`);
  },
};
