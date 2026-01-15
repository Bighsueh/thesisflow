import { FileText } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  analyticsService,
  DocumentUsage as DocumentUsageType,
} from '../../services/analyticsService';
import { GlassCard } from '../ui/GlassCard';

interface DocumentUsageProps {
  cohortId: string;
}

export function DocumentUsage({ cohortId }: DocumentUsageProps) {
  const [data, setData] = useState<DocumentUsageType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [cohortId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getDocumentUsage(cohortId);
      setData(result);
    } catch (error) {
      console.error('Failed to load document usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">文獻使用熱度</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </GlassCard>
    );
  }

  const maxCount = Math.max(...(data?.documents.map((d) => d.highlightCount) || [1]));

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">文獻使用熱度</h3>
      {data && data.documents.length > 0 ? (
        <div className="space-y-3">
          {data.documents.map((doc) => (
            <div key={doc.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <FileText size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{doc.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{doc.highlightCount} 次標記</div>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-violet-600 h-2 rounded-full transition-all"
                  style={{ width: `${(doc.highlightCount / maxCount) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500">尚無文獻使用記錄</div>
      )}
    </GlassCard>
  );
}
