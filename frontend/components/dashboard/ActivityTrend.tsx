import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  analyticsService,
  ActivityTrend as ActivityTrendType,
} from '../../services/analyticsService';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';

interface ActivityTrendProps {
  cohortId: string;
}

export function ActivityTrend({ cohortId }: ActivityTrendProps) {
  const [data, setData] = useState<ActivityTrendType | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    loadData();
  }, [cohortId, period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getActivityTrend(cohortId, period);
      setData(result);
    } catch (error) {
      console.error('Failed to load activity trend:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">學生活動趨勢</h3>
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">學生活動趨勢</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={period === '7d' ? 'primary' : 'ghost'}
            onClick={() => setPeriod('7d')}
          >
            7天
          </Button>
          <Button
            size="sm"
            variant={period === '30d' ? 'primary' : 'ghost'}
            onClick={() => setPeriod('30d')}
          >
            30天
          </Button>
          <Button
            size="sm"
            variant={period === 'all' ? 'primary' : 'ghost'}
            onClick={() => setPeriod('all')}
          >
            全部
          </Button>
        </div>
      </div>

      {data && data.daily.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              labelFormatter={(label) => {
                const date = new Date(label);
                return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="chatMessages"
              stroke="#10b981"
              strokeWidth={2}
              name="對話次數"
              dot={{ fill: '#10b981', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="taskEdits"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="任務編輯"
              dot={{ fill: '#8b5cf6', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="highlightsCreated"
              stroke="#3b82f6"
              strokeWidth={2}
              name="新增標記"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">此期間無活動記錄</div>
      )}
    </GlassCard>
  );
}
