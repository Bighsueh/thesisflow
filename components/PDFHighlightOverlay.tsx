import React from 'react';
import { Highlight } from '../types';

interface PDFHighlightOverlayProps {
  highlights: Highlight[];
  pageNumber: number;
  onHighlightClick?: (highlight: Highlight) => void;
}

const EVIDENCE_TYPE_COLORS: Record<string, { bg: string; border: string }> = {
  Purpose: { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6' }, // 藍色
  Method: { bg: 'rgba(34, 197, 94, 0.2)', border: '#22c55e' }, // 綠色
  Findings: { bg: 'rgba(234, 179, 8, 0.2)', border: '#eab308' }, // 黃色
  Limitation: { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444' }, // 紅色
  Other: { bg: 'rgba(156, 163, 175, 0.2)', border: '#9ca3af' }, // 灰色
};

export const PDFHighlightOverlay: React.FC<PDFHighlightOverlayProps> = ({
  highlights,
  pageNumber,
  onHighlightClick,
}) => {
  // 篩選出當前頁面的證據
  const pageHighlights = highlights.filter((h) => h.page === pageNumber && h.x !== undefined && h.y !== undefined && h.width !== undefined && h.height !== undefined);

  if (pageHighlights.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 5,
      }}
    >
      {pageHighlights.map((highlight) => {
        const colors = EVIDENCE_TYPE_COLORS[highlight.evidence_type || 'Other'] || EVIDENCE_TYPE_COLORS.Other;
        return (
          <div
            key={highlight.id}
            style={{
              position: 'absolute',
              left: `${(highlight.x || 0) * 100}%`,
              top: `${(highlight.y || 0) * 100}%`,
              width: `${(highlight.width || 0) * 100}%`,
              height: `${(highlight.height || 0) * 100}%`,
              backgroundColor: colors.bg,
              border: `2px solid ${colors.border}`,
              cursor: onHighlightClick ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
            onClick={() => onHighlightClick?.(highlight)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.replace('0.2', '0.3');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg;
            }}
            title={highlight.snippet.substring(0, 100)}
          />
        );
      })}
    </div>
  );
};









