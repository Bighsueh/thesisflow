import { AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { analyticsService, EditingDepth } from '../../services/analyticsService';
import { GlassCard } from '../ui/GlassCard';

interface EditingDepthAnalysisProps {
  cohortId: string;
}

export function EditingDepthAnalysis({ cohortId }: EditingDepthAnalysisProps) {
  const [data, setData] = useState<EditingDepth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [cohortId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getEditingDepth(cohortId);
      setData(result);
    } catch (error) {
      console.error('Failed to load editing depth:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWarningLevel = (student: EditingDepth['students'][0]) => {
    if (
      student.summaryWordCount < 100 ||
      student.comparisonRows < 2 ||
      student.totalEvidenceUsed < 3
    ) {
      return 'high';
    }
    return 'normal';
  };

  const getLastEditText = (timestamp: number | null) => {
    if (!timestamp) return '尚未編輯';
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小時前`;
    return '剛剛';
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">編輯深度分析</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">編輯深度分析</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">學生</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">摘要字數</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">比較行數</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Evidence 數</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">最後編輯</th>
            </tr>
          </thead>
          <tbody>
            {data?.students.map((student, index) => {
              const warning = getWarningLevel(student);
              return (
                <tr
                  key={index}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    warning === 'high' ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {warning === 'high' && <AlertTriangle size={16} className="text-red-600" />}
                      <span className="font-medium text-gray-900">{student.studentName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={student.summaryWordCount < 100 ? 'text-red-600' : 'text-gray-900'}
                    >
                      {student.summaryWordCount}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={student.comparisonRows < 2 ? 'text-red-600' : 'text-gray-900'}>
                      {student.comparisonRows}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={student.totalEvidenceUsed < 3 ? 'text-red-600' : 'text-gray-900'}
                    >
                      {student.totalEvidenceUsed}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{getLastEditText(student.lastEditAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.students.some((s) => getWarningLevel(s) === 'high') && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2 text-sm text-yellow-800">
            <AlertTriangle size={16} className="mt-0.5" />
            <span>部分學生的內容量明顯偏低，建議關注並提供協助。</span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
