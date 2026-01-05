import { Search, ArrowRight, Calendar, FileText } from 'lucide-react';
import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { useStore } from '../store';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, loadProjects, enterProject } = useStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.semester?.toLowerCase().includes(query) ||
        p.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [projects, searchQuery]);

  const handleEnterProject = async (projectId: string) => {
    await enterProject(projectId);
    navigate('/student/project');
  };

  const getProjectInitials = (title: string) => {
    return (
      title
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ||
      title[0]?.toUpperCase() ||
      'P'
    );
  };

  const getProjectColor = (index: number) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-violet-500 to-purple-500',
      'from-orange-500 to-amber-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-blue-500',
    ];
    return colors[index % colors.length];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
      case '進行中':
        return 'bg-green-100 text-green-700';
      case 'Archived':
      case '已封存':
        return 'bg-gray-100 text-gray-600';
      case 'Review':
      case '審查中':
        return 'bg-yellow-100 text-yellow-700';
      case 'Draft':
      case '草稿':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return '進行中';
    const statusMap: Record<string, string> = {
      Active: '進行中',
      Archived: '已封存',
      Review: '審查中',
      Draft: '草稿',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">專案</h1>
          <p className="text-gray-500 mt-1">管理與組織您的研究主題</p>
        </div>
      </div>

      {/* Search Bar */}
      <GlassCard className="p-4" data-tour="projects-search">
        <Input
          icon={<Search size={18} />}
          placeholder="搜尋專案..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </GlassCard>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
          <p className="text-gray-600 font-medium mb-2">
            {searchQuery ? '找不到專案' : '目前尚無專案'}
          </p>
          <p className="text-sm text-gray-500">
            {searchQuery
              ? '請嘗試其他搜尋關鍵字'
              : '請向授課教師索取專案流程，或前往群組頁面加入學生群組。'}
          </p>
        </GlassCard>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          data-tour="project-list"
        >
          {filteredProjects.map((project, index) => (
            <GlassCard
              key={project.id}
              className="p-6 flex flex-col h-full group"
              hoverEffect
              onClick={() => handleEnterProject(project.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getProjectColor(index)} flex items-center justify-center text-white shadow-md`}
                >
                  <span className="font-bold text-lg">{getProjectInitials(project.title)}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors">
                {project.title}
              </h3>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                {project.semester && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>{project.semester}</span>
                  </div>
                )}
                {project.currentStage && (
                  <div className="flex items-center gap-1.5">
                    <FileText size={14} />
                    <span>{project.currentStage}</span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                <span
                  className={`
                  text-xs font-medium px-2.5 py-1 rounded-full
                  ${getStatusColor(project.currentStage || 'Active')}
                `}
                >
                  {getStatusLabel(project.currentStage)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-violet-600 hover:bg-violet-50 pr-0"
                >
                  進入 <ArrowRight size={16} className="ml-1" />
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
