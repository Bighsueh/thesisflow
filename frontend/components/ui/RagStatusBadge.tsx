import React, { useState } from 'react';
import type { RagStatus } from '../../types';
import { RagProcessingHistory } from './RagProcessingHistory';

interface RagStatusBadgeProps {
  status?: RagStatus;
  chunkCount?: number;
  compact?: boolean;
  docId?: string;
}

const statusConfig: Record<
  Exclude<RagStatus, 'not_applicable'>,
  {
    label: string;
    shortLabel: string;
    bgGradient: string;
    textColor: string;
    borderColor: string;
    dotColor: string;
    showProgress?: boolean;
    animate?: boolean;
  }
> = {
  pending: {
    label: '等待處理',
    shortLabel: '待處理',
    bgGradient: 'bg-gradient-to-r from-amber-50 to-orange-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200/60',
    dotColor: 'bg-amber-400',
  },
  processing: {
    label: '索引處理中',
    shortLabel: '處理中',
    bgGradient: 'bg-gradient-to-r from-sky-50 to-indigo-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200/60',
    dotColor: 'bg-sky-400',
    showProgress: true,
    animate: true,
  },
  completed: {
    label: '可供查詢',
    shortLabel: '就緒',
    bgGradient: 'bg-gradient-to-r from-emerald-50 to-teal-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200/60',
    dotColor: 'bg-emerald-400',
  },
  failed: {
    label: '處理失敗',
    shortLabel: '失敗',
    bgGradient: 'bg-gradient-to-r from-rose-50 to-red-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200/60',
    dotColor: 'bg-rose-400',
  },
};

export function RagStatusBadge({
  status,
  chunkCount,
  compact = false,
  docId,
}: RagStatusBadgeProps) {
  const [showHistory, setShowHistory] = useState(false);
  const badgeRef = React.useRef<HTMLDivElement>(null);

  // 不顯示 not_applicable 狀態
  if (!status || status === 'not_applicable') {
    return null;
  }

  const config = statusConfig[status];
  if (!config) {
    return null;
  }

  const cursorClass = docId ? 'cursor-pointer hover:opacity-80' : '';

  if (compact) {
    return (
      <div className="relative inline-block" ref={badgeRef}>
        <span
          onClick={() => docId && setShowHistory(!showHistory)}
          className={`
            inline-flex items-center gap-1.5
            px-2.5 py-0.5
            text-[10px] font-semibold tracking-wide uppercase
            ${config.bgGradient}
            ${config.textColor}
            border ${config.borderColor}
            rounded-full
            shadow-sm
            backdrop-blur-sm
            transition-all duration-200
            hover:shadow-md
            ${cursorClass}
          `}
        >
          <span
            className={`
              w-1.5 h-1.5 rounded-full ${config.dotColor}
              ${config.animate ? 'animate-pulse' : ''}
            `}
          />
          <span>{config.shortLabel}</span>
        </span>
        {docId && showHistory && (
          <RagProcessingHistory
            docId={docId}
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            targetRef={badgeRef}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block" ref={badgeRef}>
      <div
        className={`flex flex-col gap-1.5 ${cursorClass}`}
        onClick={() => docId && setShowHistory(!showHistory)}
      >
        <span
          className={`
            inline-flex items-center gap-2
            px-3 py-1
            text-xs font-semibold tracking-wide
            ${config.bgGradient}
            ${config.textColor}
            border ${config.borderColor}
            rounded-full
            shadow-sm
            backdrop-blur-sm
            transition-all duration-200
            hover:shadow-md
          `}
        >
          <span
            className={`
              w-2 h-2 rounded-full ${config.dotColor}
              ${config.animate ? 'animate-pulse' : ''}
            `}
          />
          <span>{config.label}</span>
          {status === 'completed' && chunkCount !== undefined && chunkCount > 0 && (
            <span className="opacity-60 font-normal">· {chunkCount} 段落</span>
          )}
        </span>
        {config.showProgress && (
          <div className="w-full h-1 bg-sky-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full animate-pulse w-2/3" />
          </div>
        )}
      </div>
      {docId && showHistory && (
        <RagProcessingHistory
          docId={docId}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          targetRef={badgeRef}
        />
      )}
    </div>
  );
}

export default RagStatusBadge;
