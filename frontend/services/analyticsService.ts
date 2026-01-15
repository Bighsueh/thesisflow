import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// 類型定義
export interface OverviewStats {
  totalStudents: number;
  activeToday: number;
  totalHighlights: number;
  avgProgress: number;
}

export interface TaskMatrixStudent {
  id: string;
  name: string;
  email: string;
  summaryStatus: 'not_started' | 'in_progress' | 'nearly_complete' | 'complete';
  comparisonStatus: 'not_started' | 'in_progress' | 'nearly_complete' | 'complete';
  lastActive: number | null;
}

export interface TaskMatrix {
  students: TaskMatrixStudent[];
}

export interface WordCloudWord {
  text: string;
  value: number;
}

export interface WordCloudData {
  words: WordCloudWord[];
  error?: string;
}

export interface ActivityTrendDay {
  date: string;
  taskEdits: number;
  highlightsCreated: number;
  chatMessages: number;
}

export interface ActivityTrend {
  daily: ActivityTrendDay[];
  period: '7d' | '30d' | 'all';
}

export interface EvidenceStats {
  total: number;
  byType: {
    Purpose: number;
    Method: number;
    Findings: number;
    Limitation: number;
    Other: number;
  };
}

export interface DocumentUsageItem {
  id: string;
  title: string;
  highlightCount: number;
  ragStatus: string;
}

export interface DocumentUsage {
  documents: DocumentUsageItem[];
}

export interface PageHeatmapPage {
  page: number;
  highlightCount: number;
  intensity: number;
}

export interface PageHeatmap {
  documentId: string;
  documentTitle: string;
  pages: PageHeatmapPage[];
}

export interface EditingDepthStudent {
  studentName: string;
  summaryWordCount: number;
  comparisonRows: number;
  totalEvidenceUsed: number;
  lastEditAt: number | null;
}

export interface EditingDepth {
  students: EditingDepthStudent[];
}

export interface FeedbackSuggestion {
  keyword: string;
  count: number;
}

export interface RecentFeedback {
  studentName: string;
  taskType: string;
  feedbackPreview: string;
  timestamp: number;
}

export interface FeedbackSummary {
  commonSuggestions: FeedbackSuggestion[];
  recentFeedbacks: RecentFeedback[];
}

export interface ActivityTimelineHour {
  hour: number;
  count: number;
}

export interface ActivityTimeline {
  hourly: ActivityTimelineHour[];
}

export interface ComparisonDimension {
  name: string;
  usageCount: number;
}

export interface ComparisonDimensions {
  dimensions: ComparisonDimension[];
}

export interface ChatLogMessage {
  id: string;
  learning_task_id: string;
  project_title: string;
  user_id: string;
  user_name: string;
  role: string;
  content: string;
  context: any;
  created_at: number;
}

export interface ChatLogs {
  messages: ChatLogMessage[];
  total: number;
}

// API 服務
export const analyticsService = {
  // 區塊 1: 總覽統計
  getOverview: async (cohortId: string): Promise<OverviewStats> => {
    const token = localStorage.getItem('thesisflow_token');
    const response = await axios.get(`${API_BASE}/api/analytics/${cohortId}/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // 區塊 2: 任務進度矩陣
  getTaskMatrix: async (cohortId: string): Promise<TaskMatrix> => {
    const token = localStorage.getItem('thesisflow_token');
    const response = await axios.get(`${API_BASE}/api/analytics/${cohortId}/task-matrix`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // 區塊 3: 文字雲
  getWordCloud: async (cohortId: string, documentId?: string): Promise<WordCloudData> => {
    const token = localStorage.getItem('thesisflow_token');
    const params = documentId ? { document_id: documentId } : {};
    const response = await axios.get(`${API_BASE}/api/analytics/${cohortId}/word-cloud`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  },

  // 區塊 4: 學生活動趨勢
  getActivityTrend: async (
    cohortId: string,
    period: '7d' | '30d' | 'all' = '7d'
  ): Promise<ActivityTrend> => {
    const token = localStorage.getItem('thesisflow_token');
    const response = await axios.get(`${API_BASE}/api/analytics/${cohortId}/activity-trend`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { period },
    });
    return response.data;
  },

  // 區塊 5: Evidence 標記統計
  getEvidenceStats: async (cohortId: string): Promise<EvidenceStats> => {
    const token = localStorage.getItem('thesisflow_token');
    const response = await axios.get(`${API_BASE}/api/analytics/${cohortId}/evidence-stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // 區塊 6: 文獻使用熱度
  getDocumentUsage: async (cohortId: string): Promise<DocumentUsage> => {
    const token = localStorage.getItem('thesisflow_token');
    const response = await axios.get(`${API_BASE}/api/analytics/${cohortId}/document-usage`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // 區塊 7: 頁碼熱力圖
  getPageHeatmap: async (cohortId: string, documentId: string): Promise<PageHeatmap> => {
    const token = localStorage.getItem('thesisflow_token');
    const response = await axios.get(
      `${API_BASE}/api/analytics/${cohortId}/page-heatmap/${documentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // 區塊 8: 編輯深度分析
  getEditingDepth: async (cohortId: string): Promise<EditingDepth> => {
    const token = localStorage.getItem('thesisflow_token');
    const response = await axios.get(`${API_BASE}/api/analytics/${cohortId}/editing-depth`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // 區塊 9: AI 回饋摘要
  getFeedbackSummary: async (cohortId: string): Promise<FeedbackSummary> => {
    const token = localStorage.getItem('thesisflow_token');
    const response = await axios.get(`${API_BASE}/api/analytics/${cohortId}/feedback-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // 區塊 10: 活動時間分布
  getActivityTimeline: async (cohortId: string, days: number = 30): Promise<ActivityTimeline> => {
    const token = localStorage.getItem('thesisflow_token');
    const response = await axios.get(`${API_BASE}/api/analytics/${cohortId}/activity-timeline`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { days },
    });
    return response.data;
  },

  // 區塊 11: 比較維度分析
  getComparisonDimensions: async (cohortId: string): Promise<ComparisonDimensions> => {
    const token = localStorage.getItem('thesisflow_token');
    const response = await axios.get(
      `${API_BASE}/api/analytics/${cohortId}/comparison-dimensions`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // 對話記錄
  getChatLogs: async (
    cohortId: string,
    options?: {
      studentId?: string;
      projectId?: string;
      limit?: number;
    }
  ): Promise<ChatLogs> => {
    const token = localStorage.getItem('thesisflow_token');
    const params: any = {};
    if (options?.studentId) params.student_id = options.studentId;
    if (options?.projectId) params.learning_task_id = options.projectId;
    if (options?.limit) params.limit = options.limit;

    const response = await axios.get(`${API_BASE}/api/analytics/${cohortId}/chat-logs`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  },
};
