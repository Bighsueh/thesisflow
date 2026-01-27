/**
 * 標記片段類型定義
 *
 * 定義標記片段（Evidence/Highlight）相關的類型和常數
 */

import { HelpCircle, Star, MessageCircle, BookOpen, Bookmark, LucideIcon } from 'lucide-react';
import { Highlight } from '../../../types';

// ============================================================================
// 新的學習型標記類型（主要使用）
// ============================================================================

// 學習型標記類型
export type LearningMarkType =
  | 'confused' // 不懂 - 讓 AI 解釋
  | 'important' // 重點 - 做筆記
  | 'question' // 與 AI 討論 - 聊聊這段
  | 'reference' // 看 Reference - 找相關文獻
  | 'bookmark'; // 書籤 - 稍後再看

// 學習型標記動作類型
export type LearningMarkAction = 'auto_ai' | 'note' | 'chat' | 'reference' | 'none';

// 學習型標記類型資訊介面
export interface LearningMarkTypeInfo {
  type: LearningMarkType;
  label: string;
  shortLabel: string;
  subtitle: string;
  tooltip: string;
  color: string;
  bg: string;
  border: string;
  textColor: string;
  icon: LucideIcon;
  action: LearningMarkAction;
}

// 學習型標記類型常數定義
export const LEARNING_MARK_TYPES: LearningMarkTypeInfo[] = [
  {
    type: 'confused',
    label: '不懂',
    shortLabel: '不懂',
    subtitle: '讓 AI 解釋',
    tooltip: '標記看不懂的字詞或句子，AI 會引導你理解',
    color: 'bg-purple-500',
    bg: 'bg-purple-50',
    border: 'border-purple-400',
    textColor: 'text-purple-700',
    icon: HelpCircle,
    action: 'auto_ai',
  },
  {
    type: 'important',
    label: '重點',
    shortLabel: '重點',
    subtitle: '做筆記',
    tooltip: '標記重要內容並寫下你的理解或筆記',
    color: 'bg-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    textColor: 'text-amber-700',
    icon: Star,
    action: 'note',
  },
  {
    type: 'question',
    label: '與 AI 討論',
    shortLabel: '討論',
    subtitle: '聊聊這段',
    tooltip: '針對這段內容和 AI 進行深入討論',
    color: 'bg-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    textColor: 'text-blue-700',
    icon: MessageCircle,
    action: 'chat',
  },
  {
    type: 'reference',
    label: '看 Reference',
    shortLabel: 'Ref',
    subtitle: '找相關文獻',
    tooltip: '讓 AI 幫你找這段提到的參考文獻或相關資料',
    color: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    textColor: 'text-emerald-700',
    icon: BookOpen,
    action: 'reference',
  },
  {
    type: 'bookmark',
    label: '書籤',
    shortLabel: '書籤',
    subtitle: '稍後再看',
    tooltip: '單純標記起來，方便之後回顧',
    color: 'bg-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-400',
    textColor: 'text-slate-700',
    icon: Bookmark,
    action: 'none',
  },
];

// 根據類型獲取學習型標記類型資訊
export const getLearningMarkTypeInfo = (
  type: LearningMarkType
): LearningMarkTypeInfo | undefined => {
  return LEARNING_MARK_TYPES.find((t) => t.type === type);
};

// ============================================================================
// 舊的標記類型（向後相容，已棄用）
// ============================================================================

/** @deprecated 請使用 LearningMarkType */
export type EvidenceType = 'Purpose' | 'Method' | 'Findings' | 'Limitation' | 'Other';

/** @deprecated 請使用 LearningMarkTypeInfo */
export interface EvidenceTypeInfo {
  type: EvidenceType;
  label: string;
  color: string;
  bg: string;
  border: string;
}

/** @deprecated 請使用 LEARNING_MARK_TYPES */
export const EVIDENCE_TYPES: EvidenceTypeInfo[] = [
  {
    type: 'Purpose',
    label: '研究目的',
    color: 'bg-red-400',
    bg: 'bg-red-100',
    border: 'border-red-400',
  },
  {
    type: 'Method',
    label: '研究方法',
    color: 'bg-blue-400',
    bg: 'bg-blue-100',
    border: 'border-blue-400',
  },
  {
    type: 'Findings',
    label: '主要發現',
    color: 'bg-green-400',
    bg: 'bg-green-100',
    border: 'border-green-400',
  },
  {
    type: 'Limitation',
    label: '研究限制',
    color: 'bg-orange-400',
    bg: 'bg-orange-100',
    border: 'border-orange-400',
  },
  {
    type: 'Other',
    label: '其他',
    color: 'bg-yellow-400',
    bg: 'bg-yellow-100',
    border: 'border-yellow-400',
  },
];

// ============================================================================
// 擴展的標記片段介面
// ============================================================================

// 擴展的標記片段介面（同時支援新舊類型）
export interface ExtendedHighlight extends Highlight {
  tag?: string; // 使用者定義的簡短描述
  note?: string; // 詳細筆記
  aiExplanation?: string; // AI 解釋（confused 類型時自動填入）
  isResolved?: boolean; // 是否已理解（confused 類型用）
  markType?: LearningMarkType; // 新的學習型標記類型
  type?: EvidenceType; // 舊的類型（向後相容）
  docTitle?: string; // 文檔標題（用於顯示）
}

/** @deprecated 請使用 getLearningMarkTypeInfo */
export const getEvidenceTypeInfo = (type: EvidenceType): EvidenceTypeInfo | undefined => {
  return EVIDENCE_TYPES.find((t) => t.type === type);
};

// 工具欄位置介面
export interface ToolbarPosition {
  x: number;
  y: number;
}
