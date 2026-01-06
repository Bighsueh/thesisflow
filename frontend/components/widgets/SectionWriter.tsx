import { CheckCircle2, XCircle, Link as LinkIcon, X } from 'lucide-react';
import React, { useState } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useStore } from '../../store';
import { FieldWithEvidence } from '../../types';

interface SectionWriterProps {
  nodeId: string;
  sections: Array<{
    key: string;
    label: string;
    placeholder?: string;
    minEvidence?: number;
  }>;
  selectedDocId?: string;
  onUpdate: (sectionKey: string, value: FieldWithEvidence) => void;
  values: Record<string, FieldWithEvidence>;
}

export const SectionWriter: React.FC<SectionWriterProps> = ({
  nodeId: _nodeId,
  sections,
  selectedDocId: _selectedDocId,
  onUpdate,
  values,
}) => {
  const { documents } = useStore();
  const [_activeEvidenceIds, _setActiveEvidenceIds] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(sections[0]?.key || null);
  const [showEvidenceSelector, setShowEvidenceSelector] = useState<string | null>(null);
  const autoSave = useAutoSave(1000);

  // 獲取所有 highlights
  const allHighlights = documents.flatMap((d) =>
    (d.highlights || []).map((h) => ({ ...h, docTitle: d.title, document: d }))
  );

  const toggleEvidenceSelection = (sectionKey: string, highlightId: string) => {
    const currentValue = values[sectionKey] || { text: '', snippetIds: [] };
    const newSnippetIds = currentValue.snippetIds.includes(highlightId)
      ? currentValue.snippetIds.filter((id) => id !== highlightId)
      : [...currentValue.snippetIds, highlightId];

    onUpdate(sectionKey, { ...currentValue, snippetIds: newSnippetIds });
    autoSave();
  };

  const getSectionStatus = (sectionKey: string) => {
    const value = values[sectionKey];
    if (!value) return 'empty';
    const hasText = value.text.trim().length > 0;
    const hasEvidence = value.snippetIds.length > 0;
    const minEvidence = sections.find((s) => s.key === sectionKey)?.minEvidence || 1;

    if (hasText && hasEvidence && value.snippetIds.length >= minEvidence) return 'complete';
    if (hasText || hasEvidence) return 'partial';
    return 'empty';
  };

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const value = values[section.key] || { text: '', snippetIds: [] };
        const status = getSectionStatus(section.key);
        const minEvidence = section.minEvidence || 1;
        const selectedHighlights = allHighlights.filter((h) => value.snippetIds.includes(h.id));

        return (
          <div
            key={section.key}
            className={`card bg-base-100 border-2 transition-all ${
              expandedSection === section.key
                ? 'border-primary shadow-md'
                : status === 'complete'
                  ? 'border-green-300'
                  : status === 'partial'
                    ? 'border-yellow-300'
                    : 'border-base-300'
            }`}
          >
            <div
              className="card-body p-4 cursor-pointer"
              onClick={() =>
                setExpandedSection(expandedSection === section.key ? null : section.key)
              }
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {status === 'complete' ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : (
                    <XCircle size={18} className="text-slate-300" />
                  )}
                  <h4 className="font-bold text-sm">{section.label}</h4>
                  {minEvidence > 0 && (
                    <span className="badge badge-xs badge-warning">
                      需 {minEvidence} 則標記片段
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {value.snippetIds.length}/{minEvidence} 標記片段
                </div>
              </div>

              {expandedSection === section.key && (
                <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    className="textarea textarea-bordered textarea-sm w-full resize-none"
                    placeholder={section.placeholder || '請輸入內容...'}
                    value={value.text}
                    onChange={(e) => {
                      onUpdate(section.key, { ...value, text: e.target.value });
                      autoSave();
                    }}
                    rows={4}
                  />

                  <div className="border-t border-base-200 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-600">
                        綁定標記片段 {value.snippetIds.length > 0 && `(${value.snippetIds.length})`}
                      </span>
                      <button
                        className="btn btn-xs btn-outline btn-primary gap-1"
                        onClick={() =>
                          setShowEvidenceSelector(
                            showEvidenceSelector === section.key ? null : section.key
                          )
                        }
                      >
                        <LinkIcon size={12} />
                        選擇標記片段
                      </button>
                    </div>

                    {showEvidenceSelector === section.key && (
                      <div className="border border-base-300 rounded-lg p-2 bg-base-50 max-h-40 overflow-y-auto mb-2">
                        {allHighlights.length === 0 ? (
                          <div className="text-xs text-slate-400 text-center py-2">
                            尚無標註資料，請先閱讀文獻並畫線。
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {allHighlights.map((h) => (
                              <div
                                key={h.id}
                                className={`p-1.5 border rounded cursor-pointer hover:bg-base-200 flex gap-2 items-start ${
                                  value.snippetIds.includes(h.id)
                                    ? 'bg-blue-50 border-blue-300'
                                    : 'bg-white border-base-200'
                                }`}
                                onClick={() => toggleEvidenceSelection(section.key, h.id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={value.snippetIds.includes(h.id)}
                                  readOnly
                                  className="checkbox checkbox-xs mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-[10px] font-bold text-slate-500">
                                    {h.docTitle}
                                  </div>
                                  <div className="text-xs text-slate-700 line-clamp-2">
                                    "{h.snippet}"
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

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
                              <span className="truncate max-w-[120px] text-xs">{displayText}</span>
                              <button
                                onClick={() => toggleEvidenceSelection(section.key, h.id)}
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
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
