import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  analyticsService,
  ComparisonDimensions as ComparisonDimensionsType,
} from '../../services/analyticsService';
import { GlassCard } from '../ui/GlassCard';

interface ComparisonDimensionsProps {
  cohortId: string;
}

export function ComparisonDimensions({ cohortId }: ComparisonDimensionsProps) {
  const [data, setData] = useState<ComparisonDimensionsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [cohortId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getComparisonDimensions(cohortId);
      setData(result);
    } catch (error) {
      console.error('Failed to load comparison dimensions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">比較任務維度分析</h3>
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </GlassCard>
    );
  }

  const chartData = data?.dimensions.slice(0, 10) || [];

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">比較任務維度分析</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="usageCount" fill="#8b5cf6" radius={[0, 8, 8, 0]} name="使用次數" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">尚無比較任務資料</div>
      )}
    </GlassCard>
  );
}
