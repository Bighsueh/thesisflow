import { ChevronDown, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import {
  OverviewStats,
  TaskProgressMatrix,
  WordCloud,
  ActivityTrend,
  EvidenceStats,
  DocumentUsage,
  EditingDepthAnalysis,
  FeedbackSummary,
  ActivityTimeline,
  ComparisonDimensions,
  ChatLogs,
} from '../components/dashboard';
import { TeacherLayout } from '../components/teacher/TeacherLayout';
import { TeacherSidebar } from '../components/teacher/TeacherSidebar';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { useStore } from '../store';

export default function TeacherDashboard() {
  const { cohortId } = useParams<{ cohortId?: string }>();
  const navigate = useNavigate();
  const { user, hydrate } = useAuthStore();
  const { cohorts, loadCohorts } = useStore();
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(cohortId || null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    hydrate();
    loadCohorts();
  }, [hydrate, loadCohorts]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (cohortId) {
      setSelectedCohortId(cohortId);
    }
  }, [cohortId]);

  // 自動選擇第一個群組
  useEffect(() => {
    if (!cohortId && cohorts.length > 0 && !selectedCohortId) {
      const firstCohortId = cohorts[0].id;
      setSelectedCohortId(firstCohortId);
      navigate(`/teacher/dashboard/${firstCohortId}`, { replace: true });
    }
  }, [cohorts, cohortId, selectedCohortId, navigate]);

  const handleCohortSelect = (id: string) => {
    setSelectedCohortId(id);
    setDropdownOpen(false);
    navigate(`/teacher/dashboard/${id}`);
  };

  const handleSectionChange = (section: 'accounts' | 'groups' | 'dashboard') => {
    if (section === 'dashboard') {
      navigate('/teacher/dashboard');
    } else if (section === 'accounts') {
      navigate('/teacher/accounts');
    } else if (section === 'groups') {
      navigate('/teacher/groups');
    }
  };

  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId);

  return (
    <TeacherLayout
      sidebar={<TeacherSidebar activeSection="dashboard" onSectionChange={handleSectionChange} />}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">學習分析儀表板</h1>
          {selectedCohortId && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={16} />}
              onClick={() => setLoading(true)}
            >
              重新整理
            </Button>
          )}
        </div>

        {cohorts.length === 0 ? (
          <GlassCard className="p-8">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">尚未建立群組</h2>
                <p className="text-gray-600">
                  請先前往「學生群組管理」建立群組，才能查看學習分析數據。
                </p>
              </div>
              <Button variant="primary" onClick={() => navigate('/teacher')}>
                前往群組管理
              </Button>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedCohort?.name || '群組'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedCohort?.member_count || 0} 位學生
                  </p>
                </div>
                <div className="relative">
                  <Button variant="ghost" size="sm" onClick={() => setDropdownOpen(!dropdownOpen)}>
                    切換群組 <ChevronDown size={16} className="ml-1" />
                  </Button>
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-2 max-h-96 overflow-y-auto">
                        {cohorts.map((cohort) => (
                          <button
                            key={cohort.id}
                            onClick={() => handleCohortSelect(cohort.id)}
                            className={`w-full px-4 py-3 text-left hover:bg-violet-50 transition-colors ${
                              cohort.id === selectedCohortId
                                ? 'bg-violet-50 text-violet-700'
                                : 'text-gray-900'
                            }`}
                          >
                            <div className="font-medium">{cohort.name}</div>
                            <div className="text-sm text-gray-500">
                              {cohort.member_count} 位學生
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Dashboard 組件 */}
            <div className="space-y-6">
              {/* 區塊 1: 總覽統計卡片 */}
              <OverviewStats cohortId={selectedCohortId} />

              {/* 區塊 2 & 3: 任務進度矩陣 & 文字雲 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                  <TaskProgressMatrix cohortId={selectedCohortId} />
                </div>
                <div className="lg:col-span-1">
                  <WordCloud cohortId={selectedCohortId} />
                </div>
              </div>

              {/* 區塊 4 & 5: 活動趨勢 & Evidence 統計 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                  <ActivityTrend cohortId={selectedCohortId} />
                </div>
                <div className="lg:col-span-1">
                  <EvidenceStats cohortId={selectedCohortId} />
                </div>
              </div>

              {/* 區塊 6 & 7: 文獻使用 & 活動時間 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                  <DocumentUsage cohortId={selectedCohortId} />
                </div>
                <div className="lg:col-span-1">
                  <ActivityTimeline cohortId={selectedCohortId} />
                </div>
              </div>

              {/* 區塊 8: 編輯深度分析 */}
              <EditingDepthAnalysis cohortId={selectedCohortId} />

              {/* 區塊 9 & 10: AI 回饋 & 比較維度 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                  <FeedbackSummary cohortId={selectedCohortId} />
                </div>
                <div className="lg:col-span-1">
                  <ComparisonDimensions cohortId={selectedCohortId} />
                </div>
              </div>

              {/* 區塊 11: 學生對話記錄 */}
              <ChatLogs cohortId={selectedCohortId} />
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
