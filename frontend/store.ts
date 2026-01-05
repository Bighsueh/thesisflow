import {
  Edge,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  getOutgoers,
  getIncomers,
} from 'reactflow';
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
  AppNode,
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

interface AppState {
  nodes: AppNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  addNode: (node: AppNode) => void;
  updateNodeData: (id: string, data: any) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  projects: Project[];
  loadProjects: () => Promise<void>;
  activeProjectId: string | null;
  enterProject: (projectId: string) => Promise<void>;
  exitProject: () => void;
  saveProject: (meta: {
    id?: string;
    title: string;
    semester?: string;
    tags?: string[];
  }) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
  ensureSingleStartNode: () => void;
  appendStageNode: (
    nodeType: 'resource' | 'task_summary' | 'task_comparison' | 'task_synthesis',
    position?: { x: number; y: number }
  ) => void;
  deleteNodeById: (id: string) => void;
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

  currentStepId: string | null;

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
  navigateNext: () => void;
  navigatePrev: () => void;

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
  initializeTaskBDataForNode: (nodeId: string, dimensions: string[]) => void;
  saveWorkflowState: () => Promise<void>;
  loadWorkflowState: (projectId: string) => Promise<void>;

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
    saveFn().catch(console.error);
    saveTimeout = null;
  }, delay);
};

