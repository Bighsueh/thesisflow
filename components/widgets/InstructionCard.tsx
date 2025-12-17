import React from 'react';
import { BookOpen, Info, CheckSquare, Columns, Layers } from 'lucide-react';
import { AppNode } from '../../types';

interface InstructionCardProps {
  node: AppNode;
  minEvidence?: number;
  currentEvidenceCount?: number;
}

// 根據節點類型獲取顏色配置
const getNodeColorConfig = (nodeType: string) => {
  switch (nodeType) {
    case 'resource':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        titleColor: 'text-orange-900',
        textColor: 'text-orange-800',
        badgeTextColor: 'text-orange-700',
        badgeBg: 'bg-orange-100',
        icon: BookOpen,
      };
    case 'task_summary':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        titleColor: 'text-blue-900',
        textColor: 'text-blue-800',
        badgeTextColor: 'text-blue-700',
        badgeBg: 'bg-blue-100',
        icon: CheckSquare,
      };
    case 'task_comparison':
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        titleColor: 'text-purple-900',
        textColor: 'text-purple-800',
        badgeTextColor: 'text-purple-700',
        badgeBg: 'bg-purple-100',
        icon: Columns,
      };
    case 'task_synthesis':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        titleColor: 'text-emerald-900',
        textColor: 'text-emerald-800',
        badgeTextColor: 'text-emerald-700',
        badgeBg: 'bg-emerald-100',
        icon: Layers,
      };
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        titleColor: 'text-blue-900',
        textColor: 'text-blue-800',
        badgeTextColor: 'text-blue-700',
        badgeBg: 'bg-blue-100',
        icon: BookOpen,
      };
  }
};

export const InstructionCard: React.FC<InstructionCardProps> = ({
  node,
  minEvidence = 0,
  currentEvidenceCount = 0,
}) => {
  const guidance = node.data.config?.guidance || '請按照指示完成任務';
  const nodeType = node.data.type || 'resource';
  const colorConfig = getNodeColorConfig(nodeType);
  const IconComponent = colorConfig.icon;

  return (
    <div className={`card ${colorConfig.bg} border ${colorConfig.border} shadow-sm`}>
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          <div className={`${colorConfig.iconBg} rounded-full p-2`}>
            <IconComponent size={20} className={colorConfig.iconColor} />
          </div>
          <div className="flex-1">
            <h3 className={`font-bold ${colorConfig.titleColor} mb-2 flex items-center gap-2`}>
              <Info size={16} />
              {node.data.label}
            </h3>
            <p className={`text-sm ${colorConfig.textColor} mb-3`}>{guidance}</p>
            {minEvidence > 0 && (
              <div className={`text-xs ${colorConfig.badgeTextColor} ${colorConfig.badgeBg} rounded px-2 py-1 inline-block`}>
                需要至少 {minEvidence} 則標記片段
                {currentEvidenceCount > 0 && (
                  <span className="ml-2">
                    （已收集 {currentEvidenceCount}/{minEvidence}）
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

