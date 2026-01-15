import { MessageSquare } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  analyticsService,
  FeedbackSummary as FeedbackSummaryType,
} from '../../services/analyticsService';
import { GlassCard } from '../ui/GlassCard';

interface FeedbackSummaryProps {
  cohortId: string;
}

export function FeedbackSummary({ cohortId }: FeedbackSummaryProps) {
  const [data, setData] = useState<FeedbackSummaryType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [cohortId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getFeedbackSummary(cohortId);
      setData(result);
    } catch (error) {
      console.error('Failed to load feedback summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">AI 回饋摘要</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">AI 回饋摘要</h3>

      {data && data.commonSuggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">常見建議關鍵詞</h4>
          <div className="flex flex-wrap gap-2">
            {data.commonSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm"
              >
                {suggestion.keyword} ({suggestion.count})
              </div>
            ))}
          </div>
        </div>
      )}

      {data && data.recentFeedbacks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">最近回饋</h4>
          <div className="space-y-3">
            {data.recentFeedbacks.map((feedback, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-2 mb-2">
                  <MessageSquare size={16} className="text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {feedback.studentName}
                      </span>
                      <span className="text-xs text-gray-500">Task {feedback.taskType}</span>
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(feedback.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{feedback.feedbackPreview}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && data.commonSuggestions.length === 0 && data.recentFeedbacks.length === 0 && (
        <div className="h-48 flex items-center justify-center text-gray-500">尚無 AI 回饋記錄</div>
      )}
    </GlassCard>
  );
}
