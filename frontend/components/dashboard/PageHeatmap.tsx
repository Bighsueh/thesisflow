import React, { useEffect, useState } from 'react';
import { analyticsService, PageHeatmap as PageHeatmapType } from '../../services/analyticsService';
import { GlassCard } from '../ui/GlassCard';

interface PageHeatmapProps {
  cohortId: string;
  documentId: string;
}

export function PageHeatmap({ cohortId, documentId }: PageHeatmapProps) {
  const [data, setData] = useState<PageHeatmapType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (documentId) {
      loadData();
    }
  }, [cohortId, documentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getPageHeatmap(cohortId, documentId);
      setData(result);
    } catch (error) {
      console.error('Failed to load page heatmap:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">頁碼熱力圖</h3>
        <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
      </GlassCard>
    );
  }

  const getHeatColor = (intensity: number) => {
    if (intensity >= 0.8) return 'bg-red-600';
    if (intensity >= 0.6) return 'bg-orange-500';
    if (intensity >= 0.4) return 'bg-yellow-500';
    if (intensity >= 0.2) return 'bg-blue-400';
    return 'bg-gray-300';
  };

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">頁碼熱力圖</h3>
      {data && data.pages.length > 0 ? (
        <div>
          <div className="text-sm text-gray-600 mb-3">{data.documentTitle}</div>
          <div className="flex flex-wrap gap-2">
            {data.pages.map((page) => (
              <div
                key={page.page}
                className="relative group"
                title={`第 ${page.page} 頁：${page.highlightCount} 次標記`}
              >
                <div
                  className={`w-10 h-10 rounded flex items-center justify-center text-white text-xs font-medium ${getHeatColor(
                    page.intensity
                  )}`}
                >
                  {page.page}
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {page.highlightCount} 次標記
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
            <span>熱度：</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>低</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span>高</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-gray-500">
          此文檔尚無頁碼標記資料
        </div>
      )}
    </GlassCard>
  );
}
