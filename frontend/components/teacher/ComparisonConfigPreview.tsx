import { Plus, Trash2, Edit2 } from 'lucide-react';
import React, { useState } from 'react';

interface ComparisonConfigPreviewProps {
  dimensions: string[];
  onUpdateDimension: (index: number, value: string) => void;
  onAddDimension: () => void;
  onRemoveDimension: (index: number) => void;
  canRemove: boolean;
}

export const ComparisonConfigPreview: React.FC<ComparisonConfigPreviewProps> = ({
  dimensions,
  onUpdateDimension,
  onAddDimension,
  onRemoveDimension,
  canRemove,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="alert alert-info py-2">
        <div className="text-xs">
          <strong>比較任務說明：</strong>學生將選擇兩篇文獻，針對每個維度進行對比分析。
        </div>
      </div>

      {dimensions.map((dimension, idx) => (
        <div key={idx} className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <span className="badge badge-primary badge-sm">{idx + 1}</span>
                比較維度
              </h3>
              {canRemove && (
                <button
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => onRemoveDimension(idx)}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {editingIndex === idx ? (
              <div className="space-y-2">
                <input
                  className="input input-sm input-bordered w-full"
                  placeholder="維度名稱 (例如：研究方法)"
                  value={dimension}
                  onChange={(e) => onUpdateDimension(idx, e.target.value)}
                  onBlur={() => setEditingIndex(null)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setEditingIndex(null);
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div
                className="flex items-center justify-between p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300"
                onClick={() => setEditingIndex(idx)}
              >
                <span className="font-semibold text-sm">{dimension || '(未命名維度)'}</span>
                <Edit2 size={14} className="text-slate-400" />
              </div>
            )}

            {/* 預覽學生端的兩欄對比結構 */}
            <div className="grid grid-cols-2 gap-4 mt-3 opacity-50">
              <div className="border-2 border-dashed border-base-300 rounded-lg p-3">
                <div className="text-xs font-bold text-slate-500 mb-2">文獻 A</div>
                <div className="bg-base-100 h-16 rounded flex items-center justify-center text-xs text-slate-400">
                  學生填寫區域
                </div>
              </div>
              <div className="border-2 border-dashed border-base-300 rounded-lg p-3">
                <div className="text-xs font-bold text-slate-500 mb-2">文獻 B</div>
                <div className="bg-base-100 h-16 rounded flex items-center justify-center text-xs text-slate-400">
                  學生填寫區域
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2 opacity-50">
              <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-center text-slate-500">
                相同點
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-center text-slate-500">
                不同點
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        className="btn btn-outline btn-sm w-full border-dashed gap-2"
        onClick={onAddDimension}
      >
        <Plus size={16} />
        新增比較維度
      </button>
    </div>
  );
};
