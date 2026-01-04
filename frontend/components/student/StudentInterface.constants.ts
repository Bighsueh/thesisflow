import { EvidenceType } from './StudentInterface.types';

export const EVIDENCE_TYPES: {
  type: EvidenceType;
  label: string;
  color: string;
  bg: string;
  border: string;
}[] = [
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
