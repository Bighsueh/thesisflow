import { CheckCircle2, XCircle, ChevronUp, ChevronDown, Trash2, GripVertical } from 'lucide-react';
import React, { useState } from 'react';
import { TaskSectionConfig } from '../../types';

interface SectionConfigCardProps {
  section: TaskSectionConfig;
  index: number;
  totalSections: number;
  onUpdate: (field: keyof TaskSectionConfig, value: any) => void;
  onMove: (direction: 'up' | 'down') => void;
  onRemove: () => void;
  canRemove: boolean;
}

export const SectionConfigCard: React.FC<SectionConfigCardProps> = ({
  section,
  index,
  totalSections,
  onUpdate,
  onMove,
  onRemove,
  canRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 判斷配置是否完整
  const isConfigured = section.label.trim().length > 0;

  return (
    <div
      className={`card bg-base-100 border-2 transition-all ${
        isExpanded
          ? 'border-primary shadow-md'
          : isConfigured
            ? 'border-base-300'
            : 'border-yellow-300'
      }`}
    >
      <div className="card-body p-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <GripVertical size={18} className="text-slate-400" />
            {isConfigured ? (
              <CheckCircle2 size={18} className="text-green-500" />
            ) : (
              <XCircle size={18} className="text-yellow-500" />
            )}
            <h4 className="font-bold text-sm">
              {index + 1}. {section.label || '(未命名段落)'}
            </h4>
            {section.minEvidence && section.minEvidence > 0 && (
              <span className="badge badge-xs badge-warning">需 {section.minEvidence} 則標記</span>
            )}
          </div>
          <div className="flex gap-1">
            {index > 0 && (
              <button
                className="btn btn-sm btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove('up');
                }}
              >
                <ChevronUp size={16} />
              </button>
            )}
            {index < totalSections - 1 && (
              <button
                className="btn btn-sm btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove('down');
                }}
              >
                <ChevronDown size={16} />
              </button>
            )}
            {canRemove && (
              <button
                className="btn btn-sm btn-ghost text-error"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-semibold">段落標籤</span>
              </label>
              <input
                type="text"
                className="input input-sm input-bordered w-full"
                placeholder="例：A1 研究目的 (Purpose)"
                value={section.label}
                onChange={(e) => onUpdate('label', e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-semibold">提示文字</span>
              </label>
              <input
                type="text"
                className="input input-sm input-bordered w-full"
                placeholder="例：研究問題為何？"
                value={section.placeholder || ''}
                onChange={(e) => onUpdate('placeholder', e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-semibold">最少標記片段數</span>
              </label>
              <select
                className="select select-sm select-bordered w-full"
                value={section.minEvidence || 1}
                onChange={(e) => onUpdate('minEvidence', parseInt(e.target.value))}
              >
                <option value={0}>不要求標記</option>
                <option value={1}>最少需要 1 個標記片段</option>
                <option value={2}>最少需要 2 個標記片段</option>
                <option value={3}>最少需要 3 個標記片段</option>
                <option value={4}>最少需要 4 個標記片段</option>
                <option value={5}>最少需要 5 個標記片段</option>
              </select>
            </div>

            <div className="alert alert-info py-2">
              <div className="text-xs">
                <strong>配置說明：</strong>
                <br />• 標籤：學生看到的段落名稱
                <br />• 提示：輸入框內的引導文字
                <br />• 標記數：學生需綁定的最少證據數
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
