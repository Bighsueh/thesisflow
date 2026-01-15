import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, X } from 'lucide-react';
import React from 'react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '確認',
  cancelText = '取消',
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const Icon = variant === 'danger' ? AlertTriangle : Info;
  const iconColor = variant === 'danger' ? 'text-red-500' : 'text-blue-500';
  const iconBgColor = variant === 'danger' ? 'bg-red-50' : 'bg-blue-50';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm"
          >
            {/* 對話框 */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            >
              {/* 標題欄 */}
              <div className="flex items-start justify-between p-6 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className={`${iconBgColor} rounded-full p-3`}>
                    <Icon className={`${iconColor} w-6 h-6`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {title || (variant === 'danger' ? '確認刪除' : '確認操作')}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 訊息內容 */}
              <div className="p-6">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{message}</p>
              </div>

              {/* 按鈕區 */}
              <div className="flex gap-3 px-6 pb-6 justify-end">
                <Button variant="ghost" onClick={onClose}>
                  {cancelText}
                </Button>
                <Button variant={variant} onClick={handleConfirm}>
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
