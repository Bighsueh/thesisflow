import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Workflow, FileText, ChevronRight, Pencil, Trash2, Clock } from 'lucide-react';
import { useStore } from '../store';
import { useAuthStore } from '../authStore';
import CohortDetail from '../components/CohortDetail';

export default function TeacherHome() {
  const navigate = useNavigate();
  const { user, hydrate, logout } = useAuthStore();
  const {
    projects,
    loadProjects,
    cohorts,
    loadCohorts,
    enterProject,
    exitProject,
    createCohort,
    deleteProject,
    students,
    loadStudents,
    createStudent,
    bulkCreateStudents,
    deleteCohort,
    updateStudent,
    deleteStudent,
    loadUsageRecords,
    usageRecords,
  } = useStore();
  const [activeSection, setActiveSection] = useState<'projects' | 'students' | 'cohorts'>('projects');
  const [usageModalProject, setUsageModalProject] = useState<string | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentSaving, setStudentSaving] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [isBulkStudentModalOpen, setIsBulkStudentModalOpen] = useState(false);
  const [bulkClassLabel, setBulkClassLabel] = useState('');
  const [bulkPrefix, setBulkPrefix] = useState('');
  const [bulkDomain, setBulkDomain] = useState('@example.com');
  const [bulkStartNo, setBulkStartNo] = useState(1);
  const [bulkEndNo, setBulkEndNo] = useState(30);
  const [bulkZeroPad, setBulkZeroPad] = useState(2);
  const [bulkPassword, setBulkPassword] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [cohortName, setCohortName] = useState('');
  const [cohortSaving, setCohortSaving] = useState(false);
  const [activeCohortId, setActiveCohortId] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      loadProjects().catch(() => {});
      loadCohorts().catch(() => {});
      loadStudents().catch(() => {});
    }
  }, [user, navigate, loadProjects, loadCohorts, loadStudents]);

  // 當群組列表變化時，自動校正目前選取的群組：
  // - 若當前選取的群組已被刪除或不存在，改選第一個或清空
  useEffect(() => {
    const exists = cohorts.some((c) => c.id === activeCohortId);
    if (!exists) {
      if (cohorts.length > 0) {
        setActiveCohortId(cohorts[0].id);
      } else {
        setActiveCohortId(null);
      }
    }
  }, [cohorts, activeCohortId]);

  const onCreateStudent = () => {
    setEditingStudentId(null);
    setStudentName('');
    setStudentEmail('');
    setStudentPassword('');
    setIsStudentModalOpen(true);
  };

  const handleStudentSave = async () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      alert('請輸入姓名與 Email');
      return;
    }
    setStudentSaving(true);
    try {
      if (editingStudentId) {
        // 編輯模式：更新既有學生
        const payload: { name: string; email: string; password?: string } = {
          name: studentName.trim(),
          email: studentEmail.trim(),
        };
        if (studentPassword.trim()) {
          payload.password = studentPassword.trim();
        }
        await updateStudent(editingStudentId, payload);
        await loadStudents();
        alert('已更新學生資料');
      } else {
        // 新增模式：建立新學生
        await createStudent({
          name: studentName.trim(),
          email: studentEmail.trim(),
          password: studentPassword || '',
        });
        await loadStudents();
      }
      setIsStudentModalOpen(false);
    } catch (e: any) {
      alert(e?.message || (editingStudentId ? '更新失敗' : '建立失敗'));
    } finally {
      setStudentSaving(false);
    }
  };

  const onEditStudent = async (id: string, prevName: string, prevEmail: string) => {
    // 改為使用懸浮窗 modal 編輯學生資料
    setEditingStudentId(id);
    setStudentName(prevName);
    setStudentEmail(prevEmail);
    setStudentPassword(''); // 編輯時預設不顯示原密碼，留空表示不變更
    setIsStudentModalOpen(true);
  };

  const onDeleteStudent = async (id: string) => {
    if (!window.confirm('確定要刪除此學生帳號？此動作無法復原。')) return;
    try {
      await deleteStudent(id);
    } catch (e: any) {
      alert(e?.message || '刪除失敗');
    }
  };

  const openUsageModal = async (projectId: string) => {
    setUsageModalProject(projectId);
    setUsageLoading(true);
    try {
      await loadUsageRecords({ projectId });
    } catch (e: any) {
      alert(e?.message || '無法載入紀錄');
    } finally {
      setUsageLoading(false);
    }
  };

  const usageForProject = useMemo(
    () => usageRecords.filter((u) => u.project_id === usageModalProject),
    [usageRecords, usageModalProject],
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-4 font-bold text-lg border-b border-slate-800">ThesisFlow</div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          <button
            className={`btn btn-ghost w-full justify-start gap-3 ${activeSection === 'projects' ? 'bg-slate-800 text-white' : 'text-slate-100'}`}
            onClick={() => {
              setActiveSection('projects');
            }}
          >
            <Workflow size={18} /> 教學流程管理
          </button>
          <button
            className={`btn btn-ghost w-full justify-start gap-3 ${activeSection === 'students' ? 'bg-slate-800 text-white' : 'text-slate-100'}`}
            onClick={() => {
              setActiveSection('students');
            }}
          >
            <Users size={18} /> 學生帳號管理
          </button>
          <button
            className={`btn btn-ghost w-full justify-start gap-3 ${activeSection === 'cohorts' ? 'bg-slate-800 text-white' : 'text-slate-100'}`}
            onClick={() => {
              setActiveSection('cohorts');
            }}
          >
            <Users size={18} /> 學生群組管理
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 text-sm">
          <div className="font-semibold">{user?.name}</div>
          <div className="text-slate-400">{user?.email}</div>
          <button className="btn btn-sm btn-ghost mt-2" onClick={logout}>登出</button>
        </div>
      </aside>

      <main className="flex-1 p-8 space-y-8">
        {activeSection === 'projects' && (
          <>
            <div id="teacher-projects-section" className="flex justify-between items-center">
              <div>
                <p className="text-slate-500 text-sm">管理與設計學生的文獻探討學習路徑</p>
                <h1 className="text-2xl font-bold text-slate-800">教學流程管理</h1>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={async () => {
                  exitProject(); // 開新流程先清空當前流程
                  navigate('/teacher/designer');
                }}>
                  建立新流程
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((p) => (
                <div key={p.id} className="card bg-white shadow-sm border border-slate-200">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="badge badge-success">已發布</span>
                        <h3 className="text-lg font-bold text-slate-800">{p.title}</h3>
                        <p className="text-slate-500 text-sm">{p.semester || '未指定學期'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={async () => {
                          await enterProject(p.id);
                          navigate('/teacher/designer');
                        }}>編輯</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openUsageModal(p.id)}>
                          <Clock size={14}/> 紀錄
                        </button>
                        <button
                          className="btn btn-ghost btn-sm text-red-500"
                          onClick={async () => {
                            if (!window.confirm('確定要刪除這個流程嗎？')) return;
                            try {
                              await deleteProject(p.id);
                            } catch (e: any) {
                              alert(e?.message || '刪除失敗');
                            }
                          }}
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-sm mt-4">
                      <span className="flex items-center gap-1"><Users size={16}/> -</span>
                      <span className="flex items-center gap-1"><FileText size={16}/> {p.nodes.length} 個 AI 節點</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2">最後編輯：{new Date(p.updatedAt || Date.now()).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              <div
                className="card bg-white border-dashed border-2 border-slate-300 shadow-none flex items-center justify-center cursor-pointer hover:border-blue-500"
                onClick={() => {
                  exitProject();
                  navigate('/teacher/designer');
                }}
              >
                <div className="text-center p-6 text-slate-500">
                  <Plus className="mx-auto mb-2" />
                  建立新的 Workflow
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === 'students' && (
          <div id="teacher-cohorts-section" className="space-y-6">
            <div className="card bg-white border border-slate-200 shadow-sm">
            <div className="card-body">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-slate-500 text-sm">管理學生帳號與登入資訊</p>
                  <h2 className="text-lg font-bold text-slate-800">學生帳號管理</h2>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-outline" onClick={() => setIsBulkStudentModalOpen(true)}>
                    批量新增
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={onCreateStudent}>
                    <Plus size={14}/> 新增學生
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-sm">
                      <th>姓名</th>
                      <th>使用者名稱</th>
                      <th>Email</th>
                      <th>角色</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td className="text-sm text-slate-600">{(s.email || '').split('@')[0]}</td>
                        <td className="text-sm text-slate-600">{s.email}</td>
                        <td className="text-xs uppercase text-slate-500">{s.role}</td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost btn-xs" onClick={() => onEditStudent(s.id, s.name, s.email)}>
                              <Pencil size={14}/> 編輯
                            </button>
                            <button className="btn btn-ghost btn-xs text-red-500" onClick={() => onDeleteStudent(s.id)}>
                              <Trash2 size={14}/> 刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-slate-500 text-sm py-4">尚未建立學生帳號。</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </div>
        )}

        {isBulkStudentModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 text-lg">批量新增學生帳號</h2>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => !bulkSaving && setIsBulkStudentModalOpen(false)}
                >
                  關閉
                </button>
              </div>
              <div className="p-4 space-y-4 overflow-auto">
                <p className="text-sm text-slate-600">
                  透過座號範圍自動建立多個學生帳號，帳號格式為：
                  <code className="mx-1 bg-slate-100 px-1 rounded text-xs">
                    {'{prefix}{座號}{domain}'}
                  </code>
                  ，例如：<code className="bg-slate-100 px-1 rounded text-xs">cs101_01@example.com</code>。
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">顯示名稱前綴（班級名稱）</span>
                    </label>
                    <input
                      className="input input-bordered input-sm"
                      placeholder="例如：113-1 資工系 A 班 座號 "
                      value={bulkClassLabel}
                      onChange={(e) => setBulkClassLabel(e.target.value)}
                    />
                    <span className="text-xs text-slate-400 mt-1">
                      學生姓名會是「{bulkClassLabel || '113-1 資工系 A 班 座號 '}01」這樣的格式。
                    </span>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">Email 前綴（帳號前半部）</span>
                    </label>
                    <input
                      className="input input-bordered input-sm"
                      placeholder="例如：cs101_"
                      value={bulkPrefix}
                      onChange={(e) => setBulkPrefix(e.target.value)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">Email 網域</span>
                    </label>
                    <input
                      className="input input-bordered input-sm"
                      placeholder="@example.com"
                      value={bulkDomain}
                      onChange={(e) => setBulkDomain(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm">起始座號</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        value={bulkStartNo}
                        min={1}
                        onChange={(e) => setBulkStartNo(Number(e.target.value) || 1)}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm">結束座號</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        value={bulkEndNo}
                        min={bulkStartNo}
                        onChange={(e) => setBulkEndNo(Number(e.target.value) || bulkStartNo)}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm">座號補 0 位數</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        value={bulkZeroPad}
                        min={1}
                        max={4}
                        onChange={(e) => setBulkZeroPad(Number(e.target.value) || 2)}
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">預設密碼</span>
                    </label>
                    <input
                      className="input input-bordered input-sm"
                      value={bulkPassword}
                      onChange={(e) => setBulkPassword(e.target.value)}
                    />
                    <span className="text-xs text-slate-400 mt-1">
                      學生登入後可改密碼（若前台未提供修改功能，可先以此固定密碼使用）。
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-dashed border-slate-300 p-3 text-xs text-slate-600 space-y-1">
                  <div className="font-semibold">預覽</div>
                  <div>
                    座號範圍：{bulkStartNo} ~ {bulkEndNo}（共 {Math.max(0, bulkEndNo - bulkStartNo + 1)} 位）
                  </div>
                  <div>
                    第 1 位帳號：
                    <code className="bg-slate-100 px-1 rounded">
                      {bulkPrefix}
                      {String(bulkStartNo).padStart(bulkZeroPad, '0')}
                      {bulkDomain}
                    </code>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={bulkSaving}
                  onClick={() => setIsBulkStudentModalOpen(false)}
                >
                  取消
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={
                    bulkSaving ||
                    !bulkPrefix ||
                    !bulkDomain ||
                    bulkEndNo < bulkStartNo
                  }
                  onClick={async () => {
                    if (bulkEndNo < bulkStartNo) {
                      alert('結束座號必須大於等於起始座號');
                      return;
                    }
                    try {
                      setBulkSaving(true);
                      await bulkCreateStudents({
                        startNo: bulkStartNo,
                        endNo: bulkEndNo,
                        namePrefix: (bulkClassLabel || '學生座號 ') as string,
                        emailPrefix: bulkPrefix,
                        emailDomain: bulkDomain,
                        password: bulkPassword || '',
                        zeroPad: bulkZeroPad,
                      });
                      await loadStudents();
                      setIsBulkStudentModalOpen(false);
                    } catch (e: any) {
                      alert(e?.message || '批量新增失敗');
                    } finally {
                      setBulkSaving(false);
                    }
                  }}
                >
                  {bulkSaving
                    ? '建立中...'
                    : `建立 ${Math.max(0, bulkEndNo - bulkStartNo + 1)} 個學生帳號`}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'cohorts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-slate-500 text-sm">管理學生群組、綁定教學流程，並追蹤學生的實際使用情況。</p>
                <h2 className="text-2xl font-bold text-slate-800">學生群組管理</h2>
              </div>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => {
                  setCohortName('');
                  setIsCohortModalOpen(true);
                }}
              >
                <Plus size={14} /> 建立群組
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* 左側：群組清單 */}
              <div className="space-y-3 lg:col-span-1">
                <div className="card bg-white shadow-sm border border-slate-200">
                  <div className="card-body space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-slate-700">所有學生群組</h3>
                      <span className="text-xs text-slate-400">共 {cohorts.length} 個</span>
                    </div>
                    <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                      {cohorts.map((c) => {
                        const isActive = c.id === activeCohortId;
                        return (
                          <div
                            key={c.id}
                            className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                              isActive
                                ? 'border-sky-500 bg-sky-50 text-sky-900'
                                : 'border-slate-200 bg-white hover:border-sky-400 hover:bg-slate-50'
                            }`}
                          >
                            <button
                              className="flex-1 text-left"
                              onClick={() => setActiveCohortId(c.id)}
                            >
                              <div className="text-sm font-semibold">{c.name}</div>
                              <div className="text-xs text-slate-500">
                                {c.member_count} 位學生 · 編號 {c.code || '——'}
                              </div>
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => setActiveCohortId(c.id)}
                              >
                                <ChevronRight size={14} className="text-slate-400" />
                              </button>
                              <button
                                className="btn btn-ghost btn-xs text-red-500"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (
                                    !window.confirm(
                                      `確定要刪除學生群組「${c.name}」嗎？\n此動作會移除群組與其成員關聯，但不會刪除學生帳號本身。`,
                                    )
                                  ) {
                                    return;
                                  }
                                  try {
                                    await deleteCohort(c.id);
                                  } catch (err: any) {
                                    alert(err?.message || '刪除群組失敗');
                                  }
                                }}
                              >
                                刪除
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {cohorts.length === 0 && (
                        <div className="text-sm text-slate-500 py-4 text-center">
                          尚未建立任何學生群組，請點擊右上角「建立群組」開始設定。
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 右側：選定群組詳情 */}
              <div className="lg:col-span-2">
                {activeCohortId ? (
                  <CohortDetail cohortId={activeCohortId} />
                ) : (
                  <div className="h-full flex items-center justify-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
                    <div className="text-center text-slate-500 text-sm space-y-1">
                      <div>請從左側列表選擇一個學生群組，或建立新的群組。</div>
                      <div>選定群組後，這裡會顯示流程綁定、學生名單與使用紀錄。</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {usageModalProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock size={16}/> 
                <span className="font-bold text-slate-800">使用紀錄</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setUsageModalProject(null)}>關閉</button>
            </div>
            <div className="p-4 overflow-auto max-h-[70vh]">
              {usageLoading && <div className="text-slate-500 text-sm">載入中...</div>}
              {!usageLoading && usageForProject.length === 0 && (
                <div className="text-slate-500 text-sm">尚無使用紀錄。</div>
              )}
              {!usageLoading && usageForProject.length > 0 && (
                <table className="table table-zebra w-full text-sm">
                  <thead>
                    <tr>
                      <th>學生</th>
                      <th>任務類型</th>
                      <th>提交時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageForProject.map((u) => (
                      <tr key={u.id}>
                        <td>{u.user.name}</td>
                        <td>{u.task_type}</td>
                        <td>{new Date(u.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 text-lg">
                {editingStudentId ? '編輯學生帳號' : '新增學生帳號'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => !studentSaving && setIsStudentModalOpen(false)}>關閉</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">學生姓名</span>
                </label>
                <input
                  className="input input-bordered w-full"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="例如：王小明"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email（登入帳號）</span>
                </label>
                <input
                  className="input input-bordered w-full"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">初始密碼</span>
                </label>
                <input
                  className="input input-bordered w-full"
                  type="text"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder={editingStudentId ? '若不更改密碼，請留空' : '請輸入密碼'}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {editingStudentId
                    ? '若輸入新密碼，系統會將此學生密碼重設為新值；留空則不變更密碼。'
                    : '學生登入後可自行修改密碼（未實作前，可先以此密碼使用）。'}
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-2">
              <button className="btn btn-ghost btn-sm" disabled={studentSaving} onClick={() => setIsStudentModalOpen(false)}>取消</button>
              <button className="btn btn-primary btn-sm" disabled={studentSaving} onClick={handleStudentSave}>
                {studentSaving ? (editingStudentId ? '儲存中...' : '建立中...') : editingStudentId ? '儲存變更' : '建立學生'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCohortModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 text-lg">建立學生群組</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => !cohortSaving && setIsCohortModalOpen(false)}>關閉</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">群組名稱</span>
                </label>
                <input
                  className="input input-bordered w-full"
                  value={cohortName}
                  onChange={(e) => setCohortName(e.target.value)}
                  placeholder="例如：113-1 資工系 A 班"
                />
              </div>
              {/* 加入碼由系統自動產生 9 位數編號，這裡不再手動輸入 */}
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-2">
              <button className="btn btn-ghost btn-sm" disabled={cohortSaving} onClick={() => setIsCohortModalOpen(false)}>取消</button>
              <button
                className="btn btn-primary btn-sm"
                disabled={cohortSaving}
                onClick={async () => {
                  if (!cohortName.trim()) {
                    alert('請輸入群組名稱');
                    return;
                  }
                  setCohortSaving(true);
                  try {
                    await createCohort({
                      name: cohortName.trim(),
                      code: undefined,
                      project_id: null,
                    });
                    await loadCohorts();
                    setIsCohortModalOpen(false);
                  } catch (e: any) {
                    alert(e?.message || '建立群組失敗');
                  } finally {
                    setCohortSaving(false);
                  }
                }}
              >
                {cohortSaving ? '建立中...' : '建立群組'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

