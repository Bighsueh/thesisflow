import { useState, useCallback } from 'react';
import { ConfirmDialogProps } from '../components/ui/ConfirmDialog';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info';
}

interface UseConfirmReturn {
  confirmState: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'> | null;
  isOpen: boolean;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export function useConfirm(): UseConfirmReturn {
  const [confirmState, setConfirmState] = useState<Omit<
    ConfirmDialogProps,
    'isOpen' | 'onClose' | 'onConfirm'
  > | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        title: options.title,
        message: options.message,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        variant: options.variant || 'danger',
      });
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    setConfirmState(null);
    setResolvePromise(null);
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setConfirmState(null);
    setResolvePromise(null);
  }, [resolvePromise]);

  return {
    confirmState,
    isOpen: confirmState !== null,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
