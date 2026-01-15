import React, { useEffect, useState } from 'react';
import ReactWordcloud from 'react-wordcloud';
import { analyticsService, WordCloudData } from '../../services/analyticsService';
import { GlassCard } from '../ui/GlassCard';

// Fix: Remove defaultProps to prevent React 18.3+ warning
const WordCloudBase = ReactWordcloud as any;
const wordcloudDefaultProps = WordCloudBase?.defaultProps ?? {};
if (WordCloudBase?.defaultProps) {
  try {
    delete WordCloudBase.defaultProps;
  } catch {
    // Ignore if deletion fails
  }
}

interface WordCloudProps {
  cohortId: string;
}

export function WordCloud({ cohortId }: WordCloudProps) {
  const [data, setData] = useState<WordCloudData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cohortId) return;
    loadData();
  }, [cohortId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getWordCloud(cohortId);
      setData(result);
    } catch (error) {
      console.error('Failed to load word cloud:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">學生對話關鍵詞</h3>
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </GlassCard>
    );
  }

  if (data?.error) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">學生對話關鍵詞</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">{data.error}</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">學生對話關鍵詞</h3>
      {data && data.words.length > 0 ? (
        <div style={{ height: 300 }}>
          <WordCloudBase
            {...wordcloudDefaultProps}
            words={data.words}
            options={{
              rotations: 2,
              rotationAngles: [-90, 0],
              fontSizes: [12, 60],
              padding: 2,
            }}
          />
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">尚無標記資料</div>
      )}
    </GlassCard>
  );
}
