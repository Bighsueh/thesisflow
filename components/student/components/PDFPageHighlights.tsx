import React, { useRef } from 'react';
import { ExtendedHighlight } from '../StudentInterface.types';
import { EVIDENCE_TYPES } from '../StudentInterface.constants';
import { HighlightHoverCard } from './HighlightHoverCard';

interface PDFPageHighlightsProps {
  pageNumber: number;
  highlights: ExtendedHighlight[];
  hoveredHighlightId: string | null;
  onHighlightHover: (id: string | null) => void;
  onHighlightDelete: (id: string) => void;
  onHighlightCopy: (text: string) => void;
  onHighlightUpdate: (id: string, updates: Partial<ExtendedHighlight>) => void;
  currentRect?: { x: number; y: number; w: number; h: number } | null;
  showCurrentRect: boolean;
}

const HOVER_DELAY_MS = 300; // 延遲 300ms 後顯示 HoverCard

export const PDFPageHighlights: React.FC<PDFPageHighlightsProps> = ({
  pageNumber,
  highlights,
  hoveredHighlightId,
  onHighlightHover,
  onHighlightDelete,
  onHighlightCopy,
  onHighlightUpdate,
  currentRect,
  showCurrentRect,
}) => {
  // 過濾出當前頁面的標記
  const pageHighlights = highlights.filter((h) => h.page === pageNumber);
  const hoveredHighlight = pageHighlights.find((h) => h.id === hoveredHighlightId);
  
  // 用於延遲顯示 HoverCard 的計時器
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 處理游標進入標記
  const handleMouseEnter = (highlightId: string) => {
    // 清除之前的計時器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // 設置延遲後顯示
    hoverTimeoutRef.current = setTimeout(() => {
      onHighlightHover(highlightId);
    }, HOVER_DELAY_MS);
  };

  // 處理游標離開標記
  const handleMouseLeave = () => {
    // 清除計時器，取消顯示
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // 立即隱藏 HoverCard
    onHighlightHover(null);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 15, // 高於 PDFSelector (z-index: 10)
      }}
    >
      {/* 已儲存的標記 */}
      {pageHighlights.map((h) => {
        const typeInfo = EVIDENCE_TYPES.find((t) => t.type === h.type);
        if (!h.x || !h.y || !h.width || !h.height) return null;

        return (
          <React.Fragment key={h.id}>
            <div
              className={`absolute transition-opacity cursor-pointer ${typeInfo?.bg} opacity-30 hover:opacity-50 border-b-2 ${typeInfo?.border}`}
              style={{
                left: `${h.x * 100}%`,
                top: `${h.y * 100}%`,
                width: `${h.width * 100}%`,
                height: `${h.height * 100}%`,
                pointerEvents: 'auto',
              }}
              data-highlight-id={h.id}
              data-is-highlight="true"
              onMouseEnter={() => handleMouseEnter(h.id)}
              onMouseLeave={handleMouseLeave}
            />
          </React.Fragment>
        );
      })}

      {/* Hover card for the hovered highlight on this page */}
      {hoveredHighlight && (
        <div 
          style={{ pointerEvents: 'auto' }}
          data-is-highlight="true"
          onMouseEnter={() => {
            // 游標進入 HoverCard 時，清除離開計時器，保持顯示
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }
          }}
          onMouseLeave={handleMouseLeave}
        >
          <HighlightHoverCard
            highlight={hoveredHighlight}
            onDelete={onHighlightDelete}
            onCopy={onHighlightCopy}
            onUpdate={onHighlightUpdate}
          />
        </div>
      )}

      {/* 當前拖拽的選擇框（僅在當前頁面且正在拖拽時顯示） */}
      {showCurrentRect && currentRect && (
        <div
          className="absolute z-20 pointer-events-none opacity-30 hover:opacity-50"
          style={{
            left: `${currentRect.x}%`,
            top: `${currentRect.y}%`,
            width: `${currentRect.w}%`,
            height: `${currentRect.h}%`,
            backgroundColor: 'rgba(99, 102, 241, 0.3)',
            border: '2px dashed rgb(99, 102, 241)',
            borderBottom: '2px dashed rgb(99, 102, 241)',
          }}
        />
      )}
    </div>
  );
};

