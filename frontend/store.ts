import { create } from 'zustand';
import { chatService } from './services/chatService';
import { cohortService } from './services/cohortService';
import { documentService } from './services/documentService';
import { fileService } from './services/fileService';
import { projectService } from './services/projectService';
import { studentService } from './services/studentService';
import { taskService } from './services/taskService';
import { usageService } from './services/usageService';
import {
  Message,
  Document,
  LogEntry,
  Highlight,
  TaskVersion,
  ComparisonRow,
  TaskAContent,
  TaskCContent,
  Project,
  FieldWithEvidence,
  Cohort,
  Student,
  CohortMember,
  UsageRecord,
} from './types';
import { storeLogger } from './utils/logger';

interface AppState {
  projects: Project[];
  loadProjects: (cohortId?: string) => Promise<void>;
  activeProjectId: string | null;
  enterProject: (projectId: string) => Promise<void>;
  exitProject: () => void;
  saveProject: (meta: {
    id?: string;
    title: string;
    semester?: string;
    tags?: string[];
    task_config?: any;
    cohort_id?: string;
  }) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
  cohorts: Cohort[];
  loadCohorts: () => Promise<void>;
  createCohort: (payload: {
    name: string;
    code?: string;
    project_id?: string | null;
  }) => Promise<void>;
  updateCohort: (
    cohortId: string,
    payload: { name?: string; code?: string | null; project_id?: string | null }
  ) => Promise<void>;
  deleteCohort: (cohortId: string) => Promise<void>;
  cohortMembers: Record<string, CohortMember[]>;
  loadCohortMembers: (cohortId: string) => Promise<CohortMember[]>;
  addCohortMember: (cohortId: string, userId: string) => Promise<void>;
  removeCohortMember: (cohortId: string, userId: string) => Promise<void>;
  updateCohortMember: (
    cohortId: string,
    userId: string,
    payload: { status?: string; progress?: number }
  ) => Promise<void>;
  students: Student[];
  loadStudents: () => Promise<void>;
  createStudent: (payload: { email: string; name: string; password: string }) => Promise<void>;
  bulkCreateStudents: (payload: {
    startNo: number;
    endNo: number;
    namePrefix: string;
    emailPrefix: string;
    emailDomain: string;
    password: string;
    zeroPad?: number;
  }) => Promise<void>;
  joinCohortByCode: (code: string) => Promise<void>;
  updateStudent: (
    studentId: string,
    payload: { email?: string; name?: string; password?: string }
  ) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  usageRecords: UsageRecord[];
  loadUsageRecords: (filters: {
    cohortId?: string;
    projectId?: string;
    userId?: string;
  }) => Promise<UsageRecord[]>;

  // currentStepId: 已移除，改用固定的兩個任務

  documents: Document[];
  pdfCache: Record<string, { url: string; createdAt: number }>;
  currentDocId: string | null;
  loadDocuments: (projectId?: string | null) => Promise<void>;
  bindDocumentsToProject: (documentIds: string[], projectId: string) => Promise<void>;
  uploadDocument: (title: string, content: string) => Promise<void>;
  uploadFileDocument: (title: string, file: File) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  selectDocument: (docId: string) => void;
  addHighlight: (
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
  ) => Promise<void>;
  removeHighlight: (highlightId: string) => Promise<void>;
  updateHighlight: (
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
  ) => Promise<void>;
  removeAllHighlights: (docId: string) => Promise<void>;

  taskAVersions: TaskVersion[];
  taskBData: ComparisonRow[];
  taskCData: TaskCContent;

  logs: LogEntry[];
  chatMessages: Message[];
  chatTimeline: Message[]; // 完整的對話時間線
  currentWidgetState: Record<string, any>; // 各 Widget 的狀態（key: nodeId）
  activeEvidenceIds: string[]; // 當前選中的 Evidence IDs
  isAiThinking: boolean;
  isChatOpen: boolean;
  toggleChat: () => void;

  addLog: (eventType: string, details: any) => void;
  startFlow: () => void;

