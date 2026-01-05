import { Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import React from 'react';
import type { RagStatus } from '../../types';

interface RagStatusBadgeProps {
  status?: RagStatus;
  chunkCount?: number;
  compact?: boolean;
}

const statusConfig: Record<
  Exclude<RagStatus, 'not_applicable'>,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
    showProgress?: boolean;
  }
> = {
  pending: {
    label: '等待處理',
    icon: <Clock size={12} />,
    className: 'badge-warning text-warning-content',
  },
  processing: {
    label: '處理中',
    icon: <Loader2 size={12} className="animate-spin" />,
    className: 'badge-info text-info-content',
    showProgress: true,
  },
  completed: {
    label: '已就緒',
    icon: <CheckCircle size={12} />,
    className: 'badge-success text-success-content',
  },
  failed: {
    label: '處理失敗',
    icon: <AlertCircle size={12} />,
    className: 'badge-error text-error-content',
  },
};

export function RagStatusBadge({ status, chunkCount, compact = false }: RagStatusBadgeProps) {
  // 不顯示 not_applicable 狀態
  if (!status || status === 'not_applicable') {
    return null;
  }

  const config = statusConfig[status];
  if (!config) {
    return null;
  }

  if (compact) {
    return (
      <div className="tooltip tooltip-top" data-tip={config.label}>
        <span className={`badge badge-xs gap-1 ${config.className}`}>{config.icon}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className={`badge badge-sm gap-1 ${config.className}`}>
        {config.icon}
        <span>{config.label}</span>
        {status === 'completed' && chunkCount !== undefined && chunkCount > 0 && (
          <span className="opacity-75">({chunkCount})</span>
        )}
      </span>
      {config.showProgress && <progress className="progress progress-info w-full h-1" />}
    </div>
  );
}

export default RagStatusBadge;
