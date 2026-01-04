import {
  CheckSquare,
  Layers,
  Columns,
  PlayCircle,
  BookOpen,
  StopCircle,
} from 'lucide-react';
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../types';

const NodeWrapper = ({
  children,
  colorClass,
  title,
  icon: Icon,
  isStart = false,
  isOverlapping = false,
}: any) => (
  <div
    className={`w-64 shadow-lg rounded-xl bg-white border-2 ${colorClass} overflow-hidden ${isStart ? 'rounded-full w-32 text-center' : ''} relative`}
  >
    {!isStart && (
      <div
        className={`p-2 text-white font-bold flex items-center gap-2 ${colorClass.replace('border-', 'bg-')}`}
      >
        <Icon size={16} />
        <span className="text-sm truncate">{title}</span>
      </div>
    )}
    <div
      className={`p-3 bg-white text-xs text-slate-600 ${isStart ? 'flex flex-col items-center justify-center h-full py-4' : ''}`}
    >
      {children}
    </div>
    {isOverlapping && (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
        <div className="text-lg font-bold text-slate-700">交換</div>
      </div>
    )}
  </div>
);

export const StartNode = memo(({ data: _data }: NodeProps<NodeData>) => {
  return (
    <>
      <NodeWrapper colorClass="border-slate-800" title="開始" icon={PlayCircle} isStart={true}>
        <PlayCircle size={32} className="text-slate-800 mb-2" />
        <span className="font-bold text-slate-800">開始流程</span>
      </NodeWrapper>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-800 !w-4 !h-4" />
    </>
  );
});

export const ResourceNode = memo(({ data }: NodeProps<NodeData>) => {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <NodeWrapper
        colorClass="border-orange-500"
        title="階段：文獻閱讀"
        icon={BookOpen}
        isOverlapping={(data as any).isOverlapping}
      >
        <div className="font-semibold text-slate-800 mb-1">{data.label}</div>
        <div className="opacity-75 line-clamp-2 italic">
          {data.config?.guidance || '請閱讀相關文獻...'}
        </div>
      </NodeWrapper>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-500" />
    </>
  );
});

export const SummaryNode = memo(({ data }: NodeProps<NodeData>) => {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <NodeWrapper
        colorClass="border-blue-500"
        title="階段：撰寫摘要"
        icon={CheckSquare}
        isOverlapping={(data as any).isOverlapping}
      >
        <div className="font-semibold text-slate-800 mb-1">{data.label}</div>
        <div className="text-xs text-slate-400">目標：{data.config?.minWords || 150} 字</div>
      </NodeWrapper>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </>
  );
});

export const ComparisonNode = memo(({ data }: NodeProps<NodeData>) => {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <NodeWrapper
        colorClass="border-purple-500"
        title="階段：文獻比較"
        icon={Columns}
        isOverlapping={(data as any).isOverlapping}
      >
        <div className="font-semibold text-slate-800 mb-1">{data.label}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {data.config?.dimensions?.slice(0, 3).map((d: string, i: number) => (
            <span key={i} className="badge badge-xs badge-ghost">
              {d}
            </span>
          ))}
        </div>
      </NodeWrapper>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500" />
    </>
  );
});

export const SynthesisNode = memo(({ data }: NodeProps<NodeData>) => {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <NodeWrapper
        colorClass="border-emerald-500"
        title="階段：綜合分析"
        icon={Layers}
        isOverlapping={(data as any).isOverlapping}
      >
        <div className="font-semibold text-slate-800 mb-1">{data.label}</div>
        <div className="text-xs text-slate-400">雙迴圈分析</div>
      </NodeWrapper>
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500" />
    </>
  );
});

export const EndNode = memo(({ data: _data }: NodeProps<NodeData>) => {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-slate-800 !w-4 !h-4" />
      <NodeWrapper colorClass="border-slate-800" title="結束" icon={StopCircle} isStart={true}>
        <StopCircle size={32} className="text-slate-800 mb-2" />
        <span className="font-bold text-slate-800">結束流程</span>
      </NodeWrapper>
    </>
  );
});
