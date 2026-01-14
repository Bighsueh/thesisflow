import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { SectionWriter } from '../widgets/SectionWriter';
import { MatrixCompare } from '../widgets/MatrixCompare';
import { TaskConfigSummary, TaskConfigComparison, FieldWithEvidence } from '../../types';

interface StudentPreviewPanelProps {
  summaryConfig: TaskConfigSummary;
  comparisonConfig: TaskConfigComparison;
  activeTab: 'summary' | 'comparison';
}

export const StudentPreviewPanel: React.FC<StudentPreviewPanelProps> = ({
  summaryConfig,
  comparisonConfig,
  activeTab,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Mock 資料用於預覽
  const mockDocuments = [
    { id: 'doc1', title: '文獻 A（範例）' },
    { id: 'doc2', title: '文獻 B（範例）' },
  ];

  // Mock summary values - 部分填寫狀態
  const mockSummaryValues: Record<string, FieldWithEvidence> = {};
  summaryConfig.sections.forEach((section, idx) => {
    if (idx === 0) {
      // 第一個段落：已完成
      mockSummaryValues[section.key] = {
        text: '這是範例摘要內容...',
        snippetIds: ['snippet1', 'snippet2'],
      };
    } else if (idx === 1) {
      // 第二個段落：部分完成
      mockSummaryValues[section.key] = {
        text: '部分填寫的內容',
        snippetIds: [],
      };
    } else {
      // 其他段落：未填寫
      mockSummaryValues[section.key] = {
        text: '',
        snippetIds: [],
      };
    }
  });

  // Mock comparison rows
  const mockComparisonRows = comparisonConfig.dimensions.map((dimension, idx) => ({
    id: `row-${idx}`,
    dimension: dimension,
    doc1Id: idx === 0 ? 'doc1' : '',
    doc1Claim: {
      text: idx === 0 ? '範例文獻 A 的觀點...' : '',
      snippetIds: idx === 0 ? ['snippet1'] : [],
    },
    doc2Id: idx === 0 ? 'doc2' : '',
    doc2Claim: {
      text: idx === 0 ? '範例文獻 B 的觀點...' : '',
      snippetIds: idx === 0 ? ['snippet2'] : [],
    },
    similarity: idx === 0 ? '相似之處...' : '',
    difference: idx === 0 ? '差異之處...' : '',
  }));

  if (isCollapsed) {
    return (
      <div className="fixed right-4 top-32 z-10">
        <button
          className="btn btn-primary btn-sm gap-2"
          onClick={() => setIsCollapsed(false)}
        >
          <Eye size={16} />
          顯示預覽
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-32 h-fit">
      <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye size={18} className="text-blue-600" />
              <h3 className="font-bold text-sm text-blue-900">學生視角預覽</h3>
            </div>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setIsCollapsed(true)}
            >
              <EyeOff size={14} />
            </button>
          </div>

          <div className="alert alert-info py-2 mb-3">
            <div className="text-xs">
              這是學生實際看到的介面樣式，包含部分範例填寫內容。
            </div>
          </div>

          <div className="bg-base-100 rounded-lg p-3 max-h-[600px] overflow-y-auto">
            {activeTab === 'summary' && summaryConfig.enabled && (
              <>
                {summaryConfig.guidance && (
                  <div className="alert alert-warning mb-3 py-2">
                    <div className="text-xs">{summaryConfig.guidance}</div>
                  </div>
                )}
                <SectionWriter
                  nodeId="preview"
                  sections={summaryConfig.sections}
                  selectedDocId="doc1"
                  onUpdate={() => {}} // 預覽模式不需要實際更新
                  values={mockSummaryValues}
                />
              </>
            )}

            {activeTab === 'comparison' && comparisonConfig.enabled && (
              <>
                {comparisonConfig.guidance && (
                  <div className="alert alert-warning mb-3 py-2">
                    <div className="text-xs">{comparisonConfig.guidance}</div>
                  </div>
                )}
                <MatrixCompare
                  nodeId="preview"
                  rows={mockComparisonRows}
                  onUpdateRow={() => {}} // 預覽模式不需要實際更新
                  onAddRow={() => {}}
                  onRemoveRow={() => {}}
                  documents={mockDocuments}
                />
              </>
            )}

            {activeTab === 'summary' && !summaryConfig.enabled && (
              <div className="text-center text-slate-400 py-8 text-sm">
                摘要任務已停用
              </div>
            )}

            {activeTab === 'comparison' && !comparisonConfig.enabled && (
              <div className="text-center text-slate-400 py-8 text-sm">
                比較任務已停用
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
