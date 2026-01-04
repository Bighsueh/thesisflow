import {
  ArrowRight,
  BookOpen,
  Layers,
  LayoutGrid,
  FileText,
  Plus,
  Users,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import { useStore } from '../store';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '../utils/pdfConfig';

export default function StudentHome() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    projects,
    loadProjects,
    enterProject,
    documents,
    loadDocuments,
    uploadDocument,
    uploadFileDocument,
    removeDocument,
    getCachedFileUrl,
    cohorts,
    loadCohorts,
    joinCohortByCode,
  } = useStore();

  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const friendlyRole = user?.role === 'teacher' ? '教師' : '學生';

  useEffect(() => {
    loadProjects();
    loadDocuments();
    loadCohorts();
  }, [loadProjects, loadDocuments, loadCohorts]);

  const ongoingProjects = useMemo(() => projects, [projects]);

  const handleEnterProject = async (projectId: string) => {
    await enterProject(projectId);
    navigate('/student/project');
  };

  const handleJoinCohort = async () => {
    const code = joinCode.trim();
    if (code.length !== 9) return;
    setJoining(true);
    try {
      await joinCohortByCode(code);
      // 成功加入學生群組後，重新載入專案與群組清單，確保學生端卡片立即更新
      await Promise.all([loadProjects(), loadCohorts()]);
      setJoinCode('');
      alert('已加入學生群組！');
    } catch (e: any) {
      alert(e?.message || '加入失敗，請確認群組編號是否正確。');
    } finally {
      setJoining(false);
    }
  };

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
      } else if (selectedFile) {
        // 其他檔案類型
        const title = newTitle || selectedFile.name.replace(/\.[^/.]+$/, '');
        await uploadFileDocument(title, selectedFile);
      } else {
        throw new Error('請先選擇檔案或貼上文字內容');
      }
      setUploadModalOpen(false);
      setNewTitle('');
      setNewContent('');
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

  const handleDeleteDocument = async (id: string) => {
    try {
      await removeDocument(id);
      await loadDocuments();
      setDeleteConfirmId(null);
    } catch (e: any) {
      alert(`刪除失敗：${e?.message || e || '未知錯誤'}`);
    }
  };

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

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-6 overflow-y-auto">
        {/* 頂部使用者資訊列 */}
        <header className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">ThesisFlow</span>
            <span className="text-sm font-semibold text-slate-800">
              文獻探討輔助平台 · 學生端工作臺
            </span>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-800">
                  {user.name}{' '}
                  <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                    {friendlyRole}
                  </span>
                </div>
                <div className="text-xs text-slate-400">{user.email}</div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs text-xs"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                登出
              </button>
            </div>
          )}
        </header>

        {/* 上方導覽提示卡片 */}
        <section className="rounded-2xl bg-sky-50 border border-sky-100 px-6 py-5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
              <BookOpen size={22} />
            </div>
            <div className="space-y-1">
              <h1 className="text-base font-semibold text-slate-800">選擇專案後開始你的工作流程</h1>
              <p className="text-xs text-slate-500">
                上方將列出你目前可以進入的研究專案。點擊專案卡片後，你將進入學習路徑，依序完成文獻閱讀、摘要、比較與綜合分析等任務。
              </p>
            </div>
          </div>
          <div className="hidden sm:flex">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
              開始學習
              <ArrowRight size={16} />
            </span>
          </div>
        </section>

        {/* 我的研究室 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="text-primary" size={20} />
              <h2 className="text-lg font-bold text-slate-800">我的研究室</h2>
            </div>
            <p className="text-xs text-slate-500">
              {user?.name ? `${user.name}，` : ''}你目前加入了 {ongoingProjects.length}{' '}
              個專案。請選擇後開始學習。
            </p>
          </div>

          {ongoingProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                <LayoutGrid size={22} />
              </div>
              <div className="font-semibold text-slate-700">目前尚未加入任何專案</div>
              <div>請向授課教師索取專案流程，或等待教師將你加入對應的學生群組。</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ongoingProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleEnterProject(project.id)}
                  className="bg-white rounded-2xl shadow-sm border border-base-200 overflow-hidden hover:shadow-md hover:border-primary/60 transition-shadow cursor-pointer flex text-left"
                >
                  {/* 左側藍色面板 */}
                  <div className="w-32 bg-blue-600 p-4 flex flex-col items-center justify-center text-white shrink-0 relative">
                    {project.tags?.[0] && (
                      <span className="absolute top-3 right-3 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                        {project.tags[0]}
                      </span>
                    )}
                    <LayoutGrid size={32} className="mb-2 opacity-90" />
                    <span className="font-bold text-xs tracking-widest uppercase">
                      {project.currentStage || '未設定'}
                    </span>
                  </div>

                  {/* 右側內容 */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                        {project.semester || '未設定學期'}
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2 truncate">
                        {project.title}
                      </h3>
                      <div className="text-sm text-slate-500 mb-4">
                        目前階段：
                        <span className="font-semibold text-blue-600">
                          {project.currentStage || '未設定'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(project.progress ?? 0)}%</span>
                      </div>
                      <progress
                        className="progress progress-primary w-full"
                        value={project.progress ?? 0}
                        max={100}
                      />
                    </div>
                  </div>
                </button>
              ))}

              {/* 說明卡片 */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-6 min-h-[180px] bg-slate-50">
                <Plus size={32} className="mb-2" />
                <span className="font-semibold">需要新的專案？</span>
                <span className="text-xs text-slate-500 mt-1">
                  請向授課教師索取或請教師協助加入新的專案流程。
                </span>
              </div>
            </div>
          )}
        </section>

        {/* 透過邀請碼加入學生群組 + 右側群組列表 */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">加入學生群組</h3>
              <p className="text-xs text-slate-500">
                左側輸入老師提供的 9 位數群組編號；右側會顯示你目前已加入的學生群組。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* 左側：輸入邀請碼 */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  className="input input-bordered input-sm w-40 font-mono tracking-[0.35em]"
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
                  {joining ? '加入中...' : '加入群組'}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                若無法順利加入，請再次確認編號或聯繫授課教師。
              </p>
            </div>

            {/* 右側：目前已加入的學生群組 */}
            <div className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 max-h-40 overflow-auto">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  已加入的學生群組（{cohorts.length}）
                </span>
              </div>
              {cohorts.length === 0 ? (
                <div className="text-xs text-slate-400">
                  目前尚未加入任何學生群組。請向授課教師索取群組編號。
                </div>
              ) : (
                <div className="space-y-1">
                  {cohorts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5"
                    >
                      <span className="font-medium text-slate-800 truncate max-w-[140px]">
                        {c.name}
                      </span>
                      <span className="text-[10px] text-slate-400">{c.code || '無代碼'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 文獻庫概覽 */}
        <section className="bg-white rounded-2xl shadow-sm border border-base-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">文獻庫概覽</h2>
            <button
              className="text-xs text-blue-600 font-semibold hover:underline"
              onClick={() => setUploadModalOpen(true)}
            >
              上傳文檔
            </button>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-slate-700 font-medium truncate">{doc.title}</h4>
                    <p className="text-xs text-slate-400">
                      Added {new Date(doc.uploaded_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    className="btn btn-ghost btn-xs btn-square"
                    onClick={() => setPreviewId(doc.id)}
                    title="預覽文檔"
                  >
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="btn btn-ghost btn-xs btn-square text-red-500"
                    onClick={() => setDeleteConfirmId(doc.id)}
                    title="刪除文檔"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {documents.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                文獻庫目前是空的。請等待教師在系統中加入共用文獻。
              </div>
            )}
          </div>
        </section>

        {/* 上傳文檔 Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-base-200 font-bold text-lg flex justify-between items-center">
                上傳文獻至全域庫
                <button onClick={() => setUploadModalOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-sm cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-slate-300 bg-slate-50 text-slate-500'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <p className="font-semibold mb-1">拖拉檔案到此處，或點擊選擇檔案</p>
                  <p className="text-xs">
                    支援純文字檔（.txt）與 PDF。PDF 將以檔案形式儲存，後續可在系統中引用。
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
                  className="input input-bordered w-full"
                  placeholder="文獻標題"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <textarea
                  className="textarea textarea-bordered w-full h-32"
                  placeholder="貼上文字內容..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>
              <div className="p-4 bg-slate-50 flex justify-end gap-2">
                <button className="btn btn-ghost" onClick={() => setUploadModalOpen(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                  {uploading ? '上傳中...' : '確認上傳'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 預覽 Modal */}
        {previewId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
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
                    <div className="p-4 border-b border-base-200 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-slate-500">
                          {doc.type?.toUpperCase() || 'FILE'}
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">{doc.title}</h3>
                        <div className="text-xs text-slate-400">
                          Uploaded {new Date(doc.uploaded_at || Date.now()).toLocaleString()}
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => setPreviewId(null)}>
                        關閉
                      </button>
                    </div>
                    <div className="p-4 overflow-auto flex-1">
                      {previewLoading ? (
                        <div className="text-sm text-slate-500">預覽載入中...</div>
                      ) : doc.content_type?.startsWith('image/') && previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={doc.title}
                          className="max-h-[70vh] max-w-full object-contain mx-auto"
                        />
                      ) : (doc.type === 'pdf' || doc.content_type === 'application/pdf') &&
                        previewUrl ? (
                        <div className="border border-slate-200 rounded-md overflow-auto max-h-[70vh]">
                          <PdfDocument
                            file={previewUrl}
                            onLoadSuccess={({ numPages }) => setPreviewPages(numPages)}
                            loading={
                              <div className="p-4 text-sm text-slate-500">PDF 載入中...</div>
                            }
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

        {/* 刪除確認 Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">確認刪除</h3>
                <p className="text-sm text-slate-600 mb-6">
                  您確定要刪除此文檔嗎？此操作無法復原。
                </p>
                <div className="flex justify-end gap-2">
                  <button className="btn btn-ghost" onClick={() => setDeleteConfirmId(null)}>
                    取消
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={() => handleDeleteDocument(deleteConfirmId)}
                  >
                    確認刪除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