  submitTaskA: (docId: string, content: TaskAContent) => Promise<void>;
  updateTaskBRow: (
    index: number,
    field: keyof ComparisonRow | 'doc1Claim' | 'doc2Claim',
    value: any
  ) => void;
  addTaskBRow: () => void;
  removeTaskBRow: (index: number) => void;
  submitTaskBCheck: () => Promise<void>;
  updateTaskC: (field: keyof TaskCContent, value: FieldWithEvidence) => void;
  submitTaskCCheck: () => Promise<void>;
  exportData: () => void;
  getFileUrl: (objectKey: string) => Promise<string>;
  getCachedFileUrl: (objectKey: string) => Promise<string>;
  saveTaskState: () => Promise<void>;
  loadTaskState: (projectId: string) => Promise<void>;

  // Chat 相關方法
  addChatMessage: (message: Message) => void;
  updateWidgetState: (nodeId: string, widgetData: any) => void;
  sendCoachMessage: (message: string, context?: any) => Promise<void>;
  completeNode: (nodeId: string) => void;
  setActiveEvidenceIds: (ids: string[]) => void;
}

const genId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `node_${Date.now()}_${Math.random().toString(16).slice(2)}`;

// Debounce 函數用於自動保存
let saveTimeout: NodeJS.Timeout | null = null;
const debouncedSave = (saveFn: () => Promise<void>, delay: number = 1000) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveFn().catch((err: unknown) => storeLogger.error('自動保存失敗:', err));
    saveTimeout = null;
  }, delay);
};

