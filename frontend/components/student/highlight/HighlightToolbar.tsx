/**
 * 標記片段工具列組件
 *
 * 包含浮動工具列和懸停卡片
 */

import { Copy, Edit2, GripVertical, Save, Tag, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import {
  EVIDENCE_TYPES,
  EvidenceType,
  ExtendedHighlight,
  LEARNING_MARK_TYPES,
  LearningMarkType,
} from '../types/highlight';

// === HighlightFloatingToolbar 組件 ===

interface HighlightFloatingToolbarProps {
  position: { x: number; y: number };
  onSelectType: (type: LearningMarkType) => void;
  onClose: () => void;
}

/**
 * 浮動工具列（新版學習型標記）
 *
 * 在使用者選取區域後顯示，允許快速選擇標記類型
 */
export const HighlightFloatingToolbar: React.FC<HighlightFloatingToolbarProps> = ({
  position,
  onSelectType,
  onClose,
}) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  return (
    <div
      style={{
        top: `${position.y}%`,
        left: `${position.x}%`,
        zIndex: 100,
        cursor: 'auto',
      }}
      className="absolute transform -translate-y-full -translate-x-1/2 mt-[-10px] pointer-events-auto"
    >
      <div className="bg-white shadow-xl rounded-2xl p-1.5 flex items-stretch gap-1 border border-slate-200 animate-bounce-in">
        {LEARNING_MARK_TYPES.map((markType) => {
          const Icon = markType.icon;
          const isHovered = hoveredType === markType.type;

          return (
            <button
              key={markType.type}
              onClick={(e) => {
                e.stopPropagation();
                onSelectType(markType.type);
              }}
              onMouseEnter={() => setHoveredType(markType.type)}
              onMouseLeave={() => setHoveredType(null)}
              className={`
                relative flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl
                ${markType.bg} ${markType.textColor} ${markType.border}
                border hover:scale-105 active:scale-95 transition-all duration-150
                min-w-[52px] group
              `}
            >
              <div className="flex items-center gap-1">
                <Icon size={13} />
                <span className="text-[11px] font-semibold">{markType.shortLabel}</span>
              </div>
              <span className="text-[9px] opacity-60 mt-0.5 whitespace-nowrap">
                {markType.subtitle}
              </span>

              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20">
                  <div className="bg-slate-800 text-white text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                    {markType.tooltip}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                </div>
              )}
            </button>
          );
        })}

        <div className="w-px bg-slate-200 mx-0.5 self-stretch" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-100 transition-colors self-center"
          title="取消"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

// === HighlightHoverCard 組件 ===

interface HighlightHoverCardProps {
  highlight: ExtendedHighlight;
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
  onUpdate: (id: string, updates: Partial<ExtendedHighlight>) => void;
}

/**
 * 懸停卡片
 *
 * 當滑鼠懸停在標記片段上時顯示，提供編輯和操作功能
 */
export const HighlightHoverCard: React.FC<HighlightHoverCardProps> = ({
  highlight,
  onDelete,
  onCopy,
  onUpdate,
}) => {
  const typeInfo = EVIDENCE_TYPES.find(
    (t) => t.type === (highlight.type || (highlight.evidence_type as EvidenceType) || 'Other')
  );
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

  // 計算最佳位置，避免超出邊界
  const highlightLeft = highlight.x * 100;
  const highlightTop = highlight.y * 100;
  const highlightBottom = (highlight.y + highlight.height) * 100;

  // 判斷是否應該顯示在左側或右側
  let left = highlightLeft;
  let transform = 'translateY(10px)';

  // 如果 highlight 位置太靠右（超過 60%），將 card 顯示在左側
  if (highlightLeft > 60) {
    left = Math.max(0, highlightLeft + highlight.width * 100 - 32);
    transform = 'translate(-100%, 10px)';
  }

  // 如果 highlight 位置太靠下（超過 70%），將 card 顯示在上方
  let top = highlightBottom;
  if (highlightBottom > 70) {
    top = highlightTop;
    transform = transform.replace('translateY(10px)', 'translateY(-100%) translateY(-10px)');
  }

  return (
    <div
      className="absolute w-80 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl border border-slate-200 p-4 animate-fadeIn flex flex-col gap-3"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        transform,
        zIndex: 100,
        maxWidth: '320px',
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('highlight', JSON.stringify(highlight));
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      {/* 標題：類型與操作按鈕 */}
      <div className="flex justify-between items-center">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeInfo?.bg} ${typeInfo?.color.replace('bg-', 'text-')}`}
        >
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

      {/* 快速標籤輸入區 */}
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
            <button
              onClick={handleTagSubmit}
              className="p-1 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200"
            >
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
            <Edit2 size={10} className="opacity-0 group-hover:opacity-100 text-slate-400" />
          </div>
        )}
      </div>

      {/* 摘要預覽 */}
      <p className="text-xs text-slate-600 line-clamp-3 italic leading-relaxed pl-2 border-l-2 border-slate-200">
        "{highlight.snippet}"
      </p>

      <div className="flex items-center text-[10px] text-slate-400 pt-1">
        <GripVertical size={10} className="mr-1" />
        <span className="italic">拖曳此卡片以引用</span>
      </div>
    </div>
  );
};
