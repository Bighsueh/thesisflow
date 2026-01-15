import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  analyticsService,
  EvidenceStats as EvidenceStatsType,
} from '../../services/analyticsService';
import { GlassCard } from '../ui/GlassCard';

interface EvidenceStatsProps {
  cohortId: string;
}

const COLORS = {
  Purpose: '#8b5cf6',
  Method: '#3b82f6',
  Findings: '#10b981',
  Limitation: '#f59e0b',
  Other: '#6b7280',
};

export function EvidenceStats({ cohortId }: EvidenceStatsProps) {
  const [stats, setStats] = useState<EvidenceStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [cohortId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getEvidenceStats(cohortId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load evidence stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Evidence 標記統計</h3>
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </GlassCard>
    );
  }

  const chartData = stats
    ? Object.entries(stats.byType).map(([key, value]) => ({
        name: key,
        count: value,
      }))
    : [];

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Evidence 標記統計</h3>

      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900">{stats?.total || 0}</div>
        <div className="text-sm text-gray-600">總標記數</div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.Other}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">尚無標記資料</div>
      )}
    </GlassCard>
  );
}
