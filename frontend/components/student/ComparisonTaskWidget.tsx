import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { TaskConfigComparison, Document, ComparisonRow } from '../../types';
import { useAutoSave } from '../../hooks/useAutoSave';
import { MatrixCompare } from '../widgets/MatrixCompare';
import { ChecklistSubmit } from '../widgets/ChecklistSubmit';

interface ComparisonTaskWidgetProps {
  projectId: string;
  config: TaskConfigComparison;
  documents: Document[];
}

export default function ComparisonTaskWidget({
  projectId,
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
  const dimensions = config.dimensions || [];

  // 初始化比較任務資料
  useEffect(() => {
    if (dimensions.length > 0 && taskBData.length === 0) {
      initializeTaskBDataForNode(nodeId, dimensions);
    }
  }, [dimensions, taskBData.length, nodeId, initializeTaskBDataForNode]);

  const handleUpdateRow = (
    index: number,
    field: keyof ComparisonRow | 'doc1Claim' | 'doc2Claim',
    value: any
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
      await saveTaskState(projectId);
    } catch (error) {
      console.error('提交失敗:', error);
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