export const useStore = create<AppState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) as AppNode[] }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
  setNodes: (nodes) => set({ nodes }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNodeData: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    })),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  projects: [],
  loadProjects: async () => {
    const projects = await projectService.loadProjects();
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
    const state = get();
    // 去除重複 id 的節點並且確保僅有一個 start 節點，避免 DB 主鍵衝突
    const seenIds = new Set<string>();
    let startKept = false;
    const uniqueNodes: AppNode[] = [];
    for (const n of state.nodes) {
      if (seenIds.has(n.id)) continue;
      if (n.type === 'startNode' || n.data?.type === 'start') {
        if (startKept) continue;
        startKept = true;
      }
      seenIds.add(n.id);
      uniqueNodes.push(n);
    }

    const nodesPayload = uniqueNodes.map((n) => ({
      id: n.id,
      type: (n.data.type || 'resource') as any,
      label: n.data.label,
      config: n.data.config,
      position: n.position,
    }));
    const edgesPayload = state.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: e.data,
    }));
    const body = JSON.stringify({
      title: meta.title,
      semester: meta.semester,
      tags: meta.tags || [],
      nodes: nodesPayload,
      edges: edgesPayload,
    });

    let saved: Project;
    if (meta.id) {
      saved = await projectService.updateProject(meta.id, JSON.parse(body));
    } else {
      saved = await projectService.saveProject(JSON.parse(body));
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
  ensureSingleStartNode: () => {
    set((state) => {
      const nodeIdsToKeep = new Set<string>();
      const filteredNodes: AppNode[] = [];
      let startNode: AppNode | null = null;
      let endNode: AppNode | null = null;
      for (const n of state.nodes) {
        if (nodeIdsToKeep.has(n.id)) continue;
        const isStart = n.type === 'startNode' || (n as any).data?.type === 'start';
        const isEnd = (n as any).data?.type === 'end' || n.type === 'endNode';
        if (isStart) {
          if (startNode) continue;
          startNode = n;
        }
        if (isEnd) {
          if (endNode) continue;
          endNode = n;
        }
        nodeIdsToKeep.add(n.id);
        filteredNodes.push(n);
      }

      // 若缺少 start / end，自動補上
      if (!startNode) {
        startNode = {
          id: genId(),
          type: 'startNode',
          position: { x: 240, y: 80 },
          data: { label: '開始', type: 'start' as any, config: {} },
        } as AppNode;
        filteredNodes.unshift(startNode);
      }
      if (!endNode) {
        endNode = {
          id: genId(),
          type: 'endNode' as any,
          position: { x: 240, y: 200 },
          data: { label: '結束流程', type: 'end' as any, config: {} },
        } as AppNode;
        filteredNodes.push(endNode);
      }

      nodeIdsToKeep.add(startNode.id);
      nodeIdsToKeep.add(endNode.id);

      // 僅保留有效節點的 edges，並去除重複 source-target
      const edgeSeen = new Set<string>();
      const filteredEdges = state.edges.filter((e) => {
        if (!nodeIdsToKeep.has(e.source) || !nodeIdsToKeep.has(e.target)) return false;
        const key = `${e.source}->${e.target}`;
        if (edgeSeen.has(key)) return false;
        edgeSeen.add(key);
        return true;
      });

      // 僅在「只有 start 與 end 兩個節點」時才強制建立 start -> end 連線
      const middleCount = filteredNodes.filter(
        (n) =>
          n.id !== startNode!.id &&
          n.id !== endNode!.id &&
          (n as any).data?.type !== 'start' &&
          (n as any).data?.type !== 'end'
      ).length;
      if (middleCount === 0) {
        const hasStartEnd = filteredEdges.some(
          (e) => e.source === startNode!.id && e.target === endNode!.id
        );
        if (!hasStartEnd) {
          filteredEdges.push({ id: genId(), source: startNode.id, target: endNode.id, data: {} });
        }
      }

      return {
        nodes: filteredNodes,
        edges: filteredEdges,
        currentStepId:
          state.currentStepId && nodeIdsToKeep.has(state.currentStepId)
            ? state.currentStepId
            : filteredNodes.find((n) => n.type === 'startNode')?.id || filteredNodes[0]?.id || null,
      };
    });
  },
  appendStageNode: (nodeType, position) =>
    set((state) => {
      // 僅允許一般階段型節點
      if (!['resource', 'task_summary', 'task_comparison', 'task_synthesis'].includes(nodeType)) {
        return state;
      }

      const nodes = [...state.nodes];
      let edges = [...state.edges];

      let startNode =
        nodes.find((n) => n.type === 'startNode' || (n as any).data?.type === 'start') || null;
      let endNode =
        nodes.find((n) => n.type === 'endNode' || (n as any).data?.type === 'end') || null;

      // 若尚未有 start/end，先建立基本骨架
      if (!startNode) {
        startNode = {
          id: genId(),
          type: 'startNode',
          position: { x: 120, y: 80 },
          data: { label: '開始', type: 'start' as any, config: {} },
        } as AppNode;
        nodes.push(startNode);
      }
      if (!endNode) {
        endNode = {
          id: genId(),
          type: 'endNode' as any,
          position: { x: 520, y: 80 },
          data: { label: '結束', type: 'end' as any, config: {} },
        } as AppNode;
        nodes.push(endNode);
        edges.push({ id: genId(), source: startNode.id, target: endNode.id, data: {} });
      }

      // 找到目前接到 end 的節點，作為插入點；若沒有，使用 start
      const edgeToEnd = edges.find((e) => e.target === endNode!.id);
      const tailNode = (edgeToEnd && nodes.find((n) => n.id === edgeToEnd.source)) || startNode!;

      // 移除 tail -> end 的連線
      edges = edges.filter((e) => !(e.source === tailNode.id && e.target === endNode!.id));

      const basePos = position || {
        x: (tailNode.position.x + endNode!.position.x) / 2,
        y: tailNode.position.y + 140,
      };

      const newNodeData: any = { label: '', type: nodeType, config: {} };
      if (nodeType === 'resource') {
        newNodeData.label = '閱讀引導';
        newNodeData.config = { guidance: '請閱讀相關文獻...', minEvidence: 0 };
      }
      if (nodeType === 'task_summary') {
        newNodeData.label = '任務：摘要';
        newNodeData.config = {
          minWords: 150,
          guidance: '請撰寫摘要...',
          sections: [
            {
              key: 'a1_purpose',
              label: 'A1 研究目的 (Purpose)',
              placeholder: '研究問題為何？',
              minEvidence: 1,
            },
            {
              key: 'a2_method',
              label: 'A2 研究方法 (Method)',
              placeholder: '採用了什麼方法？',
              minEvidence: 1,
            },
            {
              key: 'a3_findings',
              label: 'A3 主要發現 (Findings)',
              placeholder: '核心結論為何？',
              minEvidence: 1,
            },
            {
              key: 'a4_limitations',
              label: 'A4 研究限制 (Limitations)',
              placeholder: '作者自述或觀察到的限制...',
              minEvidence: 1,
            },
          ],
        };
      }
      if (nodeType === 'task_comparison') {
        newNodeData.label = '任務：比較';
        newNodeData.config = { dimensions: ['研究目的', '研究方法', '主要發現'], minEvidence: 1 };
      }
      if (nodeType === 'task_synthesis') {
        newNodeData.label = '任務：綜合';
        newNodeData.config = { minEvidence: 1 };
      }

      const newNode: AppNode = {
        id: genId(),
        type:
          nodeType === 'resource'
            ? 'resourceNode'
            : nodeType === 'task_summary'
              ? 'summaryNode'
              : nodeType === 'task_comparison'
                ? 'comparisonNode'
                : 'synthesisNode',
        position: basePos,
        data: newNodeData,
      };

      nodes.push(newNode);
      edges.push({ id: genId(), source: tailNode.id, target: newNode.id, data: {} });
      edges.push({ id: genId(), source: newNode.id, target: endNode!.id, data: {} });

      return { ...state, nodes, edges };
    }),
  deleteNodeById: (id: string) =>
    set((state) => {
      const node = state.nodes.find((n) => n.id === id);
      if (!node) return state;
      const t = (node as any).data?.type;
      // start / end 不允許刪除
      if (t === 'start' || t === 'end') return state;

      const incoming = state.edges.filter((e) => e.target === id);
      const outgoing = state.edges.filter((e) => e.source === id);
      const edges = state.edges.filter((e) => e.source !== id && e.target !== id);

      if (incoming.length > 0 && outgoing.length > 0) {
        const src = incoming[0].source;
        const tgt = outgoing[0].target;
        if (src !== tgt && !edges.some((e) => e.source === src && e.target === tgt)) {
          edges.push({ id: genId(), source: src, target: tgt, data: {} });
        }
      }

      const nodes = state.nodes.filter((n) => n.id !== id);
      const currentStepId =
        state.currentStepId === id
          ? nodes.find((n) => n.type === 'startNode')?.id || nodes[0]?.id || null
          : state.currentStepId;

      return { ...state, nodes, edges, currentStepId };
    }),
  activeProjectId: null,
  enterProject: async (projectId: string) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;

    // 根據節點類型提供繁體中文預設 label
    const getDefaultLabel = (nodeType: string, currentLabel?: string): string => {
      // 如果已有 label 且不是英文預設值，則使用現有 label
      if (currentLabel && !currentLabel.match(/^New (resource|task_)/i)) {
        return currentLabel;
      }
      // 否則根據類型返回繁體中文預設值
      switch (nodeType) {
        case 'start':
          return '開始';
        case 'end':
          return '結束流程';
        case 'resource':
          return '閱讀引導';
        case 'task_summary':
          return '任務：摘要';
        case 'task_comparison':
          return '任務：比較';
        case 'task_synthesis':
          return '任務：綜合';
        default:
          return currentLabel || '未命名節點';
      }
    };

    const nodes: AppNode[] = project.nodes.map((n) => {
      const defaultLabel = getDefaultLabel(n.type, n.label);
      // 如果 config 中的 guidance 是英文預設值，也替換成繁體中文
      let config = n.config || {};
      if (n.type === 'resource' && (!config.guidance || config.guidance.match(/^Please read/i))) {
        config = { ...config, guidance: '請閱讀相關文獻...' };
      }
      if (n.type === 'task_summary' && (!config.guidance || config.guidance.match(/^Summarize/i))) {
        config = { ...config, guidance: '請撰寫摘要...' };
      }
      // 如果 dimensions 是英文，替換成繁體中文
      if (n.type === 'task_comparison' && config.dimensions) {
        const dimensionMap: Record<string, string> = {
          Purpose: '研究目的',
          Method: '研究方法',
          Result: '主要發現',
          Findings: '主要發現',
        };
        config = {
          ...config,
          dimensions: config.dimensions.map((d: string) => dimensionMap[d] || d),
        };
      }

      return {
        id: n.id,
        type:
          n.type === 'start'
            ? 'startNode'
            : n.type === 'end'
              ? 'endNode'
              : n.type === 'resource'
                ? 'resourceNode'
                : n.type === 'task_summary'
                  ? 'summaryNode'
                  : n.type === 'task_comparison'
                    ? 'comparisonNode'
                    : n.type === 'task_synthesis'
                      ? 'synthesisNode'
                      : 'default',
        position: {
          x: (n.position as any)?.x ?? 0,
          y: (n.position as any)?.y ?? 0,
        },
        data: { label: defaultLabel, type: n.type as any, config },
      };
    });
    const edges: Edge[] = project.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: e.data,
    }));
    set({
      activeProjectId: projectId,
      nodes,
      edges,
      chatTimeline: [], // 重置對話時間線
      currentWidgetState: {}, // 重置 Widget 狀態
      activeEvidenceIds: [], // 重置選中的證據
      taskBData: [], // 重置 taskBData
    });
    get().ensureSingleStartNode();
    const startNode = get().nodes.find((n) => n.type === 'startNode') || get().nodes[0];
    set({ currentStepId: startNode ? startNode.id : null });
    await get().loadDocuments(projectId);
    // 載入保存的 workflow 狀態
    await get().loadWorkflowState(projectId);
  },
  exitProject: () => set({ activeProjectId: null, currentStepId: null, nodes: [], edges: [] }),

  currentStepId: null,

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

    // 如果是 PDF 且 RAG 狀態為 pending 或 processing，啟動輪詢
    if (
      created.type === 'pdf' &&
      (created.rag_status === 'pending' || created.rag_status === 'processing')
    ) {
      const pollRagStatus = async () => {
        const maxAttempts = 60; // 最多輪詢 60 次（約 3 分鐘）
        let attempts = 0;

        const poll = async () => {
          attempts++;
          const state = get();
          // 重新載入文檔以獲取最新狀態
          await get().loadDocuments(state.activeProjectId);

          const updatedDoc = get().documents.find((d) => d.id === created.id);
          if (
            !updatedDoc ||
            updatedDoc.rag_status === 'completed' ||
            updatedDoc.rag_status === 'failed' ||
            attempts >= maxAttempts
          ) {
            // 停止輪詢
            return;
          }

          // 繼續輪詢
          setTimeout(poll, 3000);
        };

        // 延遲 3 秒後開始輪詢
        setTimeout(poll, 3000);
      };

      pollRagStatus();
    }
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
    const { nodes } = get();
    const startNode = nodes.find((n) => n.type === 'startNode') || nodes[0];
    if (startNode) set({ currentStepId: startNode.id });
  },

  navigateNext: () => {
    const { nodes, edges, currentStepId } = get();
    if (!currentStepId) {
      const startNode = nodes.find((n) => n.type === 'startNode');
      if (startNode) set({ currentStepId: startNode.id });
      return;
    }
    const currentNode = nodes.find((n) => n.id === currentStepId);
    if (!currentNode) return;
    const outgoers = getOutgoers(currentNode, nodes, edges);
    if (outgoers.length > 0) {
      set({ currentStepId: outgoers[0].id });
      return;
    }
    // 若沒有連出去的邊，嘗試選擇下一個非 start 節點，避免流程卡住
    const fallback =
      nodes.find((n) => n.id !== currentStepId && n.type !== 'startNode') ||
      nodes.find((n) => n.id !== currentStepId);
    if (fallback) set({ currentStepId: fallback.id });
  },

  navigatePrev: () => {
    const { nodes, edges, currentStepId } = get();
    if (!currentStepId) return;
    const currentNode = nodes.find((n) => n.id === currentStepId);
    if (!currentNode) return;
    // 如果是 start 節點，不允許後退
    if (currentNode.type === 'startNode' || currentNode.data?.type === 'start') return;
    const incomers = getIncomers(currentNode, nodes, edges);
    if (incomers.length > 0) {
      set({ currentStepId: incomers[0].id });
      return;
    }
    // 若沒有連進來的邊，嘗試選擇 start 節點
    const startNode = nodes.find(
      (n) => n.type === 'startNode' || (n as any).data?.type === 'start'
    );
    if (startNode) set({ currentStepId: startNode.id });
  },

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
    debouncedSave(() => get().saveWorkflowState());
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
    debouncedSave(() => get().saveWorkflowState());
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
    debouncedSave(() => get().saveWorkflowState());
  },

  sendCoachMessage: async (message: string, context?: any) => {
    const state = get();
    if (!state.activeProjectId || !state.currentStepId) {
      throw new Error('尚未選擇專案或節點');
    }

    const currentNode = state.nodes.find((n) => n.id === state.currentStepId);
    if (!currentNode) {
      throw new Error('找不到當前節點');
    }

    // 檢查當前文檔的 RAG 狀態
    if (state.currentDocId) {
      const currentDoc = state.documents.find((d) => d.id === state.currentDocId);
      if (currentDoc?.type === 'pdf') {
        if (currentDoc.rag_status === 'failed') {
          throw new Error('文件處理失敗，無法使用 AI 對話功能');
        }
        if (currentDoc.rag_status !== 'completed' && currentDoc.rag_status !== 'not_applicable') {
          throw new Error('文件正在處理中，請等待處理完成後再開始對話');
        }
      }
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
        chat_history: state.chatTimeline.slice(-10), // 最近 10 條
        ...context,
      };

      const res = await chatService.sendMessage(
        state.activeProjectId,
        state.currentStepId!,
        message,
        chatContext
      );

      const aiMessage: Message = {
        id: genId(),
        role: 'coach',
        content: res.message,
        timestamp: Date.now(),
        nodeId: state.currentStepId,
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

  completeNode: (nodeId: string) => {
    const completeMessage: Message = {
      id: genId(),
      role: 'status',
      content: '節點已完成',
      timestamp: Date.now(),
      nodeId,
    };
    get().addChatMessage(completeMessage);
    get().navigateNext();
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

  saveWorkflowState: async () => {
    const state = get();
    if (!state.activeProjectId || !state.currentStepId) return;

    try {
      const payload = {
        project_id: state.activeProjectId,
        node_id: state.currentStepId,
        widget_state: state.currentWidgetState,
        task_b_data: state.taskBData,
        task_c_data: state.taskCData,
      };
      await projectService.saveWorkflowState(state.activeProjectId, payload);
    } catch (error) {
      console.error('保存 workflow 狀態失敗:', error);
      // 不拋出錯誤，避免影響用戶體驗
    }
  },

  loadWorkflowState: async (projectId: string) => {
    try {
      if (!projectService || typeof projectService.loadWorkflowState !== 'function') {
        console.error('projectService.loadWorkflowState is not available');
        return;
      }
      const state = await projectService.loadWorkflowState(projectId);
      if (state) {
        set({
          currentStepId: state.node_id || null,
          currentWidgetState: state.widget_state || {},
          taskBData: state.task_b_data || [],
          taskCData: state.task_c_data || {
            c1_theme: { text: '', snippetIds: [] },
            c2_evidence: { text: '', snippetIds: [] },
            c3_boundary: { text: '', snippetIds: [] },
            c4_gap: { text: '', snippetIds: [] },
          },
        });
      }
    } catch (error) {
      console.error('載入 workflow 狀態失敗:', error);
      // 不拋出錯誤，如果沒有保存的狀態就使用預設值
    }
  },
}));
