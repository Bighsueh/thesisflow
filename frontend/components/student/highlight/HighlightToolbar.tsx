/**
 * 標記片段工具列組件
 *
 * 包含浮動工具列和懸停卡片
 */

import { Copy, Edit2, GripVertical, Save, Tag, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { EVIDENCE_TYPES, EvidenceType, ExtendedHighlight } from '../types/highlight';

// === HighlightFloatingToolbar 組件 ===

interface HighlightFloatingToolbarProps {
  position: { x: number; y: number };
  onSelectType: (type: EvidenceType) => void;
  onEdit: () => void;
  onClose: () => void;
}

/**
 * 浮動工具列
 *
 * 在使用者選取區域後顯示，允許快速選擇標記類型
 */
export const HighlightFloatingToolbar: React.FC<HighlightFloatingToolbarProps> = ({
  position,
  onSelectType,
  onEdit,
  onClose,
}) => {
  return (
    <div
      style={{
        top: `${position.y}%`,
        left: `${position.x}%`,
        zIndex: 100,
        cursor: 'auto',
      }}
      className="absolute transform -translate-y-full -translate-x-1/2 mt-[-10px] bg-white shadow-xl rounded-full p-1.5 flex items-center space-x-2 border border-slate-200 animate-bounce-in pointer-events-auto"
    >
      {EVIDENCE_TYPES.map((typeDef) => (
        <button
          key={typeDef.type}
          onClick={(e) => {
            e.stopPropagation();
            onSelectType(typeDef.type);
          }}
          className={`w-6 h-6 rounded-full ${typeDef.color} border-2 border-white shadow-sm hover:scale-125 transition-transform`}
          title={`標記為：${typeDef.label}`}
        />
      ))}
      <div className="w-px h-4 bg-slate-200 mx-1"></div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition-colors"
        title="編輯詳情"
      >
        <Edit2 size={14} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
      >
        <X size={14} />
      </button>
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
