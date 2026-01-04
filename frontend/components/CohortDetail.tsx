import { X, Copy, Plus, RefreshCw } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../authStore';
import { useStore } from '../store';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Input } from './ui/Input';

interface CohortDetailProps {
  cohortId: string;
}

interface CohortMemberUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface _CohortMember {
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
  const [_isAutoRefreshing, setIsAutoRefreshing] = useState(false);

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

  const members = useMemo(
    () => (cohortId ? cohortMembers[cohortId] || [] : []),
    [cohortId, cohortMembers]
  );
  const usageForCohort = useMemo(
    () => usageRecords.filter((u) => !cohortId || u.cohort_id === cohortId),
    [usageRecords, cohortId]
  );
  const availableStudents = useMemo(
    () => students.filter((s) => !members.some((m) => m.user.id === s.id)),
    [students, members]
  );

  const filteredAvailableStudents = useMemo(
    () =>
      availableStudents.filter((s) => {
        const q = studentSearch.trim().toLowerCase();
        if (!q) return true;
        return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      }),
    [availableStudents, studentSearch]
  );

  useEffect(() => {
    const current = cohorts.find((c) => c.id === cohortId);
    if (current) {
      setSelectedProject(current.project_id || null);
    }
  }, [cohortId, cohorts]);

  const currentCohort = useMemo(() => cohorts.find((c) => c.id === cohortId), [cohorts, cohortId]);

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
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
    return <div className="text-gray-500">載入中...</div>;
  }

  if (error) {
    const friendly =
      typeof error === 'string' && error.includes('Cohort not found')
        ? '找不到這個學生群組，可能已被刪除或編號不正確。請在左側重新選擇其他群組。'
        : error;
    return (
      <GlassCard className="p-4 border-red-200 bg-red-50">
        <div className="text-sm text-red-600">{friendly}</div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">群組設定</h2>
        {currentCohort && (
          <div className="flex flex-wrap items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            <span className="text-sm text-gray-600">學生邀請碼：</span>
            <div className="flex items-center gap-2">
              <span className="font-mono tracking-[0.35em] text-base text-gray-900 bg-white/70 backdrop-blur-xl border border-white/80 px-4 py-2 rounded-xl shadow-lg shadow-violet-500/5">
                {formattedCode || '尚未產生'}
              </span>
              {currentCohort.code && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Copy size={14} />}
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
                </Button>
              )}
            </div>
            <span className="text-xs text-gray-400">
              學生可在登入後於首頁輸入此 9 位數編號自行加入群組。
            </span>
          </div>
        )}
        <div className="flex gap-3 items-center flex-wrap">
          <label className="text-sm font-medium text-gray-700">綁定教學流程：</label>
          <select
            className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 shadow-lg shadow-violet-500/5"
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
          <Button
            size="sm"
            onClick={handleSaveProject}
            isLoading={savingProject}
            disabled={savingProject}
          >
            儲存設定
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">群組學生名單</h2>
          <Button
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => {
              setIsAddStudentModalOpen(true);
              setSelectedStudentIds([]);
              setStudentSearch('');
            }}
            disabled={availableStudents.length === 0}
          >
            加入學生
          </Button>
        </div>
        {members.length === 0 ? (
          <div className="text-gray-500 text-sm py-8 text-center">尚未有學生加入此群組。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">姓名</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">狀態</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">進度</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">操作</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.user.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-3 px-4">{m.user.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{m.user.email}</td>
                    <td className="py-3 px-4 text-sm">{m.status || 'active'}</td>
                    <td className="py-3 px-4 text-sm">{m.progress ?? 0}%</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(m.user.id)}
                        >
                          狀態
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateProgress(m.user.id)}
                        >
                          進度
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeCohortMember(cohortId, m.user.id)}
                        >
                          移除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-lg">加入學生到此群組</h3>
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => !addingStudents && setIsAddStudentModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 overflow-auto flex-1">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div className="w-full md:w-72">
                  <Input
                    label="搜尋學生（姓名或 Email）"
                    placeholder="例如：王小明 或 student@example.com"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  已選擇 {selectedStudentIds.length}{' '}
                  位學生，可點擊左側列或勾選方塊，或拖曳到右側列表。
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* 左側：尚未加入的學生 */}
                <div className="border border-gray-200 rounded-xl bg-gray-50/60">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-700">
                      尚未加入的學生（{filteredAvailableStudents.length}）
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={handleSelectAllVisible}>
                        全選
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                        清除
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-auto divide-y divide-gray-100">
                    {filteredAvailableStudents.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        沒有符合條件的學生。
                      </div>
                    ) : (
                      filteredAvailableStudents.map((s) => {
                        const checked = selectedStudentIds.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            className={`flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition ${
                              checked ? 'bg-violet-50' : 'hover:bg-gray-100'
                            }`}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', s.id);
                            }}
                            onClick={() => handleToggleStudent(s.id)}
                          >
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-900">{s.name}</div>
                              <div className="text-xs text-gray-500">{s.email}</div>
                            </div>
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
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
                  className={`border rounded-xl min-h-[160px] transition ${
                    isDragOverTarget
                      ? 'border-violet-500 bg-violet-50/60'
                      : 'border-gray-200 bg-gray-50/40'
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
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-700">
                      已選擇的學生（{selectedStudentIds.length}）
                    </div>
                    <div className="text-[11px] text-gray-400">
                      可拖曳學生到此處，或在左側勾選後集中顯示於此
                    </div>
                  </div>
                  <div className="max-h-64 overflow-auto divide-y divide-gray-100">
                    {selectedStudentIds.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        將學生拖曳到此處，或在左側點擊「+」加入到本群組。
                      </div>
                    ) : (
                      selectedStudentIds
                        .map((id) => availableStudents.find((s) => s.id === id))
                        .filter((s): s is (typeof availableStudents)[number] => !!s)
                        .map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-100"
                          >
                            <div>
                              <div className="font-medium text-gray-900">{s.name}</div>
                              <div className="text-xs text-gray-500">{s.email}</div>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleToggleStudent(s.id)}
                            >
                              移除
                            </Button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                disabled={addingStudents}
                onClick={() => setIsAddStudentModalOpen(false)}
              >
                取消
              </Button>
              <Button
                disabled={addingStudents || selectedStudentIds.length === 0}
                onClick={handleConfirmAddStudents}
                isLoading={addingStudents}
              >
                {addingStudents ? '加入中...' : `加入 ${selectedStudentIds.length} 位學生`}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      <GlassCard className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">使用紀錄</h2>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => cohortId && loadUsageRecords({ cohortId })}
          >
            重新整理
          </Button>
        </div>
        {usageForCohort.length === 0 ? (
          <div className="text-sm text-gray-500 py-8 text-center">目前沒有使用紀錄。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">學生</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">流程</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">任務</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">時間</th>
                </tr>
              </thead>
              <tbody>
                {usageForCohort.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-3 px-4">{u.user.name}</td>
                    <td className="py-3 px-4">{u.project_title || u.project_id}</td>
                    <td className="py-3 px-4">{u.task_type}</td>
                    <td className="py-3 px-4">{new Date(u.created_at).toLocaleString('zh-TW')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
