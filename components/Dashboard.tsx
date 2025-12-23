import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { BookOpen, LayoutGrid, FileText, ArrowRight, Settings, Plus, Trash2 } from 'lucide-react';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '../utils/pdfConfig';

export default function Dashboard() {
  const { projects, enterProject, documents, uploadDocument, uploadFileDocument, removeDocument, getFileUrl, getCachedFileUrl, loadProjects } = useStore();
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPages, setPreviewPages] = useState<number>(0);

  const handleUpload = async () => {
    if (!newTitle && !selectedFile && !newContent) return;
    setUploading(true);
    try {
      // 若是選擇了 PDF 檔，優先走檔案上傳流程
      if (selectedFile && selectedFile.type === 'application/pdf') {
        const title = newTitle || selectedFile.name.replace(/\.[^/.]+$/, '');
        await uploadFileDocument(title, selectedFile);
      } else if (newTitle && newContent) {
        // 文字內容上傳（原有流程）
        await uploadDocument(newTitle, newContent);
      } else {
        throw new Error('請先選擇檔案或貼上文字內容');
      }
      setUploadModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setSelectedFile(null);
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
    // 僅在非 PDF 時自動載入文字內容
    if (file.type !== 'application/pdf') {
      try {
        const text = await file.text();
        setNewContent(text);
      } catch {
        // ignore read error, user can still手動貼上
      }
    } else {
      // PDF 不讀取文字內容，由後端與檔案保存
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

  useEffect(() => {
    loadProjects().catch(() => {});
  }, [loadProjects]);

  useEffect(() => {
    // 文獻全域共享，登入後直接載入
    useStore.getState().loadDocuments().catch(() => {});
  }, []);

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
  }, [previewId, documents, getFileUrl]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="pt-0 space-y-8">
        
        {/* Section 1: Active Projects */}
        <div>
            <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold text-lg">
                <span className="w-5 h-5 flex items-center justify-center"><div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin duration-[3s]" style={{animationPlayState: 'paused', borderTopColor: 'inherit'}}></div></span> 
                進行中的專案
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map(project => (
                    <div 
                        key={project.id} 
                        className="bg-white rounded-2xl shadow-sm border border-base-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex"
                        onClick={() => enterProject(project.id)}
                    >
                        {/* Blue Left Panel */}
                        <div className="w-32 bg-blue-600 p-4 flex flex-col items-center justify-center text-white shrink-0 relative">
                            {project.tags?.[0] && <span className="absolute top-3 right-3 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{project.tags[0]}</span>}
                            <LayoutGrid size={32} className="mb-2 opacity-90"/>
                            <span className="font-bold text-sm tracking-widest uppercase">{project.currentStage}</span>
                        </div>

                        {/* Right Content */}
                        <div className="p-6 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                    {project.semester || '未設定學期'}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">{project.title}</h3>
                                <div className="text-sm text-slate-500 mb-4">
                                    目前階段：<span className="font-semibold text-blue-600">{project.currentStage || '未設定'}</span>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Progress</span>
                                    <span>{project.progress ?? 0}%</span>
                                </div>
                                <progress className="progress progress-primary w-full" value={project.progress ?? 0} max="100"></progress>
                            </div>
                        </div>
                    </div>
                ))}

                {/* New Project Placeholder - 說明用，避免誤導為可點擊功能 */}
                <div className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-6 min-h-[180px] bg-slate-50">
                    <Plus size={32} className="mb-2" />
                    <span className="font-semibold">需要新的專案？</span>
                    <span className="text-xs text-slate-500 mt-1">請向授課教師索取或加入新的專案流程。</span>
                </div>
            </div>
        </div>

        {/* Section 2: Global Document Library */}
        <div className="bg-white rounded-2xl shadow-sm border border-base-200 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    文獻庫概覽
                </h2>
                <button 
                    className="text-blue-600 text-sm font-semibold hover:underline"
                    onClick={() => setUploadModalOpen(true)}
                >
                    管理
                </button>
            </div>

            <div className="space-y-1">
                {documents.map(doc => (
                    <div key={doc.id} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-transparent hover:border-slate-100 last:border-0">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                <FileText size={20} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-slate-700 font-medium truncate pr-4">{doc.title}</h4>
                         <p className="text-xs text-slate-400">Added {new Date(doc.uploaded_at || Date.now()).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="btn btn-ghost btn-xs btn-square" onClick={() => setPreviewId(doc.id)}>
                            <ArrowRight size={16} />
                        </button>
                        <button className="btn btn-ghost btn-xs btn-square text-red-500" onClick={() => removeDocument(doc.id)}>
                            <Trash2 size={16} />
                        </button>
                        </div>
                    </div>
                ))}
                
                {documents.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        文獻庫是空的。上傳文獻以便在任何專案中使用。
                    </div>
                )}
            </div>
        </div>

      </div>

        {/* Simple Upload Modal */}
        {isUploadModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-base-200 font-bold text-lg flex justify-between items-center">
                        上傳文獻至全域庫
                        <button onClick={() => setUploadModalOpen(false)}><Settings size={16} className="rotate-45"/></button>
                    </div>
                    <div className="p-4 space-y-4">
                         <div
                           className={`border-2 border-dashed rounded-lg p-4 text-sm cursor-pointer transition-colors ${
                             isDragging ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-300 bg-slate-50 text-slate-500'
                           }`}
                           onDragOver={handleDragOver}
                           onDragLeave={handleDragLeave}
                           onDrop={handleDrop}
                           onClick={() => fileInputRef.current?.click()}
                         >
                           <p className="font-semibold mb-1">拖拉檔案到此處，或點擊選擇檔案</p>
                           <p className="text-xs">支援純文字檔（.txt）與 PDF。PDF 將以檔案形式儲存，後續可在系統中引用。</p>
                           <input
                             ref={fileInputRef}
                             type="file"
                             accept=".txt,text/plain,.pdf,application/pdf"
                             className="hidden"
                             onChange={handleFileInputChange}
                           />
                         </div>
                         <input 
                            className="input input-bordered w-full" 
                            placeholder="文獻標題" 
                            value={newTitle} 
                            onChange={e => setNewTitle(e.target.value)} 
                        />
                         <textarea 
                            className="textarea textarea-bordered w-full h-32" 
                            placeholder="貼上文字內容..." 
                            value={newContent} 
                            onChange={e => setNewContent(e.target.value)} 
                        />
                    </div>
                    <div className="p-4 bg-slate-50 flex justify-end gap-2">
                        <button className="btn btn-ghost" onClick={() => setUploadModalOpen(false)}>取消</button>
                        <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                          {uploading ? '上傳中...' : '確認上傳'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Preview Modal */}
        {previewId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              {(() => {
                const doc = documents.find(d => d.id === previewId);
                if (!doc) {
                  return (
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">找不到文件</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => setPreviewId(null)}>關閉</button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-base-200 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-slate-500">{doc.type?.toUpperCase() || 'FILE'}</div>
                        <h3 className="font-bold text-lg text-slate-800">{doc.title}</h3>
                        <div className="text-xs text-slate-400">Uploaded {new Date(doc.uploaded_at || Date.now()).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm text-red-500" onClick={() => { removeDocument(doc.id); setPreviewId(null); }}>刪除</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setPreviewId(null)}>關閉</button>
                      </div>
                    </div>
                    <div className="p-4 overflow-auto flex-1">
                      {previewLoading ? (
                        <div className="text-sm text-slate-500">預覽載入中...</div>
                      ) : doc.content_type?.startsWith('image/') && previewUrl ? (
                        <img src={previewUrl} alt={doc.title} className="max-h-[70vh] max-w-full object-contain mx-auto" />
                      ) : (doc.type === 'pdf' || doc.content_type === 'application/pdf') && previewUrl ? (
                        <div className="border border-slate-200 rounded-md overflow-auto max-h-[70vh]">
                          <PdfDocument
                            file={previewUrl}
                            onLoadSuccess={({ numPages }) => setPreviewPages(numPages)}
                            loading={<div className="p-4 text-sm text-slate-500">PDF 載入中...</div>}
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
                        <div className="prose max-w-none whitespace-pre-wrap text-sm text-slate-800">
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

      {/* Floating Action Menu (Mock) */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3">
            <button className="btn btn-circle btn-neutral shadow-lg">
                <LayoutGrid size={20} />
            </button>
      </div>
    </div>
  );
}