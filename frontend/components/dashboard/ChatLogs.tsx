import { MessageSquare, User, Bot, Clock, Filter } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { analyticsService, ChatLogMessage } from '../../services/analyticsService';
import { GlassCard } from '../ui/GlassCard';

interface ChatLogsProps {
  cohortId: string;
}

export const ChatLogs: React.FC<ChatLogsProps> = ({ cohortId }) => {
  const [messages, setMessages] = useState<ChatLogMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    loadChatLogs();
  }, [cohortId, selectedStudent, selectedProject]);

  const loadChatLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await analyticsService.getChatLogs(cohortId, {
        studentId: selectedStudent || undefined,
        projectId: selectedProject || undefined,
        limit: 100,
      });

      setMessages(data.messages);

      // 提取唯一的學生和專案列表
      const uniqueStudents = new Map<string, string>();
      const uniqueProjects = new Map<string, string>();

      data.messages.forEach((msg) => {
        uniqueStudents.set(msg.user_id, msg.user_name);
        uniqueProjects.set(msg.project_id, msg.project_title);
      });

      setStudents(Array.from(uniqueStudents.entries()).map(([id, name]) => ({ id, name })));
      setProjects(Array.from(uniqueProjects.entries()).map(([id, title]) => ({ id, title })));
    } catch (err: any) {
      console.error('載入對話記錄失敗:', err);
      setError(err?.message || '載入對話記錄失敗');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'user') {
      return <User size={16} className="text-blue-600" />;
    } else if (role === 'coach') {
      return <Bot size={16} className="text-purple-600" />;
    } else {
      return <MessageSquare size={16} className="text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'user') return '學生';
    if (role === 'coach') return 'AI 教練';
    if (role === 'status') return '系統';
    return role;
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare size={24} className="text-violet-600" />
          <h3 className="text-xl font-bold text-gray-900">對話記錄</h3>
        </div>
        <div className="text-sm text-gray-500">共 {messages.length} 則訊息</div>
      </div>

      {/* 篩選器 */}
      <div className="mb-4 flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm text-gray-600">篩選：</span>
        </div>

        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="select select-sm select-bordered"
        >
          <option value="">所有學生</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="select select-sm select-bordered"
        >
          <option value="">所有專案</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </div>

      {/* 對話列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="loading loading-spinner loading-lg text-violet-600"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
          <p>尚無對話記錄</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-lg border ${
                msg.role === 'user'
                  ? 'bg-blue-50 border-blue-200'
                  : msg.role === 'coach'
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">{getRoleIcon(msg.role)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{msg.user_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-300">
                      {getRoleLabel(msg.role)}
                    </span>
                    <span className="text-xs text-gray-500">{msg.project_title}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{formatTimestamp(msg.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
