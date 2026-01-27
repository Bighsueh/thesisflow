/**
 * 標記片段類型定義
 *
 * 定義標記片段（Evidence/Highlight）相關的類型和常數
 */

import { Highlight } from '../../../types';

// 標記片段類型
export type EvidenceType = 'Purpose' | 'Method' | 'Findings' | 'Limitation' | 'Other';

// 標記片段類型資訊介面
export interface EvidenceTypeInfo {
  type: EvidenceType;
  label: string;
  color: string;
  bg: string;
  border: string;
}

// 標記片段類型常數定義
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

// 擴展的標記片段介面（向後相容）
export interface ExtendedHighlight extends Highlight {
  tag?: string; // 使用者定義的簡短描述
  note?: string; // 詳細筆記
  type?: EvidenceType; // 便於使用，對應 evidence_type
  docTitle?: string; // 文檔標題（用於顯示）
}

// 根據類型獲取類型資訊
export const getEvidenceTypeInfo = (type: EvidenceType): EvidenceTypeInfo | undefined => {
  return EVIDENCE_TYPES.find((t) => t.type === type);
};
