import { useEffect, useRef } from 'react';
import { useStore } from '../store';

/**
 * 自動保存 hook，使用 debounce 來避免頻繁保存
 * @param delay 延遲時間（毫秒），預設 1000ms
 */
export function useAutoSave(delay: number = 1000) {
  const saveWorkflowState = useStore((state) => state.saveWorkflowState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      saveWorkflowState();
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedSave;
}

