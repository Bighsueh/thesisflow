import React, { useState } from 'react';
import { TaskConfig, Document } from '../../types';
import ComparisonTaskWidget from './ComparisonTaskWidget';
import SummaryTaskWidget from './SummaryTaskWidget';

interface TasksPanelProps {
  projectId: string;
  config: TaskConfig;
  documents: Document[];
}

export function TasksPanel({ projectId, config, documents }: TasksPanelProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'comparison'>('summary');
  if (!config || typeof config !== 'object') {
    return (
      <div className="p-4 text-center text-base-content/60">
        <p>任務設定尚未載入</p>
      </div>
    );
  }
  const baseConfig: TaskConfig = {
    summary: { enabled: false, sections: [], guidance: '' },
    comparison: { enabled: false, dimensions: [], guidance: '' },
  };
  const rawSummary = (config as TaskConfig).summary ?? baseConfig.summary;
  const rawComparison = (config as TaskConfig).comparison ?? baseConfig.comparison;
  const safeConfig: TaskConfig = {
    ...baseConfig,
    ...config,
    summary: { ...baseConfig.summary, ...rawSummary },
    comparison: { ...baseConfig.comparison, ...rawComparison },
  };

  const enabledTasks = [
    safeConfig.summary?.enabled && 'summary',
    safeConfig.comparison?.enabled && 'comparison',
  ].filter(Boolean) as Array<'summary' | 'comparison'>;

  if (enabledTasks.length === 0) {
    return (
      <div className="p-4 text-center text-base-content/60">
        <p>此專案尚未配置任何任務</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation - Only show if multiple tasks are enabled */}
      {enabledTasks.length > 1 && (
        <div className="tabs tabs-boxed mb-2 bg-base-200 p-2 rounded-lg">
          {safeConfig.summary?.enabled && (
            <button
              className={`tab flex-1 ${activeTab === 'summary' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              摘要任務
            </button>
          )}
          {safeConfig.comparison?.enabled && (
            <button
              className={`tab flex-1 ${activeTab === 'comparison' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('comparison')}
            >
              比較任務
            </button>
          )}
        </div>
      )}

      {/* Task Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'summary' && config.summary?.enabled && (
          <SummaryTaskWidget
            projectId={projectId}
            config={safeConfig.summary}
            documents={documents}
          />
        )}
        {activeTab === 'comparison' && safeConfig.comparison?.enabled && (
          <ComparisonTaskWidget
            projectId={projectId}
            config={safeConfig.comparison}
            documents={documents}
          />
        )}
      </div>
    </div>
  );
}
