import React, { useEffect, useState } from 'react';
import {
  analyticsService,
  ActivityTimeline as ActivityTimelineType,
} from '../../services/analyticsService';
import { GlassCard } from '../ui/GlassCard';

interface ActivityTimelineProps {
  cohortId: string;
}

export function ActivityTimeline({ cohortId }: ActivityTimelineProps) {
  const [data, setData] = useState<ActivityTimelineType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [cohortId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getActivityTimeline(cohortId);
      setData(result);
    } catch (error) {
      console.error('Failed to load activity timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">活動時間分布</h3>
        <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
      </GlassCard>
    );
  }

  const maxCount = Math.max(...(data?.hourly.map((h) => h.count) || [1]));

  const getBarHeight = (count: number) => {
    if (maxCount === 0) return '0%';
    return `${(count / maxCount) * 100}%`;
  };

  const getBarColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.7) return 'bg-red-500';
    if (ratio >= 0.4) return 'bg-orange-400';
    if (ratio >= 0.2) return 'bg-blue-400';
    return 'bg-gray-300';
  };

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">活動時間分布（24 小時）</h3>
      {data && data.hourly.length > 0 ? (
        <div>
          <div className="flex items-end justify-between h-32 gap-1">
            {data.hourly.map((hour) => (
              <div key={hour.hour} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-end justify-center h-full">
                  <div
                    className={`w-full rounded-t transition-all ${getBarColor(hour.count)}`}
                    style={{ height: getBarHeight(hour.count) }}
                    title={`${hour.hour}:00 - ${hour.count} 次活動`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            {[0, 6, 12, 18, 23].map((hour) => (
              <span key={hour}>{hour}:00</span>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>高峰時段：</span>
              {maxCount > 0 ? (
                data.hourly
                  .filter((h) => h.count === maxCount && h.count > 0)
                  .map((h) => `${h.hour}:00`)
                  .join(', ')
              ) : (
                <span className="text-gray-400">無資料</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-gray-500">尚無活動時間記錄</div>
      )}
    </GlassCard>
  );
}
