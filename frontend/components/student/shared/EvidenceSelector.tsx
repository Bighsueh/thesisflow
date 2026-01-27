/**
 * 標記片段選擇器組件
 *
 * 用於在表單欄位中選擇和綁定標記片段（Evidence）
 */

import { Link as LinkIcon, X } from 'lucide-react';
import React, { useState } from 'react';
import { useStore } from '../../../store';
import { FieldWithEvidence } from '../../../types';

// === EvidenceSelector 組件 ===

interface EvidenceSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * 標記片段選擇器
 *
 * 顯示可用的標記片段列表，允許使用者選擇多個標記片段
 */
export const EvidenceSelector: React.FC<EvidenceSelectorProps> = ({ selectedIds, onChange }) => {
  const { documents } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  // 展開所有文檔的標記片段
  const allHighlights = documents.flatMap((d) =>
    (d.highlights || []).map((h) => ({ ...h, docTitle: d.title }))
  );

  // 切換選擇狀態
  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="mt-2">
      {/* 已選擇的標記片段 */}
      <div className="flex flex-wrap gap-2 mb-2 min-h-[24px]">
        {selectedIds.length === 0 && (
          <span className="text-xs text-red-400 italic flex items-center gap-1">
            * 需綁定標記片段 (Evidence)
          </span>
        )}
        {selectedIds.map((id) => {
          const h = allHighlights.find((highlight) => highlight.id === id);
          if (!h) return null;
          return (
            <span key={id} className="badge badge-sm badge-warning gap-1 h-auto py-1 text-left">
              <span className="truncate max-w-[150px]">{h.snippet}</span>
              <button onClick={() => toggleSelection(id)} className="hover:text-red-700">
                <X size={10} />
              </button>
            </span>
          );
        })}
        <button
          className="btn btn-xs btn-outline btn-primary gap-1"
          onClick={() => setIsOpen(!isOpen)}
        >
          <LinkIcon size={10} /> 引用標記片段
        </button>
      </div>

      {/* 標記片段列表 */}
      {isOpen && (
        <div className="border border-base-300 rounded-lg p-2 bg-base-100 max-h-40 overflow-y-auto shadow-inner text-xs">
          {allHighlights.length === 0 && (
            <div className="text-slate-400">尚無標註資料，請先閱讀文獻並畫線。</div>
          )}
          {allHighlights.map((h) => (
            <div
              key={h.id}
              className={`p-1.5 border-b border-base-200 cursor-pointer hover:bg-base-200 flex gap-2 items-start ${selectedIds.includes(h.id) ? 'bg-blue-50' : ''}`}
              onClick={() => toggleSelection(h.id)}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(h.id)}
                readOnly
                className="checkbox checkbox-xs mt-0.5"
              />
              <div>
                <div className="font-bold text-slate-500">{h.docTitle}</div>
                <div className="text-slate-700">"{h.snippet}"</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// === FormField 組件 ===

interface FormFieldProps {
  label: string;
  value: FieldWithEvidence;
  onChange: (val: FieldWithEvidence) => void;
  placeholder?: string;
  minHeight?: string;
}

/**
 * 表單欄位組件
 *
 * 包含文字輸入區域和標記片段選擇器
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 'h-24',
}) => {
  return (
    <div className="form-control mb-4">
      <label className="label py-1">
        <span className="label-text font-bold text-slate-700">{label}</span>
      </label>
      <div className="bg-white rounded-lg border border-base-300 p-2 focus-within:border-primary transition-colors">
        <textarea
          className={`textarea textarea-ghost textarea-sm w-full resize-none focus:bg-transparent ${minHeight}`}
          placeholder={placeholder}
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
        />
        <div className="border-t border-base-200 pt-2">
          <EvidenceSelector
            selectedIds={value.snippetIds}
            onChange={(ids) => onChange({ ...value, snippetIds: ids })}
          />
        </div>
      </div>
    </div>
  );
};
