import React from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useStore } from '../../store';
import { TaskConfigSummary, FieldWithEvidence, Document } from '../../types';
import { ChecklistSubmit } from '../widgets/ChecklistSubmit';
import { SectionWriter } from '../widgets/SectionWriter';

interface SummaryTaskWidgetProps {
  projectId: string;
  config: TaskConfigSummary;
  documents: Document[];
}

const DEFAULT_SECTIONS = [
  {
    key: 'a1_purpose',
    label: 'A1 研究目的 (Purpose)',
    placeholder: '研究問題為何？',
    minEvidence: 1,
  },
  {
    key: 'a2_method',
    label: 'A2 研究方法 (Method)',
    placeholder: '採用了什麼方法？',
    minEvidence: 1,
  },
  {
    key: 'a3_findings',
    label: 'A3 主要發現 (Findings)',
    placeholder: '核心結論為何？',
    minEvidence: 1,
  },
  {
    key: 'a4_limitations',
    label: 'A4 研究限制 (Limitations)',
    placeholder: '作者自述或觀察到的限制...',
    minEvidence: 1,
  },
];

export default function SummaryTaskWidget({
  projectId,
  config,
  documents,
}: SummaryTaskWidgetProps) {
  const { currentWidgetState, updateWidgetState, submitTaskA, saveTaskState } = useStore();
  const autoSave = useAutoSave(1000);

  const nodeId = 'summary'; // 固定使用 'summary' 作為節點 ID
  const sections =
    config.sections && config.sections.length > 0 ? config.sections : DEFAULT_SECTIONS;
  const widgetState = currentWidgetState[nodeId] || {};

  // 初始化值
  const values: Record<string, FieldWithEvidence> = {};
  sections.forEach((section) => {
    values[section.key] = widgetState[section.key] || { text: '', snippetIds: [] };
  });

  const handleUpdate = (key: string, value: FieldWithEvidence) => {
    updateWidgetState(nodeId, { ...widgetState, [key]: value });
    autoSave();
  };

  const getSectionStatus = (value: any, minEvidence: number = 1) => {
    if (!value) return false;
    return value.text?.trim().length > 0 && (value.snippetIds?.length || 0) >= minEvidence;
  };

  const handleSubmit = async () => {
    const selectedDoc = documents.find((d) => d.id === widgetState.selectedDocId);
    if (!selectedDoc) {
      alert('請先選擇目標文獻');
      return;
    }

    const content: Record<string, FieldWithEvidence> = {};
    sections.forEach((section) => {
      content[section.key] = values[section.key];
    });

    try {
      await submitTaskA(selectedDoc.id, content);
      // 提交成功後，保存任務狀態
      await saveTaskState(projectId);
    } catch (error) {
      console.error('提交失敗:', error);
    }
  };

  const checks = [
    {
      id: 'doc',
      label: '已選擇目標文獻',
      checked: !!widgetState.selectedDocId,
      required: true,
    },
    ...sections.map((section) => ({
      id: section.key,
      label: `${section.label}已完成`,
      checked: getSectionStatus(
        values[section.key],
        section.minEvidence || config.minEvidence || 1
      ),
      required: true,
    })),
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-bold text-sm">選擇目標文獻</span>
        </label>
        <select
          className="select select-bordered select-sm"
          value={widgetState.selectedDocId || ''}
          onChange={(e) => {
            updateWidgetState(nodeId, {
              ...widgetState,
              selectedDocId: e.target.value,
            });
            autoSave();
          }}
        >
          <option value="" disabled>
            請選擇目標文獻...
          </option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </div>

      <SectionWriter
        nodeId={nodeId}
        sections={sections}
        selectedDocId={widgetState.selectedDocId}
        onUpdate={handleUpdate}
        values={values}
      />

      <ChecklistSubmit
        nodeId={nodeId}
        checks={checks}
        onSubmit={handleSubmit}
        onSubmitLabel="提交檢核"
      />
    </div>
  );
}
