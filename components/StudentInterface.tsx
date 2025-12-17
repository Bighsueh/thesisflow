import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useAuthStore } from '../authStore';
import {
  Bot,
  Send,
  FileText,
  Highlighter,
  ChevronRight,
  LayoutList,
  Columns,
  Layers,
  ArrowRight,
  X,
  MessageCircle,
  Plus,
  Trash2,
  BookOpen,
  ChevronLeft,
  Link as LinkIcon,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { AppNode, Document, FieldWithEvidence, Message } from '../types';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChatMainPanel } from './ChatMainPanel';
import { InstructionCard } from './widgets/InstructionCard';
import { PDFSelector } from './PDFSelector';
import { PDFHighlightOverlay } from './PDFHighlightOverlay';
import { EvidenceListPanel } from './EvidenceListPanel';
import { EvidenceCreateDialog } from './EvidenceCreateDialog';

// 使用 CDN worker 以避免路徑解析問題
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// --- Shared Components ---

const EvidenceSelector = ({ 
    selectedIds, 
    onChange 
}: { 
    selectedIds: string[], 
    onChange: (ids: string[]) => void 
}) => {
    const { documents } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    
    // Flatten all highlights
    const allHighlights = documents.flatMap(d => (d.highlights || []).map(h => ({ ...h, docTitle: d.title })));

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(sid => sid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    return (
        <div className="mt-2">
            <div className="flex flex-wrap gap-2 mb-2 min-h-[24px]">
                {selectedIds.length === 0 && <span className="text-xs text-red-400 italic flex items-center gap-1">* 需綁定標記片段 (Evidence)</span>}
                {selectedIds.map(id => {
                    const h = allHighlights.find(h => h.id === id);
                    if (!h) return null;
                    return (
                        <span key={id} className="badge badge-sm badge-warning gap-1 h-auto py-1 text-left">
                            <span className="truncate max-w-[150px]">{h.snippet}</span>
                            <button onClick={() => toggleSelection(id)} className="hover:text-red-700"><X size={10}/></button>
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
                    {allHighlights.length === 0 && <div className="text-slate-400">尚無標註資料，請先閱讀文獻並畫線。</div>}
                    {allHighlights.map(h => (
                        <div 
                            key={h.id} 
                            className={`p-1.5 border-b border-base-200 cursor-pointer hover:bg-base-200 flex gap-2 items-start ${selectedIds.includes(h.id) ? 'bg-blue-50' : ''}`}
                            onClick={() => toggleSelection(h.id)}
                        >
                            <input type="checkbox" checked={selectedIds.includes(h.id)} readOnly className="checkbox checkbox-xs mt-0.5" />
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
    minHeight = 'h-24' 
}: { 
    label: string, 
    value: FieldWithEvidence, 
    onChange: (val: FieldWithEvidence) => void, 
    placeholder?: string,
    minHeight?: string
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

// --- Panel Components (Library, Reader, Chat) ---
// Keeping these condensed as they are similar to previous logic, focusing on the Tasks update

const LibraryPanel = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { documents, uploadDocument, uploadFileDocument, removeDocument, selectDocument, activeProjectId, bindDocumentsToProject, unbindDocumentsFromProject, loadDocuments } = useStore();
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
            const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:8000';
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
                setAvailableDocuments(allDocs.filter(d => !d.project_id));
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

    const handleProjectDocsDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('application/document-id')) {
            setIsDragOverProjectDocs(true);
            e.dataTransfer.dropEffect = 'move';
        }
    };

    const handleProjectDocsDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const currentTarget = e.currentTarget as HTMLElement;
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!currentTarget.contains(relatedTarget)) {
            setIsDragOverProjectDocs(false);
        }
    };

    const handleProjectDocsDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverProjectDocs(false);
        
        const docId = e.dataTransfer.getData('application/document-id');
        if (docId && activeProjectId) {
            try {
                await bindDocumentsToProject([docId], activeProjectId);
                await loadDocuments(activeProjectId);
                // 重新載入可用文檔列表
                const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:8000';
                const token = useAuthStore.getState().token;
                const res = await fetch(`${API_BASE}/api/documents`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                if (res.ok) {
                    const allDocs: Document[] = await res.json();
                    setAvailableDocuments(allDocs.filter(d => !d.project_id));
                }
            } catch (error: any) {
                alert(`加入文檔失敗：${error?.message || error || '未知錯誤'}`);
            }
        }
    };

    const handleLibraryDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // 檢查是否是從專案文檔區域拖拽過來的
        const hasProjectDocId = e.dataTransfer.types.includes('application/project-document-id');
        if (hasProjectDocId) {
            setIsDragOverLibrary(true);
            e.dataTransfer.dropEffect = 'move';
        }
    };

    const handleLibraryDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const currentTarget = e.currentTarget as HTMLElement;
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!currentTarget.contains(relatedTarget)) {
            setIsDragOverLibrary(false);
        }
    };

    const handleLibraryDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverLibrary(false);
        
        const docId = e.dataTransfer.getData('application/project-document-id');
        if (!docId) {
            console.warn('No document ID found in drop event');
            return;
        }
        if (!activeProjectId) {
            console.warn('No active project ID');
            return;
        }
        
        try {
            await unbindDocumentsFromProject([docId], activeProjectId);
            await loadDocuments(activeProjectId);
            // 重新載入可用文檔列表
            const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:8000';
            const token = useAuthStore.getState().token;
            const res = await fetch(`${API_BASE}/api/documents`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (res.ok) {
                const allDocs: Document[] = await res.json();
                setAvailableDocuments(allDocs.filter(d => !d.project_id));
            }
        } catch (error: any) {
            console.error('解除綁定失敗:', error);
            alert(`解除綁定失敗：${error?.message || error || '未知錯誤'}`);
        }
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
    if (!isOpen) return null;
    return (
        <div 
            className="absolute inset-0 z-20 bg-black/20 backdrop-blur-sm flex items-start justify-start"
            onDragOver={(e) => {
                // 允許拖拽事件穿透 LibraryPanel
                e.stopPropagation();
            }}
        >
            <div className="w-80 h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
                <div className="p-4 border-b border-base-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold flex items-center gap-2"><BookOpen size={18}/> 文獻庫</h3>
                    <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle"><X size={16}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {/* 專案已綁定的文檔 */}
                    <div 
                        className={`mb-4 rounded-lg p-3 transition-colors ${
                            isDragOverProjectDocs ? 'bg-primary/10 border-2 border-primary border-dashed' : ''
                        }`}
                        onDragOver={handleProjectDocsDragOver}
                        onDragLeave={handleProjectDocsDragLeave}
                        onDrop={handleProjectDocsDrop}
                    >
                        <h4 className="text-xs font-semibold text-slate-500 mb-2">
                            {isDragOverProjectDocs ? '放開以加入文檔' : '專案文檔'}
                        </h4>
                        {documents.length === 0 ? (
                            <div className={`text-xs py-4 text-center rounded-lg border-2 border-dashed transition-colors ${
                                isDragOverProjectDocs 
                                    ? 'text-primary border-primary bg-primary/5' 
                                    : 'text-slate-400 border-slate-200 bg-slate-50'
                            }`}>
                                {isDragOverProjectDocs 
                                    ? '放開以加入文檔' 
                                    : '拖拽文檔到此處以加入專案'}
                            </div>
                        ) : (
                            documents.map(doc => (
                                <div 
                                    key={doc.id} 
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('application/project-document-id', doc.id);
                                        e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    className="card card-compact bg-base-100 border border-base-200 hover:border-primary cursor-move group mb-2"
                                >
                                    <div className="card-body p-3">
                                        <h4 className="font-bold text-sm text-slate-700 truncate flex items-center gap-2" onClick={() => { selectDocument(doc.id); onClose(); }}>
                                            <FileText size={14} className="text-slate-400" />
                                            {doc.title}
                                        </h4>
                                        <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
                                            <span>{new Date(doc.uploaded_at || Date.now()).toLocaleDateString()}</span>
                                            <button onClick={(e) => { e.stopPropagation(); removeDocument(doc.id); }} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1 italic">拖拽到文獻庫以解除綁定</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 從文獻庫加入文檔 */}
                    <div 
                        className={`mb-4 border-t pt-4 rounded-lg p-3 transition-colors ${
                            isDragOverLibrary ? 'bg-red-50 border-2 border-red-300 border-dashed' : ''
                        }`}
                        onDragOver={handleLibraryDragOver}
                        onDragLeave={handleLibraryDragLeave}
                        onDrop={handleLibraryDrop}
                    >
                        <h4 className="text-xs font-semibold text-slate-500 mb-2">
                            {isDragOverLibrary ? '放開以解除綁定' : '文獻庫（可拖拽加入）'}
                        </h4>
                        {availableDocuments.length === 0 ? (
                            <div className={`text-xs py-4 text-center rounded-lg border-2 border-dashed transition-colors ${
                                isDragOverLibrary 
                                    ? 'text-red-500 border-red-300 bg-red-50' 
                                    : 'text-slate-400 border-slate-200 bg-slate-50'
                            }`}>
                                {isDragOverLibrary 
                                    ? '放開以解除綁定' 
                                    : '拖拽專案文檔到此處以解除綁定'}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {availableDocuments.map(doc => (
                                    <div
                                        key={doc.id}
                                        draggable
                                        onDragStart={(e) => handleDocumentDragStart(e, doc.id)}
                                        className="card card-compact bg-base-100 border border-dashed border-slate-300 hover:border-primary cursor-move group"
                                    >
                                        <div className="card-body p-3">
                                            <h4 className="font-bold text-sm text-slate-700 truncate flex items-center gap-2">
                                                <FileText size={14} className="text-slate-400" />
                                                {doc.title}
                                            </h4>
                                            <div className="text-xs text-slate-400 mt-1">
                                                {doc.type?.toUpperCase() || 'FILE'} · {new Date(doc.uploaded_at || Date.now()).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1 italic">拖拽到專案文檔區域以加入</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {!uploadMode ? (
                        <button className="btn btn-primary w-full gap-2 mt-4" onClick={() => setUploadMode(true)}><Plus size={16}/> 上傳新文獻</button>
                    ) : (
                        <div className="space-y-2 mt-4 border-t pt-4">
                             <div
                               className={`border-2 border-dashed rounded-lg p-3 text-xs cursor-pointer transition-colors ${
                                 isDragging ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-300 bg-slate-50 text-slate-500'
                               }`}
                               onDragOver={handleDragOver}
                               onDragLeave={handleDragLeave}
                               onDrop={handleDrop}
                               onClick={() => fileInputRef.current?.click()}
                             >
                               <p className="font-semibold mb-1">拖拉檔案到此處，或點擊選擇檔案</p>
                               <p>支援純文字檔（.txt）與 PDF。PDF 會以檔案形式儲存供後續引用。</p>
                               <input
                                 ref={fileInputRef}
                                 type="file"
                                 accept=".txt,text/plain,.pdf,application/pdf"
                                 className="hidden"
                                 onChange={handleFileInputChange}
                               />
                             </div>
                             <input className="input input-sm input-bordered w-full" placeholder="文獻標題" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                             <textarea className="textarea textarea-sm textarea-bordered w-full h-24" placeholder="貼上文字內容..." value={newContent} onChange={e => setNewContent(e.target.value)} />
                             <div className="flex gap-2">
                                <button className="btn btn-sm btn-ghost flex-1" onClick={() => setUploadMode(false)}>取消</button>
                                <button className="btn btn-sm btn-primary flex-1" onClick={handleUpload}>確認</button>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ReaderPanel = () => {
    const { documents, currentDocId, selectDocument, addHighlight, removeHighlight, updateHighlight, getFileUrl, getCachedFileUrl, activeProjectId, bindDocumentsToProject, loadDocuments, removeAllHighlights } = useStore();
    const [isLibraryOpen, setLibraryOpen] = useState(false);
    const [isEvidencePanelOpen, setIsEvidencePanelOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [pageCount, setPageCount] = useState<number>(0);
    const [zoom, setZoom] = useState<number>(1.0);
    const [selectionToolbar, setSelectionToolbar] = useState<{ text: string; x: number; y: number } | null>(null);
    const [evidenceType, setEvidenceType] = useState<string>('Other');
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectionMode, setSelectionMode] = useState<'text' | 'box'>('box'); // 'text' 或 'box'
    const [pendingSelection, setPendingSelection] = useState<{ x: number; y: number; width: number; height: number; page: number; text?: string } | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const pdfPageTexts = useRef<Map<number, any>>(new Map()); // 存儲每頁的文本內容和頁面實例
    const doc = documents.find(d => d.id === currentDocId);

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
    
    const handleMouseUp = () => {
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

    const handleCreateEvidence = async () => {
        if (selectionToolbar && currentDocId) {
            await addHighlight(currentDocId, selectionToolbar.text, { evidence_type: evidenceType });
            window.getSelection()?.removeAllRanges();
            setSelectionToolbar(null);
        }
    };

    const handleBoxSelection = (selection: { x: number; y: number; width: number; height: number; page: number; text?: string }) => {
        if (!currentDocId) return;
        setPendingSelection(selection);
        setIsCreateDialogOpen(true);
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

    const handleLocateHighlight = (highlight: Highlight, document: Document) => {
        if (highlight.page && pdfContainerRef.current) {
            // 滾動到對應頁面
            const pageElement = pageRefs.current.get(highlight.page);
            if (pageElement) {
                pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const handleEditHighlight = async (highlight: Highlight) => {
        // 編輯功能由 EvidenceListPanel 中的對話框處理
        // 這裡只需要確保狀態更新
        await loadDocuments(activeProjectId || undefined);
    };

    const handleRemoveHighlight = async (highlightId: string) => {
        try {
            await removeHighlight(highlightId);
        } catch (error: any) {
            throw error;
        }
    };

    const handleCreateHighlight = async (snippet: string, name?: string, page?: number) => {
        if (!currentDocId) return;
        await addHighlight(currentDocId, snippet, {
            name,
            page,
        });
    };

    const handleRemoveAllHighlights = async () => {
        if (!currentDocId) return;
        try {
            await removeAllHighlights(currentDocId);
        } catch (error: any) {
            throw error;
        }
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
            className={`flex flex-col h-full bg-slate-50 border-r border-base-300 relative transition-colors ${
                isDragOver ? 'bg-primary/5' : ''
            }`}
            onDragOver={handleDocumentDragOver}
            onDragLeave={handleDocumentDragLeave}
            onDrop={handleDocumentDrop}
        >
             <LibraryPanel isOpen={isLibraryOpen} onClose={() => setLibraryOpen(false)} />
             <div 
                className={`flex items-center bg-white border-b border-base-300 px-2 h-10 gap-1 overflow-x-auto shrink-0 transition-colors ${
                    isDragOver ? 'bg-primary/10 border-primary border-2' : ''
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
                <button className="btn btn-xs btn-ghost btn-square text-slate-500 hover:text-primary" onClick={() => setLibraryOpen(!isLibraryOpen)}><BookOpen size={16}/></button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                {documents.length === 0 ? (
                    <div className="text-xs text-slate-400 italic flex-1 text-center">
                        {isDragOver ? '放開以加入文檔' : '拖拽文檔到此處以加入專案'}
                    </div>
                ) : (
                    documents.map(d => (
                        <button key={d.id} onClick={() => selectDocument(d.id)} className={`btn btn-xs normal-case max-w-[120px] truncate ${currentDocId === d.id ? 'btn-neutral' : 'btn-ghost text-slate-500 font-normal'}`}>{d.title}</button>
                    ))
                )}
             </div>
             <div className="flex-1 p-8 overflow-y-auto prose max-w-none select-text cursor-text bg-white" onMouseUp={handleMouseUp}>
                {!doc ? (
                    <div className="grid place-items-center h-full text-slate-400">請選擇文獻</div>
                ) : (
                    <div className="w-full h-full">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="mt-0 text-xl font-bold text-slate-800">{doc.title}</h2>
                            <div className="flex items-center gap-2">
                                {(doc.type === 'pdf' || doc.content_type === 'application/pdf') && (
                                    <>
                                        <button
                                            className="btn btn-xs btn-primary"
                                            onClick={() => setIsEvidencePanelOpen(true)}
                                        >
                                            <Highlighter size={14} />
                                            標記片段管理 ({doc.highlights?.length || 0})
                                        </button>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <span className="hidden sm:inline">縮放：</span>
                                            <button
                                                type="button"
                                                className="btn btn-xs"
                                                onClick={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(2)))}
                                            >
                                                -
                                            </button>
                                            <span className="w-12 text-center tabular-nums">
                                                {Math.round(zoom * 100)}%
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-xs"
                                                onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(2)))}
                                            >
                                                +
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-ghost"
                                                onClick={() => {
                                                    calculateAutoZoom();
                                                }}
                                            >
                                                重設
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        {previewLoading && <div className="text-slate-500 text-sm">預覽載入中...</div>}
                        {!previewLoading && doc.content_type?.startsWith('image/') && previewUrl && (
                            <img src={previewUrl} alt={doc.title} className="max-h-[70vh] max-w-full object-contain border border-base-200 rounded-md" />
                        )}
                        {!previewLoading && (doc.type === 'pdf' || doc.content_type === 'application/pdf') && previewUrl && (
                            <div ref={pdfContainerRef} className="border border-base-200 rounded-md overflow-auto max-h-[70vh]">
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
                                                style={{ position: 'relative', marginBottom: '8px', display: 'inline-block' }}
                                            >
                                                <Page
                                                    pageNumber={pageNum}
                                                    renderAnnotationLayer={false}
                                                    renderTextLayer={true}
                                                    width={520 * zoom}
                                                    onGetTextSuccess={(text) => {
                                                        // 存儲文本內容
                                                        const current = pdfPageTexts.current.get(pageNum) || {};
                                                        pdfPageTexts.current.set(pageNum, { ...current, text });
                                                    }}
                                                    onRenderSuccess={(pageInfo) => {
                                                        // 存儲頁面實例以便後續提取文本
                                                        // pageInfo 包含 { page, scale } 結構
                                                        const current = pdfPageTexts.current.get(pageNum) || {};
                                                        pdfPageTexts.current.set(pageNum, { ...current, page: pageInfo?.page || pageInfo });
                                                    }}
                                                />
                                                {/* 高亮覆蓋層 */}
                                                {doc.highlights && doc.highlights.length > 0 && (
                                                    <PDFHighlightOverlay
                                                        highlights={doc.highlights}
                                                        pageNumber={pageNum}
                                                        onHighlightClick={(h) => {
                                                            setIsEvidencePanelOpen(true);
                                                        }}
                                                    />
                                                )}
                                                {/* 選擇器覆蓋層 */}
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
                        {!previewLoading && (!doc.content_type || (!doc.content_type.startsWith('image/') && doc.content_type !== 'application/pdf')) && (
                            <div className="whitespace-pre-line text-slate-800">{doc.raw_preview || '（此文獻內容需從物件儲存載入）'}</div>
                        )}
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
                    <button
                        className="btn btn-xs btn-primary"
                        onClick={handleCreateEvidence}
                    >
                        加入標記片段
                    </button>
                    <button
                        className="btn btn-xs btn-ghost"
                        onClick={handleCancelSelection}
                    >
                        取消
                    </button>
                </div>
             )}

             {/* 標記片段管理面板 */}
             {doc && (
                 <EvidenceListPanel
                     document={doc}
                     isOpen={isEvidencePanelOpen}
                     onClose={() => setIsEvidencePanelOpen(false)}
                     onLocate={handleLocateHighlight}
                     onEdit={handleEditHighlight}
                     onRemove={handleRemoveHighlight}
                     onCreate={handleCreateHighlight}
                     onRemoveAll={handleRemoveAllHighlights}
                 />
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

const TaskATab = ({ nodeData }: { nodeData: any }) => {
    const { documents, submitTaskA, taskAVersions, isAiThinking } = useStore();
    const [selectedDocId, setSelectedDocId] = useState<string>('');
    
    // Structured State for Task A
    const [content, setContent] = useState({
        a1_purpose: { text: '', snippetIds: [] as string[] },
        a2_method: { text: '', snippetIds: [] as string[] },
        a3_findings: { text: '', snippetIds: [] as string[] },
        a4_limitations: { text: '', snippetIds: [] as string[] }
    });

    const handleSubmit = () => {
        if(!selectedDocId) return;
        submitTaskA(selectedDocId, content);
    };

    const previousVersions = taskAVersions.filter(v => v.targetDocId === selectedDocId);

    return (
        <div className="flex flex-col h-full">
            <div className="alert alert-info shadow-sm mb-4 text-xs">
                <span>任務 A：{nodeData.config?.guidance || "單篇摘要"}。請針對選擇的文獻，分段撰寫並綁定標記片段。</span>
            </div>

            <div className="form-control mb-4">
                <select className="select select-bordered select-sm w-full" value={selectedDocId} onChange={e => setSelectedDocId(e.target.value)}>
                    <option value="" disabled>請選擇目標文獻...</option>
                    {documents.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
                {selectedDocId ? (
                    <>
                        <FormField label="A1 研究目的 (Purpose)" value={content.a1_purpose} onChange={v => setContent({...content, a1_purpose: v})} placeholder="研究問題為何？" minHeight="h-16" />
                        <FormField label="A2 研究方法 (Method)" value={content.a2_method} onChange={v => setContent({...content, a2_method: v})} placeholder="採用了什麼方法？" minHeight="h-16" />
                        <FormField label="A3 主要發現 (Findings)" value={content.a3_findings} onChange={v => setContent({...content, a3_findings: v})} placeholder="核心結論為何？" minHeight="h-24" />
                        <FormField label="A4 研究限制 (Limitations)" value={content.a4_limitations} onChange={v => setContent({...content, a4_limitations: v})} placeholder="作者自述或觀察到的限制..." minHeight="h-16" />
                        
                        <div className="h-4"></div>
                        <button className="btn btn-primary w-full mb-8" onClick={handleSubmit} disabled={isAiThinking}>
                            {isAiThinking ? 'AI 驗證中...' : '提交檢核'} <Send size={14}/>
                        </button>
                    </>
                ) : (
                    <div className="text-center text-slate-400 mt-10">請先選擇上方文獻以開始任務</div>
                )}
                
                 {/* History */}
                {previousVersions.length > 0 && (
                    <div className="mt-8 pt-4 border-t border-base-300">
                        <h4 className="text-xs font-bold text-slate-500 mb-2">歷史版本回饋</h4>
                        {previousVersions.map(v => (
                            <div key={v.id} className="text-xs bg-slate-50 p-2 rounded mb-2 border border-base-200">
                                <div className="font-bold mb-1">v{v.version} {v.isValid ? '✅' : '❌'}</div>
                                <div className="text-slate-600 whitespace-pre-wrap">{v.feedback || v.validationErrors?.join('\n')}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const TaskBTab = ({ nodeData }: { nodeData: any }) => {
    const { documents, taskBData, updateTaskBRow, addTaskBRow, removeTaskBRow, submitTaskBCheck, isAiThinking } = useStore();

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
                                <button className="btn btn-ghost btn-xs text-red-400" onClick={() => removeTaskBRow(idx)}><Trash2 size={14}/></button>
                            </div>
                            
                            <input 
                                className="input input-sm input-bordered w-full mb-3" 
                                placeholder="維度名稱 (例如：研究方法)"
                                value={row.dimension}
                                onChange={e => updateTaskBRow(idx, 'dimension', e.target.value)}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs font-bold text-slate-500 mb-1">文獻 A</div>
                                    <textarea 
                                        className="textarea textarea-bordered textarea-xs w-full h-20"
                                        value={row.doc1Claim.text}
                                        onChange={e => updateTaskBRow(idx, 'doc1Claim', {...row.doc1Claim, text: e.target.value})}
                                    />
                                    <EvidenceSelector selectedIds={row.doc1Claim.snippetIds} onChange={ids => updateTaskBRow(idx, 'doc1Claim', {...row.doc1Claim, snippetIds: ids})} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500 mb-1">文獻 B</div>
                                    <textarea 
                                        className="textarea textarea-bordered textarea-xs w-full h-20"
                                        value={row.doc2Claim.text}
                                        onChange={e => updateTaskBRow(idx, 'doc2Claim', {...row.doc2Claim, text: e.target.value})}
                                    />
                                    <EvidenceSelector selectedIds={row.doc2Claim.snippetIds} onChange={ids => updateTaskBRow(idx, 'doc2Claim', {...row.doc2Claim, snippetIds: ids})} />
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-4">
                                <input className="input input-xs input-bordered" placeholder="相同點 (一句話)" value={row.similarity} onChange={e => updateTaskBRow(idx, 'similarity', e.target.value)} />
                                <input className="input input-xs input-bordered" placeholder="不同點 (一句話)" value={row.difference} onChange={e => updateTaskBRow(idx, 'difference', e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}
                
                <button className="btn btn-outline btn-sm w-full border-dashed" onClick={addTaskBRow}>+ 新增比較維度</button>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-base-200">
                <button className="btn btn-primary w-full" onClick={submitTaskBCheck} disabled={isAiThinking}>
                    {isAiThinking ? '檢查中...' : '提交比較表'} <Send size={14}/>
                </button>
            </div>
        </div>
    );
};

const TaskCTab = ({ nodeData }: { nodeData: any }) => {
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
                    onChange={v => updateTaskC('c1_theme', v)} 
                    minHeight="h-16"
                />
                <FormField 
                    label="C2 跨篇標記片段 (Evidence)" 
                    placeholder="綜合多篇文獻的觀察..."
                    value={taskCData.c2_evidence} 
                    onChange={v => updateTaskC('c2_evidence', v)} 
                />
                <FormField 
                    label="C3 差異界線 (Boundary)" 
                    placeholder="雖然...但是... (指出適用範圍或對立點)"
                    value={taskCData.c3_boundary} 
                    onChange={v => updateTaskC('c3_boundary', v)} 
                    minHeight="h-16"
                />
                <FormField 
                    label="C4 意義與缺口 (Gap)" 
                    placeholder="因此... 目前尚未... (指出研究機會)"
                    value={taskCData.c4_gap} 
                    onChange={v => updateTaskC('c4_gap', v)} 
                    minHeight="h-16"
                />
                
                <button className="btn btn-primary w-full mt-4 mb-8" onClick={submitTaskCCheck} disabled={isAiThinking}>
                    {isAiThinking ? '分析中...' : '提交綜合分析'} <Send size={14}/>
                </button>
            </div>
        </div>
    )
}

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
                <button onClick={toggleChat} className="btn btn-sm btn-circle btn-ghost text-white hover:bg-white/20">
                    <X size={18} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {chatMessages.map(msg => (
                    <div key={msg.id} className={`chat ${msg.role === 'ai' ? 'chat-start' : 'chat-end'}`}>
                        <div className={`chat-bubble text-sm shadow-sm whitespace-pre-wrap ${msg.role === 'ai' ? 'bg-white text-slate-700' : 'bg-primary text-white'}`}>
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
                <div className="text-[10px] text-center text-slate-400 mt-1">AI 僅提供引導，不會直接代寫</div>
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
    exitProject,
    cohorts,
    joinCohortByCode,
    chatTimeline,
    addChatMessage,
    currentWidgetState,
    documents,
    loadDocuments,
    bindDocumentsToProject,
  } = useStore();
  const navigate = useNavigate();
  const currentNode = nodes.find(n => n.id === currentStepId);
  const currentProject = projects.find(p => p.id === activeProjectId);
  const projectCohorts = cohorts.filter(c => c.project_id === activeProjectId);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isDocumentSelectModalOpen, setIsDocumentSelectModalOpen] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isBinding, setIsBinding] = useState(false);
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
        const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:8000';
        const token = useAuthStore.getState().token;
        const res = await fetch(`${API_BASE}/api/documents`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const allDocs: Document[] = await res.json();
          setAvailableDocuments(allDocs.filter(d => !d.project_id));
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
      setSelectedDocumentIds(selectedDocumentIds.filter(id => id !== docId));
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
          <div className="flex h-full w-full">
            <div className="w-1/2 h-full flex flex-col border-r border-base-300">
              <ReaderPanel />
            </div>
            <div className="w-1/2 h-full flex flex-col bg-white relative">
              <div className="flex-1 p-6 overflow-hidden">
                {type === 'start' && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <BookOpen size={64} className="text-primary mb-4 opacity-50"/>
                    <h2 className="text-2xl font-bold mb-2">開始本次學習流程</h2>
                    <p className="text-slate-500 mb-6">
                      請先確認左側文獻資源與任務說明，準備好後按下「開始第一階段」進入下一步。
                    </p>
                    <button className="btn btn-primary" onClick={navigateNext}>
                      開始第一階段 <ArrowRight size={16}/>
                    </button>
                  </div>
                )}
                {type === 'end' && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <CheckCircle2 size={64} className="text-green-500 mb-4 opacity-50"/>
                    <h2 className="text-2xl font-bold mb-2">流程已完成</h2>
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
        <div className="flex h-full w-full">
          <div className="w-1/2 h-full flex flex-col border-r border-base-300">
            <ReaderPanel />
          </div>
          <div className="w-1/2 h-full flex flex-col bg-white relative">
            <ChatMainPanel currentNode={currentNode} />
          </div>
        </div>
      );
  };

  return (
    <div className="h-full w-full bg-base-100 font-sans text-base-content overflow-hidden relative">
        <div className="navbar min-h-[3rem] border-b border-base-200 px-4 bg-white z-10 shadow-sm shrink-0">
             <div className="flex-none mr-2">
               <button
                 className="btn btn-ghost btn-sm btn-circle"
                 onClick={() => {
                   exitProject();
                   navigate('/student');
                 }}
               >
                 <ChevronLeft size={20} />
               </button>
             </div>
             <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-primary tracking-tight">
                    {currentProject ? currentProject.title : 'ThesisFlow'}
                  </span>
                  {currentNode && <span className="badge badge-ghost gap-1">{currentNode.data.label}</span>}
                </div>
                {projectCohorts.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users size={14} className="text-primary" />
                      <span>我的學生群組：</span>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {projectCohorts.map((c) => (
                        <span
                          key={c.id}
                          className="badge badge-xs badge-outline border-slate-300 text-slate-600"
                          title={c.name}
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
             </div>
             <div className="flex-none flex items-center gap-2" />
        </div>
        <div className="h-[calc(100%-3rem)] relative">{renderContent()}</div>
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
              <p className="text-xs text-slate-400">
                若無法順利加入，請再次確認編號或聯繫授課教師。
              </p>
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
                              {doc.type?.toUpperCase() || 'FILE'} · 
                              {' '}{new Date(doc.uploaded_at || Date.now()).toLocaleDateString()}
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