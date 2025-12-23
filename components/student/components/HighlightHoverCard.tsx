import React, { useState } from 'react';
import { Copy, Trash2, Tag, Save } from 'lucide-react';
import { ExtendedHighlight, EvidenceType } from '../StudentInterface.types';
import { EVIDENCE_TYPES } from '../StudentInterface.constants';

interface HighlightHoverCardProps {
  highlight: ExtendedHighlight;
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
  onUpdate: (id: string, updates: Partial<ExtendedHighlight>) => void;
}

export const HighlightHoverCard: React.FC<HighlightHoverCardProps> = ({
  highlight,
  onDelete,
  onCopy,
  onUpdate,
}) => {
  const typeInfo = EVIDENCE_TYPES.find((t) => t.type === (highlight.type || (highlight.evidence_type as EvidenceType) || 'Other'));
  const [tagInput, setTagInput] = useState(highlight.tag || highlight.name || '');
  const [isEditingTag, setIsEditingTag] = useState(false);

  const handleTagSubmit = () => {
    onUpdate(highlight.id, { tag: tagInput, name: tagInput });
    setIsEditingTag(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTagSubmit();
    }
  };

  if (!highlight.x || !highlight.y || !highlight.width || !highlight.height) return null;

  return (
    <div
      className="absolute z-40 w-80 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl border border-slate-200 p-4 flex flex-col gap-3 transition-all duration-200 ease-out"
      style={{
        top: `${highlight.y * 100 + (highlight.height || 0) * 100}%`,
        left: `${highlight.x * 100}%`,
        transform: 'translateY(10px)',
        animation: 'fadeInSlideUp 200ms ease-out',
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('highlight', JSON.stringify(highlight));
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header: Type & Actions */}
      <div className="flex justify-between items-center">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeInfo?.bg} ${typeInfo?.color.replace('bg-', 'text-')}`}>
          {typeInfo?.label}
        </span>
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(highlight.snippet);
            }}
            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
            title="複製摘要"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(highlight.id);
            }}
            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
            title="刪除標記"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Quick Tag Input Section */}
      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
        <div className="flex items-center space-x-2 text-slate-500 mb-1">
          <Tag size={12} />
          <span className="text-[10px] font-bold uppercase">標籤說明</span>
        </div>
        {isEditingTag || !highlight.tag ? (
          <div className="flex items-center space-x-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="說明這個標記的用途..."
              className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-300 outline-none"
              autoFocus
            />
            <button onClick={handleTagSubmit} className="p-1 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200">
              <Save size={12} />
            </button>
          </div>
        ) : (
          <div
            className="text-xs text-slate-700 font-medium hover:bg-slate-200 rounded px-1 py-0.5 cursor-pointer flex justify-between items-center group"
            onClick={() => setIsEditingTag(true)}
            title="點擊編輯說明"
          >
            <span>{highlight.tag}</span>
          </div>
        )}
      </div>

      {/* Snippet Preview */}
      <div className="text-xs text-slate-600 line-clamp-3 italic border-l-2 border-indigo-200 pl-2">
        "{highlight.snippet}"
      </div>
    </div>
  );
};

