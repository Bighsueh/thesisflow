import {
  Settings,
  Save,
  CheckSquare,
  Columns,
  Layers,
  BookOpen,
  Plus,
  Trash2,
} from 'lucide-react';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  Node,
  useReactFlow,
  MarkerType,
} from 'reactflow';
import { useStore } from '../store';
import { AppNodeType } from '../types';
import {
  ResourceNode,
  SummaryNode,
  ComparisonNode,
  SynthesisNode,
  StartNode,
  EndNode,
} from './CustomNodes';

const nodeTypes = {
  startNode: StartNode,
  resourceNode: ResourceNode,
  summaryNode: SummaryNode,
  comparisonNode: ComparisonNode,
  synthesisNode: SynthesisNode,
  endNode: EndNode,
};

const Sidebar = () => {
  const { appendStageNode } = useStore();
  const onDragStart = (event: React.DragEvent, nodeType: AppNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-base-100 border-r border-base-300 flex flex-col h-full shadow-lg z-10 shrink-0">
      <div className="p-4 border-b border-base-300 bg-base-200">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Settings size={20} /> 課程設計工具
        </h2>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase">階段模組</div>

        <div
          className="card compact bg-white border border-orange-200 cursor-grab hover:shadow-md transition-all"
          draggable
          onDragStart={(e) => onDragStart(e, 'resource')}
          onClick={() => appendStageNode('resource')}
        >
          <div className="card-body p-3 flex flex-row items-center gap-3">
            <BookOpen size={18} className="text-orange-500" />
            <span className="font-medium">閱讀引導</span>
          </div>
        </div>

        <div
          className="card compact bg-white border border-blue-200 cursor-grab hover:shadow-md transition-all"
          draggable
          onDragStart={(e) => onDragStart(e, 'task_summary')}
          onClick={() => appendStageNode('task_summary')}
        >
          <div className="card-body p-3 flex flex-row items-center gap-3">
            <CheckSquare size={18} className="text-blue-500" />
            <span className="font-medium">任務：摘要</span>
          </div>
        </div>

        <div
          className="card compact bg-white border border-purple-200 cursor-grab hover:shadow-md transition-all"
          draggable
          onDragStart={(e) => onDragStart(e, 'task_comparison')}
          onClick={() => appendStageNode('task_comparison')}
        >
          <div className="card-body p-3 flex flex-row items-center gap-3">
            <Columns size={18} className="text-purple-500" />
            <span className="font-medium">任務：比較</span>
          </div>
        </div>

        <div
          className="card compact bg-white border border-emerald-200 cursor-grab hover:shadow-md transition-all"
          draggable
          onDragStart={(e) => onDragStart(e, 'task_synthesis')}
          onClick={() => appendStageNode('task_synthesis')}
        >
          <div className="card-body p-3 flex flex-row items-center gap-3">
            <Layers size={18} className="text-emerald-500" />
            <span className="font-medium">任務：綜合</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfigPanel = () => {
  const { nodes, updateNodeData, selectedNodeId, setSelectedNodeId, deleteNodeById } = useStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-80 bg-base-100 border-l border-base-300 p-6 flex items-center justify-center text-slate-400 shrink-0">
        點擊節點以編輯屬性
      </div>
    );
  }

  return (
    <div className="w-80 bg-base-100 border-l border-base-300 h-full flex flex-col shadow-lg z-10 shrink-0 animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-base-300 bg-base-200 flex justify-between items-center">
        <h2 className="font-bold text-lg">階段設定</h2>
        <div className="flex gap-2 items-center">
          {selectedNode.data.type !== 'start' && selectedNode.data.type !== 'end' && (
            <button
              className="btn btn-xs btn-outline btn-error"
              onClick={() => {
                deleteNodeById(selectedNode.id);
                setSelectedNodeId(null);
              }}
            >
              刪除節點
            </button>
          )}
          <button
            onClick={() => setSelectedNodeId(null)}
            className="btn btn-xs btn-circle btn-ghost"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">階段名稱</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={selectedNode.data.label}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
          />
        </div>

        {selectedNode.data.type === 'resource' && (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">閱讀指導語</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32"
                placeholder="例如：請閱讀關於 Attention Mechanism 的章節..."
                value={selectedNode.data.config?.guidance || ''}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, {
                    config: { ...selectedNode.data.config, guidance: e.target.value },
                  })
                }
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">最少標記片段數量</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                min="0"
                value={selectedNode.data.config?.minEvidence || 0}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, {
                    config: {
                      ...selectedNode.data.config,
                      minEvidence: parseInt(e.target.value) || 0,
                    },
                  })
                }
              />
              <label className="label">
                <span className="label-text-alt text-slate-500">
                  學生在此節點至少需要建立多少則標記片段
                </span>
              </label>
            </div>
          </>
        )}

        {selectedNode.data.type === 'task_summary' && (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">摘要指導語</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                value={selectedNode.data.config?.guidance || ''}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, {
                    config: { ...selectedNode.data.config, guidance: e.target.value },
                  })
                }
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">字數要求</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={selectedNode.data.config?.minWords || 150}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, {
                    config: { ...selectedNode.data.config, minWords: parseInt(e.target.value) },
                  })
                }
              />
            </div>
            <div className="form-control">
              <div className="flex items-center justify-between mb-2">
                <label className="label py-0">
                  <span className="label-text font-bold">摘要段落設定</span>
                </label>
                <button
                  className="btn btn-xs btn-primary gap-1"
                  onClick={() => {
                    const currentSections = selectedNode.data.config?.sections || [];
                    const newSection = {
                      key: `section_${Date.now()}`,
                      label: `段落 ${currentSections.length + 1}`,
                      placeholder: '請輸入內容...',
                      minEvidence: 1,
                    };
                    updateNodeData(selectedNode.id, {
                      config: {
                        ...selectedNode.data.config,
                        sections: [...currentSections, newSection],
                      },
                    });
                  }}
                >
                  <Plus size={12} />
                  新增段落
                </button>
                {(!selectedNode.data.config?.sections ||
                  selectedNode.data.config.sections.length === 0) && (
                  <button
                    className="btn btn-xs btn-outline gap-1"
                    onClick={() => {
                      updateNodeData(selectedNode.id, {
                        config: {
                          ...selectedNode.data.config,
                          sections: [
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
                          ],
                        },
                      });
                    }}
                  >
                    使用預設值
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(selectedNode.data.config?.sections || []).map((section: any, idx: number) => (
                  <div key={idx} className="card bg-base-200 border border-base-300 p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          className="input input-sm input-bordered w-full"
                          placeholder="段落 Key (唯一識別碼，如 a1_purpose)"
                          value={section.key || ''}
                          onChange={(e) => {
                            const sections = [...(selectedNode.data.config?.sections || [])];
                            sections[idx] = { ...sections[idx], key: e.target.value };
                            updateNodeData(selectedNode.id, {
                              config: { ...selectedNode.data.config, sections },
                            });
                          }}
                        />
                        <input
                          type="text"
                          className="input input-sm input-bordered w-full"
                          placeholder="段落標籤 (如 A1 研究目的)"
                          value={section.label || ''}
                          onChange={(e) => {
                            const sections = [...(selectedNode.data.config?.sections || [])];
                            sections[idx] = { ...sections[idx], label: e.target.value };
                            updateNodeData(selectedNode.id, {
                              config: { ...selectedNode.data.config, sections },
                            });
                          }}
                        />
                        <input
                          type="text"
                          className="input input-sm input-bordered w-full"
                          placeholder="輸入提示文字"
                          value={section.placeholder || ''}
                          onChange={(e) => {
                            const sections = [...(selectedNode.data.config?.sections || [])];
                            sections[idx] = { ...sections[idx], placeholder: e.target.value };
                            updateNodeData(selectedNode.id, {
                              config: { ...selectedNode.data.config, sections },
                            });
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <label className="label py-0 text-xs">最少標記片段：</label>
                          <input
                            type="number"
                            className="input input-sm input-bordered w-20"
                            min="0"
                            value={section.minEvidence || 1}
                            onChange={(e) => {
                              const sections = [...(selectedNode.data.config?.sections || [])];
                              sections[idx] = {
                                ...sections[idx],
                                minEvidence: parseInt(e.target.value) || 1,
                              };
                              updateNodeData(selectedNode.id, {
                                config: { ...selectedNode.data.config, sections },
                              });
                            }}
                          />
                        </div>
                      </div>
                      <button
                        className="btn btn-xs btn-ghost text-red-500 hover:text-red-700"
                        onClick={() => {
                          const sections = (selectedNode.data.config?.sections || []).filter(
                            (_: any, i: number) => i !== idx
                          );
                          updateNodeData(selectedNode.id, {
                            config: { ...selectedNode.data.config, sections },
                          });
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {(!selectedNode.data.config?.sections ||
                  selectedNode.data.config.sections.length === 0) && (
                  <div className="text-sm text-slate-400 text-center py-4">
                    尚未設定段落，點擊「新增段落」或「使用預設值」開始設定
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {selectedNode.data.type === 'task_comparison' && (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">比較維度 (逗號分隔)</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={selectedNode.data.config?.dimensions?.join(',') || ''}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, {
                    config: {
                      ...selectedNode.data.config,
                      dimensions: e.target.value.split(',').filter((x: string) => x.trim()),
                    },
                  })
                }
              />
              <label className="label">
                <span className="label-text-alt text-slate-500">
                  例如：研究目的, 研究方法, 主要發現
                </span>
              </label>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">最少標記片段數量</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                min="0"
                value={selectedNode.data.config?.minEvidence || 1}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, {
                    config: {
                      ...selectedNode.data.config,
                      minEvidence: parseInt(e.target.value) || 1,
                    },
                  })
                }
              />
              <label className="label">
                <span className="label-text-alt text-slate-500">
                  每個比較維度至少需要的標記片段數量
                </span>
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Flow = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    appendStageNode,
    setSelectedNodeId,
    setNodes,
    ensureSingleStartNode,
  } = useStore();
  const { project, fitView, getNode } = useReactFlow();
  const lastLayoutSig = useRef<string>('');
  const isSwappingRef = useRef(false);
  // 記錄拖動開始時所有節點的原始位置
  const originalPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  // 追蹤當前拖動的節點和重疊的節點，用於顯示視覺提示
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [overlappingNodeId, setOverlappingNodeId] = useState<string | null>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (reactFlowWrapper.current) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const type = event.dataTransfer.getData('application/reactflow') as AppNodeType;

        if (typeof type === 'undefined' || !type) {
          return;
        }

        const position = project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        if (
          type === 'resource' ||
          type === 'task_summary' ||
          type === 'task_comparison' ||
          type === 'task_synthesis'
        ) {
          appendStageNode(type, position);
        }
      }
    },
    [project, appendStageNode]
  );

  // 記錄拖動開始時的原始位置
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    const currentNodes = useStore.getState().nodes;
    // 記錄所有節點的原始位置
    originalPositionsRef.current.clear();
    currentNodes.forEach((n) => {
      originalPositionsRef.current.set(n.id, { ...n.position });
    });
    // 設置當前拖動的節點
    setDraggingNodeId(node.id);
    setOverlappingNodeId(null);
  }, []);

  // 檢測兩個節點是否重疊
  const nodesOverlap = useCallback(
    (node1: Node, node2: Node, nodeWidth = 256, nodeHeight = 120) => {
      const x1 = node1.position.x;
      const y1 = node1.position.y;
      const x2 = node2.position.x;
      const y2 = node2.position.y;

      // 檢查兩個節點的邊界框是否重疊
      // 使用中心點距離來判斷，更寬鬆的重疊條件
      const centerX1 = x1 + nodeWidth / 2;
      const centerY1 = y1 + nodeHeight / 2;
      const centerX2 = x2 + nodeWidth / 2;
      const centerY2 = y2 + nodeHeight / 2;

      const distanceX = Math.abs(centerX1 - centerX2);
      const distanceY = Math.abs(centerY1 - centerY2);

      // 如果兩個節點的中心點距離小於節點尺寸的一半，則認為重疊
      return distanceX < nodeWidth * 0.8 && distanceY < nodeHeight * 0.8;
    },
    []
  );

  // 處理節點拖動過程，檢測重疊並顯示視覺提示
  const onNodeDrag = useCallback(
    (event: React.MouseEvent, draggedNode: Node) => {
      if (!draggingNodeId || draggingNodeId !== draggedNode.id) return;

      // draggedNode 已經包含最新的位置信息
      const currentNodes = useStore.getState().nodes;

      // 找到與被拖動節點重疊的其他節點
      const overlappingNode = currentNodes.find((node) => {
        if (node.id === draggedNode.id) return false;
        // 跳過 start 和 end 節點，不允許交換
        const nodeType = (node as any).data?.type;
        const draggedType = (draggedNode as any).data?.type;
        if (
          nodeType === 'start' ||
          nodeType === 'end' ||
          draggedType === 'start' ||
          draggedType === 'end'
        ) {
          return false;
        }
        // 使用 draggedNode 的最新位置進行重疊檢測
        return nodesOverlap(draggedNode, node);
      });

      // 更新重疊節點狀態
      setOverlappingNodeId(overlappingNode?.id || null);
    },
    [draggingNodeId, nodesOverlap]
  );

  // 處理節點拖動結束，檢測是否與其他節點重疊並交換位置
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, draggedNode: Node) => {
      // 清除拖動狀態
      setDraggingNodeId(null);
      setOverlappingNodeId(null);

      // 如果正在交換中，跳過處理
      if (isSwappingRef.current) {
        return;
      }

      // 使用 getNode 獲取最新的節點位置（包含拖動後的位置）
      const latestDraggedNode = getNode(draggedNode.id);
      if (!latestDraggedNode) return;

      const currentNodes = useStore.getState().nodes;

      // 找到與被拖動節點重疊的其他節點
      const overlappingNode = currentNodes.find((node) => {
        if (node.id === latestDraggedNode.id) return false;
        // 跳過 start 和 end 節點，不允許交換
        const nodeType = (node as any).data?.type;
        const draggedType = (latestDraggedNode as any).data?.type;
        if (
          nodeType === 'start' ||
          nodeType === 'end' ||
          draggedType === 'start' ||
          draggedType === 'end'
        ) {
          return false;
        }
        return nodesOverlap(latestDraggedNode, node);
      });

      if (overlappingNode) {
        isSwappingRef.current = true;

        const draggedNodeId = latestDraggedNode.id;
        const overlappingNodeId = overlappingNode.id;

        // 獲取兩個節點的原始位置
        const draggedOriginalPos = originalPositionsRef.current.get(draggedNodeId);
        const overlappingOriginalPos = originalPositionsRef.current.get(overlappingNodeId);

        // 如果找不到原始位置，使用當前位置作為備選
        const draggedPos = draggedOriginalPos || latestDraggedNode.position;
        const overlappingPos = overlappingOriginalPos || overlappingNode.position;

        // 交換兩個節點的原始位置
        const updatedNodes = currentNodes.map((node) => {
          if (node.id === draggedNodeId) {
            return { ...node, position: { ...overlappingPos } };
          }
          if (node.id === overlappingNodeId) {
            return { ...node, position: { ...draggedPos } };
          }
          return node;
        });

        // 交換兩個節點在 workflow 中的順序（交換邊連接）
        const currentEdges = useStore.getState().edges;
        const updatedEdges = currentEdges
          .map((edge) => {
            // 交換 source
            let newSource = edge.source;
            if (edge.source === draggedNodeId) {
              newSource = overlappingNodeId;
            } else if (edge.source === overlappingNodeId) {
              newSource = draggedNodeId;
            }

            // 交換 target
            let newTarget = edge.target;
            if (edge.target === draggedNodeId) {
              newTarget = overlappingNodeId;
            } else if (edge.target === overlappingNodeId) {
              newTarget = draggedNodeId;
            }

            // 如果 source 和 target 相同，跳過這條邊（避免自環）
            if (newSource === newTarget) {
              return null;
            }

            return { ...edge, source: newSource, target: newTarget };
          })
          .filter((edge): edge is (typeof currentEdges)[0] => edge !== null);

        // 移除重複的邊
        const seenEdges = new Set<string>();
        const uniqueEdges = updatedEdges.filter((edge) => {
          const key = `${edge.source}->${edge.target}`;
          if (seenEdges.has(key)) {
            return false;
          }
          seenEdges.add(key);
          return true;
        });

        // 同時更新節點和邊
        useStore.setState({ nodes: updatedNodes, edges: uniqueEdges });

        // 更新 autoLayout 的簽名，避免自動佈局覆蓋交換結果
        const signature = JSON.stringify(
          updatedNodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y }))
        );
        lastLayoutSig.current = signature;

        // 重置標記
        setTimeout(() => {
          isSwappingRef.current = false;
        }, 100);
      }
    },
    [nodesOverlap, setNodes, getNode]
  );

  const autoLayout = useCallback(() => {
    ensureSingleStartNode();
    const current = useStore.getState().nodes;
    const start =
      current.find((n) => n.type === 'startNode') ||
      current.find((n: any) => n.data?.type === 'start');
    const end =
      current.find((n) => n.type === 'endNode') || current.find((n: any) => n.data?.type === 'end');
    const middle = current.filter(
      (n) =>
        n.id !== start?.id &&
        n.id !== end?.id &&
        (n as any).data?.type !== 'start' &&
        (n as any).data?.type !== 'end'
    );

    // 依目前位置排序，維持穩定性
    const middleSorted = [...middle].sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));

    const ordered = [start, ...middleSorted, end].filter(Boolean) as typeof current;
    const gapY = 140;
    const x = 240;

    const positioned = ordered.map((n, idx) => ({
      ...n,
      position: { x, y: 80 + idx * gapY },
    }));

    const signature = JSON.stringify(
      positioned.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y }))
    );
    if (signature === lastLayoutSig.current) return;
    lastLayoutSig.current = signature;

    setNodes(positioned);
    setTimeout(() => fitView({ padding: 0.2 }), 0);
  }, [ensureSingleStartNode, setNodes, fitView]);

  useEffect(() => {
    autoLayout();
  }, [nodes.length, edges.length, autoLayout]);

  return (
    <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isOverlapping: overlappingNodeId === node.id,
          },
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        nodeTypes={nodeTypes}
        onInit={(instance) => instance.fitView()}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        defaultEdgeOptions={{
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }}
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default function TeacherInterface() {
  const navigate = useNavigate();
  const { saveProject, nodes, addNode, activeProjectId, projects, ensureSingleStartNode } =
    useStore();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [title, setTitle] = useState('');
  const [semester, setSemester] = useState('');

  useEffect(() => {
    ensureSingleStartNode();
    // 若目前沒有 startNode，就自動建立一個；使用隨機 id 避免與資料庫主鍵衝突
    if (!nodes.some((n) => n.type === 'startNode')) {
      const newId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `start_${Date.now()}`;
      addNode({
        id: newId,
        type: 'startNode',
        position: { x: 120, y: 80 },
        data: { label: '開始', type: 'start' as any },
      });
    }
  }, [nodes.length, addNode, ensureSingleStartNode]);

  // 編輯已存在專案時，自動帶入專案名稱與學期
  useEffect(() => {
    if (!activeProjectId) return;
    const p = projects.find((proj) => proj.id === activeProjectId);
    if (p) {
      setTitle(p.title || '');
      setSemester(p.semester || '');
    }
  }, [activeProjectId, projects]);

  const handleSave = async () => {
    if (!title.trim()) {
      setSaveMessage({ type: 'error', text: '請先輸入專案名稱再儲存。' });
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      await saveProject({
        id: activeProjectId || undefined,
        title: title.trim(),
        semester: semester.trim() || undefined,
        tags: [],
      });
      setSaveMessage({ type: 'success', text: '設計已成功儲存。' });
    } catch (e: any) {
      setSaveMessage({ type: 'error', text: `儲存失敗：${e.message || e}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-full bg-slate-50">
        {/* Header */}
        <div className="navbar bg-white border-b border-slate-200 px-4 h-16 shrink-0 z-20 shadow-sm">
          <div className="flex-none mr-2">
            <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate(-1)}>
              ←
            </button>
          </div>
          <div className="flex-1 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-800">
                ThesisFlow
                <span className="ml-1 text-xs font-normal text-slate-500">文獻探討輔助平台</span>
              </span>
              <span className="badge badge-outline border-slate-300 text-slate-500 mt-1 w-fit">
                教師端
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="input input-sm input-bordered"
                placeholder="專案名稱（必填）"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                className="input input-sm input-bordered"
                placeholder="學期（選填，如 113-1）"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-none gap-2 flex items-center">
            <button className="btn btn-sm btn-primary gap-2" onClick={handleSave} disabled={saving}>
              {saving ? '儲存中...' : '儲存設計'}
              <Save size={16} />
            </button>
          </div>
        </div>

        {/* Save feedback */}
        {saveMessage && (
          <div
            className={`px-4 py-2 text-sm ${
              saveMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-200'
                : 'bg-red-50 text-red-700 border-b border-red-200'
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* Workspace */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <Flow />
          <ConfigPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
