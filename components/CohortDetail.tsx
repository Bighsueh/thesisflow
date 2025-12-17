import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../authStore';
import { useStore } from '../store';

interface CohortDetailProps {
  cohortId: string;
}

interface CohortMemberUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface CohortMember {
  user: CohortMemberUser;
  status?: string;
  progress: number;
}

export default function CohortDetail({ cohortId }: CohortDetailProps) {
  const { hydrate } = useAuthStore();
  const {
    cohorts,
    loadCohorts,
    loadCohortMembers,
    cohortMembers,
    projects,
    loadProjects,
    students,
    loadStudents,
    addCohortMember,
    removeCohortMember,
    updateCohortMember,
    updateCohort,
    loadUsageRecords,
    usageRecords,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [addingStudents, setAddingStudents] = useState(false);
  const [isDragOverTarget, setIsDragOverTarget] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const loadData = async () => {
      if (!cohortId) return;
      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          loadCohorts(),
          loadProjects(),
          loadStudents(),
          loadCohortMembers(cohortId),
          loadUsageRecords({ cohortId }),
        ]);
      } catch (e: any) {
        setError(e.message || '無法載入資料');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [cohortId, loadProjects, loadStudents, loadCohortMembers, loadUsageRecords, loadCohorts]);

  // 老師端自動輪詢最新學生名單，讓使用邀請碼加入的學生可以在幾秒內出現在畫面上
  useEffect(() => {
    if (!cohortId) return;
    setIsAutoRefreshing(true);

    const intervalId = window.setInterval(() => {
      // 僅更新目前這個 cohort 的成員，避免造成後端太大負載
      loadCohortMembers(cohortId);
      // 同步更新左側群組列表上的人數統計
      loadCohorts();
    }, 10000); // 每 10 秒更新一次，兼顧即時性與效能

    return () => {
      window.clearInterval(intervalId);
      setIsAutoRefreshing(false);
    };
  }, [cohortId, loadCohortMembers, loadCohorts]);

  const members = useMemo(() => (cohortId ? cohortMembers[cohortId] || [] : []), [cohortId, cohortMembers]);
  const usageForCohort = useMemo(
    () => usageRecords.filter((u) => !cohortId || u.cohort_id === cohortId),
    [usageRecords, cohortId],
  );
  const availableStudents = useMemo(
    () => students.filter((s) => !members.some((m) => m.user.id === s.id)),
    [students, members],
  );

  const filteredAvailableStudents = useMemo(
    () =>
      availableStudents.filter((s) => {
        const q = studentSearch.trim().toLowerCase();
        if (!q) return true;
        return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      }),
    [availableStudents, studentSearch],
  );

  useEffect(() => {
    const current = cohorts.find((c) => c.id === cohortId);
    if (current) {
      setSelectedProject(current.project_id || null);
    }
  }, [cohortId, cohorts]);

  const currentCohort = useMemo(
    () => cohorts.find((c) => c.id === cohortId),
    [cohorts, cohortId],
  );

  const formattedCode = useMemo(() => {
    if (!currentCohort?.code) return '';
    // 每 3 碼插入一個空格，方便閱讀，例如 123 456 789
    return currentCohort.code.replace(/(\d{3})(?=\d)/g, '$1 ');
  }, [currentCohort]);

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

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAllVisible = () => {
    setSelectedStudentIds(filteredAvailableStudents.map((s) => s.id));
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  const handleConfirmAddStudents = async () => {
    if (!cohortId || selectedStudentIds.length === 0) return;
    setAddingStudents(true);
    try {
      for (const id of selectedStudentIds) {
        // 逐一加入，避免一次傳太多造成錯誤難以追蹤
        // eslint-disable-next-line no-await-in-loop
        await addCohortMember(cohortId, id);
      }
      await loadCohortMembers(cohortId);
      setIsAddStudentModalOpen(false);
      setSelectedStudentIds([]);
      setStudentSearch('');
    } catch (e: any) {
      alert(e?.message || '加入學生失敗');
    } finally {
      setAddingStudents(false);
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

  if (loading) {
    return <div className="text-slate-500">載入中...</div>;
  }

  if (error) {
    const friendly =
      typeof error === 'string' && error.includes('Cohort not found')
        ? '找不到這個學生群組，可能已被刪除或編號不正確。請在左側重新選擇其他群組。'
        : error;
    return <div className="alert alert-error mb-4 text-sm">{friendly}</div>;
  }

  return (
    <div className="space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
      <div className="card bg-white shadow-sm border border-slate-200">
        <div className="card-body space-y-4">
          <h2 className="text-lg font-bold text-slate-800">群組設定</h2>
          {currentCohort && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-600">學生邀請碼：</span>
              <span className="flex items-center gap-2">
                <span className="font-mono tracking-[0.35em] text-base text-slate-900 bg-slate-100 px-3 py-1 rounded-md">
                  {formattedCode || '尚未產生'}
                </span>
                {currentCohort.code && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(currentCohort.code!);
                        alert('邀請碼已複製到剪貼簿');
                      } catch {
                        alert('複製失敗，請手動選取文字複製');
                      }
                    }}
                  >
                    複製
                  </button>
                )}
              </span>
              <span className="text-xs text-slate-400">
                學生可在登入後於首頁輸入此 9 位數編號自行加入群組。
              </span>
            </div>
          )}
          <div className="flex gap-3 items-center">
            <label className="text-sm text-slate-600">綁定教學流程：</label>
            <select
              className="select select-bordered select-sm"
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value || null)}
            >
              <option value="">未綁定</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <button className="btn btn-sm btn-primary" onClick={handleSaveProject} disabled={savingProject}>
              {savingProject ? '儲存中...' : '儲存設定'}
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-white shadow-sm border border-slate-200">
        <div className="card-body space-y-3 max-h-[420px] flex flex-col">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">群組學生名單</h2>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                setIsAddStudentModalOpen(true);
                setSelectedStudentIds([]);
                setStudentSearch('');
              }}
              disabled={availableStudents.length === 0}
            >
              加入學生
            </button>
          </div>
          {members.length === 0 ? (
            <div className="text-slate-500 text-sm">尚未有學生加入此群組。</div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th>姓名</th>
                    <th>Email</th>
                    <th>狀態</th>
                    <th>進度</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.user.id}>
                      <td>{m.user.name}</td>
                      <td className="text-sm text-slate-600">{m.user.email}</td>
                      <td className="text-sm">{m.status || 'active'}</td>
                      <td className="text-sm">{m.progress ?? 0}%</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-xs" onClick={() => handleUpdateStatus(m.user.id)}>
                            狀態
                          </button>
                          <button className="btn btn-ghost btn-xs" onClick={() => handleUpdateProgress(m.user.id)}>
                            進度
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-red-500"
                            onClick={() => removeCohortMember(cohortId, m.user.id)}
                          >
                            移除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">加入學生到此群組</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => !addingStudents && setIsAddStudentModalOpen(false)}
              >
                關閉
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-auto">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div className="form-control w-full md:w-72">
                  <label className="label">
                    <span className="label-text text-sm text-slate-600">搜尋學生（姓名或 Email）</span>
                  </label>
                  <input
                    className="input input-bordered input-sm w-full"
                    placeholder="例如：王小明 或 student@example.com"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                <div className="text-xs text-slate-500">
                  已選擇 {selectedStudentIds.length} 位學生，可點擊左側列或勾選方塊，或拖曳到右側列表。
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* 左側：尚未加入的學生 */}
                <div className="border border-slate-200 rounded-lg bg-slate-50/60">
                  <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-600">
                      尚未加入的學生（{filteredAvailableStudents.length}）
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={handleSelectAllVisible}
                      >
                        全選
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={handleClearSelection}
                      >
                        清除
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-auto divide-y">
                    {filteredAvailableStudents.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500 text-center">沒有符合條件的學生。</div>
                    ) : (
                      filteredAvailableStudents.map((s) => {
                        const checked = selectedStudentIds.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition ${
                              checked ? 'bg-sky-50' : 'hover:bg-slate-100'
                            }`}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', s.id);
                            }}
                            onClick={() => handleToggleStudent(s.id)}
                          >
                            <div className="flex-1 text-left">
                              <div className="font-medium text-slate-800">{s.name}</div>
                              <div className="text-xs text-slate-500">{s.email}</div>
                            </div>
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              readOnly
                              checked={checked}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 右側：準備加入的學生（拖曳目標） */}
                <div
                  className={`border rounded-lg min-h-[160px] transition ${
                    isDragOverTarget ? 'border-sky-500 bg-sky-50/60' : 'border-slate-200 bg-slate-50/40'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOverTarget(true);
                  }}
                  onDragLeave={() => setIsDragOverTarget(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOverTarget(false);
                    const id = e.dataTransfer.getData('text/plain');
                    if (id && availableStudents.some((s) => s.id === id)) {
                      handleToggleStudent(id);
                    }
                  }}
                >
                  <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-600">
                      已選擇的學生（{selectedStudentIds.length}）
                    </div>
                    <div className="text-[11px] text-slate-400">
                      可拖曳學生到此處，或在左側勾選後集中顯示於此
                    </div>
                  </div>
                  <div className="max-h-64 overflow-auto divide-y">
                    {selectedStudentIds.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500 text-center">
                        將學生拖曳到此處，或在左側點擊「+」加入到本群組。
                      </div>
                    ) : (
                      selectedStudentIds
                        .map((id) => availableStudents.find((s) => s.id === id))
                        .filter((s): s is (typeof availableStudents)[number] => !!s)
                        .map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-100"
                          >
                            <div>
                              <div className="font-medium text-slate-800">{s.name}</div>
                              <div className="text-xs text-slate-500">{s.email}</div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-red-500"
                              onClick={() => handleToggleStudent(s.id)}
                            >
                              移除
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                className="btn btn-ghost btn-sm"
                disabled={addingStudents}
                onClick={() => setIsAddStudentModalOpen(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={addingStudents || selectedStudentIds.length === 0}
                onClick={handleConfirmAddStudents}
              >
                {addingStudents ? '加入中...' : `加入 ${selectedStudentIds.length} 位學生`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-white shadow-sm border border-slate-200">
        <div className="card-body">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-slate-800">使用紀錄</h2>
            <button className="btn btn-sm" onClick={() => cohortId && loadUsageRecords({ cohortId })}>
              重新整理
            </button>
          </div>
          {usageForCohort.length === 0 ? (
            <div className="text-sm text-slate-500">目前沒有使用紀錄。</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-sm">
                <thead>
                  <tr>
                    <th>學生</th>
                    <th>流程</th>
                    <th>任務</th>
                    <th>時間</th>
                  </tr>
                </thead>
                <tbody>
                  {usageForCohort.map((u) => (
                    <tr key={u.id}>
                      <td>{u.user.name}</td>
                      <td>{u.project_title || u.project_id}</td>
                      <td>{u.task_type}</td>
                      <td>{new Date(u.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


