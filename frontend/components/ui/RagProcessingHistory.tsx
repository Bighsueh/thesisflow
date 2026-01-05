import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Database,
  Cpu,
  Upload,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { documentService } from '../../services/documentService';
import { RagProcessingLog } from '../../types';

interface RagProcessingHistoryProps {
  docId: string;
  isOpen: boolean;
  onClose: () => void;
  targetRef?: React.RefObject<HTMLElement>;
}

const STAGE_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  upload: { icon: <Upload size={14} />, label: '檔案上傳' },
  start: { icon: <Clock size={14} />, label: '開始處理' },
  parsing: { icon: <FileText size={14} />, label: 'PDF 解析' },
  chunking: { icon: <Cpu size={14} />, label: '文本切分' },
  embedding: { icon: <Cpu size={14} />, label: '向量生成' },
  indexing: { icon: <Database size={14} />, label: '建立索引' },
  complete: { icon: <CheckCircle2 size={14} />, label: '處理完成' },
  failed: { icon: <AlertCircle size={14} />, label: '處理失敗' },
};

export const RagProcessingHistory: React.FC<RagProcessingHistoryProps> = ({
  docId,
  isOpen,
  onClose,
  targetRef,
}) => {
  const [logs, setLogs] = useState<RagProcessingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && docId) {
      loadLogs();
    }
  }, [isOpen, docId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await documentService.getRagLogs(docId);
      setLogs(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load logs:', err);
      setError('無法載入處理紀錄');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'error':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'pending':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-TW', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const calculateDuration = (index: number) => {
    if (index === 0) return null;
    const current = logs[index];
    const prev = logs[index - 1];
    const diff = current.created_at - prev.created_at;
    if (diff < 1000) return '< 1s';
    return `${(diff / 1000).toFixed(1)}s`;
  };

  // Calculate position relative to target if provided
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && targetRef?.current) {
      const rect = targetRef.current.getBoundingClientRect();
      // Simple positioning: below the trigger, centered horizontally
      // Also ensure it doesn't go off-screen (basic check)
      const top = rect.bottom + 8;
      let left = rect.left + rect.width / 2;

      // Basic boundary check
      if (left - 160 < 10) left = 170; // 160 is half width of 320px popover
      if (window.innerWidth - left < 160) left = window.innerWidth - 170;

      setPosition({ top, left });
    }
  }, [isOpen, targetRef]);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/5"
            onClick={onClose}
          />

          {/* Popover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[9999] w-80 bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden"
            style={{
              top: targetRef?.current ? position.top : '50%',
              left: targetRef?.current ? position.left : '50%',
              transform: targetRef?.current ? 'translateX(-50%)' : 'translate(-50%, -50%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-100 bg-white/50 flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">處理歷程</h3>
              {loading && <Loader2 size={12} className="animate-spin text-gray-400" />}
            </div>

            <div className="max-h-[300px] overflow-y-auto p-4 space-y-4">
              {error ? (
                <div className="text-center text-xs text-rose-500 py-4">{error}</div>
              ) : logs.length === 0 ? (
                <div className="text-center text-xs text-gray-400 py-4">
                  {loading ? '載入中...' : '尚無紀錄'}
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gray-100" />

                  {logs.map((log, index) => {
                    const config = STAGE_CONFIG[log.stage] || {
                      icon: <Circle size={14} />,
                      label: log.stage,
                    };
                    const duration = calculateDuration(index);

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative pl-8"
                      >
                        {/* Dot / Icon */}
                        <div
                          className={`
                            absolute left-0 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border
                            ${getStatusColor(log.status)}
                            z-10 bg-white
                          `}
                        >
                          {config.icon}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700">
                              {config.label}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {formatTime(log.created_at)}
                            </span>
                          </div>

                          {log.message && (
                            <p className="text-[11px] text-gray-500 leading-snug">{log.message}</p>
                          )}

                          {/* Metadata */}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {Object.entries(log.metadata).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 border border-gray-200"
                                >
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Duration */}
                          {duration && (
                            <div className="text-[10px] text-gray-300 mt-0.5">↓ {duration}</div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};
