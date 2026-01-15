import { ArrowRight, FileText, Users, Plus, Search, BookOpen } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import { Button } from '../components/ui/Button';
import { useStore } from '../store';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, loadProjects, enterProject, documents, loadDocuments } = useStore();

  // 搜尋狀態
  const [projectSearch, setProjectSearch] = useState('');
  const [documentSearch, setDocumentSearch] = useState('');

  useEffect(() => {
    loadProjects();
    loadDocuments();
  }, [loadProjects, loadDocuments]);

  // 過濾後的專案列表
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const searchLower = projectSearch.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(searchLower) ||
        (p.currentStage && p.currentStage.toLowerCase().includes(searchLower))
    );
  }, [projects, projectSearch]);

  // 過濾後的文獻列表（按上傳時間排序）
  const filteredDocuments = useMemo(() => {
    const sorted = [...documents].sort((a, b) => (b.uploaded_at || 0) - (a.uploaded_at || 0));
    if (!documentSearch.trim()) return sorted;
    const searchLower = documentSearch.toLowerCase();
    return sorted.filter((d) => d.title.toLowerCase().includes(searchLower));
  }, [documents, documentSearch]);

  const handleEnterProject = async (projectId: string) => {
    await enterProject(projectId);
    navigate('/student/project');
  };

  const getProjectInitials = (title: string) => {
    return title
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProjectColor = (index: number) => {
    const colors = [
      'from-violet-500 to-indigo-500',
      'from-emerald-500 to-green-500',
      'from-blue-500 to-cyan-500',
      'from-orange-500 to-amber-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-blue-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem-4rem)]">
      {/* Welcome Section */}
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          歡迎回來，{user?.name || '使用者'}
        </h1>
        <p className="text-lg text-gray-500">繼續您的研究旅程</p>
      </div>

      {/* Two Column Layout: Projects & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* LEFT COLUMN: Projects */}
        <div
          className="relative bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] shadow-violet-500/5 rounded-3xl flex flex-col overflow-hidden"
          data-tour="projects-section"
        >
          {/* Decorative overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/20 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-violet-50/20 via-transparent to-transparent pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 p-5 border-b border-gray-100/80 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">您的專案</h2>
                  <p className="text-gray-500 text-xs mt-0.5">共 {projects.length} 個專案</p>
                </div>
              </div>
              <Link to="/projects">
                <Button size="sm" leftIcon={<Plus size={16} />}>
                  全部
                </Button>
              </Link>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="搜尋專案..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
              />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <FileText size={40} className="text-gray-300 mb-3" />
                {projects.length === 0 ? (
                  <>
                    <p className="text-gray-600 font-medium mb-1">尚未加入任何專案</p>
                    <p className="text-sm text-gray-400">請向教師索取專案流程</p>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">找不到符合的專案</p>
                )}
              </div>
            ) : (
              filteredProjects.map((project, i) => (
                <div
                  key={project.id}
                  onClick={() => handleEnterProject(project.id)}
                  className="group flex items-center gap-3 p-4 bg-white/60 hover:bg-white rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-500/5 cursor-pointer transition-all duration-200"
                  data-tour={i === 0 ? 'project-card-example' : undefined}
                >
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getProjectColor(i)} flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0`}
                  >
                    {getProjectInitials(project.title)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm group-hover:text-violet-700 transition-colors truncate">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {project.currentStage && (
                        <>
                          <span className="text-xs text-gray-500 truncate max-w-[120px]">
                            {project.currentStage}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                        </>
                      )}
                      <span className="text-xs font-medium text-violet-600">
                        {Math.round(project.progress ?? 0)}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(project.progress ?? 0)}%` }}
                      />
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Documents */}
        <div
          className="relative bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] shadow-violet-500/5 rounded-3xl flex flex-col overflow-hidden"
          data-tour="literature-section"
        >
          {/* Decorative overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/20 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-50/20 via-transparent to-transparent pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 p-5 border-b border-gray-100/80 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <BookOpen size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">我的文獻</h2>
                  <p className="text-gray-500 text-xs mt-0.5">共 {documents.length} 篇文獻</p>
                </div>
              </div>
              <Link to="/literature">
                <Button size="sm" variant="secondary" leftIcon={<Plus size={16} />}>
                  新增
                </Button>
              </Link>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="搜尋文獻..."
                value={documentSearch}
                onChange={(e) => setDocumentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
              />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <BookOpen size={40} className="text-gray-300 mb-3" />
                {documents.length === 0 ? (
                  <>
                    <p className="text-gray-600 font-medium mb-1">文獻庫是空的</p>
                    <p className="text-sm text-gray-400">前往 Literature 頁面上傳文獻</p>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">找不到符合的文獻</p>
                )}
              </div>
            ) : (
              filteredDocuments.map((doc, index) => (
                <div
                  key={doc.id}
                  onClick={() => navigate('/literature')}
                  className="group flex items-center gap-3 p-4 bg-white/60 hover:bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer transition-all duration-200"
                  data-tour={index === 0 ? 'literature-card-example' : undefined}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      doc.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {doc.type === 'pdf' ? 'PDF' : 'TXT'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(doc.uploaded_at || Date.now()).toLocaleDateString('zh-TW')}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Groups Status */}
      <div className="flex-shrink-0 pt-4 mt-4 border-t border-gray-100" data-tour="cohorts-section">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={16} />
            <span>
              您目前參與{' '}
              <span className="font-semibold text-gray-900">{projects.length} 個專案</span>
            </span>
          </div>
          <Link to="/groups">
            <Button variant="ghost" size="sm" className="text-violet-600">
              管理群組
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
