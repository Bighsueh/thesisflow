import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, XCircle, Loader2, Minimize2, Maximize2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useUploadStore } from '../../uploadStore';

export function UploadProgressOverlay() {
  const { tasks, removeTask, clearAll } = useUploadStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

  const activeTasks = tasks.filter((t) => t.status === 'uploading' || t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'success');
  const errorTasks = tasks.filter((t) => t.status === 'error');

  const hasActiveTasks = activeTasks.length > 0;
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length + errorTasks.length;

  // 當所有任務完成後，5 秒後自動清除全部
  useEffect(() => {
    if (totalTasks > 0 && !hasActiveTasks) {
      const timer = setTimeout(() => {
        clearAll();
      }, 5000);
      setAutoHideTimer(timer);
      return () => clearTimeout(timer);
    } else if (autoHideTimer) {
      clearTimeout(autoHideTimer);
      setAutoHideTimer(null);
    }
  }, [totalTasks, hasActiveTasks, clearAll, autoHideTimer]);

  // 沒有任務時不顯示
  if (tasks.length === 0) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'error':
        return <XCircle size={16} className="text-red-600" />;
      case 'uploading':
        return <Loader2 size={16} className="text-blue-600 animate-spin" />;
      default:
        return <Upload size={16} className="text-gray-400" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-[9999]"
      >
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl overflow-hidden min-w-[380px] max-w-[450px]">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload size={18} />
              <span className="font-semibold text-sm">
                {hasActiveTasks ? '上傳中' : '上傳完成'} ({completedCount}/{totalTasks})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title={isMinimized ? '展開' : '最小化'}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => {
                  tasks.forEach((task) => removeTask(task.id));
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="關閉全部"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tasks List */}
          {!isMinimized && (
            <div className="max-h-[400px] overflow-y-auto">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getStatusIcon(task.status)}
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {task.fileName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{task.progress}%</span>
                      {(task.status === 'success' || task.status === 'error') && (
                        <button
                          onClick={() => removeTask(task.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <X size={14} className="text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${task.progress}%` }}
                      transition={{ duration: 0.3 }}
                      className={`h-full rounded-full ${
                        task.status === 'error'
                          ? 'bg-red-500'
                          : task.status === 'success'
                            ? 'bg-green-500'
                            : 'bg-gradient-to-r from-violet-500 to-indigo-500'
                      }`}
                    />
                  </div>

                  {/* Error Message */}
                  {task.error && (
                    <p className="text-xs text-red-600 mt-1 truncate" title={task.error}>
                      {task.error}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Minimized View */}
          {isMinimized && (
            <div className="px-4 py-3 text-center">
              <div className="text-sm text-gray-600">
                {hasActiveTasks ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin text-blue-600" />
                    <span>正在上傳 {activeTasks.length} 個檔案...</span>
                  </div>
                ) : (
                  <span>
                    {errorTasks.length > 0
                      ? `${errorTasks.length} 個檔案上傳失敗`
                      : '所有檔案上傳完成'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
