import { useState, useRef } from 'react';
import { SelectionRect } from '../StudentInterface.types';

export const useSelection = () => {
  const [selectionToolbar, setSelectionToolbar] = useState<{ text: string; x: number; y: number } | null>(null);
  const [evidenceType, setEvidenceType] = useState<string>('Other');
  const [pendingSelection, setPendingSelection] = useState<SelectionRect | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [toolbarRect, setToolbarRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [currentRectPage, setCurrentRectPage] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const pageRef = useRef<HTMLDivElement>(null);

  const getRelativePos = (e: React.MouseEvent) => {
    if (!pageRef.current) return { x: 0, y: 0 };
    const rect = pageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  const handleBoxSelection = (selection: SelectionRect, currentDocId: string | null) => {
    if (!currentDocId) return;
    // PDFSelector 返回的座標是 0-1 範圍，已經是相對於頁面的
    // 轉換為 0-100% 以用於顯示
    const rect = {
      x: selection.x * 100,  // 轉換為百分比（相對於頁面）
      y: selection.y * 100,   // 轉換為百分比（相對於頁面）
      w: selection.width * 100,   // 轉換為百分比（相對於頁面）
      h: selection.height * 100,   // 轉換為百分比（相對於頁面）
    };
    setToolbarRect(rect);
    setCurrentRect(rect); // 設置 currentRect，讓選擇框持續顯示（相對於頁面）
    setCurrentRectPage(selection.page); // 設置當前選擇框所在頁面
    setPendingSelection(selection);
  };

  const handleMouseDown = (e: React.MouseEvent, doc: any) => {
    // 防止在按鈕或輸入框上觸發拖拽
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    
    // 檢查是否點擊到已存在的標記
    const target = e.target as HTMLElement;
    if (target.dataset.isHighlight === 'true' || target.closest('[data-is-highlight="true"]')) {
      // 點擊到已存在的標記，不開始拖拽
      return;
    }
    
    if (!doc || (doc.type !== 'pdf' && doc.content_type !== 'application/pdf')) return;
    setIsDrawing(true);
    const pos = getRelativePos(e);
    setStartPos(pos);
    setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
    setToolbarRect(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const pos = getRelativePos(e);
    const w = pos.x - startPos.x;
    const h = pos.y - startPos.y;
    setCurrentRect({
      x: w > 0 ? startPos.x : pos.x,
      y: h > 0 ? startPos.y : pos.y,
      w: Math.abs(w),
      h: Math.abs(h),
    });
  };

  const handleMouseUp = (
    pageRefs?: React.MutableRefObject<Map<number, HTMLDivElement>> | undefined,
    pdfContainerRef?: React.RefObject<HTMLDivElement> | undefined
  ) => {
    if (isDrawing) {
      setIsDrawing(false);
      // 只有當框選範圍大於一定閾值(1%)時才視為有效，避免誤觸
      if (currentRect && (currentRect.w > 1 || currentRect.h > 1)) {
        // 保存容器相對座標，用於工具列定位（工具列相對於外層容器）
        const containerRelativeRect = { ...currentRect };
        
        // 計算選擇框所在的頁面和頁面相對座標
        if (pageRefs && pdfContainerRef && pageRef.current && pdfContainerRef.current) {
          const containerRect = pageRef.current.getBoundingClientRect();
          
          // 計算選擇框的中心點（絕對座標）
          const centerX = containerRect.left + (currentRect.x / 100) * containerRect.width;
          const centerY = containerRect.top + (currentRect.y / 100) * containerRect.height;
          
          // 找到包含中心點的 PDF 頁面
          let targetPage = 1;
          let pageElement: HTMLDivElement | null = null;
          
          for (const [pageNum, pageEl] of pageRefs.current.entries()) {
            const pageRect = pageEl.getBoundingClientRect();
            if (
              centerX >= pageRect.left &&
              centerX <= pageRect.right &&
              centerY >= pageRect.top &&
              centerY <= pageRect.bottom
            ) {
              targetPage = pageNum;
              pageElement = pageEl;
              break;
            }
          }
          
          if (pageElement) {
            const pageRect = pageElement.getBoundingClientRect();
            
            // 計算選擇框的邊界（絕對座標）
            const selectionLeft = containerRect.left + (currentRect.x / 100) * containerRect.width;
            const selectionTop = containerRect.top + (currentRect.y / 100) * containerRect.height;
            const selectionRight = selectionLeft + (currentRect.w / 100) * containerRect.width;
            const selectionBottom = selectionTop + (currentRect.h / 100) * containerRect.height;
            
            // 計算選擇框相對於頁面的位置（0-1）
            const pageRelativeLeft = Math.max(0, Math.min(1, (selectionLeft - pageRect.left) / pageRect.width));
            const pageRelativeTop = Math.max(0, Math.min(1, (selectionTop - pageRect.top) / pageRect.height));
            const pageRelativeRight = Math.max(0, Math.min(1, (selectionRight - pageRect.left) / pageRect.width));
            const pageRelativeBottom = Math.max(0, Math.min(1, (selectionBottom - pageRect.top) / pageRect.height));
            
            // 設置當前選擇框所在頁面
            setCurrentRectPage(targetPage);
            
            // 更新 currentRect 為相對於頁面的座標（0-100%），用於在頁面上顯示選擇框
            setCurrentRect({
              x: pageRelativeLeft * 100,
              y: pageRelativeTop * 100,
              w: (pageRelativeRight - pageRelativeLeft) * 100,
              h: (pageRelativeBottom - pageRelativeTop) * 100,
            });
            
            // 設置 toolbarRect 為容器相對座標，用於工具列定位（相對於外層容器）
            setToolbarRect(containerRelativeRect);
            
            // 創建 pendingSelection，座標為 0-1 範圍
            setPendingSelection({
              x: pageRelativeLeft,
              y: pageRelativeTop,
              width: pageRelativeRight - pageRelativeLeft,
              height: pageRelativeBottom - pageRelativeTop,
              page: targetPage,
              text: '', // 文本提取需要從 PDF 頁面獲取，這裡先留空
            });
          } else {
            // 如果找不到頁面，使用第一頁並使用容器座標（轉換為 0-1）
            setCurrentRectPage(1);
            setToolbarRect(containerRelativeRect);
            setPendingSelection({
              x: currentRect.x / 100,
              y: currentRect.y / 100,
              width: currentRect.w / 100,
              height: currentRect.h / 100,
              page: 1,
              text: '',
            });
          }
        } else {
          // 如果沒有 pageRefs，使用容器座標（轉換為 0-1）
          setCurrentRectPage(1);
          setToolbarRect(containerRelativeRect);
          setPendingSelection({
            x: currentRect.x / 100,
            y: currentRect.y / 100,
            width: currentRect.w / 100,
            height: currentRect.h / 100,
            page: 1,
            text: '',
          });
        }
        
        // currentRect 保持不變，讓選擇框持續顯示直到用戶確認或取消
      } else {
        setCurrentRect(null); // 取消無效框選
        setCurrentRectPage(null);
        setToolbarRect(null);
        setPendingSelection(null);
      }
      return;
    }
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const text = selection.toString().trim();
      if (text.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionToolbar({
          text,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
      }
    }
  };

  const handleEditCreate = () => {
    if (toolbarRect && pendingSelection) {
      setIsCreateDialogOpen(true);
    }
  };

  const handleCloseToolbar = () => {
    setToolbarRect(null);
    setCurrentRect(null);
    setCurrentRectPage(null);
    setPendingSelection(null);
  };

  const handleCancelSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSelectionToolbar(null);
  };

  return {
    selectionToolbar,
    setSelectionToolbar,
    evidenceType,
    setEvidenceType,
    pendingSelection,
    setPendingSelection,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    toolbarRect,
    setToolbarRect,
    currentRect,
    setCurrentRect,
    currentRectPage,
    setCurrentRectPage,
    isDrawing,
    pageRef,
    handleBoxSelection,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleEditCreate,
    handleCloseToolbar,
    handleCancelSelection,
  };
};

