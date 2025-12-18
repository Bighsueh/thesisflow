import React, { useRef, useEffect, useState } from 'react';
import { Send, Bot, Link as LinkIcon, ArrowRight, Menu, X, ChevronLeft } from 'lucide-react';
import { getIncomers, getOutgoers } from 'reactflow';
import { useStore } from '../store';
import { ChatMessage } from './ChatMessage';
import { EvidenceCard } from './EvidenceCard';
import { InstructionCard } from './widgets/InstructionCard';
import { SectionWriter } from './widgets/SectionWriter';
import { ChecklistSubmit } from './widgets/ChecklistSubmit';
import { MatrixCompare } from './widgets/MatrixCompare';
import { SynthesisWriter } from './widgets/SynthesisWriter';
import { AppNode, Message, TaskAContent, ComparisonRow, TaskCContent } from '../types';
import { useAutoSave } from '../hooks/useAutoSave';

// 預設的 sections（向後相容用）
const DEFAULT_SECTIONS = [
  { key: 'a1_purpose', label: 'A1 研究目的 (Purpose)', placeholder: '研究問題為何？', minEvidence: 1 },
  { key: 'a2_method', label: 'A2 研究方法 (Method)', placeholder: '採用了什麼方法？', minEvidence: 1 },
  { key: 'a3_findings', label: 'A3 主要發現 (Findings)', placeholder: '核心結論為何？', minEvidence: 1 },
  { key: 'a4_limitations', label: 'A4 研究限制 (Limitations)', placeholder: '作者自述或觀察到的限制...', minEvidence: 1 },
];

interface ChatMainPanelProps {
  currentNode: AppNode | null;
}

