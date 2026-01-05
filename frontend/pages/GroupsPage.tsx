import { Users, Hash, LogIn, School } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { useStore } from '../store';

export function GroupsPage() {
  const { cohorts, loadCohorts, joinCohortByCode } = useStore();
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCohorts();
  }, [loadCohorts]);

  const handleJoinCohort = async () => {
    const code = joinCode.trim();
    if (code.length !== 9) {
      setError('群組代碼必須為 9 位數');
      return;
    }
    setJoining(true);
    setError('');
    try {
      await joinCohortByCode(code);
      await loadCohorts();
      setJoinCode('');
      alert('已加入學生群組！');
    } catch (e: any) {
      setError(e?.message || '加入失敗，請確認群組編號是否正確。');
    } finally {
      setJoining(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('已複製群組代碼！');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">學生群組</h1>
          <p className="text-gray-500 mt-1">與同儕和指導老師協作</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Join Group Section */}
        <div className="lg:col-span-1" data-tour="join-group-form">
          <GlassCard className="p-6 space-y-6 sticky top-24">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                <LogIn size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">加入群組</h2>
            </div>
            <p className="text-gray-600 text-sm">
              輸入您的指導老師或同儕提供的唯一群組代碼，以加入他們的研究群組。
            </p>

            <div className="space-y-4">
              <Input
                label="群組代碼"
                placeholder="例如：123456789"
                icon={<Hash size={16} />}
                value={joinCode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\s+/g, '').replace(/[^\d]/g, '');
                  setJoinCode(v);
                  setError('');
                }}
                maxLength={9}
                error={error}
              />
              <Button
                className="w-full"
                onClick={handleJoinCohort}
                isLoading={joining}
                disabled={joinCode.trim().length !== 9}
              >
                加入群組
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Groups List */}
        <div className="lg:col-span-2 space-y-6" data-tour="groups-list">
          <h2 className="text-xl font-bold text-gray-900 px-1">您的群組</h2>

          {cohorts.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <School size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
              <p className="text-gray-600 font-medium mb-2">目前尚未加入任何學生群組</p>
              <p className="text-sm text-gray-500">
                請向授課教師索取群組編號，或使用左側表單加入群組。
              </p>
            </GlassCard>
          ) : (
            cohorts.map((group, index) => (
              <GlassCard
                key={group.id}
                className="p-6"
                hoverEffect
                data-tour={index === 0 ? 'group-card' : undefined}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                      <School size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Users size={14} /> Group
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {group.code && (
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      群組代碼：{' '}
                      <span className="font-mono font-medium text-gray-900 bg-white/70 backdrop-blur-xl border border-white/60 px-2 py-1 rounded shadow-sm">
                        {group.code}
                      </span>
                    </span>
                    <button
                      onClick={() => handleCopyCode(group.code!)}
                      className="text-violet-600 hover:text-violet-700 font-medium text-xs uppercase tracking-wide"
                    >
                      複製代碼
                    </button>
                  </div>
                )}
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
