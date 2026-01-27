/**
 * 標記片段編輯對話框
 *
 * 用於編輯標記片段的詳細資訊（標籤和筆記）
 */

import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ExtendedHighlight } from '../types/highlight';

interface HighlightEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tag: string, note: string) => void;
  initialData?: ExtendedHighlight | null;
}

/**
 * 標記片段編輯對話框
 *
 * 提供完整的編輯介面，包含標籤和詳細筆記欄位
 */
export const HighlightEditModal: React.FC<HighlightEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.tag || initialData?.name || '');
  const [note, setNote] = useState(initialData?.note || '');

  // 當 initialData 變更時重置表單
  useEffect(() => {
    if (initialData) {
      setName(initialData.tag || initialData.name || '');
      setNote(initialData.note || '');
    }
  }, [initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden animate-fadeIn">
        {/* 標題列 */}
        <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center">
          <h3 className="text-white font-bold text-sm">編輯標記詳情</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* 表單內容 */}
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">標籤說明 (Tag)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none"
              autoFocus
              placeholder="例如：支持論點 A 的關鍵數據..."
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">詳細筆記 (Note)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm p-2 border border-slate-200 rounded-lg h-24 resize-none"
              placeholder="輸入更多筆記..."
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                onSave(name, note);
                onClose();
              }}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              儲存變更
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