export const ChatMainPanel: React.FC<ChatMainPanelProps> = ({ currentNode }) => {
  const {
    chatTimeline,
    isAiThinking,
    sendCoachMessage,
    documents,
    currentWidgetState,
    updateWidgetState,
    activeProjectId,
    currentStepId,
    submitTaskA,
    taskBData,
    updateTaskBRow,
    addTaskBRow,
    removeTaskBRow,
    submitTaskBCheck,
    taskCData,
    updateTaskC,
    submitTaskCCheck,
    initializeTaskBDataForNode,
    completeNode,
    nodes,
    edges,
    navigateNext,
    navigatePrev,
  } = useStore();

  const [inputMessage, setInputMessage] = useState('');
  const [showEvidenceSelector, setShowEvidenceSelector] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoSave = useAutoSave(1000);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatTimeline, isAiThinking]);

  // 當切換到 Comparison Node 時，根據 dimensions 初始化 taskBData
  // 注意：只有在 taskBData 為空時才初始化，避免覆蓋已載入的保存數據
  useEffect(() => {
    if (currentNode?.data.type === 'task_comparison' && currentNode.data.config?.dimensions) {
      const dimensions = currentNode.data.config.dimensions;
      // 只有在 taskBData 為空時才初始化，避免覆蓋已載入的保存數據
      if (dimensions.length > 0 && taskBData.length === 0) {
        initializeTaskBDataForNode(currentNode.id, dimensions);
      }
    }
  }, [currentStepId, currentNode?.data.config?.dimensions, initializeTaskBDataForNode, taskBData.length]);

  // ESC 鍵關閉抽屜
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isDrawerOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAiThinking) return;

    const message = inputMessage.trim();
    setInputMessage('');

    try {
      await sendCoachMessage(message);
    } catch (error) {
      console.error('發送訊息失敗:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInsertEvidence = (highlightId: string) => {
    // 找到對應的 highlight
    const highlight = allHighlights.find((h) => h.id === highlightId);
    if (!highlight) return;
    
    // 優先使用名稱，如果沒有名稱則使用內容摘要
    const displayText = highlight.name 
      ? highlight.name 
      : highlight.snippet.length > 40 
        ? highlight.snippet.substring(0, 40) + '...' 
        : highlight.snippet;
    
    // 縮短 UUID 顯示：只顯示前 8 個字符（足夠在單一專案中保持唯一性）
    const shortId = highlightId.substring(0, 8);
    
    // 插入格式：[標記片段: 顯示文字][E縮短ID]
    // 實際發送的消息中包含短ID，後端會通過匹配前8個字符找到完整ID
    const token = `[標記片段: ${displayText}][E${shortId}]`;
    setInputMessage((prev) => prev + token + ' ');
    setShowEvidenceSelector(false);
    inputRef.current?.focus();
  };

  // 獲取所有 highlights
  const allHighlights = documents.flatMap((d) =>
    (d.highlights || []).map((h) => ({ ...h, docTitle: d.title, document: d }))
  );

  // 渲染導航按鈕組
  const renderNavigationButtons = () => {
    if (!currentNode) return null;
    
    const incomers = getIncomers(currentNode, nodes, edges);
    const outgoers = getOutgoers(currentNode, nodes, edges);
    const hasPrevious = incomers.length > 0 && currentNode.data.type !== 'start';
    const hasNext = outgoers.length > 0 && currentNode.data.type !== 'end';

    return (
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-4">
          <div className="flex gap-2">
            {hasPrevious && (
              <button
                className="btn btn-outline btn-sm flex-1 gap-2"
                onClick={navigatePrev}
              >
                <ChevronLeft size={14} />
                返回上一階段
              </button>
            )}
            {hasNext && (
              <button
                className="btn btn-primary btn-sm flex-1 gap-2"
                onClick={() => {
                  completeNode(currentNode.id);
                }}
              >
                進入下一階段
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 根據節點類型渲染 Widget
  const renderWidget = () => {
    if (!currentNode) return null;

    const nodeType = currentNode.data.type;
    const widgetState = currentWidgetState[currentNode.id] || {};

    if (nodeType === 'task_summary') {
      // 從 node.config.sections 讀取，如果沒有則使用預設值（向後相容）
      const configSections = currentNode.data.config?.sections;
      const sections = configSections && configSections.length > 0 
        ? configSections 
        : DEFAULT_SECTIONS;

      // 動態生成 values 物件
      const values: Record<string, any> = {};
      sections.forEach((section) => {
        values[section.key] = widgetState[section.key] || { text: '', snippetIds: [] };
      });

      const handleUpdate = (sectionKey: string, value: any) => {
        updateWidgetState(currentNode.id, {
          ...widgetState,
          [sectionKey]: value,
        });
      };

      const handleSubmit = async () => {
        // 需要選擇文獻
        const selectedDoc = documents.find((d) => d.id === widgetState.selectedDocId);
        if (!selectedDoc) {
          alert('請先選擇目標文獻');
          return;
        }

        // 動態生成 TaskAContent
        const content: TaskAContent = {};
        sections.forEach((section) => {
          content[section.key] = values[section.key];
        });

        try {
          await submitTaskA(selectedDoc.id, content);
          // 提交成功後自動進入下一階段
          completeNode(currentNode.id);
        } catch (error) {
          // 提交失敗時不進入下一階段，讓用戶修正錯誤
          console.error('提交失敗:', error);
        }
      };

      // 動態生成 checks 陣列
      const checks = [
        { id: 'doc', label: '已選擇目標文獻', checked: !!widgetState.selectedDocId, required: true },
        ...sections.map((section) => ({
          id: section.key,
          label: `${section.label}已完成`,
          checked: getSectionStatus(values[section.key], section.minEvidence || currentNode.data.config?.minEvidence || 1),
          required: true,
        })),
      ];

      return (
        <div className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-sm">選擇目標文獻</span>
            </label>
            <select
              className="select select-bordered select-sm"
              value={widgetState.selectedDocId || ''}
              onChange={(e) => {
                updateWidgetState(currentNode.id, {
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
            nodeId={currentNode.id}
            sections={sections}
            selectedDocId={widgetState.selectedDocId}
            onUpdate={handleUpdate}
            values={values}
          />

          <ChecklistSubmit
            nodeId={currentNode.id}
            checks={checks}
            onSubmit={handleSubmit}
            onSubmitLabel="提交檢核"
          />
          {renderNavigationButtons()}
        </div>
      );
    }

    if (nodeType === 'task_comparison') {
      const minEvidence = currentNode.data.config?.minEvidence || 1;

      const handleUpdateRow = (index: number, field: keyof ComparisonRow | 'doc1Claim' | 'doc2Claim', value: any) => {
        if (field === 'doc1Claim' || field === 'doc2Claim') {
          updateTaskBRow(index, field, value);
        } else {
          updateTaskBRow(index, field, value);
        }
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

      const handleSubmitB = async () => {
        try {
          await submitTaskBCheck();
          // 提交成功後自動進入下一階段
          completeNode(currentNode.id);
        } catch (error) {
          // 提交失敗時不進入下一階段，讓用戶修正錯誤
          console.error('提交失敗:', error);
        }
      };

      return (
        <div className="space-y-4">
          <MatrixCompare
            nodeId={currentNode.id}
            rows={taskBData}
            onUpdateRow={handleUpdateRow}
            onAddRow={addTaskBRow}
            onRemoveRow={removeTaskBRow}
            documents={documents.map((d) => ({ id: d.id, title: d.title }))}
          />
          <ChecklistSubmit
            nodeId={currentNode.id}
            checks={checks}
            onSubmit={handleSubmitB}
            onSubmitLabel="提交比較表"
          />
          {renderNavigationButtons()}
        </div>
      );
    }

    if (nodeType === 'task_synthesis') {
      const slots = [
        { key: 'c1_theme' as keyof TaskCContent, label: 'C1 主題句 (Theme)', placeholder: '本段落要探討的核心主題...', minEvidence: 1 },
        { key: 'c2_evidence' as keyof TaskCContent, label: 'C2 跨篇標記片段 (Evidence)', placeholder: '綜合多篇文獻的觀察...', minEvidence: 2 },
        { key: 'c3_boundary' as keyof TaskCContent, label: 'C3 差異界線 (Boundary)', placeholder: '雖然...但是... (指出適用範圍或對立點)', minEvidence: 1 },
        { key: 'c4_gap' as keyof TaskCContent, label: 'C4 意義與缺口 (Gap)', placeholder: '因此... 目前尚未... (指出研究機會)', minEvidence: 1 },
      ];

      const checks = [
        { id: 'c1', label: 'C1 主題句已完成', checked: getSectionStatus(taskCData.c1_theme), required: true },
        { id: 'c2', label: 'C2 跨篇標記片段已完成（需至少 2 則）', checked: taskCData.c2_evidence.snippetIds.length >= 2 && taskCData.c2_evidence.text.trim().length > 0, required: true },
        { id: 'c3', label: 'C3 差異界線已完成', checked: getSectionStatus(taskCData.c3_boundary), required: true },
        { id: 'c4', label: 'C4 意義與缺口已完成', checked: getSectionStatus(taskCData.c4_gap), required: true },
      ];

      const handleSubmitC = async () => {
        try {
          await submitTaskCCheck();
          // 提交成功後自動進入下一階段
          completeNode(currentNode.id);
        } catch (error) {
          // 提交失敗時不進入下一階段，讓用戶修正錯誤
          console.error('提交失敗:', error);
        }
      };

      return (
        <div className="space-y-4">
          <SynthesisWriter
            nodeId={currentNode.id}
            slots={slots}
            values={taskCData}
            onUpdate={updateTaskC}
          />
          <ChecklistSubmit
            nodeId={currentNode.id}
            checks={checks}
            onSubmit={handleSubmitC}
            onSubmitLabel="提交綜合分析"
          />
          {renderNavigationButtons()}
        </div>
      );
    }

    if (nodeType === 'resource') {
      const minEvidence = currentNode.data.config?.minEvidence || 0;
      const currentCount = allHighlights.length;

      return (
        <div className="space-y-4">
          <InstructionCard
            node={currentNode}
            minEvidence={minEvidence}
            currentEvidenceCount={currentCount}
          />
          {minEvidence > 0 && currentCount < minEvidence && (
            <div className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body p-4">
                <p className="text-xs text-slate-500 text-center">
                  建議收集至少 {minEvidence} 則標記片段後再進入下一階段
                </p>
              </div>
            </div>
          )}
          {renderNavigationButtons()}
        </div>
      );
    }

    return null;
  };

  const getSectionStatus = (value: any, minEvidence: number = 1) => {
    if (!value) return false;
    return value.text?.trim().length > 0 && (value.snippetIds?.length || 0) >= minEvidence;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 頂部：當前節點標題 */}
      {currentNode && (
        <div className="px-4 py-3 border-b border-base-200 bg-slate-50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-primary" />
              <span className="font-bold text-sm">{currentNode.data.label}</span>
              {currentNode.data.config?.guidance && (
                <span className="text-xs text-slate-500 ml-2">
                  {currentNode.data.config.guidance}
                </span>
              )}
            </div>
            {/* 任務表單按鈕 - 只在有 Widget 的節點顯示 */}
            {(currentNode.data.type === 'task_summary' || 
              currentNode.data.type === 'task_comparison' || 
              currentNode.data.type === 'task_synthesis' || 
              currentNode.data.type === 'resource') && (
              <button
                className="btn btn-sm btn-primary gap-2 relative"
                onClick={() => setIsDrawerOpen(true)}
              >
                <Menu size={16} />
                <span>任務表單</span>
                {currentNode.data.type === 'task_comparison' && taskBData.length > 0 && (
                  <span className="badge badge-sm badge-secondary absolute -top-2 -right-2">
                    {taskBData.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 上半部：對話訊息串 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {chatTimeline.length === 0 && currentNode && (
          <InstructionCard
            node={currentNode}
            minEvidence={currentNode.data.config?.minEvidence || 0}
            currentEvidenceCount={allHighlights.length}
          />
        )}

        {chatTimeline.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isAiThinking && (
          <div className="chat chat-start">
            <div className="chat-bubble bg-base-200 text-slate-500 text-xs">
              <span className="loading loading-dots loading-xs"></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 輸入區 */}
      <div className="border-t border-base-200 bg-white p-3">
        <div className="flex gap-2 mb-2">
          <button
            className="btn btn-xs btn-outline btn-primary gap-1"
            onClick={() => setShowEvidenceSelector(!showEvidenceSelector)}
          >
            <LinkIcon size={12} />
            插入標記片段
          </button>
        </div>

        {showEvidenceSelector && (
          <div className="border border-base-300 rounded-lg p-2 bg-base-50 max-h-32 overflow-y-auto mb-2">
            {allHighlights.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-2">
                尚無標註資料
              </div>
            ) : (
              <div className="space-y-1">
                {allHighlights.map((h) => (
                  <div
                    key={h.id}
                    className="p-1.5 border rounded cursor-pointer hover:bg-base-200 flex gap-2 items-start text-xs"
                    onClick={() => handleInsertEvidence(h.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-500">{h.docTitle}</div>
                      <div className="text-slate-700 line-clamp-1">"{h.snippet}"</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            className="textarea textarea-bordered textarea-sm flex-1 resize-none"
            placeholder="輸入訊息給 AI 教練..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={2}
          />
          <button
            className="btn btn-primary btn-sm gap-2"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isAiThinking}
          >
            <Send size={14} />
            發送
          </button>
        </div>
        <div className="text-[10px] text-center text-slate-400 mt-1">
          AI 僅提供引導，不會直接代寫
        </div>
      </div>

      {/* Off-canvas 側邊抽屜：Widget 區 */}
      {currentNode && (
        <>
          {/* 覆蓋層 */}
          {isDrawerOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
              aria-hidden="true"
            />
          )}
          
          {/* 抽屜面板 */}
          <div
            className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
              isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
          >
            {/* 抽屜標題欄 */}
            <div className="sticky top-0 bg-white border-b border-base-200 p-4 flex items-center justify-between z-10 shadow-sm">
              <div className="flex items-center gap-2">
                <h2 id="drawer-title" className="font-bold text-lg">任務表單</h2>
                {currentNode.data.type === 'task_comparison' && taskBData.length > 0 && (
                  <span className="badge badge-primary badge-sm">
                    {taskBData.length} 個維度
                  </span>
                )}
                {currentNode.data.type === 'task_summary' && (
                  <span className="badge badge-primary badge-sm">進行中</span>
                )}
              </div>
              <button
                className="btn btn-sm btn-ghost btn-circle"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="關閉任務表單"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Widget 內容 */}
            <div className="h-[calc(100%-4rem)] overflow-y-auto p-4">
              {renderWidget()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

