import { ArrowRight, FileText, Users, Upload } from 'lucide-react';
import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { useStore } from '../store';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, loadProjects, enterProject, documents, loadDocuments } = useStore();

  useEffect(() => {
    loadProjects();
    loadDocuments();
  }, [loadProjects, loadDocuments]);

  const ongoingProjects = useMemo(() => projects, [projects]);
  const recentDocuments = useMemo(() => {
    return documents.sort((a, b) => (b.uploaded_at || 0) - (a.uploaded_at || 0)).slice(0, 3);
  }, [documents]);

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
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          歡迎回來，{user?.name || '使用者'}
        </h1>
        <p className="text-lg text-gray-500">繼續您的研究旅程</p>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* LEFT: Active Projects (3/5 width) */}
        <div className="lg:col-span-3 space-y-5" data-tour="projects-section">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">正在進行的專案</h2>
              <p className="text-gray-500 text-sm mt-0.5">從上次離開的地方繼續</p>
            </div>
            <Link to="/projects">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                更多專案
              </Button>
            </Link>
          </div>

          {ongoingProjects.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <FileText size={48} className="mx-auto mb-2 opacity-50" />
              </div>
              <p className="text-gray-600 font-medium mb-2">目前尚未加入任何專案</p>
              <p className="text-sm text-gray-500">
                請向授課教師索取專案流程，或前往群組頁面加入學生群組。
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {ongoingProjects.slice(0, 3).map((project, i) => (
                <GlassCard
                  key={project.id}
                  className="p-5 group"
                  hoverEffect
                  onClick={() => handleEnterProject(project.id)}
                  data-tour={i === 0 ? 'project-card-example' : undefined}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getProjectColor(i)} flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0`}
                    >
                      {getProjectInitials(project.title)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 group-hover:text-violet-700 transition-colors">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        {project.currentStage && (
                          <>
                            <span className="flex items-center gap-1">
                              <FileText size={12} />
                              {project.currentStage}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span>完成度 {Math.round(project.progress ?? 0)}%</span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="group-hover:bg-violet-50 group-hover:text-violet-700 group-hover:border-violet-200 transition-all flex-shrink-0"
                      data-tour={i === 0 ? 'enter-project-button' : undefined}
                    >
                      進入 <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Recent Literature (2/5 width) */}
        <div className="lg:col-span-2 space-y-5" data-tour="literature-section">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">最新上傳文獻</h2>
              <p className="text-gray-500 text-sm mt-0.5">最近新增的論文</p>
            </div>
            <Link to="/literature">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                更多文獻
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentDocuments.length === 0 ? (
              <GlassCard className="p-6 text-center">
                <FileText size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">文獻庫目前是空的</p>
              </GlassCard>
            ) : (
              recentDocuments.map((doc, index) => (
                <GlassCard
                  key={doc.id}
                  className="p-4 flex items-center gap-3"
                  hoverEffect
                  onClick={() => navigate('/literature')}
                  data-tour={index === 0 ? 'literature-card-example' : undefined}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      doc.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {doc.type === 'pdf' ? 'PDF' : 'TXT'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.uploaded_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                </GlassCard>
              ))
            )}

            {/* Quick Upload Area */}
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-violet-300 hover:bg-violet-50/30 transition-colors cursor-pointer"
              onClick={() => navigate('/literature')}
            >
              <Upload size={20} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">點擊上傳新文獻</p>
            </div>
          </div>
        </div>
      </div>

      {/* TERTIARY: Groups - Minimal */}
      <div className="pt-4 border-t border-gray-100" data-tour="cohorts-section">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={16} />
            <span>
              您目前參與{' '}
              <span className="font-semibold text-gray-900">{ongoingProjects.length} 個專案</span>
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
