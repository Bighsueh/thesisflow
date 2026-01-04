import { Plus, Trash2, Link as LinkIcon, X } from 'lucide-react';
import React, { useState } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useStore } from '../../store';
import { ComparisonRow, FieldWithEvidence } from '../../types';

interface MatrixCompareProps {
  nodeId: string;
  rows: ComparisonRow[];
  onUpdateRow: (
    index: number,
    field: keyof ComparisonRow | 'doc1Claim' | 'doc2Claim',
    value: any
  ) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  documents: Array<{ id: string; title: string }>;
}

export const MatrixCompare: React.FC<MatrixCompareProps> = ({
  nodeId,
  rows,
  onUpdateRow,
  onAddRow,
  onRemoveRow,
  documents,
}) => {
  const { documents: allDocuments } = useStore();
  const autoSave = useAutoSave(1000);

  // 獲取所有 highlights
  const allHighlights = allDocuments.flatMap((d) =>
    (d.highlights || []).map((h) => ({ ...h, docTitle: d.title, document: d }))
  );

  const toggleEvidenceSelection = (
    rowIndex: number,
    field: 'doc1Claim' | 'doc2Claim',
    highlightId: string
  ) => {
    const row = rows[rowIndex];
    const currentClaim = row[field];
    const newSnippetIds = currentClaim.snippetIds.includes(highlightId)
      ? currentClaim.snippetIds.filter((id) => id !== highlightId)
      : [...currentClaim.snippetIds, highlightId];

    onUpdateRow(rowIndex, field, { ...currentClaim, snippetIds: newSnippetIds });
    autoSave();
  };

  return (
    <div className="space-y-4">
      {rows.map((row, idx) => (
        <div key={row.id} className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">比較維度 #{idx + 1}</h3>
              <button
                className="btn btn-ghost btn-xs text-red-400"
                onClick={() => onRemoveRow(idx)}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <input
              className="input input-sm input-bordered w-full mb-3"
              placeholder="維度名稱 (例如：研究方法)"
              value={row.dimension}
              onChange={(e) => {
                onUpdateRow(idx, 'dimension', e.target.value);
                autoSave();
              }}
            />

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-xs font-bold text-slate-500 mb-1">文獻 A</div>
                <select
                  className="select select-bordered select-xs w-full mb-2"
                  value={row.doc1Id}
                  onChange={(e) => {
                    onUpdateRow(idx, 'doc1Id', e.target.value);
                    autoSave();
                  }}
                >
                  <option value="">選擇文獻...</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
                <textarea
                  className="textarea textarea-bordered textarea-xs w-full h-20 mb-2"
                  value={row.doc1Claim.text}
                  onChange={(e) => {
                    onUpdateRow(idx, 'doc1Claim', { ...row.doc1Claim, text: e.target.value });
                    autoSave();
                  }}
                />
                <EvidenceSelector
                  selectedIds={row.doc1Claim.snippetIds}
                  onToggle={(id) => toggleEvidenceSelection(idx, 'doc1Claim', id)}
                  highlights={allHighlights}
                />
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500 mb-1">文獻 B</div>
                <select
                  className="select select-bordered select-xs w-full mb-2"
                  value={row.doc2Id}
                  onChange={(e) => {
                    onUpdateRow(idx, 'doc2Id', e.target.value);
                    autoSave();
                  }}
                >
                  <option value="">選擇文獻...</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
                <textarea
                  className="textarea textarea-bordered textarea-xs w-full h-20 mb-2"
                  value={row.doc2Claim.text}
                  onChange={(e) => {
                    onUpdateRow(idx, 'doc2Claim', { ...row.doc2Claim, text: e.target.value });
                    autoSave();
                  }}
                />
                <EvidenceSelector
                  selectedIds={row.doc2Claim.snippetIds}
                  onToggle={(id) => toggleEvidenceSelection(idx, 'doc2Claim', id)}
                  highlights={allHighlights}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                className="input input-xs input-bordered"
                placeholder="相同點 (一句話)"
                value={row.similarity}
                onChange={(e) => {
                  onUpdateRow(idx, 'similarity', e.target.value);
                  autoSave();
                }}
              />
              <input
                className="input input-xs input-bordered"
                placeholder="不同點 (一句話)"
                value={row.difference}
                onChange={(e) => {
                  onUpdateRow(idx, 'difference', e.target.value);
                  autoSave();
                }}
              />
            </div>
          </div>
        </div>
      ))}

      <button className="btn btn-outline btn-sm w-full border-dashed" onClick={onAddRow}>
        <Plus size={14} />
        新增比較維度
      </button>
    </div>
  );
};

const EvidenceSelector: React.FC<{
  selectedIds: string[];
  onToggle: (id: string) => void;
  highlights: Array<{ id: string; snippet: string; docTitle: string }>;
}> = ({ selectedIds, onToggle, highlights }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        className="btn btn-xs btn-outline btn-primary gap-1 w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <LinkIcon size={10} />
        引用標記片段 ({selectedIds.length})
      </button>

      {isOpen && (
        <div className="border border-base-300 rounded-lg p-2 bg-base-50 max-h-32 overflow-y-auto mt-1">
          {highlights.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-2">尚無標註資料</div>
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
                    <div className="text-slate-700 line-clamp-1">"{h.snippet}"</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedIds.map((id) => {
            const h = highlights.find((h) => h.id === id);
            if (!h) return null;
            return (
              <span key={id} className="badge badge-xs badge-warning gap-1">
                <span className="truncate max-w-[80px]">{h.snippet.substring(0, 20)}...</span>
                <button onClick={() => onToggle(id)} className="hover:text-red-700">
                  <X size={8} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