export const useStore = create<AppState>((set, get) => ({
  projects: [],
  loadProjects: async (cohortId?: string) => {
    const projects = await projectService.loadProjects(cohortId);
    set({ projects });
  },
  cohorts: [],
  cohortMembers: {},
  students: [],
  usageRecords: [],
  loadCohorts: async () => {
    const data = await cohortService.loadCohorts();
    set({ cohorts: data });
  },
  createCohort: async (payload) => {
    const created = await cohortService.createCohort(payload);
    set((s) => ({ cohorts: [...s.cohorts, created] }));
  },
  updateCohort: async (cohortId, payload) => {
    const updated = await cohortService.updateCohort(cohortId, payload);
    set((s) => ({
      cohorts: s.cohorts.map((c) => (c.id === cohortId ? updated : c)),
    }));
  },
  deleteCohort: async (cohortId) => {
    await cohortService.deleteCohort(cohortId);
    set((s) => ({
      cohorts: s.cohorts.filter((c) => c.id !== cohortId),
      cohortMembers: Object.fromEntries(
        Object.entries(s.cohortMembers).filter(([k]) => k !== cohortId)
      ),
    }));
  },
  loadCohortMembers: async (cohortId) => {
    const members = await cohortService.loadCohortMembers(cohortId);
    set((s) => ({ cohortMembers: { ...s.cohortMembers, [cohortId]: members } }));
    return members;
  },
  addCohortMember: async (cohortId, userId) => {
    await cohortService.addCohortMember(cohortId, userId);
    await get().loadCohortMembers(cohortId);
    await get().loadCohorts();
  },
  removeCohortMember: async (cohortId, userId) => {
    await cohortService.removeCohortMember(cohortId, userId);
    await get().loadCohortMembers(cohortId);
    await get().loadCohorts();
  },
  updateCohortMember: async (cohortId, userId, payload) => {
    await cohortService.updateCohortMember(cohortId, userId, payload);
    await get().loadCohortMembers(cohortId);
  },
  loadStudents: async () => {
    const students = await studentService.loadStudents();
    set({ students });
  },
  createStudent: async (payload) => {
    const created = await studentService.createStudent(payload);
    set((s) => ({ students: [created, ...s.students] }));
  },
  bulkCreateStudents: async (payload) => {
    const created = await studentService.bulkCreateStudents({
      start_no: payload.startNo,
      end_no: payload.endNo,
      name_prefix: payload.namePrefix,
      email_prefix: payload.emailPrefix,
      email_domain: payload.emailDomain,
      password: payload.password,
      zero_pad: payload.zeroPad ?? 2,
    });
    set((s) => ({ students: [...created, ...s.students] }));
  },
  joinCohortByCode: async (code: string) => {
    await cohortService.joinCohortByCode(code);
    await get().loadCohorts();
  },
  updateStudent: async (studentId, payload) => {
    const updated = await studentService.updateStudent(studentId, payload);
    set((s) => ({ students: s.students.map((st) => (st.id === studentId ? updated : st)) }));
  },
  deleteStudent: async (studentId) => {
    await studentService.deleteStudent(studentId);
    set((s) => ({ students: s.students.filter((st) => st.id !== studentId) }));
  },
  loadUsageRecords: async (filters) => {
    const usage = await usageService.loadUsageRecords(filters);
    set({ usageRecords: usage });
    return usage;
  },
  saveProject: async (meta) => {
    const body = {
      title: meta.title,
      semester: meta.semester,
      tags: meta.tags || [],
      task_config: meta.task_config || {
        summary: { enabled: true, sections: [], guidance: '' },
        comparison: { enabled: true, dimensions: [], guidance: '' },
      },
      cohort_id: meta.cohort_id, // 新架構：專案屬於群組
    };

    let saved: Project;
    if (meta.id) {
      saved = await projectService.updateProject(meta.id, body);
    } else {
      saved = await projectService.saveProject(body);
    }
    set((s) => {
      const other = s.projects.filter((p) => p.id !== saved.id);
      return { projects: [...other, saved] };
    });
    return saved;
  },
  deleteProject: async (projectId: string) => {
    await projectService.deleteProject(projectId);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) }));
    // 若刪除的是目前進入的專案，重置流程狀態
    if (get().activeProjectId === projectId) {
      get().exitProject();
    }
  },
  activeProjectId: null,
  enterProject: async (projectId: string) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;

    set({
      activeProjectId: projectId,
      chatTimeline: [], // 重置對話時間線
      currentWidgetState: {}, // 重置 Widget 狀態
      activeEvidenceIds: [], // 重置選中的證據
      taskBData: [], // 重置 taskBData
    });

    await get().loadDocuments(projectId);
    // 載入保存的任務狀態
    await get().loadTaskState(projectId);
    // 載入對話歷史
    try {
      const chatHistory = await chatService.getChatHistory(projectId);
      set({ chatTimeline: chatHistory, chatMessages: chatHistory });
    } catch (error) {
      storeLogger.error('載入對話歷史失敗:', error);
      // 不拋出錯誤，繼續執行
    }
  },
  exitProject: () => set({ activeProjectId: null }),

  documents: [],
  pdfCache: {},
  currentDocId: null,
  loadDocuments: async (projectId?: string | null) => {
    const docs = await documentService.loadDocuments(projectId);
    set({ documents: docs, currentDocId: docs[0]?.id || null });
  },
  bindDocumentsToProject: async (documentIds: string[], projectId: string) => {
    await documentService.bindDocumentsToProject(documentIds, projectId);
    await get().loadDocuments(projectId);
  },
  unbindDocumentsFromProject: async (documentIds: string[], projectId: string) => {
    await documentService.unbindDocumentsFromProject(documentIds, projectId);
    await get().loadDocuments(projectId);
  },
  uploadDocument: async (title: string, content: string) => {
    const created = await documentService.uploadDocument(title, content);
    set((state) => ({ documents: [...state.documents, created], currentDocId: created.id }));
  },
  uploadFileDocument: async (title: string, file: File) => {
    const created = await documentService.uploadFileDocument(title, file);
    set((state) => ({ documents: [...state.documents, created], currentDocId: created.id }));
  },
  removeDocument: async (id: string) => {
    await documentService.removeDocument(id);
    set((state) => ({ documents: state.documents.filter((d) => d.id !== id), currentDocId: null }));
  },
  selectDocument: (docId: string) => set({ currentDocId: docId }),
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
  ) => {
    const res = await documentService.addHighlight(docId, text, options);
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === docId ? { ...d, highlights: [...(d.highlights || []), res as Highlight] } : d
      ),
    }));
  },
  removeHighlight: async (highlightId: string) => {
    await documentService.removeHighlight(highlightId);
    set((state) => ({
      documents: state.documents.map((d) => ({
        ...d,
        highlights: (d.highlights || []).filter((h) => h.id !== highlightId),
      })),
    }));
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
  ) => {
    const res = await documentService.updateHighlight(highlightId, payload);
    set((state) => {
      const updatedState = {
        documents: state.documents.map((d) => ({
          ...d,
          highlights: (d.highlights || []).map((h) => {
            if (h.id === highlightId) {
              return res;
            }
            return h;
          }),
        })),
      };
      return updatedState;
    });
    return res;
  },
  removeAllHighlights: async (docId: string) => {
    await documentService.removeAllHighlights(docId);
    set((state) => ({
      documents: state.documents.map((d) => (d.id === docId ? { ...d, highlights: [] } : d)),
    }));
  },

  taskAVersions: [],
  taskBData: [],
  taskCData: {
    c1_theme: { text: '', snippetIds: [] },
    c2_evidence: { text: '', snippetIds: [] },
    c3_boundary: { text: '', snippetIds: [] },
    c4_gap: { text: '', snippetIds: [] },
  },

  logs: [],
  chatMessages: [],
  chatTimeline: [],
  currentWidgetState: {},
  activeEvidenceIds: [],
  isAiThinking: false,
  isChatOpen: false,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

  addLog: (eventType, details) =>
    set((state) => ({
      logs: [...state.logs, { id: crypto.randomUUID(), timestamp: Date.now(), eventType, details }],
    })),

  startFlow: () => {
    // Flow navigation removed - fixed tasks used instead
  },

  // navigateNext 和 navigatePrev 已移除 - 使用固定的兩個任務代替

  submitTaskA: async (docId: string, content: TaskAContent) => {
    const state = get();
    if (!state.activeProjectId) throw new Error('尚未選擇專案');
    set({ isAiThinking: true, isChatOpen: true });
    try {
      const res = await taskService.submitTaskA(state.activeProjectId, docId, content);
      set((s) => {
        const nextVersion =
          (s.taskAVersions.filter((v) => v.targetDocId === docId).length || 0) + 1;
        const newVersion: TaskVersion = {
          id: res.id,
          projectId: state.activeProjectId!,
          targetDocId: docId,
          version: nextVersion,
          taskType: 'A',
          content,
          feedback: res.feedback,
          timestamp: Date.now(),
          isValid: res.is_valid,
          validationErrors: res.validation_errors || [],
        };
        return {
          isAiThinking: false,
          taskAVersions: [...s.taskAVersions, newVersion],
          chatMessages: [
            ...s.chatMessages,
            { id: crypto.randomUUID(), role: 'ai', content: res.feedback, timestamp: Date.now() },
          ],
        };
      });
    } catch (e: any) {
      set({ isAiThinking: false });
      throw e;
    }
  },

  updateTaskBRow: (index, field, value) => {
    set((state) => {
      const newData = [...state.taskBData];
      newData[index] = { ...newData[index], [field]: value } as any;
      return { taskBData: newData };
    });
    // 使用 debounce 自動保存
    debouncedSave(() => get().saveTaskState());
  },
  addTaskBRow: () =>
    set((state) => ({
      taskBData: [
        ...state.taskBData,
        {
          id: crypto.randomUUID(),
          dimension: '',
          doc1Id: '',
          doc1Claim: { text: '', snippetIds: [] },
          doc2Id: '',
          doc2Claim: { text: '', snippetIds: [] },
          similarity: '',
          difference: '',
        },
      ],
    })),
  removeTaskBRow: (index) =>
    set((state) => ({ taskBData: state.taskBData.filter((_, i) => i !== index) })),
  submitTaskBCheck: async () => {
    const state = get();
    if (!state.activeProjectId) throw new Error('尚未選擇專案');
    set({ isAiThinking: true, isChatOpen: true });
    try {
      const res = await taskService.submitTaskB(state.activeProjectId, state.taskBData);
      set((s) => {
        const newVersion: TaskVersion = {
          id: res.id,
          projectId: state.activeProjectId!,
          version: (s.taskAVersions.filter((v) => v.taskType === 'B').length || 0) + 1,
          taskType: 'B',
          content: state.taskBData,
          feedback: res.feedback,
          timestamp: Date.now(),
          isValid: res.is_valid,
          validationErrors: res.validation_errors || [],
        };
        return {
          isAiThinking: false,
          taskAVersions: [...s.taskAVersions, newVersion],
          chatMessages: [
            ...s.chatMessages,
            { id: crypto.randomUUID(), role: 'ai', content: res.feedback, timestamp: Date.now() },
          ],
        };
      });
    } catch (e) {
      set({ isAiThinking: false });
      throw e;
    }
  },

  updateTaskC: (field, value) => {
    set((state) => ({ taskCData: { ...state.taskCData, [field]: value } }));
    // 使用 debounce 自動保存
    debouncedSave(() => get().saveTaskState());
  },
  submitTaskCCheck: async () => {
    const state = get();
    if (!state.activeProjectId) throw new Error('尚未選擇專案');
    set({ isAiThinking: true, isChatOpen: true });
    try {
      const res = await taskService.submitTaskC(state.activeProjectId, state.taskCData);
      set((s) => {
        const newVersion: TaskVersion = {
          id: res.id,
          projectId: state.activeProjectId!,
          version: (s.taskAVersions.filter((v) => v.taskType === 'C').length || 0) + 1,
          taskType: 'C',
          content: state.taskCData,
          feedback: res.feedback,
          timestamp: Date.now(),
          isValid: res.is_valid,
          validationErrors: res.validation_errors || [],
        };
        return {
          isAiThinking: false,
          taskAVersions: [...s.taskAVersions, newVersion],
          chatMessages: [
            ...s.chatMessages,
            { id: crypto.randomUUID(), role: 'ai', content: res.feedback, timestamp: Date.now() },
          ],
        };
      });
    } catch (e) {
      set({ isAiThinking: false });
      throw e;
    }
  },

  exportData: () => {
    const state = get();
    const exportObj = {
      project: state.activeProjectId,
      tasks: { A: state.taskAVersions, B: state.taskBData, C: state.taskCData },
      documents: state.documents,
    };
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'thesis_data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  getFileUrl: async (objectKey: string) => {
    return fileService.getFileUrl(objectKey);
  },

  getCachedFileUrl: async (objectKey: string) => {
    const MAX_CACHE_ITEMS = 10;
    const state = get();
    const cached = state.pdfCache[objectKey];
    if (cached) {
      return cached.url;
    }

    const url = await state.getFileUrl(objectKey);

    // 將新項目加入快取，並在必要時清理最舊的項目
    set((s) => {
      const entries = Object.entries(s.pdfCache);
      let nextCache = { ...s.pdfCache, [objectKey]: { url, createdAt: Date.now() } };
      if (entries.length >= MAX_CACHE_ITEMS) {
        const [oldestKey] = entries.reduce(
          (acc, [key, value]) => (value.createdAt < acc[1].createdAt ? [key, value] : acc),
          entries[0] as [string, { url: string; createdAt: number }]
        );
        const { [oldestKey]: _removed, ...rest } = nextCache;
        nextCache = rest;
      }
      return { pdfCache: nextCache };
    });

    return url;
  },

  // Chat 相關方法
  addChatMessage: (message: Message) =>
    set((state) => ({
      chatTimeline: [...state.chatTimeline, message],
      chatMessages: [...state.chatMessages, message],
    })),

  updateWidgetState: (nodeId: string, widgetData: any) => {
    set((state) => ({
      currentWidgetState: { ...state.currentWidgetState, [nodeId]: widgetData },
    }));
    // 使用 debounce 自動保存
    debouncedSave(() => get().saveTaskState());
  },

  sendCoachMessage: async (message: string, context?: any) => {
    const state = get();
    if (!state.activeProjectId) {
      throw new Error('尚未選擇專案');
    }

    // 從消息中提取標記片段ID（匹配格式：[E8個字符]）
    const evidenceTokenRegex = /\[E([a-f0-9]{8})\]/g;
    const extractedEvidenceIds: string[] = [];
    const evidenceInfoMap: Record<string, any> = {};

    let match;
    while ((match = evidenceTokenRegex.exec(message)) !== null) {
      const shortId = match[1];
      // 在所有documents的highlights中查找匹配的ID（比較前8個字符）
      for (const doc of state.documents) {
        if (doc.highlights) {
          for (const highlight of doc.highlights) {
            if (highlight.id.substring(0, 8) === shortId) {
              extractedEvidenceIds.push(highlight.id);
              // 找到對應的文檔
              const document = state.documents.find((d) => d.id === highlight.document_id);
              evidenceInfoMap[highlight.id] = {
                id: highlight.id,
                name: highlight.name || null,
                snippet: highlight.snippet,
                page: highlight.page || null,
                document_title: document?.title || '未知文檔',
                document_id: highlight.document_id,
                object_key: document?.object_key || null,
              };
              break;
            }
          }
        }
      }
    }

    // 添加用戶訊息到時間線
    const userMessage: Message = {
      id: genId(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    get().addChatMessage(userMessage);

    set({ isAiThinking: true });
    try {
      const chatContext = {
        current_document_id: state.currentDocId, // RAG: 當前正在查看的文檔
        evidence_ids: state.activeEvidenceIds,
        evidence_info: evidenceInfoMap, // 新增：傳遞標記片段的完整信息
        widget_states: state.currentWidgetState,
        chat_history: state.chatTimeline.slice(-8), // 最近 8 條（與後端同步）
        ...context,
      };

      const res = await chatService.sendMessage(
        state.activeProjectId,
        'general', // 不再使用節點ID，使用通用標識符
        message,
        chatContext
      );

      const aiMessage: Message = {
        id: genId(),
        role: 'coach',
        content: res.message,
        timestamp: Date.now(),
      };

      get().addChatMessage(aiMessage);
    } catch (e: any) {
      const errorMessage: Message = {
        id: genId(),
        role: 'status',
        content: `錯誤：${e?.message || '無法連接到 AI 教練'}`,
        timestamp: Date.now(),
      };
      get().addChatMessage(errorMessage);
      throw e;
    } finally {
      set({ isAiThinking: false });
    }
  },

  completeNode: (_nodeId: string) => {
    const completeMessage: Message = {
      id: genId(),
      role: 'status',
      content: '節點已完成',
      timestamp: Date.now(),
    };
    get().addChatMessage(completeMessage);
    // Flow navigation removed - tasks are always available
  },

  setActiveEvidenceIds: (ids: string[]) => set({ activeEvidenceIds: ids }),

  initializeTaskBDataForNode: (nodeId: string, dimensions: string[]) => {
    if (!dimensions || dimensions.length === 0) {
      // 如果沒有 dimensions，使用預設值
      set({
        taskBData: [
          {
            id: genId(),
            dimension: '研究目的',
            doc1Id: '',
            doc1Claim: { text: '', snippetIds: [] },
            doc2Id: '',
            doc2Claim: { text: '', snippetIds: [] },
            similarity: '',
            difference: '',
          },
          {
            id: genId(),
            dimension: '研究方法',
            doc1Id: '',
            doc1Claim: { text: '', snippetIds: [] },
            doc2Id: '',
            doc2Claim: { text: '', snippetIds: [] },
            similarity: '',
            difference: '',
          },
        ],
      });
      return;
    }

    // 根據 dimensions 初始化 taskBData
    const newTaskBData = dimensions.map((dim) => ({
      id: genId(),
      dimension: dim.trim(),
      doc1Id: '',
      doc1Claim: { text: '', snippetIds: [] },
      doc2Id: '',
      doc2Claim: { text: '', snippetIds: [] },
      similarity: '',
      difference: '',
    }));

    set({ taskBData: newTaskBData });
  },

  saveTaskState: async () => {
    const state = get();
    if (!state.activeProjectId) return;

    try {
      const payload = {
        project_id: state.activeProjectId,
        summary_state: state.currentWidgetState['summary'] || {},
        comparison_state: state.taskBData || [],
      };
      await projectService.saveTaskState(state.activeProjectId, payload);
    } catch (error) {
      storeLogger.error('保存任務狀態失敗:', error);
      // 不拋出錯誤，避免影響用戶體驗
    }
  },

  loadTaskState: async (projectId: string) => {
    try {
      if (!projectService || typeof projectService.loadTaskState !== 'function') {
        storeLogger.error('projectService.loadTaskState is not available');
        return;
      }
      const taskState = await projectService.loadTaskState(projectId);
      if (taskState) {
        set({
          currentWidgetState: taskState.summary_state
            ? { summary: taskState.summary_state, comparison: {} }
            : {},
          taskBData: taskState.comparison_state || [],
        });
      }
    } catch (error) {
      storeLogger.error('載入任務狀態失敗:', error);
      // 不拋出錯誤，如果沒有保存的狀態就使用預設值
    }
  },
}));
