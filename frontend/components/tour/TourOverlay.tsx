import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTourStore } from '../../tourStore';
import { TourControls } from './TourControls';
import { TourProgress } from './TourProgress';
import { TourSpotlight } from './TourSpotlight';
import { TourTooltip } from './TourTooltip';

// Debounce utility
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function TourOverlay() {
  const { isActive, currentTour, currentStep, nextStep, prevStep, skipTour, completeTour } =
    useTourStore();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // 獲取 portal 容器
  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  // 計算目標元素位置
  const updateTargetRect = useCallback(() => {
    if (!currentTour || !isActive) {
      setTargetRect(null);
      return;
    }

    const step = currentTour.steps[currentStep];
    if (!step.target || step.target === 'body' || step.spotlightShape === 'none') {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      if (import.meta.env.DEV) {
        console.log('[Tour] Target found:', {
          selector: step.target,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        });
      }
      setTargetRect(rect);
    } else {
      if (import.meta.env.DEV) {
        console.warn(`[Tour] Target not found: ${step.target}`);
      }
      setTargetRect(null);
    }
  }, [currentTour, currentStep, isActive]);

  // 監聽步驟變化和 resize
  useEffect(() => {
    if (!isActive) return;

    // 重試機制：嘗試多次尋找目標元素（動態組件可能需要時間渲染）
    let attempts = 0;
    const maxAttempts = 5;
    const retryDelay = 200; // ms
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const tryUpdateTarget = () => {
      if (!currentTour) return;

      const step = currentTour.steps[currentStep];

      // 跳過不需要高亮的步驟
      if (!step.target || step.target === 'body' || step.spotlightShape === 'none') {
        setTargetRect(null);
        return;
      }

      const element = document.querySelector(step.target);
      if (element) {
        // 找到元素，更新位置
        setTargetRect(element.getBoundingClientRect());
        if (import.meta.env.DEV) {
          console.log(`[Tour] ✅ Target found: ${step.target}`);
        }
      } else if (attempts < maxAttempts) {
        // 未找到，繼續重試
        attempts++;
        if (import.meta.env.DEV) {
          // 只在最後一次重試時輸出警告，前幾次使用 debug 級別
          if (attempts === maxAttempts) {
            console.warn(`[Tour] ⏳ Retry ${attempts}/${maxAttempts}: ${step.target}`);
          } else {
            console.debug(`[Tour] ⏳ Retry ${attempts}/${maxAttempts}: ${step.target}`);
          }
        }
        retryTimer = setTimeout(tryUpdateTarget, retryDelay);
      } else {
        // 達到最大重試次數，優雅降級
        if (import.meta.env.DEV) {
          console.warn(
            `[Tour] ❌ Target not found after ${maxAttempts} attempts: ${step.target}\n` +
              `   Hint: Check if the tour is started on the correct page.`
          );
        }
        setTargetRect(null);
      }
    };

    // 初始嘗試
    tryUpdateTarget();

    // Debounced resize handler
    const debouncedUpdate = debounce(updateTargetRect, 100);
    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('scroll', debouncedUpdate, true);

    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('scroll', debouncedUpdate, true);
    };
  }, [isActive, currentStep, currentTour]);

  // 自動執行動作（如點擊、滾動）
  useEffect(() => {
    if (!isActive || !currentTour) return;

    const step = currentTour.steps[currentStep];

    if (step.action === 'click' && step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        setTimeout(() => {
          (element as HTMLElement).click();
          // 更新位置
          setTimeout(updateTargetRect, 300);
        }, 300);
      }
    }

    if (step.action === 'scroll' && step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 更新位置
        setTimeout(updateTargetRect, 500);
      }
    }
  }, [isActive, currentTour, currentStep, updateTargetRect]);

  if (!isActive || !currentTour || !portalContainer) {
    return null;
  }

  const step = currentTour.steps[currentStep];
  const isLastStep = currentStep === currentTour.steps.length - 1;
  const isCenterPlacement = step.placement === 'center' || !targetRect;

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998]"
      >
        {/* Spotlight */}
        {targetRect && step.spotlightShape !== 'none' && (
          <TourSpotlight
            targetRect={targetRect}
            shape={step.spotlightShape || 'rect'}
            pulse={step.highlightPulse !== false}
          />
        )}

        {/* 無高亮時的背景遮罩 */}
        {isCenterPlacement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[9998]"
          />
        )}

        {/* Tooltip */}
        <TourTooltip step={step} targetRect={targetRect} placement={step.placement || 'bottom'} />

        {/* Progress */}
        <TourProgress current={currentStep + 1} total={currentTour.steps.length} />

        {/* Controls */}
        <TourControls
          onPrev={prevStep}
          onNext={nextStep}
          onSkip={skipTour}
          onComplete={completeTour}
          canGoPrev={currentStep > 0}
          canGoNext={currentStep < currentTour.steps.length - 1}
          isLastStep={isLastStep}
        />
      </motion.div>
    </AnimatePresence>,
    portalContainer
  );
}
