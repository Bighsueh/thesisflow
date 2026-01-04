import { Plus, ChevronRight, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import CohortDetail from '../CohortDetail';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';

export function StudentGroupSection() {
  const { cohorts, loadCohorts, createCohort, deleteCohort } = useStore();
  const [activeCohortId, setActiveCohortId] = useState<string | null>(null);
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [cohortName, setCohortName] = useState('');
  const [cohortSaving, setCohortSaving] = useState(false);

  useEffect(() => {
    loadCohorts().catch(() => {});
  }, [loadCohorts]);

  // 當群組列表變化時，自動校正目前選取的群組
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm">
            管理學生群組、綁定教學流程，並追蹤學生的實際使用情況。
          </p>
          <h2 className="text-2xl font-bold text-gray-900">學生群組管理</h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setCohortName('');
            setIsCohortModalOpen(true);
          }}
          leftIcon={<Plus size={16} />}
        >
          建立群組
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* 左側：群組清單 */}
        <div className="space-y-3 lg:col-span-1">
          <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700">所有學生群組</h3>
              <span className="text-xs text-gray-400">共 {cohorts.length} 個</span>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
              {cohorts.map((c) => {
                const isActive = c.id === activeCohortId;
                return (
                  <div
                    key={c.id}
                    className={`
                      w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition cursor-pointer
                      ${
                        isActive
                          ? 'border-violet-500 bg-violet-50 text-violet-900'
                          : 'border-gray-200 bg-white hover:border-violet-400 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setActiveCohortId(c.id)}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="text-xs text-gray-500">
                        {c.member_count || 0} 位學生 · 編號 {c.code || '——'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1 hover:bg-white/50 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCohortId(c.id);
                        }}
                      >
                        <ChevronRight size={14} className="text-gray-400" />
                      </button>
                      <button
                        className="p-1 hover:bg-red-50 rounded transition-colors text-red-500"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (
                            !window.confirm(
                              `確定要刪除學生群組「${c.name}」嗎？\n此動作會移除群組與其成員關聯，但不會刪除學生帳號本身。`
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
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {cohorts.length === 0 && (
                <div className="text-sm text-gray-500 py-4 text-center">
                  尚未建立任何學生群組，請點擊右上角「建立群組」開始設定。
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* 右側：選定群組詳情 */}
        <div className="lg:col-span-2">
          {activeCohortId ? (
            <CohortDetail cohortId={activeCohortId} />
          ) : (
            <GlassCard className="p-12">
              <div className="text-center text-gray-500 space-y-2">
                <div>請從左側列表選擇一個學生群組，或建立新的群組。</div>
                <div className="text-sm">選定群組後，這裡會顯示流程綁定、學生名單與使用紀錄。</div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Create Cohort Modal */}
      {isCohortModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-lg">建立學生群組</h2>
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => !cohortSaving && setIsCohortModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="群組名稱"
                placeholder="例如：113-1 資工系 A 班"
                value={cohortName}
                onChange={(e) => setCohortName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                disabled={cohortSaving}
                onClick={() => setIsCohortModalOpen(false)}
              >
                取消
              </Button>
              <Button
                disabled={cohortSaving || !cohortName.trim()}
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
                isLoading={cohortSaving}
              >
                建立群組
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
