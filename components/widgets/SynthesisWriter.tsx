import React from 'react';
import { Link as LinkIcon, X } from 'lucide-react';
import { TaskCContent, FieldWithEvidence } from '../../types';
import { useStore } from '../../store';

interface SynthesisWriterProps {
  nodeId: string;
  slots: Array<{
    key: keyof TaskCContent;
    label: string;
    placeholder?: string;
    minEvidence?: number;
  }>;
  values: TaskCContent;
  onUpdate: (key: keyof TaskCContent, value: FieldWithEvidence) => void;
}

export const SynthesisWriter: React.FC<SynthesisWriterProps> = ({
  nodeId,
  slots,
  values,
  onUpdate,
}) => {
  const { documents } = useStore();
  
  // 獲取所有 highlights
  const allHighlights = documents.flatMap((d) =>
    (d.highlights || []).map((h) => ({ ...h, docTitle: d.title, document: d }))
  );

  const toggleEvidenceSelection = (key: keyof TaskCContent, highlightId: string) => {
    const currentValue = values[key];
    const newSnippetIds = currentValue.snippetIds.includes(highlightId)
      ? currentValue.snippetIds.filter((id) => id !== highlightId)
      : [...currentValue.snippetIds, highlightId];
    
    onUpdate(key, { ...currentValue, snippetIds: newSnippetIds });
  };

  return (
    <div className="space-y-4">
      {slots.map((slot) => {
        const value = values[slot.key];
        const minEvidence = slot.minEvidence || 1;
        const selectedHighlights = allHighlights.filter((h) =>
          value.snippetIds.includes(h.id)
        );

        return (
          <div
            key={slot.key}
            className={`card bg-base-100 border-2 ${
              value.text.trim().length > 0 && value.snippetIds.length >= minEvidence
                ? 'border-green-300'
                : 'border-base-300'
            }`}
          >
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">{slot.label}</h4>
                {minEvidence > 0 && (
                  <span className="badge badge-xs badge-warning">
                    需 {minEvidence} 則標記片段 ({value.snippetIds.length}/{minEvidence})
                  </span>
                )}
              </div>

              <textarea
                className="textarea textarea-bordered textarea-sm w-full resize-none mb-3"
                placeholder={slot.placeholder || '請輸入內容...'}
                value={value.text}
                onChange={(e) => onUpdate(slot.key, { ...value, text: e.target.value })}
                rows={4}
              />

              <div className="border-t border-base-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600">
                    綁定標記片段 {value.snippetIds.length > 0 && `(${value.snippetIds.length})`}
                  </span>
                  <EvidenceSelector
                    selectedIds={value.snippetIds}
                    onToggle={(id) => toggleEvidenceSelection(slot.key, id)}
                    highlights={allHighlights}
                  />
                </div>

                {selectedHighlights.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedHighlights.map((h) => {
                      // 優先顯示名稱，如果沒有名稱則顯示內容摘要
                      const displayText = h.name 
                        ? h.name 
                        : h.snippet.length > 30 
                          ? h.snippet.substring(0, 30) + '...' 
                          : h.snippet;
                      return (
                        <div
                          key={h.id}
                          className="badge badge-sm badge-warning gap-1 h-auto py-1 text-left"
                        >
                          <span className="truncate max-w-[120px] text-xs">
                            {displayText}
                          </span>
                          <button
                            onClick={() => toggleEvidenceSelection(slot.key, h.id)}
                            className="hover:text-red-700"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {value.snippetIds.length < minEvidence && (
                  <div className="text-xs text-red-500 mt-1">
                    * 還需要 {minEvidence - value.snippetIds.length} 則標記片段
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const EvidenceSelector: React.FC<{
  selectedIds: string[];
  onToggle: (id: string) => void;
  highlights: Array<{ id: string; snippet: string; name?: string; docTitle: string }>;
}> = ({ selectedIds, onToggle, highlights }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div>
      <button
        className="btn btn-xs btn-outline btn-primary gap-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <LinkIcon size={12} />
        選擇標記片段
      </button>

      {isOpen && (
        <div className="border border-base-300 rounded-lg p-2 bg-base-50 max-h-40 overflow-y-auto mt-2">
          {highlights.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-2">
              尚無標註資料
            </div>
          ) : (
            <div className="space-y-1">
              {highlights.map((h) => (
                <div
                  key={h.id}
                  className={`p-1.5 border rounded cursor-pointer hover:bg-base-200 flex gap-2 items-start text-xs ${
                    selectedIds.includes(h.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-base-200'
                  }`}
                  onClick={() => onToggle(h.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(h.id)}
                    readOnly
                    className="checkbox checkbox-xs mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-500">{h.docTitle}</div>
                    {h.name ? (
                      <div className="text-slate-700 font-semibold">{h.name}</div>
                    ) : (
                      <div className="text-slate-700 line-clamp-2">"{h.snippet}"</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


