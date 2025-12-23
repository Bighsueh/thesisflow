import React from 'react';
import { X, Edit2 } from 'lucide-react';
import { EvidenceType, ToolbarPosition } from '../StudentInterface.types';
import { EVIDENCE_TYPES } from '../StudentInterface.constants';

interface HighlightFloatingToolbarProps {
  position: ToolbarPosition;
  onSelectType: (type: EvidenceType) => void;
  onEdit: () => void;
  onClose: () => void;
}

export const HighlightFloatingToolbar: React.FC<HighlightFloatingToolbarProps> = ({
  position,
  onSelectType,
  onEdit,
  onClose,
}) => {
  return (
    <div
      style={{ 
        top: `${position.y}%`, 
        left: `${position.x}%`,
        pointerEvents: 'auto',
        cursor: 'default',
        zIndex: 100,
      }}
      className="absolute transform -translate-y-1/2 translate-x-2 bg-white shadow-xl rounded-full p-1.5 flex items-center space-x-2 border border-slate-200 animate-bounce-in"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {EVIDENCE_TYPES.map((typeDef) => (
        <button
          key={typeDef.type}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onSelectType(typeDef.type);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={`w-6 h-6 rounded-full ${typeDef.color} border-2 border-white shadow-sm hover:scale-125 transition-transform cursor-pointer`}
          title={`標記為：${typeDef.label}`}
        />
      ))}
      <div className="w-px h-4 bg-slate-200 mx-1"></div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onEdit();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        title="編輯詳情"
      >
        <Edit2 size={14} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClose();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
};

