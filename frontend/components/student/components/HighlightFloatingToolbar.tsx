import { X } from 'lucide-react';
import React, { useState } from 'react';
import { LEARNING_MARK_TYPES } from '../StudentInterface.constants';
import { LearningMarkType, ToolbarPosition } from '../StudentInterface.types';

interface HighlightFloatingToolbarProps {
  position: ToolbarPosition;
  onSelectType: (type: LearningMarkType) => void;
  onClose: () => void;
}

export const HighlightFloatingToolbar: React.FC<HighlightFloatingToolbarProps> = ({
  position,
  onSelectType,
  onClose,
}) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  return (
    <div
      style={{ top: `${position.y}%`, left: `${position.x}%`, zIndex: 100 }}
      className="absolute transform -translate-y-full -translate-x-1/2 mt-[-10px] pointer-events-auto"
    >
      {/* 主工具列 */}
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
              {/* 圖標 + 主標籤 */}
              <div className="flex items-center gap-1">
                <Icon size={13} />
                <span className="text-[11px] font-semibold">{markType.shortLabel}</span>
              </div>
              {/* 小字說明 */}
              <span className="text-[9px] opacity-60 mt-0.5 whitespace-nowrap">
                {markType.subtitle}
              </span>

              {/* Hover Tooltip */}
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

        {/* 分隔線 */}
        <div className="w-px bg-slate-200 mx-0.5 self-stretch" />

        {/* 關閉按鈕 */}
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
