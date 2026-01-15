import React, { useEffect } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useStore } from '../../store';
import { TaskConfigComparison, Document, ComparisonRow } from '../../types';
import { ChecklistSubmit } from '../widgets/ChecklistSubmit';
import { MatrixCompare } from '../widgets/MatrixCompare';

interface ComparisonTaskWidgetProps {
  learningTaskId: string;
  config: TaskConfigComparison;
  documents: Document[];
}

export default function ComparisonTaskWidget({
  learningTaskId,
  config,
  documents,
}: ComparisonTaskWidgetProps) {
  const {
    taskBData,
    updateTaskBRow,
    addTaskBRow,
    removeTaskBRow,
    submitTaskBCheck,
    saveTaskState,
    initializeTaskBDataForNode,
  } = useStore();

  const autoSave = useAutoSave(1000);
  const nodeId = 'comparison'; // 固定使用 'comparison' 作為節點 ID
  const minEvidence = config.minEvidence || 1;

  // 初始化比較任務資料
  useEffect(() => {
    const dimensions = config.dimensions || [];
    if (dimensions.length > 0 && taskBData.length === 0) {
      initializeTaskBDataForNode(nodeId, dimensions);
    }
  }, [config.dimensions, taskBData.length, nodeId, initializeTaskBDataForNode]);

  const handleUpdateRow = (
    index: number,
    field: keyof ComparisonRow | 'doc1Claim' | 'doc2Claim',
    value: unknown
  ) => {
    updateTaskBRow(index, field, value);
    autoSave();
  };

  const checks = taskBData.map((row, idx) => ({
    id: `row-${idx}`,
    label: `維度 ${idx + 1}: ${row.dimension || '未命名'}`,
    checked: !!(
      row.dimension &&
      row.doc1Id &&
      row.doc2Id &&
      row.doc1Claim.text &&
      row.doc2Claim.text &&
      row.doc1Claim.snippetIds.length >= minEvidence &&
      row.doc2Claim.snippetIds.length >= minEvidence
    ),
    required: true,
  }));

  const handleSubmit = async () => {
    try {
      await submitTaskBCheck();
      // 提交成功後，保存任務狀態
      await saveTaskState(learningTaskId);
    } catch (_error) {
      // 提交失敗，記錄錯誤但不中斷流程
    }
  };

  return (
    <div className="space-y-4 p-4">
      <MatrixCompare
        nodeId={nodeId}
        rows={taskBData}
        onUpdateRow={handleUpdateRow}
        onAddRow={() => {
          addTaskBRow();
          autoSave();
        }}
        onRemoveRow={(index) => {
          removeTaskBRow(index);
          autoSave();
        }}
        documents={documents.map((d) => ({ id: d.id, title: d.title }))}
      />

      <ChecklistSubmit
        nodeId={nodeId}
        checks={checks}
        onSubmit={handleSubmit}
        onSubmitLabel="提交比較表"
      />
    </div>
  );
}
