import {
  Bot,
  Send,
  FileText,
  File,
  Highlighter,
  ChevronRight,
  ArrowRight,
  X,
  MessageCircle,
  ClipboardList,
  Trash2,
  BookOpen,
  ChevronLeft,
  Link as LinkIcon,
  Users,
  CheckCircle2,
  Upload,
  GripVertical,
  ZoomIn,
  ZoomOut,
  Edit2,
  Copy,
  Tag,
  Save,
  MousePointer2,
  Target,
  Sparkles,
  LayoutTemplate,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Document as PdfDocument, Page } from 'react-pdf';
import { useNavigate } from 'react-router-dom';
import { getIncomers, getOutgoers } from 'reactflow';
import { useAuthStore } from '../authStore';
import { useAutoSave } from '../hooks/useAutoSave';
import { useStore } from '../store';
import {
  AppNode,
  Document,
  FieldWithEvidence,
  Message,
  TaskAContent,
  ComparisonRow,
  TaskCContent,
} from '../types';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChatMessage } from './ChatMessage';
import { EvidenceCreateDialog } from './EvidenceCreateDialog';
import { PDFSelector } from './PDFSelector';
import { ChecklistSubmit } from './widgets/ChecklistSubmit';
import { InstructionCard } from './widgets/InstructionCard';
import { MatrixCompare } from './widgets/MatrixCompare';
import { SectionWriter } from './widgets/SectionWriter';
import { SynthesisWriter } from './widgets/SynthesisWriter';
import '../utils/pdfConfig';

// --- Shared Components ---

