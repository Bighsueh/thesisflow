import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Workflow, Users } from 'lucide-react';
import { useAuthStore } from '../authStore';
import CohortDetail from '../components/CohortDetail';

export default function TeacherCohort() {
  const navigate = useNavigate();
  const { cohortId } = useParams<{ cohortId: string }>();
  const { user, logout } = useAuthStore();

  if (!cohortId) {
    return null;
  }

  const handleSaveProject = async () => {
    if (!cohortId) return;
    setSavingProject(true);
    try {
      await updateCohort(cohortId, { project_id: selectedProject || null });
      alert('群組設定已更新');
      await loadCohorts();
    } catch (e: any) {
      alert(e?.message || '更新失敗');
    } finally {
      setSavingProject(false);
    }
  };

  const handleAddMember = async () => {
    if (!cohortId || !addingUserId) return;
    try {
      await addCohortMember(cohortId, addingUserId);
      setAddingUserId('');
    } catch (e: any) {
      alert(e?.message || '加入失敗');
    }
  };

  const handleUpdateStatus = async (userId: string) => {
    if (!cohortId) return;
    const status = window.prompt('輸入狀態（active / blocked / done）');
    if (!status) return;
    try {
      await updateCohortMember(cohortId, userId, { status });
    } catch (e: any) {
      alert(e?.message || '更新失敗');
    }
  };

  const handleUpdateProgress = async (userId: string) => {
    if (!cohortId) return;
    const progressInput = window.prompt('輸入進度百分比（0-100）');
    if (progressInput === null) return;
    const progress = parseInt(progressInput, 10);
    if (Number.isNaN(progress)) return;
    try {
      await updateCohortMember(cohortId, userId, { progress });
    } catch (e: any) {
      alert(e?.message || '更新失敗');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* 與教師首頁共用風格的側邊欄，並維持「學生群組管理」為目前作用中的區塊 */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-4 font-bold text-lg border-b border-slate-800">
          ThesisFlow
          <span className="ml-1 text-xs font-normal text-slate-300">文獻探討輔助平台</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          <button
            className="btn btn-ghost w-full justify-start gap-3 text-slate-100"
            onClick={() => navigate('/teacher')}
          >
            <Workflow size={18} /> 教學流程管理
          </button>
          <button
            className="btn btn-ghost w-full justify-start gap-3 text-slate-100"
            onClick={() => navigate('/teacher')}
          >
            <Users size={18} /> 學生帳號管理
          </button>
          <button
            className="btn btn-ghost w-full justify-start gap-3 bg-slate-800 text-white"
            disabled
          >
            <Users size={18} /> 學生群組管理
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 text-sm">
          <div className="font-semibold">{user?.name}</div>
          <div className="text-slate-400">{user?.email}</div>
          <button className="btn btn-sm btn-ghost mt-2" onClick={logout}>
            登出
          </button>
        </div>
      </aside>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        <CohortDetail cohortId={cohortId} />
      </main>
    </div>
  );
}


