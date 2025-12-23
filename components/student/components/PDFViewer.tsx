import React from 'react';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';
import { Document } from '../../../types';
import { PDFSelector } from '../../PDFSelector';
import { SelectionRect, ExtendedHighlight } from '../StudentInterface.types';
import { PDFPageHighlights } from './PDFPageHighlights';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  previewUrl: string | null;
  previewLoading: boolean;
  doc: Document | undefined;
  pageCount: number;
  zoom: number;
  pdfContainerRef: React.RefObject<HTMLDivElement>;
  pageRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  pdfPageTexts: React.MutableRefObject<Map<number, any>>;
  onPageCountChange: (count: number) => void;
  onBoxSelection: (selection: SelectionRect) => void;
  highlights?: ExtendedHighlight[];
  hoveredHighlightId?: string | null;
  onHighlightHover?: (id: string | null) => void;
  onHighlightDelete?: (id: string) => void;
  onHighlightCopy?: (text: string) => void;
  onHighlightUpdate?: (id: string, updates: Partial<ExtendedHighlight>) => void;
  currentRect?: { x: number; y: number; w: number; h: number } | null;
  currentRectPage?: number | null;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  previewUrl,
  previewLoading,
  doc,
  pageCount,
  zoom,
  pdfContainerRef,
  pageRefs,
  pdfPageTexts,
  onPageCountChange,
  onBoxSelection,
  highlights = [],
  hoveredHighlightId = null,
  onHighlightHover = () => {},
  onHighlightDelete = () => {},
  onHighlightCopy = () => {},
  onHighlightUpdate = () => {},
  currentRect = null,
  currentRectPage = null,
}) => {
  if (previewLoading) {
    return <div className="text-slate-500 text-sm">預覽載入中...</div>;
  }

  if (doc?.content_type?.startsWith('image/') && previewUrl) {
    return (
      <img
        src={previewUrl}
        alt={doc.title}
        className="max-h-[70vh] max-w-full object-contain border border-base-200 rounded-md"
      />
    );
  }

  if ((doc?.type === 'pdf' || doc?.content_type === 'application/pdf') && previewUrl) {
    return (
      <div
        ref={pdfContainerRef}
        className="border border-base-200 rounded-md overflow-auto max-h-[calc(100vh-280px)] bg-white pointer-events-auto"
      >
        <PdfDocument
          file={previewUrl}
          onLoadSuccess={({ numPages }) => onPageCountChange(numPages)}
          loading={<div className="p-4 text-sm text-slate-500">PDF 載入中...</div>}
          error={<div className="p-4 text-sm text-red-500">PDF 載入失敗</div>}
        >
          {Array.from({ length: pageCount || 1 }, (_, i) => {
            const pageNum = i + 1;
            return (
              <div
                key={i}
                ref={(el) => {
                  if (el) pageRefs.current.set(pageNum, el);
                  else pageRefs.current.delete(pageNum);
                }}
                style={{
                  position: 'relative',
                  marginBottom: '8px',
                  display: 'inline-block',
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                <Page
                  pageNumber={pageNum}
                  renderAnnotationLayer={false}
                  renderTextLayer={true}
                  width={680 * zoom}
                  onGetTextSuccess={(text) => {
                    const current = pdfPageTexts.current.get(pageNum) || {};
                    pdfPageTexts.current.set(pageNum, { ...current, text });
                  }}
                  onRenderSuccess={(pageInfo) => {
                    const current = pdfPageTexts.current.get(pageNum) || {};
                    pdfPageTexts.current.set(pageNum, {
                      ...current,
                      page: pageInfo?.page || pageInfo,
                    });
                  }}
                />
                <PDFSelector
                  pageNumber={pageNum}
                  pageData={pdfPageTexts.current.get(pageNum)}
                  onSelect={onBoxSelection}
                  disabled={false}
                />
                <PDFPageHighlights
                  pageNumber={pageNum}
                  highlights={highlights}
                  hoveredHighlightId={hoveredHighlightId}
                  onHighlightHover={onHighlightHover}
                  onHighlightDelete={onHighlightDelete}
                  onHighlightCopy={onHighlightCopy}
                  onHighlightUpdate={onHighlightUpdate}
                  currentRect={currentRect}
                  showCurrentRect={currentRectPage === pageNum}
                />
              </div>
            );
          })}
        </PdfDocument>
      </div>
    );
  }

  if (!doc?.content_type || (!doc.content_type.startsWith('image/') && doc.content_type !== 'application/pdf')) {
    return (
      <div className="whitespace-pre-line text-slate-800">
        {doc?.raw_preview || '（此文獻內容需從物件儲存載入）'}
      </div>
    );
  }

  return null;
};

