import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { analyticsService, TaskMatrix as TaskMatrixType } from '../../services/analyticsService';
import { GlassCard } from '../ui/GlassCard';

interface TaskProgressMatrixProps {
  cohortId: string;
}

export function TaskProgressMatrix({ cohortId }: TaskProgressMatrixProps) {
  const [data, setData] = useState<TaskMatrixType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [cohortId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getTaskMatrix(cohortId);
      setData(result);
    } catch (error) {
      console.error('Failed to load task matrix:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'nearly_complete':
        return <Clock size={20} className="text-orange-500" />;
      case 'in_progress':
        return <Circle size={20} className="text-blue-500" />;
      default:
        return <Circle size={20} className="text-gray-300" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return '完成';
      case 'nearly_complete':
        return '接近完成';
      case 'in_progress':
        return '進行中';
      default:
        return '未開始';
    }
  };

  const getLastActiveText = (timestamp: number | null) => {
    if (!timestamp) return '尚未開始';
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (days > 3) return `${days} 天前`;
    if (hours > 0) return `${hours} 小時前`;
    return '剛剛';
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">任務進度矩陣</h3>
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
      <h3 className="text-lg font-bold text-gray-900 mb-4">任務進度矩陣</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">學生姓名</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">摘要任務</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">比較任務</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">最後活躍</th>
            </tr>
          </thead>
          <tbody>
            {data?.students.map((student) => {
              const isInactive =
                student.lastActive && Date.now() - student.lastActive > 3 * 24 * 60 * 60 * 1000;
              return (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(student.summaryStatus)}
                      <span className="text-sm">{getStatusText(student.summaryStatus)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(student.comparisonStatus)}
                      <span className="text-sm">{getStatusText(student.comparisonStatus)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={isInactive ? 'text-red-600' : 'text-gray-600'}>
                        {getLastActiveText(student.lastActive)}
                      </span>
                      {isInactive && <AlertCircle size={16} className="text-red-600" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