const EvidenceSelector = ({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) => {
  const { documents } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  // Flatten all highlights
  const allHighlights = documents.flatMap((d) =>
    (d.highlights || []).map((h) => ({ ...h, docTitle: d.title }))
  );

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2 mb-2 min-h-[24px]">
        {selectedIds.length === 0 && (
          <span className="text-xs text-red-400 italic flex items-center gap-1">
            * 需綁定標記片段 (Evidence)
          </span>
        )}
        {selectedIds.map((id) => {
          const h = allHighlights.find((h) => h.id === id);
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
                <div className="text-slate-700">\"{h.snippet}\"</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FormField = ({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 'h-24',
}: {
  label: string;
  value: FieldWithEvidence;
  onChange: (val: FieldWithEvidence) => void;
  placeholder?: string;
  minHeight?: string;
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

// --- Evidence Type Definitions ---
type EvidenceType = 'Purpose' | 'Method' | 'Findings' | 'Limitation' | 'Other';

const EVIDENCE_TYPES: {
  type: EvidenceType;
  label: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    type: 'Purpose',
    label: '研究目的',
    color: 'bg-red-400',
    bg: 'bg-red-100',
    border: 'border-red-400',
  },
  {
    type: 'Method',
    label: '研究方法',
    color: 'bg-blue-400',
    bg: 'bg-blue-100',
    border: 'border-blue-400',
  },
  {
    type: 'Findings',
    label: '主要發現',
    color: 'bg-green-400',
    bg: 'bg-green-100',
    border: 'border-green-400',
  },
  {
    type: 'Limitation',
    label: '研究限制',
    color: 'bg-orange-400',
    bg: 'bg-orange-100',
    border: 'border-orange-400',
  },
  {
    type: 'Other',
    label: '其他',
    color: 'bg-yellow-400',
    bg: 'bg-yellow-100',
    border: 'border-yellow-400',
  },
];

// Extended Highlight type with tag and note (backward compatible)
interface ExtendedHighlight extends Highlight {
  tag?: string; // User defined short description
  note?: string; // Detailed note
  type?: EvidenceType; // For convenience, maps from evidence_type
  docTitle?: string; // Document title for display
}

// --- Design Prototype Components ---

// 1. Highlight Floating Toolbar
const HighlightFloatingToolbar = ({
  position,
  onSelectType,
  onEdit,
  onClose,
}: {
  position: { x: number; y: number };
  onSelectType: (type: EvidenceType) => void;
  onEdit: () => void;
  onClose: () => void;
}) => {
  return (
    <div
      style={{ top: `${position.y}%`, left: `${position.x}%` }}
      className="absolute z-50 transform -translate-y-full -translate-x-1/2 mt-[-10px] bg-white shadow-xl rounded-full p-1.5 flex items-center space-x-2 border border-slate-200 animate-bounce-in"
    >
      {EVIDENCE_TYPES.map((typeDef) => (
        <button
          key={typeDef.type}
          onClick={(e) => {
            e.stopPropagation();
            onSelectType(typeDef.type);
          }}
          className={`w-6 h-6 rounded-full ${typeDef.color} border-2 border-white shadow-sm hover:scale-125 transition-transform`}
          title={`標記為：${typeDef.label}`}
        />
      ))}
      <div className="w-px h-4 bg-slate-200 mx-1"></div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition-colors"
        title="編輯詳情"
      >
        <Edit2 size={14} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// 2. Highlight Hover Card (with Quick Tag Input)
const HighlightHoverCard = ({
  highlight,
  onDelete,
  onCopy,
  onUpdate,
}: {
  highlight: ExtendedHighlight;
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
  onUpdate: (id: string, updates: Partial<ExtendedHighlight>) => void;
}) => {
  const typeInfo = EVIDENCE_TYPES.find(
    (t) => t.type === (highlight.type || (highlight.evidence_type as EvidenceType) || 'Other')
  );
  const [tagInput, setTagInput] = useState(highlight.tag || highlight.name || '');
  const [isEditingTag, setIsEditingTag] = useState(false);

  const handleTagSubmit = () => {
    onUpdate(highlight.id, { tag: tagInput, name: tagInput });
    setIsEditingTag(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTagSubmit();
    }
  };

  if (!highlight.x || !highlight.y || !highlight.width || !highlight.height) return null;

  return (
    <div
      className="absolute z-40 w-80 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl border border-slate-200 p-4 animate-fadeIn flex flex-col gap-3"
      style={{
        top: `${highlight.y * 100 + (highlight.height || 0) * 100}%`,
        left: `${highlight.x * 100}%`,
        transform: 'translateY(10px)',
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('highlight', JSON.stringify(highlight));
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      {/* Header: Type & Actions */}
      <div className="flex justify-between items-center">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeInfo?.bg} ${typeInfo?.color.replace('bg-', 'text-')}`}
        >
          {typeInfo?.label}
        </span>
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(highlight.snippet);
            }}
            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
            title="複製摘要"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(highlight.id);
            }}
            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
            title="刪除標記"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Quick Tag Input Section */}
      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
        <div className="flex items-center space-x-2 text-slate-500 mb-1">
          <Tag size={12} />
          <span className="text-[10px] font-bold uppercase">標籤說明</span>
        </div>
        {isEditingTag || !highlight.tag ? (
          <div className="flex items-center space-x-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="說明這個標記的用途..."
              className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-300 outline-none"
              autoFocus
            />
            <button
              onClick={handleTagSubmit}
              className="p-1 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200"
            >
              <Save size={12} />
            </button>
          </div>
        ) : (
          <div
            className="text-xs text-slate-700 font-medium hover:bg-slate-200 rounded px-1 py-0.5 cursor-pointer flex justify-between items-center group"
            onClick={() => setIsEditingTag(true)}
            title="點擊編輯說明"
          >
            <span>{highlight.tag}</span>
            <Edit2 size={10} className="opacity-0 group-hover:opacity-100 text-slate-400" />
          </div>
        )}
      </div>

      {/* Snippet Preview */}
      <p className="text-xs text-slate-600 line-clamp-3 italic leading-relaxed pl-2 border-l-2 border-slate-200">
        "{highlight.snippet}"
      </p>

      <div className="flex items-center text-[10px] text-slate-400 pt-1">
        <GripVertical size={10} className="mr-1" />
        <span className="italic">拖曳此卡片以引用</span>
      </div>
    </div>
  );
};

// 4. Highlight Edit Modal
const HighlightEditModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tag: string, note: string) => void;
  initialData?: ExtendedHighlight | null;
}) => {
  const [name, setName] = useState(initialData?.tag || initialData?.name || '');
  const [note, setNote] = useState(initialData?.note || '');

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
        <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center">
          <h3 className="text-white font-bold text-sm">編輯標記詳情</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>
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

// 3. Highlight List Sidebar
const HighlightSidebar = ({
  isOpen,
  onClose,
  highlights,
  onDelete,
  onLocate,
}: {
  isOpen: boolean;
  onClose: () => void;
  highlights: ExtendedHighlight[];
  onDelete: (id: string) => void;
  onLocate: (h: ExtendedHighlight) => void;
}) => {
  const groupedHighlights = highlights.reduce(
    (acc, h) => {
      const type = (h.type || (h.evidence_type as EvidenceType) || 'Other') as EvidenceType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(h);
      return acc;
    },
    {} as Record<EvidenceType, ExtendedHighlight[]>
  );

  return (
    <div
      className={`
      absolute top-12 bottom-0 left-0 z-20 w-[300px] bg-white border-r border-slate-200 shadow-xl transform transition-transform duration-300 flex flex-col
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}
    >
      <div className="h-10 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50/50">
        <h3 className="font-bold text-slate-700 text-sm">標記管理 ({highlights.length})</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        {highlights.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Highlighter size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">
              尚無標記片段
              <br />
              請在 PDF 上拖曳框選
            </p>
          </div>
        ) : (
          EVIDENCE_TYPES.map((typeDef) => {
            const typeHighlights = groupedHighlights[typeDef.type];
            if (!typeHighlights || typeHighlights.length === 0) return null;

            return (
              <div key={typeDef.type} className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 flex items-center">
                  <span className={`w-2 h-2 rounded-full ${typeDef.color} mr-2`}></span>
                  {typeDef.label}
                </h4>
                {typeHighlights.map((h) => (
                  <div
                    key={h.id}
                    className="group bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-all hover:border-indigo-300 cursor-grab active:cursor-grabbing relative"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('highlight', JSON.stringify(h));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      {/* Show Tag if exists, else show Name */}
                      <span
                        className={`text-xs font-bold truncate max-w-[150px] ${h.tag ? 'text-indigo-700' : 'text-slate-700'}`}
                      >
                        {h.tag || h.name || h.snippet.substring(0, 20)}
                      </span>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onLocate(h)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="定位"
                        >
                          <Target size={12} />
                        </button>
                        <button
                          onClick={() => onDelete(h.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="刪除"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 pl-2 border-l-2 border-slate-100 italic">
                      "{h.snippet}"
                    </p>
                    <div className="absolute top-1/2 right-[-10px] transform -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:right-2 transition-all">
                      <GripVertical size={14} className="text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- Chat & Task Panel Wrappers ---

const ChatPanelWrapper = ({ currentNode: _currentNode }: { currentNode: AppNode | null }) => {
  const { documents, chatTimeline, isAiThinking, sendCoachMessage } = useStore();
  const allHighlights: ExtendedHighlight[] = documents.flatMap((d) =>
    (d.highlights || []).map((h) => ({
      ...h,
      type: (h.evidence_type as EvidenceType) || 'Other',
      tag: h.name,
      docTitle: d.title,
    }))
  );
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [showEvidenceSelector, setShowEvidenceSelector] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatTimeline, isAiThinking]);

  const handleInsertEvidence = (highlightId: string) => {
    const highlight = allHighlights.find((h) => h.id === highlightId);
    if (!highlight) return;
    const displayText =
      highlight.tag || highlight.name || highlight.snippet.substring(0, 40) + '...';
    const shortId = highlightId.substring(0, 8);
    const token = `[標記片段: ${displayText}][E${shortId}]`;
    setInputMessage((prev) => prev + token + ' ');
    setShowEvidenceSelector(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAiThinking) return;
    const message = inputMessage.trim();
    setInputMessage('');
    try {
      await sendCoachMessage(message);
    } catch (error) {
      console.error('發送訊息失敗:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const highlightData = e.dataTransfer.getData('highlight');
    if (highlightData) {
      try {
        const h = JSON.parse(highlightData);
        const highlightId = h.id;
        if (highlightId) {
          handleInsertEvidence(highlightId);
        }
      } catch (err) {
        console.error('Failed to parse highlight data', err);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
        <h3 className="text-sm font-bold text-slate-800">AI 協作助手</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30">
        {chatTimeline.length === 0 && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[90%] shadow-sm">
              <Sparkles size={14} className="inline text-indigo-600 mr-1" />
              試試將標記片段直接拖曳進來，我可以為你分析。
            </div>
          </div>
        )}
        {chatTimeline.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isAiThinking && (
          <div className="chat chat-start">
            <div className="chat-bubble bg-white border border-slate-100 text-slate-500 text-xs">
              <span className="loading loading-dots loading-xs"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div
        className={`p-3 bg-white border-t transition-colors ${
          isDragOver ? 'bg-indigo-50 border-indigo-300' : 'border-slate-100'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="flex gap-2 mb-2">
          <button
            className="btn btn-xs btn-outline btn-primary gap-1"
            onClick={() => setShowEvidenceSelector(!showEvidenceSelector)}
          >
            <LinkIcon size={12} />
            插入標記片段
          </button>
        </div>
        {showEvidenceSelector && (
          <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 max-h-32 overflow-y-auto mb-2">
            {allHighlights.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-2">尚無標註資料</div>
            ) : (
              <div className="space-y-1">
                {allHighlights.map((h) => (
                  <div
                    key={h.id}
                    className="p-1.5 border rounded cursor-pointer hover:bg-slate-100 flex gap-2 items-start text-xs"
                    onClick={() => handleInsertEvidence(h.id)}
                  >
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
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            className="textarea textarea-bordered textarea-sm flex-1 resize-none"
            placeholder={isDragOver ? '放開以引用標記...' : '輸入訊息或拖曳標記至此...'}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={2}
          />
          <button
            className="btn btn-primary btn-sm gap-2"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isAiThinking}
          >
            <Send size={14} />
            發送
          </button>
        </div>
        <div className="text-[10px] text-center text-slate-400 mt-1">
          AI 僅提供引導，不會直接代寫
        </div>
      </div>
    </div>
  );
};

// Default sections for task_summary (backward compatible)
const DEFAULT_SECTIONS = [
  {
    key: 'a1_purpose',
    label: 'A1 研究目的 (Purpose)',
    placeholder: '研究問題為何？',
    minEvidence: 1,
  },
  {
    key: 'a2_method',
    label: 'A2 研究方法 (Method)',
    placeholder: '採用了什麼方法？',
    minEvidence: 1,
  },
  {
    key: 'a3_findings',
    label: 'A3 主要發現 (Findings)',
    placeholder: '核心結論為何？',
    minEvidence: 1,
  },
  {
    key: 'a4_limitations',
    label: 'A4 研究限制 (Limitations)',
    placeholder: '作者自述或觀察到的限制...',
    minEvidence: 1,
  },
];

// TaskWidget component - extracts widget rendering logic from ChatMainPanel
const TaskWidget = ({ currentNode }: { currentNode: AppNode | null }) => {
  const {
    documents,
    currentWidgetState,
    updateWidgetState,
    currentStepId,
    submitTaskA,
    taskBData,
    updateTaskBRow,
    addTaskBRow,
    removeTaskBRow,
    submitTaskBCheck,
    taskCData,
    updateTaskC,
    submitTaskCCheck,
    initializeTaskBDataForNode,
    completeNode,
    nodes,
    edges,
    navigateNext,
    navigatePrev,
  } = useStore();
  const autoSave = useAutoSave(1000);

  useEffect(() => {
    if (currentNode?.data.type === 'task_comparison' && currentNode.data.config?.dimensions) {
      const dimensions = currentNode.data.config.dimensions;
      if (dimensions.length > 0 && taskBData.length === 0) {
        initializeTaskBDataForNode(currentNode.id, dimensions);
      }
    }
  }, [
    currentStepId,
    currentNode?.data.config?.dimensions,
    initializeTaskBDataForNode,
    taskBData.length,
  ]);

  const renderNavigationButtons = () => {
    if (!currentNode) return null;
    const incomers = getIncomers(currentNode, nodes, edges);
    const outgoers = getOutgoers(currentNode, nodes, edges);
    const hasPrevious = incomers.length > 0 && currentNode.data.type !== 'start';
    const hasNext = outgoers.length > 0 && currentNode.data.type !== 'end';
    return (
      <div className="card bg-base-100 border border-base-300 shadow-sm mt-4">
        <div className="card-body p-4">
          <div className="flex gap-2">
            {hasPrevious && (
              <button className="btn btn-sm btn-outline flex-1" onClick={navigatePrev}>
                <ChevronLeft size={14} /> 上一步
              </button>
            )}
            {hasNext && (
              <button className="btn btn-sm btn-primary flex-1" onClick={navigateNext}>
                下一步 <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getSectionStatus = (value: any, minEvidence: number = 1) => {
    if (!value) return false;
    return value.text?.trim().length > 0 && (value.snippetIds?.length || 0) >= minEvidence;
  };

  if (!currentNode) return null;

  const nodeType = currentNode.data.type;

  if (nodeType === 'task_summary') {
    const sections = currentNode.data.config?.sections || DEFAULT_SECTIONS;
    const widgetState = currentWidgetState[currentNode.id] || {};
    const values: Record<string, FieldWithEvidence> = {};
    sections.forEach((section) => {
      values[section.key] = widgetState[section.key] || { text: '', snippetIds: [] };
    });

    const handleUpdate = (key: string, value: FieldWithEvidence) => {
      updateWidgetState(currentNode.id, { ...widgetState, [key]: value });
      autoSave();
    };

    const handleSubmit = async () => {
      const selectedDoc = documents.find((d) => d.id === widgetState.selectedDocId);
      if (!selectedDoc) {
        alert('請先選擇目標文獻');
        return;
      }
      const content: TaskAContent = {};
      sections.forEach((section) => {
        content[section.key] = values[section.key];
      });
      try {
        await submitTaskA(selectedDoc.id, content);
        completeNode(currentNode.id);
      } catch (error) {
        console.error('提交失敗:', error);
      }
    };

    const checks = [
      { id: 'doc', label: '已選擇目標文獻', checked: !!widgetState.selectedDocId, required: true },
      ...sections.map((section) => ({
        id: section.key,
        label: `${section.label}已完成`,
        checked: getSectionStatus(
          values[section.key],
          section.minEvidence || currentNode.data.config?.minEvidence || 1
        ),
        required: true,
      })),
    ];

    return (
      <div className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold text-sm">選擇目標文獻</span>
          </label>
          <select
            className="select select-bordered select-sm"
            value={widgetState.selectedDocId || ''}
            onChange={(e) => {
              updateWidgetState(currentNode.id, {
                ...widgetState,
                selectedDocId: e.target.value,
              });
              autoSave();
            }}
          >
            <option value="" disabled>
              請選擇目標文獻...
            </option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
        <SectionWriter
          nodeId={currentNode.id}
          sections={sections}
          selectedDocId={widgetState.selectedDocId}
          onUpdate={handleUpdate}
          values={values}
        />
        <ChecklistSubmit
          nodeId={currentNode.id}
          checks={checks}
          onSubmit={handleSubmit}
          onSubmitLabel="提交檢核"
        />
        {renderNavigationButtons()}
      </div>
    );
  }

  if (nodeType === 'task_comparison') {
    const minEvidence = currentNode.data.config?.minEvidence || 1;

    const handleUpdateRow = (
      index: number,
      field: keyof ComparisonRow | 'doc1Claim' | 'doc2Claim',
      value: any
    ) => {
      if (field === 'doc1Claim' || field === 'doc2Claim') {
        updateTaskBRow(index, field, value);
      } else {
        updateTaskBRow(index, field, value);
      }
    };

    const checks = taskBData.map((row, idx) => ({
      id: `row-${idx}`,
      label: `維度 ${idx + 1}: ${row.dimension || '未命名'}`,
      checked: !!(
        row.dimension &&
        row.doc1Id &&
        row.doc2Id &&
        row.doc1Claim.text &&
        row.doc2Claim.text &&
        row.doc1Claim.snippetIds.length >= minEvidence &&
        row.doc2Claim.snippetIds.length >= minEvidence
      ),
      required: true,
    }));

    const handleSubmitB = async () => {
      try {
        await submitTaskBCheck();
        completeNode(currentNode.id);
      } catch (error) {
        console.error('提交失敗:', error);
      }
    };

    return (
      <div className="space-y-4">
        <MatrixCompare
          nodeId={currentNode.id}
          rows={taskBData}
          onUpdateRow={handleUpdateRow}
          onAddRow={addTaskBRow}
          onRemoveRow={removeTaskBRow}
          documents={documents.map((d) => ({ id: d.id, title: d.title }))}
        />
        <ChecklistSubmit
          nodeId={currentNode.id}
          checks={checks}
          onSubmit={handleSubmitB}
          onSubmitLabel="提交比較表"
        />
        {renderNavigationButtons()}
      </div>
    );
  }

  if (nodeType === 'task_synthesis') {
    const slots = [
      {
        key: 'c1_theme' as keyof TaskCContent,
        label: 'C1 主題句 (Theme)',
        placeholder: '本段落要探討的核心主題...',
        minEvidence: 1,
      },
      {
        key: 'c2_evidence' as keyof TaskCContent,
        label: 'C2 跨篇標記片段 (Evidence)',
        placeholder: '綜合多篇文獻的觀察...',
        minEvidence: 2,
      },
      {
        key: 'c3_boundary' as keyof TaskCContent,
        label: 'C3 差異界線 (Boundary)',
        placeholder: '雖然...但是... (指出適用範圍或對立點)',
        minEvidence: 1,
      },
      {
        key: 'c4_gap' as keyof TaskCContent,
        label: 'C4 意義與缺口 (Gap)',
        placeholder: '因此... 目前尚未... (指出研究機會)',
        minEvidence: 1,
      },
    ];

    const checks = [
      {
        id: 'c1',
        label: 'C1 主題句已完成',
        checked: getSectionStatus(taskCData.c1_theme),
        required: true,
      },
      {
        id: 'c2',
        label: 'C2 跨篇標記片段已完成（需至少 2 則）',
        checked:
          taskCData.c2_evidence.snippetIds.length >= 2 &&
          taskCData.c2_evidence.text.trim().length > 0,
        required: true,
      },
      {
        id: 'c3',
        label: 'C3 差異界線已完成',
        checked: getSectionStatus(taskCData.c3_boundary),
        required: true,
      },
      {
        id: 'c4',
        label: 'C4 意義與缺口已完成',
        checked: getSectionStatus(taskCData.c4_gap),
        required: true,
      },
    ];

    const handleSubmitC = async () => {
      try {
        await submitTaskCCheck();
        completeNode(currentNode.id);
      } catch (error) {
        console.error('提交失敗:', error);
      }
    };

    return (
      <div className="space-y-4">
        <SynthesisWriter
          nodeId={currentNode.id}
          slots={slots}
          values={taskCData}
          onUpdate={updateTaskC}
        />
        <ChecklistSubmit
          nodeId={currentNode.id}
          checks={checks}
          onSubmit={handleSubmitC}
          onSubmitLabel="提交綜合分析"
        />
        {renderNavigationButtons()}
      </div>
    );
  }

  if (nodeType === 'resource') {
    return (
      <div className="space-y-4">
        <InstructionCard
          node={currentNode}
          minEvidence={currentNode.data.config?.minEvidence || 0}
          currentEvidenceCount={documents.flatMap((d) => d.highlights || []).length}
        />
        {renderNavigationButtons()}
      </div>
    );
  }

  return null;
};

const TaskPanelWrapper = ({ currentNode }: { currentNode: AppNode | null }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50/30">
      <div className="p-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
        <h3 className="text-sm font-bold text-slate-800">任務表單</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <TaskWidget currentNode={currentNode} />
      </div>
    </div>
  );
};

// --- Panel Components (Library, Reader, Chat) ---
// Keeping these condensed as they are similar to previous logic, focusing on the Tasks update

// DocCard Component (for LibraryDrawer)
const DocCard = ({
  doc,
  source,
  onDragStart,
  onDelete,
  onClick,
}: {
  doc: Document;
  source: 'project' | 'library';
  onDragStart: (e: React.DragEvent, doc: Document, source: 'project' | 'library') => void;
  onDelete?: (id: string) => void;
  onClick?: (doc: Document) => void;
}) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, doc, source)}
    onClick={() => onClick && onClick(doc)}
    className={`group relative flex items-center p-3 mb-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
      source === 'project'
        ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
        : 'bg-slate-50 border-slate-200 border-dashed hover:border-indigo-300 hover:bg-white'
    }`}
  >
    <div className="mr-3 text-slate-400 group-hover:text-indigo-500">
      <GripVertical size={16} />
    </div>
    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3 shrink-0">
      {doc.type === 'pdf' ? <FileText size={16} /> : <File size={16} />}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-medium text-slate-700 truncate group-hover:text-indigo-700 transition-colors">
        {doc.title}
      </h4>
    </div>
    {source === 'project' && onDelete && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(doc.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
      >
        <Trash2 size={14} />
      </button>
    )}
  </div>
);

const LibraryPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const {
    documents,
    uploadDocument,
    uploadFileDocument,
    removeDocument,
    selectDocument,
    activeProjectId,
    bindDocumentsToProject,
    unbindDocumentsFromProject,
    loadDocuments,
  } = useStore();
  const [uploadMode, setUploadMode] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [isDragOverProjectDocs, setIsDragOverProjectDocs] = useState(false);
  const [isDragOverLibrary, setIsDragOverLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 載入所有可用文檔（未綁定到專案的）
  useEffect(() => {
    const loadAvailableDocuments = async () => {
      if (!activeProjectId) return;
      const API_BASE =
        ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:8000';
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE}/api/documents`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const allDocs: Document[] = await res.json();
        // 只顯示未綁定到任何專案的文檔
        setAvailableDocuments(allDocs.filter((d) => !d.project_id));
      }
    };
    if (isOpen) {
      loadAvailableDocuments();
    }
  }, [isOpen, activeProjectId]);

  const handleDocumentDragStart = (e: React.DragEvent, docId: string) => {
    e.dataTransfer.setData('application/document-id', docId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    const base = file.name.replace(/\.[^/.]+$/, '');
    if (!newTitle) {
      setNewTitle(base);
    }
    if (file.type !== 'application/pdf') {
      try {
        const text = await file.text();
        setNewContent(text);
      } catch {
        // ignore error, allow manual paste
      }
    } else {
      setNewContent('');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleUpload = async () => {
    try {
      // PDF 檔案優先走檔案上傳流程
      if (selectedFile && selectedFile.type === 'application/pdf') {
        const title = newTitle || selectedFile.name.replace(/\.[^/.]+$/, '');
        await uploadFileDocument(title, selectedFile);
      } else if (newTitle && newContent) {
        // 一般文字檔 / 貼上文字
        await uploadDocument(newTitle, newContent);
      } else {
        throw new Error('請先選擇檔案或貼上文字內容');
      }
      setUploadMode(false);
      onClose();
      setNewTitle('');
      setNewContent('');
      setSelectedFile(null);
      alert('文獻已上傳成功');
    } catch (e: any) {
      alert(`文獻上傳失敗：${e?.message || e || '未知錯誤'}`);
    }
  };

  const handleDragStart = (e: React.DragEvent, doc: Document, source: 'project' | 'library') => {
    if (source === 'project') {
      e.dataTransfer.setData('application/project-document-id', doc.id);
    } else {
      handleDocumentDragStart(e, doc.id);
    }
    e.dataTransfer.setData('source', source);
  };

  const handleMoveDoc = async (
    docId: string,
    from: 'project' | 'library',
    to: 'project' | 'library'
  ) => {
    if (!activeProjectId) return;
    try {
      if (from === 'library' && to === 'project') {
        await bindDocumentsToProject([docId], activeProjectId);
      } else if (from === 'project' && to === 'library') {
        await unbindDocumentsFromProject([docId], activeProjectId);
      }
      await loadDocuments(activeProjectId);
      // 重新載入可用文檔列表
      const API_BASE =
        ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:8000';
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE}/api/documents`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const allDocs: Document[] = await res.json();
        setAvailableDocuments(allDocs.filter((d) => !d.project_id));
      }
    } catch (error: any) {
      alert(`操作失敗：${error?.message || error || '未知錯誤'}`);
    }
  };

  if (!isOpen) return null;
  return (
    <>
      <div
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      ></div>
      <div
        className={`absolute inset-y-0 left-0 z-50 w-[800px] bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center space-x-2">
            <BookOpen className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800">文獻庫管理</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 flex overflow-hidden bg-slate-50/50">
          {/* 專案綁定文檔 */}
          <div
            className={`flex-1 flex flex-col border-r border-slate-200 p-4 ${
              isDragOverProjectDocs ? 'bg-indigo-50/50' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (e.dataTransfer.types.includes('application/document-id')) {
                setIsDragOverProjectDocs(true);
                e.dataTransfer.dropEffect = 'move';
              }
            }}
            onDragLeave={() => setIsDragOverProjectDocs(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOverProjectDocs(false);
              const docId = e.dataTransfer.getData('application/document-id');
              const source = e.dataTransfer.getData('source') as 'project' | 'library';
              if (docId && source === 'library') {
                handleMoveDoc(docId, 'library', 'project');
              }
            }}
          >
            <h3 className="font-bold text-slate-700 mb-4">專案綁定文檔</h3>
            <div className="flex-1 overflow-y-auto">
              {documents.length === 0 ? (
                <div
                  className={`text-xs py-6 text-center rounded-lg border-2 border-dashed transition-colors ${
                    isDragOverProjectDocs
                      ? 'text-indigo-600 border-indigo-300 bg-indigo-50/60'
                      : 'text-slate-400 border-slate-200 bg-white'
                  }`}
                >
                  {isDragOverProjectDocs ? '放開以加入文檔' : '拖曳文獻到此處以加入專案'}
                </div>
              ) : (
                documents.map((doc) => (
                  <DocCard
                    key={doc.id}
                    doc={doc}
                    source="project"
                    onDragStart={handleDragStart}
                    onDelete={removeDocument}
                    onClick={(d) => {
                      selectDocument(d.id);
                      onClose();
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* 全域文獻庫 */}
          <div
            className={`flex-1 flex flex-col p-4 ${isDragOverLibrary ? 'bg-red-50/30' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (e.dataTransfer.types.includes('application/project-document-id')) {
                setIsDragOverLibrary(true);
                e.dataTransfer.dropEffect = 'move';
              }
            }}
            onDragLeave={() => setIsDragOverLibrary(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOverLibrary(false);
              const docId = e.dataTransfer.getData('application/project-document-id');
              if (docId) {
                handleMoveDoc(docId, 'project', 'library');
              }
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700">全域文獻庫</h3>
              <button
                className="text-xs px-2 py-1 rounded-md border border-slate-200 bg-white hover:border-indigo-300 hover:text-indigo-600"
                onClick={() => setUploadMode((v) => !v)}
              >
                <Upload size={14} className="inline mr-1" /> 上傳
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {availableDocuments.length === 0 ? (
                <div
                  className={`text-xs py-6 text-center rounded-lg border-2 border-dashed transition-colors ${
                    isDragOverLibrary
                      ? 'text-red-500 border-red-300 bg-red-50'
                      : 'text-slate-400 border-slate-200 bg-white'
                  }`}
                >
                  {isDragOverLibrary ? '放開以解除綁定' : '拖拽專案文檔到此處以解除綁定'}
                </div>
              ) : (
                availableDocuments.map((doc) => (
                  <DocCard doc={doc} source="library" onDragStart={handleDragStart} key={doc.id} />
                ))
              )}
            </div>

            {uploadMode && (
              <div className="mt-4 border-t border-slate-200 pt-4 space-y-3">
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-sm cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                      : 'border-slate-300 bg-white text-slate-600'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <p className="font-semibold mb-1">拖拉檔案到此處，或點擊選擇檔案</p>
                  <p className="text-xs text-slate-500">
                    支援純文字檔（.txt）與 PDF。PDF 會以檔案形式儲存供後續引用。
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,text/plain,.pdf,application/pdf"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </div>
                <input
                  className="input input-sm input-bordered w-full"
                  placeholder="文獻標題"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <textarea
                  className="textarea textarea-sm textarea-bordered w-full h-24"
                  placeholder="貼上文字內容..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-ghost flex-1"
                    onClick={() => setUploadMode(false)}
                  >
                    取消
                  </button>
                  <button className="btn btn-sm btn-primary flex-1" onClick={handleUpload}>
                    確認
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const ReaderPanel = () => {
  const {
    documents,
    currentDocId,
    addHighlight,
    removeHighlight,
    updateHighlight,
    getCachedFileUrl,
    activeProjectId,
    bindDocumentsToProject,
    loadDocuments,
    removeAllHighlights,
  } = useStore();
  const [isLibraryOpen, setLibraryOpen] = useState(false);
  const [isEvidencePanelOpen, setIsEvidencePanelOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pageCount, setPageCount] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [selectionToolbar, setSelectionToolbar] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [evidenceType, setEvidenceType] = useState<string>('Other');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectionMode, _setSelectionMode] = useState<'text' | 'box'>('box'); // 'text' 或 'box'
  const [pendingSelection, setPendingSelection] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    text?: string;
  } | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [hoveredHighlightId, setHoveredHighlightId] = useState<string | null>(null);
  const [toolbarRect, setToolbarRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [currentRect, setCurrentRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pdfPageTexts = useRef<Map<number, any>>(new Map()); // 存儲每頁的文本內容和頁面實例
  const pageRef = useRef<HTMLDivElement>(null);
  const doc = documents.find((d) => d.id === currentDocId);

  // Convert highlights to ExtendedHighlight format
  const extendedHighlights: ExtendedHighlight[] = (doc?.highlights || []).map((h) => ({
    ...h,
    type: (h.evidence_type as EvidenceType) || 'Other',
    tag: h.name, // Use name as tag for now
  }));

  const handleDocumentDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const docId = e.dataTransfer.getData('application/document-id');
    if (docId && activeProjectId) {
      try {
        await bindDocumentsToProject([docId], activeProjectId);
        await loadDocuments(activeProjectId);
      } catch (error: any) {
        alert(`加入文檔失敗：${error?.message || error || '未知錯誤'}`);
      }
    }
  };

  const handleDocumentDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('application/document-id')) {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDocumentDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有當離開整個 ReaderPanel 時才設置為 false
    const currentTarget = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleCreateEvidence = async () => {
    if (selectionToolbar && currentDocId) {
      await addHighlight(currentDocId, selectionToolbar.text, { evidence_type: evidenceType });
      window.getSelection()?.removeAllRanges();
      setSelectionToolbar(null);
    }
  };

  const handleBoxSelection = (selection: {
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    text?: string;
  }) => {
    if (!currentDocId) return;
    // Show floating toolbar instead of dialog
    setToolbarRect({
      x: selection.x + selection.width / 2,
      y: selection.y,
      w: selection.width,
      h: selection.height,
    });
    setPendingSelection(selection);
  };

  const getRelativePos = (e: React.MouseEvent) => {
    if (!pageRef.current) return { x: 0, y: 0 };
    const rect = pageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input'))
      return;
    if (!doc || (doc.type !== 'pdf' && doc.content_type !== 'application/pdf')) return;

    setIsDrawing(true);
    const pos = getRelativePos(e);
    setStartPos(pos);
    setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
    setToolbarRect(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const pos = getRelativePos(e);
    const w = pos.x - startPos.x;
    const h = pos.y - startPos.y;
    setCurrentRect({
      x: w > 0 ? startPos.x : pos.x,
      y: h > 0 ? startPos.y : pos.y,
      w: Math.abs(w),
      h: Math.abs(h),
    });
  };

  const handleMouseUp = () => {
    // Handle box drawing first
    if (isDrawing) {
      setIsDrawing(false);
      if (currentRect && (currentRect.w > 1 || currentRect.h > 1)) {
        setToolbarRect(currentRect);
      } else {
        setCurrentRect(null);
        setToolbarRect(null);
      }
      return;
    }

    // Handle text selection (for non-PDF documents or text selection mode)
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const text = selection.toString().trim();
      if (text.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionToolbar({
          text,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
      }
    }
  };

  const handleQuickCreate = async (type: EvidenceType) => {
    if (toolbarRect && currentDocId && pendingSelection) {
      await addHighlight(currentDocId, pendingSelection.text || '選取的內容', {
        evidence_type: type,
        page: pendingSelection.page,
        x: pendingSelection.x,
        y: pendingSelection.y,
        width: pendingSelection.width,
        height: pendingSelection.height,
      });
      setToolbarRect(null);
      setCurrentRect(null);
      setPendingSelection(null);
    }
  };

  const handleEditCreate = () => {
    if (toolbarRect && pendingSelection) {
      setIsCreateDialogOpen(true);
    }
  };

  const handleCreateEvidenceFromDialog = async (snippet: string, name?: string) => {
    if (!currentDocId || !pendingSelection) return;
    await addHighlight(currentDocId, snippet, {
      name: name,
      page: pendingSelection.page,
      x: pendingSelection.x,
      y: pendingSelection.y,
      width: pendingSelection.width,
      height: pendingSelection.height,
    });
    setPendingSelection(null);
    setIsCreateDialogOpen(false);
  };

  const handleLocateHighlight = (highlight: ExtendedHighlight) => {
    if (highlight.page && pdfContainerRef.current) {
      // 滾動到對應頁面
      const pageElement = pageRefs.current.get(highlight.page);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    setIsEvidencePanelOpen(false);
  };

  const handleUpdateHighlight = async (id: string, updates: Partial<ExtendedHighlight>) => {
    await updateHighlight(id, {
      name: updates.tag || updates.name,
      evidence_type: updates.type || updates.evidence_type,
    });
    await loadDocuments(activeProjectId || undefined);
  };

  const handleCopyHighlight = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const _handleEditHighlight = async (_highlight: Highlight) => {
    // 編輯功能由 EvidenceListPanel 中的對話框處理
    // 這裡只需要確保狀態更新
    await loadDocuments(activeProjectId || undefined);
  };

  const handleRemoveHighlight = async (highlightId: string) => {
    await removeHighlight(highlightId);
  };

  const _handleCreateHighlight = async (snippet: string, name?: string, page?: number) => {
    if (!currentDocId) return;
    await addHighlight(currentDocId, snippet, {
      name,
      page,
    });
  };

  const _handleRemoveAllHighlights = async () => {
    if (!currentDocId) return;
    await removeAllHighlights(currentDocId);
  };

  const handleCancelSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSelectionToolbar(null);
  };
  useEffect(() => {
    if (!doc) {
      setPreviewUrl(null);
      setPreviewLoading(false);
      setPageCount(0);
      setZoom(1.0);
      return;
    }
    const isImage = doc.content_type?.startsWith('image/');
    const isPdf = doc.type === 'pdf' || doc.content_type === 'application/pdf';
    if (isImage || isPdf) {
      setPreviewLoading(true);
      getCachedFileUrl(doc.object_key)
        .then((url) => setPreviewUrl(url))
        .finally(() => setPreviewLoading(false));
    } else {
      setPreviewUrl(null);
      setPreviewLoading(false);
      setPageCount(0);
      setZoom(1.0);
    }
  }, [doc, getCachedFileUrl]);

  // 自動計算 PDF 縮放比例
  const calculateAutoZoom = () => {
    if (!pdfContainerRef.current) return;
    const container = pdfContainerRef.current;
    // 獲取容器的實際可用寬度（減去邊框和內邊距）
    const containerWidth = container.clientWidth - 4; // 減去邊框寬度 (border = 2px * 2)
    if (containerWidth <= 0) return;

    // 標準 PDF 寬度：A4 紙張寬度為 210mm，在 96 DPI 下約為 794px
    // 但考慮到實際顯示，我們使用 612pt (標準 PDF 點數) = 816px (96 DPI)
    // 為了讓 PDF 能夠適應容器，我們計算合適的縮放比例
    // 目標：讓 PDF 寬度約為容器寬度的 95%（留一些邊距）
    const targetWidth = containerWidth * 0.95;
    const basePdfWidth = 612; // PDF 標準寬度 (pt)
    const basePdfWidthPx = basePdfWidth * (96 / 72); // 轉換為像素 (96 DPI)

    // 計算縮放比例：目標寬度 / 基準寬度
    const autoZoom = (targetWidth / basePdfWidthPx) * 1.68;

    // 限制在合理範圍內 (0.5 到 2.5)
    const clampedZoom = Math.max(0.5, Math.min(2.5, autoZoom));
    setZoom(clampedZoom);
  };

  // 當 PDF 載入成功或容器大小改變時，重新計算縮放
  useEffect(() => {
    if (previewUrl && (doc?.type === 'pdf' || doc?.content_type === 'application/pdf')) {
      // 延遲一下以確保容器已經渲染
      const timer = setTimeout(() => {
        calculateAutoZoom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [previewUrl, doc, pageCount]);

  // 監聽窗口大小變化
  useEffect(() => {
    if (previewUrl && (doc?.type === 'pdf' || doc?.content_type === 'application/pdf')) {
      const handleResize = () => {
        calculateAutoZoom();
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [previewUrl, doc]);

  return (
    <div
      className={`flex flex-col h-full bg-slate-50/50 relative overflow-hidden transition-colors ${
        isDragOver ? 'bg-indigo-50/80' : ''
      }`}
      onDragOver={handleDocumentDragOver}
      onDragLeave={handleDocumentDragLeave}
      onDrop={handleDocumentDrop}
      onMouseUp={handleMouseUp}
    >
      <LibraryPanel isOpen={isLibraryOpen} onClose={() => setLibraryOpen(false)} />
      <HighlightSidebar
        isOpen={isEvidencePanelOpen}
        onClose={() => setIsEvidencePanelOpen(false)}
        highlights={extendedHighlights}
        onDelete={handleRemoveHighlight}
        onLocate={handleLocateHighlight}
      />

      {/* PDF Toolbar */}
      <div
        className={`h-12 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 sticky top-0 z-10 transition-colors ${
          isDragOver ? 'bg-indigo-50 border-indigo-300' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.types.includes('application/document-id')) {
            setIsDragOver(true);
            e.dataTransfer.dropEffect = 'move';
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const currentTarget = e.currentTarget as HTMLElement;
          const relatedTarget = e.relatedTarget as HTMLElement;
          if (!currentTarget.contains(relatedTarget)) {
            setIsDragOver(false);
          }
        }}
        onDrop={handleDocumentDrop}
      >
        <div className="flex items-center space-x-3 max-w-[60%]">
          <button
            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-600 hover:text-indigo-600 transition-all shadow-sm group shrink-0"
            onClick={() => setLibraryOpen(!isLibraryOpen)}
          >
            <BookOpen
              size={14}
              className="text-slate-500 group-hover:text-indigo-600 transition-colors"
            />
            <span className="text-xs font-medium">文獻庫</span>
          </button>
          <button
            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-600 hover:text-indigo-600 transition-all shadow-sm group shrink-0"
            onClick={() => setIsEvidencePanelOpen((prev) => !prev)}
            disabled={!doc}
          >
            <Highlighter
              size={14}
              className="text-slate-500 group-hover:text-indigo-600 transition-colors"
            />
            <span className="text-xs font-medium">標記列表</span>
            {doc && (
              <span className="bg-indigo-100 text-indigo-700 px-1.5 rounded-full text-[10px] font-bold">
                {doc.highlights?.length || 0}
              </span>
            )}
          </button>
          <div className="h-4 w-px bg-slate-300 shrink-0"></div>
          {documents.length === 0 ? (
            <div className="text-[11px] text-slate-400 italic">
              {isDragOver ? '放開以加入文檔' : '拖曳文獻到此處以加入專案'}
            </div>
          ) : (
            <span className="text-sm font-medium text-slate-700 truncate">
              {doc?.title || '請選擇文獻'}
            </span>
          )}
        </div>

        {doc && (doc.type === 'pdf' || doc.content_type === 'application/pdf') && (
          <div className="flex items-center space-x-2 shrink-0">
            <div className="flex items-center bg-slate-100 rounded-lg px-2 py-1 mr-2 text-xs text-slate-500">
              <MousePointer2 size={12} className="mr-1" />
              <span>拖曳框選</span>
            </div>
            <button
              className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500"
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs text-slate-500 font-mono">{Math.round(zoom * 100)}%</span>
            <button
              className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500"
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}
            >
              <ZoomIn size={16} />
            </button>
          </div>
        )}
      </div>

      {/* PDF Page View Container */}
      <div
        className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar select-none"
        onMouseMove={handleMouseMove}
      >
        {!doc ? (
          <div className="grid place-items-center h-full text-slate-400">請選擇文獻</div>
        ) : (
          <div
            ref={pageRef}
            className="w-full max-w-3xl bg-white shadow-sm border border-slate-200 min-h-[1000px] p-10 relative cursor-crosshair"
            onMouseDown={handleMouseDown}
          >
            {/* Highlights Overlay */}
            {extendedHighlights
              .filter((h) => h.document_id === currentDocId)
              .map((h) => {
                const typeInfo = EVIDENCE_TYPES.find((t) => t.type === h.type);
                if (!h.x || !h.y || !h.width || !h.height) return null;

                return (
                  <React.Fragment key={h.id}>
                    <div
                      className={`absolute transition-opacity z-10 cursor-pointer ${typeInfo?.bg} opacity-30 hover:opacity-50 border-b-2 ${typeInfo?.border}`}
                      style={{
                        left: `${h.x * 100}%`,
                        top: `${h.y * 100}%`,
                        width: `${h.width * 100}%`,
                        height: `${h.height * 100}%`,
                      }}
                      onMouseEnter={() => setHoveredHighlightId(h.id)}
                      onMouseLeave={() => setHoveredHighlightId(null)}
                    />
                    {hoveredHighlightId === h.id && (
                      <HighlightHoverCard
                        highlight={h}
                        onDelete={handleRemoveHighlight}
                        onCopy={handleCopyHighlight}
                        onUpdate={handleUpdateHighlight}
                      />
                    )}
                  </React.Fragment>
                );
              })}

            {/* Current Selection Rect */}
            {currentRect && (
              <div
                className="absolute bg-indigo-500/20 border-2 border-indigo-500 z-20"
                style={{
                  left: `${currentRect.x}%`,
                  top: `${currentRect.y}%`,
                  width: `${currentRect.w}%`,
                  height: `${currentRect.h}%`,
                }}
              />
            )}

            {/* Floating Creation Toolbar */}
            {toolbarRect && (
              <HighlightFloatingToolbar
                position={{ x: toolbarRect.x + toolbarRect.w / 2, y: toolbarRect.y }}
                onSelectType={handleQuickCreate}
                onEdit={handleEditCreate}
                onClose={() => {
                  setToolbarRect(null);
                  setCurrentRect(null);
                  setPendingSelection(null);
                }}
              />
            )}

            {/* PDF Content */}
            <div className="relative z-0 pointer-events-none">
              {previewLoading && <div className="text-slate-500 text-sm">預覽載入中...</div>}

              {!previewLoading && doc.content_type?.startsWith('image/') && previewUrl && (
                <img
                  src={previewUrl}
                  alt={doc.title}
                  className="max-h-[70vh] max-w-full object-contain border border-base-200 rounded-md"
                />
              )}

              {!previewLoading &&
                (doc.type === 'pdf' || doc.content_type === 'application/pdf') &&
                previewUrl && (
                  <div
                    ref={pdfContainerRef}
                    className="border border-base-200 rounded-md overflow-auto max-h-[70vh] bg-white pointer-events-auto"
                  >
                    <PdfDocument
                      file={previewUrl}
                      onLoadSuccess={({ numPages }) => setPageCount(numPages)}
                      loading={<div className="p-4 text-sm text-slate-500">PDF 載入中...</div>}
                      error={<div className="p-4 text-sm text-red-500">PDF 載入失敗</div>}
                    >
                      {Array.from({ length: pageCount || 1 }, (_, i) => {
                        const pageNum = i + 1;

                        return (
                          <div
                            key={i}
                            ref={(el) => {
                              if (el) pageRefs.current.set(pageNum, el);
                              else pageRefs.current.delete(pageNum);
                            }}
                            style={{
                              position: 'relative',
                              marginBottom: '8px',
                              display: 'inline-block',
                              width: '100%',
                              textAlign: 'center',
                            }}
                          >
                            <Page
                              pageNumber={pageNum}
                              renderAnnotationLayer={false}
                              renderTextLayer={true}
                              width={520 * zoom}
                              onGetTextSuccess={(text) => {
                                const current = pdfPageTexts.current.get(pageNum) || {};
                                pdfPageTexts.current.set(pageNum, { ...current, text });
                              }}
                              onRenderSuccess={(pageInfo) => {
                                const current = pdfPageTexts.current.get(pageNum) || {};
                                pdfPageTexts.current.set(pageNum, {
                                  ...current,
                                  page: pageInfo?.page || pageInfo,
                                });
                              }}
                            />
                            {/* 選擇器覆蓋層 - 保留原有功能 */}
                            {selectionMode === 'box' && (
                              <PDFSelector
                                pageNumber={pageNum}
                                pageData={pdfPageTexts.current.get(pageNum)}
                                onSelect={handleBoxSelection}
                                disabled={false}
                              />
                            )}
                          </div>
                        );
                      })}
                    </PdfDocument>
                  </div>
                )}

              {!previewLoading &&
                (!doc.content_type ||
                  (!doc.content_type.startsWith('image/') &&
                    doc.content_type !== 'application/pdf')) && (
                  <div className="whitespace-pre-line text-slate-800">
                    {doc.raw_preview || '（此文獻內容需從物件儲存載入）'}
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {selectionToolbar && (
        <div
          className="fixed z-50 bg-white border border-base-300 rounded-lg shadow-lg p-2 flex items-center gap-2"
          style={{
            left: `${selectionToolbar.x}px`,
            top: `${selectionToolbar.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <select
            className="select select-xs select-bordered"
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
          >
            <option value="Purpose">Purpose</option>
            <option value="Method">Method</option>
            <option value="Findings">Findings</option>
            <option value="Limitation">Limitation</option>
            <option value="Other">Other</option>
          </select>
          <button className="btn btn-xs btn-primary" onClick={handleCreateEvidence}>
            加入標記片段
          </button>
          <button className="btn btn-xs btn-ghost" onClick={handleCancelSelection}>
            取消
          </button>
        </div>
      )}

      {/* 創建標記片段對話框 */}
      {pendingSelection && (
        <EvidenceCreateDialog
          isOpen={isCreateDialogOpen}
          pageNumber={pendingSelection.page}
          initialText={pendingSelection.text || ''}
          onSave={handleCreateEvidenceFromDialog}
          onCancel={() => {
            setIsCreateDialogOpen(false);
            setPendingSelection(null);
          }}
        />
      )}
    </div>
  );
};

// --- Task Components (保留但不再使用，邏輯已移至 ChatMainPanel) ---

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TaskATab = ({ nodeData }: { nodeData: any }) => {
  const { documents, submitTaskA, taskAVersions, isAiThinking } = useStore();
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  // Structured State for Task A
  const [content, setContent] = useState({
    a1_purpose: { text: '', snippetIds: [] as string[] },
    a2_method: { text: '', snippetIds: [] as string[] },
    a3_findings: { text: '', snippetIds: [] as string[] },
    a4_limitations: { text: '', snippetIds: [] as string[] },
  });

  const handleSubmit = () => {
    if (!selectedDocId) return;
    submitTaskA(selectedDocId, content);
  };

  const previousVersions = taskAVersions.filter((v) => v.targetDocId === selectedDocId);

  return (
    <div className="flex flex-col h-full">
      <div className="alert alert-info shadow-sm mb-4 text-xs">
        <span>
          任務 A：{nodeData.config?.guidance || '單篇摘要'}
          。請針對選擇的文獻，分段撰寫並綁定標記片段。
        </span>
      </div>

      <div className="form-control mb-4">
        <select
          className="select select-bordered select-sm w-full"
          value={selectedDocId}
          onChange={(e) => setSelectedDocId(e.target.value)}
        >
          <option value="" disabled>
            請選擇目標文獻...
          </option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {selectedDocId ? (
          <>
            <FormField
              label="A1 研究目的 (Purpose)"
              value={content.a1_purpose}
              onChange={(v) => setContent({ ...content, a1_purpose: v })}
              placeholder="研究問題為何？"
              minHeight="h-16"
            />
            <FormField
              label="A2 研究方法 (Method)"
              value={content.a2_method}
              onChange={(v) => setContent({ ...content, a2_method: v })}
              placeholder="採用了什麼方法？"
              minHeight="h-16"
            />
            <FormField
              label="A3 主要發現 (Findings)"
              value={content.a3_findings}
              onChange={(v) => setContent({ ...content, a3_findings: v })}
              placeholder="核心結論為何？"
              minHeight="h-24"
            />
            <FormField
              label="A4 研究限制 (Limitations)"
              value={content.a4_limitations}
              onChange={(v) => setContent({ ...content, a4_limitations: v })}
              placeholder="作者自述或觀察到的限制..."
              minHeight="h-16"
            />

            <div className="h-4"></div>
            <button
              className="btn btn-primary w-full mb-8"
              onClick={handleSubmit}
              disabled={isAiThinking}
            >
              {isAiThinking ? 'AI 驗證中...' : '提交檢核'} <Send size={14} />
            </button>
          </>
        ) : (
          <div className="text-center text-slate-400 mt-10">請先選擇上方文獻以開始任務</div>
        )}

        {/* History */}
        {previousVersions.length > 0 && (
          <div className="mt-8 pt-4 border-t border-base-300">
            <h4 className="text-xs font-bold text-slate-500 mb-2">歷史版本回饋</h4>
            {previousVersions.map((v) => (
              <div
                key={v.id}
                className="text-xs bg-slate-50 p-2 rounded mb-2 border border-base-200"
              >
                <div className="font-bold mb-1">
                  v{v.version} {v.isValid ? '✅' : '❌'}
                </div>
                <div className="text-slate-600 whitespace-pre-wrap">
                  {v.feedback || v.validationErrors?.join('\n')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TaskBTab = ({ nodeData: _nodeData }: { nodeData: any }) => {
  const { taskBData, updateTaskBRow, addTaskBRow, removeTaskBRow, submitTaskBCheck, isAiThinking } =
    useStore();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="alert alert-warning shadow-sm mb-4 text-xs">
        <span>任務 B：跨篇比較。請確保每一個比較維度都有雙邊的標記片段支持。</span>
      </div>

      <div className="overflow-y-auto flex-1 pr-2 pb-20">
        {taskBData.map((row, idx) => (
          <div key={row.id} className="card bg-base-100 border border-base-300 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm">比較維度 #{idx + 1}</h3>
                <button
                  className="btn btn-ghost btn-xs text-red-400"
                  onClick={() => removeTaskBRow(idx)}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <input
                className="input input-sm input-bordered w-full mb-3"
                placeholder="維度名稱 (例如：研究方法)"
                value={row.dimension}
                onChange={(e) => updateTaskBRow(idx, 'dimension', e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-1">文獻 A</div>
                  <textarea
                    className="textarea textarea-bordered textarea-xs w-full h-20"
                    value={row.doc1Claim.text}
                    onChange={(e) =>
                      updateTaskBRow(idx, 'doc1Claim', { ...row.doc1Claim, text: e.target.value })
                    }
                  />
                  <EvidenceSelector
                    selectedIds={row.doc1Claim.snippetIds}
                    onChange={(ids) =>
                      updateTaskBRow(idx, 'doc1Claim', { ...row.doc1Claim, snippetIds: ids })
                    }
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-1">文獻 B</div>
                  <textarea
                    className="textarea textarea-bordered textarea-xs w-full h-20"
                    value={row.doc2Claim.text}
                    onChange={(e) =>
                      updateTaskBRow(idx, 'doc2Claim', { ...row.doc2Claim, text: e.target.value })
                    }
                  />
                  <EvidenceSelector
                    selectedIds={row.doc2Claim.snippetIds}
                    onChange={(ids) =>
                      updateTaskBRow(idx, 'doc2Claim', { ...row.doc2Claim, snippetIds: ids })
                    }
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4">
                <input
                  className="input input-xs input-bordered"
                  placeholder="相同點 (一句話)"
                  value={row.similarity}
                  onChange={(e) => updateTaskBRow(idx, 'similarity', e.target.value)}
                />
                <input
                  className="input input-xs input-bordered"
                  placeholder="不同點 (一句話)"
                  value={row.difference}
                  onChange={(e) => updateTaskBRow(idx, 'difference', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <button className="btn btn-outline btn-sm w-full border-dashed" onClick={addTaskBRow}>
          + 新增比較維度
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-base-200">
        <button
          className="btn btn-primary w-full"
          onClick={submitTaskBCheck}
          disabled={isAiThinking}
        >
          {isAiThinking ? '檢查中...' : '提交比較表'} <Send size={14} />
        </button>
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TaskCTab = ({ nodeData: _nodeData }: { nodeData: any }) => {
  const { taskCData, updateTaskC, submitTaskCCheck, isAiThinking } = useStore();

  return (
    <div className="flex flex-col h-full">
      <div className="alert alert-success shadow-sm mb-4 text-xs">
        <span>任務 C：綜合分析。請填寫四個關鍵槽位，C2 需包含跨篇標記片段，C4 需指出缺口。</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-8">
        <FormField
          label="C1 主題句 (Theme)"
          placeholder="本段落要探討的核心主題..."
          value={taskCData.c1_theme}
          onChange={(v) => updateTaskC('c1_theme', v)}
          minHeight="h-16"
        />
        <FormField
          label="C2 跨篇標記片段 (Evidence)"
          placeholder="綜合多篇文獻的觀察..."
          value={taskCData.c2_evidence}
          onChange={(v) => updateTaskC('c2_evidence', v)}
        />
        <FormField
          label="C3 差異界線 (Boundary)"
          placeholder="雖然...但是... (指出適用範圍或對立點)"
          value={taskCData.c3_boundary}
          onChange={(v) => updateTaskC('c3_boundary', v)}
          minHeight="h-16"
        />
        <FormField
          label="C4 意義與缺口 (Gap)"
          placeholder="因此... 目前尚未... (指出研究機會)"
          value={taskCData.c4_gap}
          onChange={(v) => updateTaskC('c4_gap', v)}
          minHeight="h-16"
        />

        <button
          className="btn btn-primary w-full mt-4 mb-8"
          onClick={submitTaskCCheck}
          disabled={isAiThinking}
        >
          {isAiThinking ? '分析中...' : '提交綜合分析'} <Send size={14} />
        </button>
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FloatingChat = () => {
  const { chatMessages, isChatOpen, toggleChat, isAiThinking } = useStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  if (!isChatOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 btn btn-circle btn-primary btn-lg shadow-xl z-50 animate-bounce"
      >
        <MessageCircle size={32} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-slate-200 overflow-hidden animate-in slide-in-from-bottom duration-300">
      <div className="bg-primary text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 font-bold">
          <Bot size={20} /> AI 引導教練
        </div>
        <button
          onClick={toggleChat}
          className="btn btn-sm btn-circle btn-ghost text-white hover:bg-white/20"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`chat ${msg.role === 'ai' ? 'chat-start' : 'chat-end'}`}>
            <div
              className={`chat-bubble text-sm shadow-sm whitespace-pre-wrap ${msg.role === 'ai' ? 'bg-white text-slate-700' : 'bg-primary text-white'}`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isAiThinking && (
          <div className="chat chat-start">
            <div className="chat-bubble bg-white text-slate-500 text-xs">
              <span className="loading loading-dots loading-xs"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="text-[10px] text-center text-slate-400 mt-1">
          AI 僅提供引導，不會直接代寫
        </div>
      </div>
    </div>
  );
};

export default function StudentInterface() {
  const {
    currentStepId,
    nodes,
    navigateNext,
    projects,
    activeProjectId,
    cohorts,
    joinCohortByCode,
    chatTimeline,
    addChatMessage,
    loadDocuments,
    bindDocumentsToProject,
    updateHighlight,
  } = useStore();
  const _navigate = useNavigate();
  const currentNode = nodes.find((n) => n.id === currentStepId);
  const _currentProject = projects.find((p) => p.id === activeProjectId);
  const _projectCohorts = cohorts.filter((c) => c.project_id === activeProjectId);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isDocumentSelectModalOpen, setIsDocumentSelectModalOpen] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isBinding, setIsBinding] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'task'>('chat');
  const [editingHighlight, setEditingHighlight] = useState<ExtendedHighlight | null>(null);
  const prevStepIdRef = useRef<string | null>(null);

  const handleJoinCohort = async () => {
    const code = joinCode.trim();
    if (code.length !== 9) return;
    setJoining(true);
    try {
      await joinCohortByCode(code);
      setJoinCode('');
      setIsJoinModalOpen(false);
      alert('已加入學生群組！');
    } catch (e: any) {
      alert(e?.message || '加入失敗，請確認群組編號是否正確。');
    } finally {
      setJoining(false);
    }
  };

  const handleUpdateHighlight = async (id: string, updates: Partial<ExtendedHighlight>) => {
    if (!updateHighlight) return;
    await updateHighlight(id, {
      name: (updates as any).tag || (updates as any).name,
      evidence_type: (updates as any).type || (updates as any).evidence_type,
    });
    await loadDocuments(activeProjectId || undefined);
  };

  // 檢查專案是否有綁定文檔
  useEffect(() => {
    const checkProjectDocuments = async () => {
      if (!activeProjectId) return;

      // 載入專案綁定的文檔
      await loadDocuments(activeProjectId);

      // 檢查是否有綁定的文檔（loadDocuments 已經過濾了，所以如果為空就表示沒有綁定）
      const currentDocs = useStore.getState().documents;
      if (currentDocs.length === 0 && !isDocumentSelectModalOpen) {
        // 沒有綁定文檔，載入所有可用文檔供選擇
        // 直接調用 API 獲取所有文檔，避免更新 store
        const API_BASE =
          ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:8000';
        const token = useAuthStore.getState().token;
        const res = await fetch(`${API_BASE}/api/documents`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const allDocs: Document[] = await res.json();
          setAvailableDocuments(allDocs.filter((d) => !d.project_id));
          setIsDocumentSelectModalOpen(true);
        }
      }
    };

    checkProjectDocuments();
  }, [activeProjectId, loadDocuments, isDocumentSelectModalOpen]);

  const handleBindDocuments = async () => {
    if (!activeProjectId || selectedDocumentIds.length === 0) return;

    setIsBinding(true);
    try {
      await bindDocumentsToProject(selectedDocumentIds, activeProjectId);
      setIsDocumentSelectModalOpen(false);
      setSelectedDocumentIds([]);
      await loadDocuments(activeProjectId);
    } catch (e: any) {
      alert(`綁定失敗：${e?.message || e || '未知錯誤'}`);
    } finally {
      setIsBinding(false);
    }
  };

  const toggleDocumentSelection = (docId: string) => {
    if (selectedDocumentIds.includes(docId)) {
      setSelectedDocumentIds(selectedDocumentIds.filter((id) => id !== docId));
    } else {
      setSelectedDocumentIds([...selectedDocumentIds, docId]);
    }
  };

  // 節點切換時自動插入 Instruction + Widget
  useEffect(() => {
    if (currentNode && currentStepId !== prevStepIdRef.current) {
      prevStepIdRef.current = currentStepId;

      // 檢查是否已經有該節點的系統訊息
      const hasSystemMessage = chatTimeline.some(
        (msg) => msg.nodeId === currentStepId && msg.role === 'system'
      );

      if (!hasSystemMessage) {
        const systemMessage: Message = {
          id: `system-${currentStepId}-${Date.now()}`,
          role: 'system',
          content: currentNode.data.config?.guidance || `開始任務：${currentNode.data.label}`,
          timestamp: Date.now(),
          nodeId: currentStepId,
        };
        addChatMessage(systemMessage);
      }
    }
  }, [currentStepId, currentNode, chatTimeline, addChatMessage]);

  const renderContent = () => {
    if (!currentNode) return <div className="p-10 text-center">Loading Stage...</div>;
    const type = currentNode.data.type;

    // start 和 end 節點顯示簡單畫面
    if (type === 'start' || type === 'end') {
      return (
        <div className="flex h-full w-full relative">
          <div className="flex-[0.7] h-full flex flex-col border-r border-slate-200">
            <ReaderPanel />
          </div>
          <div className="flex-[0.3] h-full flex flex-col bg-white relative">
            <div className="flex-1 p-6 overflow-hidden flex items-center justify-center">
              {type === 'start' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <BookOpen size={64} className="text-indigo-600 mb-4 opacity-50" />
                  <h2 className="text-2xl font-bold mb-2 text-slate-800">開始本次學習流程</h2>
                  <p className="text-slate-500 mb-6">
                    請先確認左側文獻資源與任務說明，準備好後按下「開始第一階段」進入下一步。
                  </p>
                  <button className="btn btn-primary" onClick={navigateNext}>
                    開始第一階段 <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {type === 'end' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <CheckCircle2 size={64} className="text-green-500 mb-4 opacity-50" />
                  <h2 className="text-2xl font-bold mb-2 text-slate-800">流程已完成</h2>
                  <p className="text-slate-500 mb-6">恭喜你完成了所有任務！</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 其他節點使用 Chat 主區
    return (
      <div className="flex h-full w-full relative">
        <div
          className={`transition-all duration-500 ease-in-out h-full relative ${isCollapsed ? 'w-[calc(100%-60px)]' : 'w-[70%]'}`}
        >
          <ReaderPanel />
        </div>
        <div
          className={`transition-all duration-500 ease-in-out h-full bg-white border-l border-slate-200 shadow-[-5px_0_20px_rgba(0,0,0,0.02)] flex flex-col ${isCollapsed ? 'w-[60px]' : 'w-[30%]'}`}
        >
          <div className="h-12 border-b border-slate-100 flex items-center justify-between px-2 bg-white sticky top-0 z-10">
            {!isCollapsed ? (
              <div className="flex space-x-1 p-1 bg-slate-100 rounded-lg w-full max-w-[240px] ml-2">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 flex items-center justify-center py-1 rounded text-xs font-medium transition-all ${
                    activeTab === 'chat'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <MessageCircle size={14} className="mr-1.5" /> AI 對話
                </button>
                <button
                  onClick={() => setActiveTab('task')}
                  className={`flex-1 flex items-center justify-center py-1 rounded text-xs font-medium transition-all ${
                    activeTab === 'task'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ClipboardList size={14} className="mr-1.5" /> 任務表單
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full space-y-4 pt-4">
                <button
                  onClick={() => {
                    setIsCollapsed(false);
                    setActiveTab('chat');
                  }}
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <MessageCircle size={20} />
                </button>
                <button
                  onClick={() => {
                    setIsCollapsed(false);
                    setActiveTab('task');
                  }}
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <ClipboardList size={20} />
                </button>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
            >
              {isCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden relative animate-fadeIn">
              {activeTab === 'chat' ? (
                <ChatPanelWrapper currentNode={currentNode} />
              ) : (
                <TaskPanelWrapper currentNode={currentNode} />
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const { user } = useAuthStore();
  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden flex flex-col">
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-100/40 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-100/40 blur-[100px]"></div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(203, 213, 225, 0.5); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(148, 163, 184, 0.8); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
        @keyframes bounceIn {
          0% { opacity: 0; transform: translate(-50%, -80%) scale(0.9); }
          50% { opacity: 1; transform: translate(-50%, -105%) scale(1.05); }
          100% { transform: translate(-50%, -100%) scale(1); }
        }
        .animate-bounce-in { animation: bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .cursor-crosshair { cursor: crosshair; }
      `}</style>

      {/* Header */}
      <header className="h-14 bg-white/80 backdrop-blur-lg border-b border-slate-200 shrink-0 flex items-center justify-between px-6 z-50 relative">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <LayoutTemplate size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-800">ThesisFlow</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {getUserInitials()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative z-10 overflow-hidden">{renderContent()}</div>
      <HighlightEditModal
        isOpen={!!editingHighlight}
        onClose={() => setEditingHighlight(null)}
        onSave={async (tag, note) => {
          if (editingHighlight) {
            await handleUpdateHighlight(editingHighlight.id, { tag, note });
            setEditingHighlight(null);
          }
        }}
        initialData={editingHighlight}
      />
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-primary" />
                加入學生群組
              </h3>
              <button
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => !joining && setIsJoinModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              請輸入老師提供的 <span className="font-mono tracking-[0.2em]">9</span> 位數群組編號。
            </p>
            <div className="flex gap-2">
              <input
                className="input input-bordered input-sm flex-1 font-mono tracking-[0.35em]"
                placeholder="___ ___ ___"
                value={joinCode}
                maxLength={9}
                onChange={(e) => {
                  const v = e.target.value.replace(/\s+/g, '').replace(/[^\d]/g, '');
                  setJoinCode(v);
                }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleJoinCohort}
                disabled={joining || joinCode.trim().length !== 9}
              >
                {joining ? '加入中...' : '加入'}
              </button>
            </div>
            <p className="text-xs text-slate-400">若無法順利加入，請再次確認編號或聯繫授課教師。</p>
          </div>
        </div>
      )}
      {isDocumentSelectModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-base-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen size={18} className="text-primary" />
                  選擇要加入專案的文檔
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  此專案尚未綁定任何文檔，請選擇要加入的文檔。
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => !isBinding && setIsDocumentSelectModalOpen(false)}
                disabled={isBinding}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {availableDocuments.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">目前沒有可用的文檔。</p>
                  <p className="text-xs mt-2">請先上傳文檔後再選擇。</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedDocumentIds.includes(doc.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-base-200 hover:border-primary/50'
                      }`}
                      onClick={() => toggleDocumentSelection(doc.id)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedDocumentIds.includes(doc.id)}
                          onChange={() => toggleDocumentSelection(doc.id)}
                          className="checkbox checkbox-primary"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">{doc.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {doc.type?.toUpperCase() || 'FILE'} ·{' '}
                            {new Date(doc.uploaded_at || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-base-200 flex justify-end gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => setIsDocumentSelectModalOpen(false)}
                disabled={isBinding}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleBindDocuments}
                disabled={isBinding || selectedDocumentIds.length === 0}
              >
                {isBinding ? '綁定中...' : `確認綁定 (${selectedDocumentIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
