import { Document, Highlight, RagProcessingLog } from '../types';
import { api } from './api';

export const documentService = {
  loadDocuments: async (projectId?: string | null): Promise<Document[]> => {
    const endpoint = projectId ? `/api/documents?project_id=${projectId}` : '/api/documents';
    return api.get(endpoint);
  },
  // 取得單一文檔（用於輪詢 RAG 狀態，避免載入所有文檔）
  getDocument: async (docId: string): Promise<Document> => {
    return api.get(`/api/documents/${docId}`);
  },
  bindDocumentsToProject: async (documentIds: string[], projectId: string): Promise<void> => {
    return api.post(`/api/documents/bind`, { document_ids: documentIds, project_id: projectId });
  },
  unbindDocumentsFromProject: async (documentIds: string[], projectId: string): Promise<void> => {
    return api.post(`/api/documents/unbind`, { document_ids: documentIds, project_id: projectId });
  },
  uploadDocument: async (title: string, content: string): Promise<Document> => {
    return api.post('/api/documents', { title, content });
  },
  uploadFileDocument: async (title: string, file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    const token = localStorage.getItem('thesisflow_token');
    const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:8000';
    const res = await fetch(`${API_BASE}/api/documents/upload`, {
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
