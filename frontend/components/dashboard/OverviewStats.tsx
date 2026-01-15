import { Users, Activity, FileText, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  analyticsService,
  OverviewStats as OverviewStatsType,
} from '../../services/analyticsService';
import { GlassCard } from '../ui/GlassCard';

interface OverviewStatsProps {
  cohortId: string;
}

export function OverviewStats({ cohortId }: OverviewStatsProps) {
  const [stats, setStats] = useState<OverviewStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [cohortId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getOverview(cohortId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load overview stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: '班級人數',
      value: stats?.totalStudents || 0,
      icon: <Users size={24} />,
      color: 'violet',
    },
    {
      label: '今日活躍',
      value: stats?.activeToday || 0,
      icon: <Activity size={24} />,
      color: 'green',
    },
    {
      label: '總標記數',
      value: stats?.totalHighlights || 0,
      icon: <FileText size={24} />,
      color: 'blue',
    },
    {
      label: '平均進度',
      value: `${stats?.avgProgress || 0}%`,
      icon: <TrendingUp size={24} />,
      color: 'orange',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <GlassCard key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, index) => (
        <GlassCard key={index} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className={`p-3 rounded-lg bg-${card.color}-100 text-${card.color}-600`}>
              {card.icon}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
