import React from 'react';
import { CheckCircle2, XCircle, Send } from 'lucide-react';
import { useStore } from '../../store';

interface ChecklistSubmitProps {
  nodeId: string;
  checks: Array<{
    id: string;
    label: string;
    checked: boolean;
    required?: boolean;
  }>;
  onSubmit?: () => void;
  onSubmitLabel?: string;
}

export const ChecklistSubmit: React.FC<ChecklistSubmitProps> = ({
  nodeId,
  checks,
  onSubmit,
  onSubmitLabel = '完成此節點',
}) => {
  const { completeNode } = useStore();
  const allRequiredChecked = checks.filter(c => c.required).every(c => c.checked);
  const allChecked = checks.every(c => c.checked);

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    } else {
      completeNode(nodeId);
    }
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-4">
        <h3 className="font-bold text-sm mb-3">完成檢核</h3>
        <div className="space-y-2 mb-4">
          {checks.map((check) => (
            <div key={check.id} className="flex items-center gap-2 text-sm">
              {check.checked ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <XCircle size={16} className="text-slate-300" />
              )}
              <span className={check.checked ? 'text-slate-700' : 'text-slate-400'}>
                {check.label}
                {check.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </div>
          ))}
        </div>
        <button
          className={`btn btn-primary btn-sm w-full gap-2 ${
            !allRequiredChecked ? 'btn-disabled' : ''
          }`}
          onClick={handleSubmit}
          disabled={!allRequiredChecked}
        >
          <Send size={14} />
          {onSubmitLabel}
        </button>
        {!allChecked && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            請完成所有必填項目（標記 *）
          </p>
        )}
      </div>
    </div>
  );
};



