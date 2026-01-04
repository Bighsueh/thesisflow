import { X, Filter, Edit2, Trash2, MapPin, Trash } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Highlight, Document } from '../types';
import { EvidenceCreateDialog } from './EvidenceCreateDialog';
import { EvidenceEditDialog } from './EvidenceEditDialog';

interface EvidenceListPanelProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onLocate?: (highlight: Highlight, document: Document) => void;
  onEdit?: (highlight: Highlight) => void;
  onRemove?: (highlightId: string) => void;
  onCreate?: (snippet: string, name?: string, page?: number) => void;
  onRemoveAll?: () => void;
}

const EVIDENCE_TYPES = ['Purpose', 'Method', 'Findings', 'Limitation', 'Other'];

export const EvidenceListPanel: React.FC<EvidenceListPanelProps> = ({
  document,
  isOpen,
  onClose,
  onLocate,
  onEdit,
  onRemove,
  onCreate,
  onRemoveAll,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPage, setFilterPage] = useState<number | null>(null);
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const highlights = document.highlights || [];

  const filteredHighlights = useMemo(() => {
    return highlights.filter((h) => {
      if (filterType !== 'all' && h.evidence_type !== filterType) return false;
      if (filterPage !== null && h.page !== filterPage) return false;
      return true;
    });
  }, [highlights, filterType, filterPage]);

  const pages = useMemo(() => {
    const pageSet = new Set<number>();
    highlights.forEach((h) => {
      if (h.page !== undefined) pageSet.add(h.page);
    });
    return Array.from(pageSet).sort((a, b) => a - b);
  }, [highlights]);

  const handleEdit = (highlight: Highlight) => {
    setEditingHighlight(highlight);
  };

  const handleEditComplete = () => {
    setEditingHighlight(null);
  };

  const handleRemove = (highlightId: string) => {
    if (window.confirm('確定要刪除此標記片段嗎？')) {
      onRemove?.(highlightId);
    }
  };

  const handleRemoveAll = () => {
    if (window.confirm(`確定要刪除「${document.title}」的所有標記片段嗎？此操作無法復原。`)) {
      onRemoveAll?.();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 覆蓋層 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 側邊面板 */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-panel-title"
      >
        {/* 標題欄 */}
        <div className="sticky top-0 bg-white border-b border-base-200 p-4 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <h2 id="evidence-panel-title" className="font-bold text-lg">
              標記片段管理
            </h2>
            <span className="badge badge-primary badge-sm">{highlights.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm btn-ghost btn-circle"
              onClick={onClose}
              aria-label="關閉標記片段面板"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 篩選器 */}
        <div className="p-4 border-b border-base-200 bg-base-50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-600">篩選</span>
              </div>
              {onRemoveAll && highlights.length > 0 && (
                <button
                  className="btn btn-xs btn-error btn-outline gap-1"
                  onClick={handleRemoveAll}
                  title="清除所有標記片段"
                >
                  <Trash size={12} />
                  清除全部
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="select select-xs select-bordered"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">所有類型</option>
                {EVIDENCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                className="select select-xs select-bordered"
                value={filterPage || ''}
                onChange={(e) => setFilterPage(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">所有頁面</option>
                {pages.map((page) => (
                  <option key={page} value={page}>
                    第 {page} 頁
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 證據列表 */}
        <div className="h-[calc(100%-8rem)] overflow-y-auto p-4">
          {filteredHighlights.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <p className="text-sm">尚無標記片段</p>
              {(filterType !== 'all' || filterPage !== null) && (
                <p className="text-xs mt-2">請調整篩選條件</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHighlights.map((highlight) => {
                return (
                  <div
                    key={highlight.id}
                    className="card bg-base-100 border border-base-300 shadow-sm"
                  >
                    <div className="card-body p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-500 truncate">
                            {document.title}
                          </div>
                          {highlight.name && (
                            <div className="text-xs font-semibold text-primary mt-1">
                              {highlight.name}
                            </div>
                          )}
                          {highlight.page && (
                            <div className="text-[10px] text-slate-400">頁碼: {highlight.page}</div>
                          )}
                          {highlight.evidence_type && (
                            <span className="badge badge-xs badge-primary mt-1">
                              {highlight.evidence_type}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-700 mb-2 line-clamp-2">
                        "{highlight.snippet}"
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {onLocate && (
                          <button
                            className="btn btn-xs btn-ghost gap-1"
                            onClick={() => onLocate(highlight, document)}
                            title="定位到 PDF"
                          >
                            <MapPin size={10} />
                            定位
                          </button>
                        )}
                        {onEdit && (
                          <button
                            className="btn btn-xs btn-ghost gap-1"
                            onClick={() => handleEdit(highlight)}
                            title="編輯標記片段"
                          >
                            <Edit2 size={10} />
                            編輯
                          </button>
                        )}
                        {onRemove && (
                          <button
                            className="btn btn-xs btn-ghost gap-1 text-red-500 hover:text-red-700"
                            onClick={() => handleRemove(highlight.id)}
                            title="刪除標記片段"
                          >
                            <Trash2 size={10} />
                            刪除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 編輯對話框 */}
      {editingHighlight && (
        <EvidenceEditDialog
          highlight={editingHighlight}
          document={document}
          onSave={(updated) => {
            onEdit?.(updated);
            handleEditComplete();
          }}
          onCancel={handleEditComplete}
        />
      )}

      {/* 新增標記片段對話框 */}
      {isCreating && onCreate && (
        <EvidenceCreateDialog
          isOpen={isCreating}
          pageNumber={filterPage || 1}
          onSave={(snippet, name) => {
            onCreate(snippet, name, filterPage || undefined);
            setIsCreating(false);
          }}
          onCancel={() => setIsCreating(false)}
        />
      )}
    </>
  );
};
