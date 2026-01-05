import { Node } from 'reactflow';

// --- Flow & Node Types ---

export type AppNodeType =
  | 'resource'
  | 'task_summary'
  | 'task_comparison'
  | 'task_synthesis'
  | 'start'
  | 'end';

export interface NodeData {
  label: string;
  type: AppNodeType;
  description?: string;
  config?: TaskConfig;
}

export interface TaskConfig {
  guidance?: string;
  minWords?: number;
  dimensions?: string[];
  synthesisSlots?: { key: string; label: string }[];
  // Widget 配置參數
  sections?: Array<{
    key: string; // 唯一識別碼，如 'a1_purpose'
    label: string; // 顯示標籤，如 'A1 研究目的 (Purpose)'
    placeholder?: string; // 輸入提示文字
    minEvidence?: number; // 該段至少需要的 evidence 數量
  }>; // 用於 Summary Node
  minEvidence?: number; // 每段至少需要的 evidence 數量（全域預設值）
  requirePageNumber?: boolean; // 是否必須引用頁碼
  enableCoachPrompt?: boolean; // 是否啟用教練主動提示
}

export type AppNode = Node<NodeData>;

// --- Core Data Structures ---

export interface FlowNodePayload {
  id: string;
  type: AppNodeType;
  label: string;
  config?: TaskConfig;
  position?: Record<string, any>;
}

export interface FlowEdgePayload {
  id: string;
  source: string;
  target: string;
  data?: Record<string, any>;
}

export interface Project {
  id: string;
  title: string;
  semester?: string;
  tags: string[];
  nodes: FlowNodePayload[];
  edges: FlowEdgePayload[];
  currentStage?: string;
  progress?: number;
  updatedAt?: number;
}

export interface Highlight {
  id: string;
  document_id: string;
  snippet: string;
  name?: string; // 標記片段名稱，使用者自訂
  page?: number;
  x?: number; // 相對座標 0-1
  y?: number; // 相對座標 0-1
  width?: number; // 相對寬度 0-1
  height?: number; // 相對高度 0-1
  evidence_type?: string; // Purpose/Method/Findings/Limitation/Other (保留以向後相容)
  created_at: number;
}

export type RagStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'not_applicable';

export interface Document {
  id: string;
  project_id?: string | null;
  title: string;
  object_key: string;
  content_type?: string;
  size?: number;
  /**
   * 後端目前會回傳：
   * - "pdf"：PDF 檔
   * - "text"：純文字檔
   * - "file"：其他一般檔案
   */
  type: 'pdf' | 'text' | 'file';
  uploaded_at: number;
  raw_preview?: string;
  highlights?: Highlight[];
  /**
   * RAG 處理狀態
   * - pending: 等待處理
   * - processing: 處理中
   * - completed: 處理完成
   * - failed: 處理失敗
   * - not_applicable: 非 PDF 文件，不適用
   */
  rag_status?: RagStatus;
  /** RAG 處理後的 chunk 數量 */
  chunk_count?: number;
}

export interface RagProcessingLog {
  id: string;
  document_id: string;
  stage: string;
  status: string;
  message?: string;
  metadata: Record<string, any>;
  created_at: number;
}

export interface Cohort {
  id: string;
  name: string;
  code?: string;
  project_id?: string;
  created_at: number;
  member_count: number;
}

export interface Student {
  id: string;
  email: string;
  name: string;
  role: 'student';
  username?: string;
}

export interface CohortMember {
  user: Student | { id: string; email: string; name: string; role: 'student' | 'teacher' };
  status?: string;
  progress: number;
}

export interface UsageRecord {
  id: string;
  user: Student;
  project_id: string;
  project_title?: string;
  task_type: string;
  created_at: number;
  cohort_id?: string | null;
  target_doc_id?: string | null;
}

// --- Structured Task Data ---

export interface FieldWithEvidence {
  text: string;
  snippetIds: string[];
}

// Task A: Single Paper Summary
// 動態結構：key 對應 sections 配置中的 key
export interface TaskAContent {
  [key: string]: FieldWithEvidence;
}

// 向後相容：保留舊的固定結構類型（可選）
export interface TaskAContentLegacy {
  a1_purpose: FieldWithEvidence;
  a2_method: FieldWithEvidence;
  a3_findings: FieldWithEvidence;
  a4_limitations: FieldWithEvidence;
}

// Task B: Comparison
export interface ComparisonRow {
  id: string;
  dimension: string;
  doc1Id: string;
  doc1Claim: FieldWithEvidence;
  doc2Id: string;
  doc2Claim: FieldWithEvidence;
  similarity: string; // Single sentence constraint
  difference: string; // Single sentence constraint
}

// Task C: Synthesis
export interface TaskCContent {
  c1_theme: FieldWithEvidence;
  c2_evidence: FieldWithEvidence; // Must have snippets from >1 docs
  c3_boundary: FieldWithEvidence;
  c4_gap: FieldWithEvidence;
}

export interface TaskVersion {
  id: string;
  projectId: string;
  targetDocId?: string; // For Task A
  version: number;
  taskType: 'A' | 'B' | 'C';
  content: TaskAContent | ComparisonRow[] | TaskCContent | any;
  feedback?: string; // AI Feedback
  timestamp: number;
  isValid: boolean;
  validationErrors: string[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  eventType: string;
  details: any;
}

export type MessageRole = 'ai' | 'user' | 'system' | 'coach' | 'widget' | 'evidence' | 'status';

export type WidgetType =
  | 'instruction'
  | 'section_writer'
  | 'matrix_compare'
  | 'synthesis_writer'
  | 'checklist_submit';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  // 擴展欄位
  widgetType?: WidgetType;
  widgetData?: any; // 根據 widgetType 不同而異
  nodeId?: string; // 綁定的 workflow node
  evidenceIds?: string[]; // 引用的 evidence IDs
}

export interface ChatContext {
  projectId: string;
  nodeId: string;
  evidenceIds: string[];
  widgetStates: Record<string, any>;
  chatHistory: Message[];
  currentNode?: AppNode;
}

export interface WidgetState {
  nodeId: string;
  widgetType: WidgetType;
  data: any;
  completed?: boolean;
}
