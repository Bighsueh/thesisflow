import React, { useState } from 'react';
import { TaskConfig, Document } from '../../types';
import SummaryTaskWidget from './SummaryTaskWidget';
import ComparisonTaskWidget from './ComparisonTaskWidget';

interface TasksPanelProps {
  projectId: string;
  config: TaskConfig;
  documents: Document[];
}

export function TasksPanel({ projectId, config, documents }: TasksPanelProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'comparison'>('summary');

  const enabledTasks = [
    config.summary?.enabled && 'summary',
    config.comparison?.enabled && 'comparison',
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
          {config.summary?.enabled && (
            <button
              className={`tab flex-1 ${activeTab === 'summary' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              摘要任務
            </button>
          )}
          {config.comparison?.enabled && (
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
            config={config.summary}
            documents={documents}
          />
        )}
        {activeTab === 'comparison' && config.comparison?.enabled && (
          <ComparisonTaskWidget
            projectId={projectId}
            config={config.comparison}
            documents={documents}
          />
        )}
      </div>
    </div>
  );
}
