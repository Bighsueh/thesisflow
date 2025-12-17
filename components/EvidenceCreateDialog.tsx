import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface EvidenceCreateDialogProps {
  isOpen: boolean;
  pageNumber?: number;
  initialText?: string;
  onSave: (snippet: string, name?: string, page?: number) => void;
  onCancel: () => void;
}

export const EvidenceCreateDialog: React.FC<EvidenceCreateDialogProps> = ({
  isOpen,
  pageNumber,
  initialText = '',
  onSave,
  onCancel,
}) => {
  const [snippet, setSnippet] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSnippet(initialText || '');
      setName('');
    }
  }, [isOpen, pageNumber, initialText]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (snippet.trim()) {
      onSave(snippet.trim(), name.trim() || undefined, pageNumber);
      setSnippet('');
      setName('');
    }
  };

  return (
    <>
      {/* 覆蓋層 */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* 對話框 */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* 標題欄 */}
          <div className="flex items-center justify-between p-4 border-b border-base-200">
            <h3 className="font-bold text-lg">新增標記片段</h3>
            <button
              className="btn btn-sm btn-ghost btn-circle"
              onClick={onCancel}
              aria-label="關閉"
            >
              <X size={18} />
            </button>
          </div>

          {/* 內容 */}
          <div className="p-4 space-y-4">
            <div>
              <label className="label">
                <span className="label-text font-bold text-sm">標記片段名稱</span>
                <span className="label-text-alt text-xs text-slate-500">（方便識別此標記片段的用途）</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="輸入標記片段名稱..."
                autoFocus
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text font-bold text-sm">證據內容</span>
                {initialText && (
                  <span className="label-text-alt text-xs text-slate-500">
                    （已自動提取選中區域的文本，可編輯）
                  </span>
                )}
              </label>
              <textarea
                className="textarea textarea-bordered textarea-sm w-full resize-none"
                rows={4}
                value={snippet}
                onChange={(e) => setSnippet(e.target.value)}
                placeholder={initialText ? "已自動提取文本，可在此編輯..." : "請輸入證據內容..."}
              />
              {!initialText && (
                <div className="text-xs text-slate-400 mt-1">
                  提示：在 PDF 上拉框選擇區域可自動提取文本
                </div>
              )}
            </div>

            {pageNumber && (
              <div>
                <label className="label">
                  <span className="label-text font-bold text-sm">頁碼</span>
                </label>
                <div className="text-sm text-slate-600">第 {pageNumber} 頁</div>
              </div>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex justify-end gap-2 p-4 border-t border-base-200">
            <button className="btn btn-sm btn-ghost" onClick={onCancel}>
              取消
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSave}
              disabled={!snippet.trim()}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

