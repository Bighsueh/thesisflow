import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Highlight, Document } from '../types';
import { useStore } from '../store';

interface EvidenceEditDialogProps {
  highlight: Highlight;
  document: Document;
  onSave: (updated: Highlight) => void;
  onCancel: () => void;
}

export const EvidenceEditDialog: React.FC<EvidenceEditDialogProps> = ({
  highlight,
  document,
  onSave,
  onCancel,
}) => {
  const { updateHighlight } = useStore();
  const [snippet, setSnippet] = useState(highlight.snippet);
  const [name, setName] = useState(highlight.name || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSnippet(highlight.snippet);
    setName(highlight.name || '');
  }, [highlight]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const trimmedName = name.trim();
      // 總是傳遞 name 欄位，即使是空字串，這樣後端才能正確更新
      const response = await updateHighlight(highlight.id, {
        snippet,
        name: trimmedName, // 傳遞空字串以清除名稱，而不是 undefined
      });
      const updated: Highlight = {
        ...highlight,
        snippet,
        name: trimmedName || undefined,
      };
      onSave(updated);
    } catch (error) {
      console.error('更新標記片段失敗:', error);
      alert('更新標記片段失敗，請重試');
    } finally {
      setSaving(false);
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
            <h3 className="font-bold text-lg">編輯標記片段</h3>
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
                <span className="label-text font-bold text-sm">文檔</span>
              </label>
              <div className="text-sm text-slate-600">{document.title}</div>
            </div>

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
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text font-bold text-sm">證據內容</span>
              </label>
              <textarea
                className="textarea textarea-bordered textarea-sm w-full resize-none"
                rows={4}
                value={snippet}
                onChange={(e) => setSnippet(e.target.value)}
                placeholder="輸入證據內容..."
              />
            </div>

            {highlight.page && (
              <div>
                <label className="label">
                  <span className="label-text font-bold text-sm">頁碼</span>
                </label>
                <div className="text-sm text-slate-600">第 {highlight.page} 頁</div>
              </div>
            )}

            {highlight.x !== undefined && highlight.y !== undefined && (
              <div className="text-xs text-slate-500">
                座標: ({((highlight.x || 0) * 100).toFixed(1)}%, {((highlight.y || 0) * 100).toFixed(1)}%)
                {' '}
                尺寸: ({((highlight.width || 0) * 100).toFixed(1)}%, {((highlight.height || 0) * 100).toFixed(1)}%)
              </div>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex justify-end gap-2 p-4 border-t border-base-200">
            <button className="btn btn-sm btn-ghost" onClick={onCancel} disabled={saving}>
              取消
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

