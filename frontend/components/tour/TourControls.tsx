import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';
import { controlsVariants } from '../../config/animations';
import { Button } from '../ui/Button';

interface TourControlsProps {
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
}

export function TourControls({
  onPrev,
  onNext,
  onSkip,
  onComplete,
  canGoPrev,
  canGoNext,
  isLastStep,
}: TourControlsProps) {
  // 鍵盤快捷鍵
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canGoPrev) {
        e.preventDefault();
        onPrev();
      }
      if (e.key === 'ArrowRight' && canGoNext) {
        e.preventDefault();
        onNext();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      }
      if (e.key === 'Enter' && isLastStep) {
        e.preventDefault();
        onComplete();
      }
    },
    [canGoPrev, canGoNext, isLastStep, onPrev, onNext, onSkip, onComplete]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <motion.div
      variants={controlsVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999]"
    >
      <div className="bg-white/90 backdrop-blur-2xl border border-white/80 rounded-2xl px-6 py-4 shadow-xl shadow-violet-500/20 flex items-center gap-4">
        {/* 跳過按鈕 */}
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          跳過導覽
        </button>

        <div className="w-px h-6 bg-gray-200" />

        {/* 上一步 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={!canGoPrev}
          className="flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          上一步
        </Button>

        {/* 下一步 / 完成 */}
        <Button
          variant="primary"
          size="sm"
          onClick={isLastStep ? onComplete : onNext}
          disabled={!canGoNext && !isLastStep}
          className="flex items-center gap-1"
        >
          {isLastStep ? '完成' : '下一步'}
          {!isLastStep && <ChevronRight size={16} />}
        </Button>
      </div>

      {/* 鍵盤提示 */}
      <div className="text-center mt-2 text-xs text-gray-400">使用 ← → 切換步驟，Esc 跳過</div>
    </motion.div>
  );
}
