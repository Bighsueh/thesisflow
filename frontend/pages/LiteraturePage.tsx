import { AnimatePresence, motion } from 'framer-motion';
import { Upload, FileText, Trash2, Eye, Search, Filter, X } from 'lucide-react';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Document as PdfDocument, Page } from 'react-pdf';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { RagStatusBadge } from '../components/ui/RagStatusBadge';
import { useStore } from '../store';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '../utils/pdfConfig';

export function LiteraturePage() {
  const { documents, loadDocuments, uploadFileDocument, removeDocument, getCachedFileUrl } =
    useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [_newContent, _setNewContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPages, setPreviewPages] = useState<number>(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const doc = documents.find((d) => d.id === previewId);
    if (!previewId || !doc) {
      setPreviewUrl(null);
      setPreviewLoading(false);
      setPreviewPages(0);
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
      setPreviewPages(0);
    }
  }, [previewId, documents, getCachedFileUrl]);

  // Escape 鍵關閉 modal
  const closeUploadModal = useCallback(() => setUploadModalOpen(false), []);
  const closePreview = useCallback(() => setPreviewId(null), []);
  const closeDeleteConfirm = useCallback(() => setDeleteConfirmId(null), []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isUploadModalOpen) closeUploadModal();
        else if (previewId) closePreview();
        else if (deleteConfirmId) closeDeleteConfirm();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [
    isUploadModalOpen,
    previewId,
    deleteConfirmId,
    closeUploadModal,
    closePreview,
    closeDeleteConfirm,
  ]);

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return doc.title.toLowerCase().includes(query) || doc.type.toLowerCase().includes(query);
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('請先選擇檔案');
      return;
    }
    setUploading(true);
    try {
      const title = newTitle || selectedFile.name.replace(/\.[^/.]+$/, '');
      await uploadFileDocument(title, selectedFile);
      setUploadModalOpen(false);
      setNewTitle('');
      _setNewContent('');
      setSelectedFile(null);
      await loadDocuments();
    } catch (e: any) {
      alert(`上傳失敗：${e?.message || e || '未知錯誤'}`);
    } finally {
      setUploading(false);
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
        _setNewContent(text);
      } catch {
        // ignore read error
      }
    } else {
      _setNewContent('');
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

  const handleDeleteDocument = async (id: string) => {
    try {
      await removeDocument(id);
      await loadDocuments();
      setDeleteConfirmId(null);
    } catch (e: any) {
      alert(`刪除失敗：${e?.message || e || '未知錯誤'}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">文獻庫</h1>
          <p className="text-gray-500 mt-1">管理您的論文、筆記和文件</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setUploadModalOpen(true)}
          leftIcon={<Upload size={18} />}
        >
          上傳新文獻
        </Button>
      </div>

      <div className="space-y-6">
        {/* Search Bar */}
        <GlassCard className="p-4 flex gap-4">
          <div className="flex-1">
            <Input
              icon={<Search size={18} />}
              placeholder="搜尋標題、作者或關鍵字..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-none shadow-none bg-transparent"
            />
          </div>
          <div className="w-px bg-gray-200 my-1"></div>
          <Button variant="ghost" leftIcon={<Filter size={18} />}>
            篩選
          </Button>
        </GlassCard>

        {/* List */}
        {filteredDocuments.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <FileText size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
            <p className="text-gray-600 font-medium mb-2">
              {searchQuery ? '找不到文件' : '文獻庫目前是空的'}
            </p>
            <p className="text-sm text-gray-500">
              {searchQuery ? '請嘗試其他搜尋關鍵字' : '請上傳文獻或等待教師在系統中加入共用文獻。'}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
            {filteredDocuments.map((item) => (
              <GlassCard
                key={item.id}
                className="p-4 flex items-center justify-between group"
                hoverEffect
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                      item.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {item.type === 'pdf' ? 'PDF' : 'TXT'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">
                        {item.title}
                      </h3>
                      {item.type === 'pdf' && (
                        <RagStatusBadge
                          status={item.rag_status}
                          chunkCount={item.chunk_count}
                          compact
                          docId={item.id}
                        />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(item.uploaded_at || Date.now()).toLocaleDateString()}
                      {item.size && ` • ${(item.size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                    {item.rag_status === 'processing' && (
                      <progress className="progress progress-primary w-full h-1 mt-1" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Eye size={16} />}
                    onClick={() => setPreviewId(item.id)}
                  >
                    預覽
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="px-3"
                    onClick={() => setDeleteConfirmId(item.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeUploadModal}
            role="button"
            aria-label="關閉上傳視窗"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                closeUploadModal();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                duration: 0.3,
              }}
              className="relative overflow-hidden bg-white/90 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-violet-500/10 w-full max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="upload-modal-title"
            >
              {/* Subtle shine effect overlay - matching GlassCard style */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/20 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-violet-50/20 via-transparent to-transparent pointer-events-none" />

              <div className="relative z-10 p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 id="upload-modal-title" className="text-xl font-bold text-gray-900">
                    上傳文獻
                  </h2>
                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeUploadModal}
                    aria-label="關閉上傳視窗"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center bg-violet-50/50 hover:bg-violet-50 transition-colors cursor-pointer mb-6 ${
                    isDragging ? 'border-violet-500 bg-violet-100' : 'border-violet-200'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-4">
                    <Upload size={32} />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    點擊或拖曳檔案到此處上傳
                  </h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    支援 PDF 和 TXT 檔案。最大檔案大小 25MB。
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,text/plain,.pdf,application/pdf"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </div>

                <div className="space-y-4">
                  <Input
                    label="標題"
                    placeholder="輸入文件標題"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" onClick={closeUploadModal}>
                      取消
                    </Button>
                    <Button onClick={handleUpload} isLoading={uploading}>
                      新增至文獻庫
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      {previewId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-2xl border border-white/80 rounded-xl shadow-2xl shadow-violet-500/10 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {(() => {
              const doc = documents.find((d) => d.id === previewId);
              if (!doc) {
                return (
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">找不到文件</h3>
                      <button className="btn btn-ghost btn-sm" onClick={() => setPreviewId(null)}>
                        關閉
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-500">
                        {doc.type?.toUpperCase() || 'FILE'}
                      </div>
                      <h3 className="font-bold text-lg text-gray-800">{doc.title}</h3>
                      <div className="text-xs text-gray-400">
                        上傳於 {new Date(doc.uploaded_at || Date.now()).toLocaleString('zh-TW')}
                      </div>
                    </div>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => setPreviewId(null)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-4 overflow-auto flex-1">
                    {previewLoading ? (
                      <div className="text-sm text-gray-500">預覽載入中...</div>
                    ) : doc.content_type?.startsWith('image/') && previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={doc.title}
                        className="max-h-[70vh] max-w-full object-contain mx-auto"
                      />
                    ) : (doc.type === 'pdf' || doc.content_type === 'application/pdf') &&
                      previewUrl ? (
                      <div className="border border-gray-200 rounded-md overflow-auto max-h-[70vh]">
                        <PdfDocument
                          file={previewUrl}
                          onLoadSuccess={({ numPages }) => setPreviewPages(numPages)}
                          loading={<div className="p-4 text-sm text-gray-500">PDF 載入中...</div>}
                          error={<div className="p-4 text-sm text-red-500">PDF 載入失敗</div>}
                        >
                          {Array.from({ length: previewPages || 1 }, (_, i) => (
                            <Page
                              key={i}
                              pageNumber={i + 1}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                              width={720}
                            />
                          ))}
                        </PdfDocument>
                      </div>
                    ) : (
                      <div className="prose max-w-none whitespace-pre-wrap text-sm text-gray-800">
                        {doc.raw_preview || '（沒有預覽內容）'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <GlassCard className="p-6 max-w-md w-full">
            <h3 className="font-bold text-lg mb-2">確認刪除</h3>
            <p className="text-sm text-gray-600 mb-6">您確定要刪除此文檔嗎？此操作無法復原。</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                取消
              </Button>
              <Button variant="danger" onClick={() => handleDeleteDocument(deleteConfirmId)}>
                確認刪除
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
