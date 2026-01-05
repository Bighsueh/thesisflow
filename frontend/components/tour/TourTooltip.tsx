import { motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { getTooltipVariants, arrowVariants } from '../../config/animations';
import type { TourStep } from '../../tourStore';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

interface TooltipPosition {
  placement: TooltipPlacement;
  x: number;
  y: number;
}

interface TourTooltipProps {
  step: TourStep;
  targetRect: DOMRect | null;
  placement?: TooltipPlacement;
}

function calculateTooltipPosition(
  targetRect: DOMRect,
  tooltipSize: { width: number; height: number },
  preferredPlacement: TooltipPlacement
): TooltipPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 20;
  const gap = 16;

  const positions: TooltipPosition[] = [
    {
      placement: 'bottom',
      x: targetRect.left + targetRect.width / 2 - tooltipSize.width / 2,
      y: targetRect.bottom + gap,
    },
    {
      placement: 'top',
      x: targetRect.left + targetRect.width / 2 - tooltipSize.width / 2,
      y: targetRect.top - tooltipSize.height - gap,
    },
    {
      placement: 'right',
      x: targetRect.right + gap,
      y: targetRect.top + targetRect.height / 2 - tooltipSize.height / 2,
    },
    {
      placement: 'left',
      x: targetRect.left - tooltipSize.width - gap,
      y: targetRect.top + targetRect.height / 2 - tooltipSize.height / 2,
    },
  ];

  // 嘗試使用偏好的位置
  const preferredPos = positions.find((p) => p.placement === preferredPlacement);
  if (preferredPos) {
    const isValid =
      preferredPos.x >= padding &&
      preferredPos.x + tooltipSize.width <= viewportWidth - padding &&
      preferredPos.y >= padding &&
      preferredPos.y + tooltipSize.height <= viewportHeight - padding;

    if (isValid) {
      return preferredPos;
    }
  }

  // 選擇第一個有效的位置
  for (const pos of positions) {
    if (
      pos.x >= padding &&
      pos.x + tooltipSize.width <= viewportWidth - padding &&
      pos.y >= padding &&
      pos.y + tooltipSize.height <= viewportHeight - padding
    ) {
      return pos;
    }
  }

  // 若都無效，使用 bottom 並調整到視窗內
  const fallback = positions[0];
  return {
    placement: 'bottom',
    x: Math.max(padding, Math.min(fallback.x, viewportWidth - tooltipSize.width - padding)),
    y: Math.max(padding, Math.min(fallback.y, viewportHeight - tooltipSize.height - padding)),
  };
}

const arrowStyles: Record<TooltipPlacement, string> = {
  top: '-bottom-2 left-1/2 -translate-x-1/2 border-b border-r',
  bottom: '-top-2 left-1/2 -translate-x-1/2 border-t border-l',
  left: '-right-2 top-1/2 -translate-y-1/2 border-t border-r',
  right: '-left-2 top-1/2 -translate-y-1/2 border-b border-l',
  center: 'hidden',
};

export function TourTooltip({ step, targetRect, placement = 'bottom' }: TourTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<TooltipPosition>({
    placement,
    x: 0,
    y: 0,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!tooltipRef.current) return;

    const updatePosition = () => {
      const rect = tooltipRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (targetRect) {
        const newPos = calculateTooltipPosition(
          targetRect,
          { width: rect.width, height: rect.height },
          placement
        );
        setPosition(newPos);
      } else {
        // Center 位置
        setPosition({
          placement: 'center',
          x: window.innerWidth / 2 - rect.width / 2,
          y: window.innerHeight / 2 - rect.height / 2,
        });
      }
      setIsReady(true);
    };

    // 延遲計算位置，確保 DOM 已渲染
    requestAnimationFrame(updatePosition);
  }, [targetRect, placement]);

  const variants = getTooltipVariants(position.placement);

  return (
    <motion.div
      ref={tooltipRef}
      variants={variants}
      initial="hidden"
      animate={isReady ? 'visible' : 'hidden'}
      exit="exit"
      className="fixed z-[9999] max-w-md pointer-events-auto"
      style={{ left: position.x, top: position.y }}
    >
      {/* 玻璃態提示框 */}
      <div className="relative bg-white/90 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-2xl shadow-violet-500/20 p-6">
        {/* 箭頭 */}
        {position.placement !== 'center' && (
          <motion.div
            variants={arrowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute w-4 h-4 bg-white/90 border-white/80 rotate-45 ${arrowStyles[position.placement]}`}
          />
        )}

        {/* 內容 */}
        <div className="relative z-10">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
          <p className="text-gray-600 leading-relaxed">{step.description}</p>
        </div>
      </div>
    </motion.div>
  );
}
