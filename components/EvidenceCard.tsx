import React from 'react';
import { X, MapPin, MessageSquare, Link as LinkIcon, Edit2 } from 'lucide-react';
import { Highlight, Document } from '../types';
import { useStore } from '../store';

interface EvidenceCardProps {
  highlight: Highlight;
  document: Document;
  onRemove?: (id: string) => void;
  onEdit?: (highlight: Highlight) => void;
  onLocate?: (highlight: Highlight, document: Document) => void;
  onInsert?: (highlight: Highlight) => void;
  onAssign?: (highlight: Highlight) => void;
  draggable?: boolean;
  compact?: boolean;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  highlight,
  document,
  onRemove,
  onEdit,
  onLocate,
  onInsert,
  onAssign,
  draggable = false,
  compact = false,
}) => {
  const snippet = highlight.snippet.length > 100 
    ? highlight.snippet.substring(0, 100) + '...' 
    : highlight.snippet;

  const handleDragStart = (e: React.DragEvent) => {
    if (draggable) {
      e.dataTransfer.setData('text/plain', highlight.id);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  if (compact) {
    return (
      <div
        className="badge badge-sm badge-warning gap-1 h-auto py-1 text-left cursor-pointer hover:badge-primary transition-colors"
        draggable={draggable}
        onDragStart={handleDragStart}
        onClick={() => onLocate?.(highlight, document)}
      >
        <span className="truncate max-w-[150px]">{snippet}</span>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(highlight.id);
            }}
            className="hover:text-red-700"
          >
            <X size={10} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="card card-compact bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow"
      draggable={draggable}
      onDragStart={handleDragStart}
    >
      <div className="card-body p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-500 truncate">{document.title}</div>
            <div className="flex items-center gap-2 mt-1">
              {highlight.page && (
                <div className="text-[10px] text-slate-400">頁碼: {highlight.page}</div>
              )}
              {highlight.evidence_type && (
                <span className="badge badge-xs badge-primary">{highlight.evidence_type}</span>
              )}
            </div>
          </div>
          {onRemove && (
            <button
              onClick={() => onRemove(highlight.id)}
              className="btn btn-ghost btn-xs btn-circle text-slate-400 hover:text-red-500"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div className="text-xs text-slate-700 mb-2 line-clamp-2">"{snippet}"</div>
        <div className="flex gap-1 flex-wrap">
          {onLocate && (
            <button
              className="btn btn-xs btn-ghost gap-1"
              onClick={() => onLocate(highlight, document)}
              title="定位到 PDF"
            >
              <MapPin size={10} />
              定位
            </button>
          )}
          {onEdit && (
            <button
              className="btn btn-xs btn-ghost gap-1"
              onClick={() => onEdit(highlight)}
              title="編輯標記片段"
            >
              <Edit2 size={10} />
              編輯
            </button>
          )}
          {onInsert && (
            <button
              className="btn btn-xs btn-ghost gap-1"
              onClick={() => onInsert(highlight)}
              title="插入到聊天"
            >
              <MessageSquare size={10} />
              插入
            </button>
          )}
          {onAssign && (
            <button
              className="btn btn-xs btn-ghost gap-1"
              onClick={() => onAssign(highlight)}
              title="指派到欄位"
            >
              <LinkIcon size={10} />
              指派
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


