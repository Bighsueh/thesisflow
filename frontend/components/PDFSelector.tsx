import type { PDFPageProxy } from 'pdfjs-dist';
import React, { useState, useRef, useEffect } from 'react';

interface PDFSelectorProps {
  pageNumber: number;
  pageData?: { page?: PDFPageProxy; text?: any };
  onSelect: (selection: {
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    text?: string;
  }) => void;
  disabled?: boolean;
}

export const PDFSelector: React.FC<PDFSelectorProps> = ({
  pageNumber,
  pageData,
  onSelect,
  disabled = false,
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 提取選中區域的文本
  const extractTextFromSelection = async (
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<string> => {
    try {
      if (!pageData?.page) return '';

      const page = pageData.page;

      // 添加错误处理，防止 worker 终止错误
      let textContent;
      try {
        textContent = await page.getTextContent();
      } catch (error: any) {
        // 如果 worker 被终止，返回空字符串而不是抛出错误
        if (error?.message?.includes('Worker') && error?.message?.includes('terminated')) {
          console.debug('PDF worker task was terminated, skipping text extraction');
          return '';
        }
        throw error;
      }
      const viewport = page.getViewport({ scale: 1 });

      // 將相對座標轉換為 PDF 座標系統（PDF 座標系統原點在左下角）
      // 需要考慮 viewport 的實際尺寸
      const pageWidth = viewport.width;
      const pageHeight = viewport.height;

      // 相對座標轉換為 PDF 座標（注意 Y 軸需要翻轉）
      const left = x * pageWidth;
      const top = (1 - y) * pageHeight; // Y 軸翻轉
      const right = (x + width) * pageWidth;
      const bottom = (1 - y - height) * pageHeight; // Y 軸翻轉

      // 確保座標順序正確
      const minX = Math.min(left, right);
      const maxX = Math.max(left, right);
      const minY = Math.min(top, bottom);
      const maxY = Math.max(top, bottom);

      // 過濾出在選中區域內的文本項目
      const selectedTexts: Array<{ text: string; y: number; x: number }> = [];

      for (const item of textContent.items) {
        if ('transform' in item && Array.isArray(item.transform)) {
          // transform: [a, b, c, d, e, f]
          // e = x, f = y (在 PDF 座標系統中)
          const tx = item.transform[4];
          const ty = item.transform[5];
          const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12;

          // 檢查文本項目的位置是否在選中區域內
          // 考慮字體大小，允許一些容差
          const tolerance = fontSize * 0.5;
          if (
            tx >= minX - tolerance &&
            tx <= maxX + tolerance &&
            ty >= minY - fontSize - tolerance &&
            ty <= maxY + tolerance
          ) {
            if ('str' in item && typeof item.str === 'string' && item.str.trim()) {
              selectedTexts.push({ text: item.str, y: ty, x: tx });
            }
          }
        }
      }

      // 按 Y 座標（從上到下）和 X 座標（從左到右）排序
      selectedTexts.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 5) {
          // 不同行，按 Y 座標排序（從上到下）
          return b.y - a.y;
        }
        // 同一行，按 X 座標排序（從左到右）
        return a.x - b.x;
      });

      return selectedTexts
        .map((item) => item.text)
        .join(' ')
        .trim();
    } catch (error) {
      console.error('提取文本失敗:', error);
      return '';
    }
  };

  const getRelativeCoordinates = (clientX: number, clientY: number) => {
    if (!overlayRef.current) return null;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;

    // 檢查是否點擊到已存在的標記
    const target = e.target as HTMLElement;
    if (target.dataset.isHighlight === 'true' || target.closest('[data-is-highlight="true"]')) {
      // 點擊到標記，不開始選擇，讓標記的事件處理器處理
      return;
    }

    const coords = getRelativeCoordinates(e.clientX, e.clientY);
    if (coords) {
      e.preventDefault();
      e.stopPropagation();
      setIsSelecting(true);
      setStartPos(coords);
      setCurrentPos(coords);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const coords = getRelativeCoordinates(e.clientX, e.clientY);
    if (coords) {
      setCurrentPos(coords);
    }
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!isSelecting || disabled || !startPos || !currentPos) return;
    e.preventDefault();
    e.stopPropagation();

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    // 只有當選擇區域足夠大時才觸發選擇
    if (width > 0.01 && height > 0.01) {
      // 提取選中區域的文本
      const extractedText = await extractTextFromSelection(x, y, width, height);

      onSelect({
        x,
        y,
        width,
        height,
        page: pageNumber,
        text: extractedText,
      });
    }

    setIsSelecting(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = async (e: MouseEvent) => {
      if (isSelecting) {
        const coords = overlayRef.current ? getRelativeCoordinates(e.clientX, e.clientY) : null;
        if (coords && startPos) {
          const x = Math.min(startPos.x, coords.x);
          const y = Math.min(startPos.y, coords.y);
          const width = Math.abs(coords.x - startPos.x);
          const height = Math.abs(coords.y - startPos.y);

          if (width > 0.01 && height > 0.01) {
            // 提取選中區域的文本
            const extractedText = await extractTextFromSelection(x, y, width, height);

            onSelect({
              x,
              y,
              width,
              height,
              page: pageNumber,
              text: extractedText,
            });
          }
        }
        setIsSelecting(false);
        setStartPos(null);
        setCurrentPos(null);
      }
    };

    if (isSelecting) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mousemove', (e) => {
        if (overlayRef.current && startPos) {
          const coords = getRelativeCoordinates(e.clientX, e.clientY);
          if (coords) {
            setCurrentPos(coords);
          }
        }
      });
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isSelecting, startPos, pageNumber, onSelect, pageData]);

  const getSelectionStyle = () => {
    if (!startPos || !currentPos) return { display: 'none' };

    const x = Math.min(startPos.x, currentPos.x) * 100;
    const y = Math.min(startPos.y, currentPos.y) * 100;
    const width = Math.abs(currentPos.x - startPos.x) * 100;
    const height = Math.abs(currentPos.y - startPos.y) * 100;

    return {
      position: 'absolute' as const,
      left: `${x}%`,
      top: `${y}%`,
      width: `${width}%`,
      height: `${height}%`,
      // 使用與儲存後相同的樣式，僅 border 為虛線
      border: '2px dashed #fb923c', // orange-400
      backgroundColor: 'rgba(254, 243, 199, 0.3)', // orange-100 with opacity
      pointerEvents: 'none' as const,
    };
  };

  return (
    <>
      {/* 選擇覆蓋層 - 較低 z-index，用於開始選擇 */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: 'crosshair',
          zIndex: 5,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* 選擇框 - 在選擇時提高 z-index 到 20，確保在 highlight 之上 */}
        {isSelecting && startPos && currentPos && (
          <div
            style={{
              ...getSelectionStyle(),
              zIndex: 20,
            }}
          />
        )}
      </div>
    </>
  );
};
