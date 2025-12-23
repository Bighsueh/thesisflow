import { useState } from 'react';
import { useStore } from '../../../store';
import { usePDFViewer } from './usePDFViewer';
import { useHighlights } from './useHighlights';
import { useSelection } from './useSelection';
import { useDocumentDragDrop } from './useDocumentDragDrop';

export const useReaderPanel = () => {
  const { currentDocId, addHighlight } = useStore();
  const [isLibraryOpen, setLibraryOpen] = useState(false);

  const pdfViewer = usePDFViewer();
  const highlights = useHighlights();
  const selection = useSelection();
  const dragDrop = useDocumentDragDrop();

  const handleCreateEvidence = async () => {
    if (selection.selectionToolbar && currentDocId) {
      await addHighlight(currentDocId, selection.selectionToolbar.text, { evidence_type: selection.evidenceType });
      window.getSelection()?.removeAllRanges();
      selection.setSelectionToolbar(null);
    }
  };

  const handleBoxSelection = (sel: any) => {
    selection.handleBoxSelection(sel, currentDocId);
  };

  const handleQuickCreate = async (type: any) => {
    await highlights.handleQuickCreate(
      type,
      selection.toolbarRect,
      selection.pendingSelection,
      selection.setToolbarRect,
      selection.setCurrentRect,
      selection.setPendingSelection,
      selection.setCurrentRectPage
    );
  };

  const handleCreateEvidenceFromDialog = async (snippet: string, name?: string) => {
    await highlights.handleCreateEvidenceFromDialog(
      snippet,
      name,
      selection.pendingSelection,
      selection.setPendingSelection,
      selection.setIsCreateDialogOpen,
      selection.setToolbarRect,
      selection.setCurrentRect,
      selection.setCurrentRectPage
    );
  };

  const handleLocateHighlight = (highlight: any) => {
    highlights.handleLocateHighlight(highlight, pdfViewer.pageRefs);
  };

  return {
    doc: pdfViewer.doc,
    extendedHighlights: highlights.extendedHighlights,
    isLibraryOpen,
    setIsLibraryOpen: setLibraryOpen,
    isEvidencePanelOpen: highlights.isEvidencePanelOpen,
    setIsEvidencePanelOpen: highlights.setIsEvidencePanelOpen,
    previewUrl: pdfViewer.previewUrl,
    previewLoading: pdfViewer.previewLoading,
    pageCount: pdfViewer.pageCount,
    setPageCount: pdfViewer.setPageCount,
    zoom: pdfViewer.zoom,
    setZoom: pdfViewer.setZoom,
    selectionToolbar: selection.selectionToolbar,
    evidenceType: selection.evidenceType,
    setEvidenceType: selection.setEvidenceType,
    isDragOver: dragDrop.isDragOver,
    pendingSelection: selection.pendingSelection,
    setPendingSelection: selection.setPendingSelection,
    isCreateDialogOpen: selection.isCreateDialogOpen,
    setIsCreateDialogOpen: selection.setIsCreateDialogOpen,
    hoveredHighlightId: highlights.hoveredHighlightId,
    setHoveredHighlightId: highlights.setHoveredHighlightId,
    toolbarRect: selection.toolbarRect,
    currentRect: selection.currentRect,
    currentRectPage: selection.currentRectPage,
    pdfContainerRef: pdfViewer.pdfContainerRef,
    pageRefs: pdfViewer.pageRefs,
    pdfPageTexts: pdfViewer.pdfPageTexts,
    pageRef: selection.pageRef,
    handleDocumentDrop: dragDrop.handleDocumentDrop,
    handleDocumentDragOver: dragDrop.handleDocumentDragOver,
    handleDocumentDragLeave: dragDrop.handleDocumentDragLeave,
    handleCreateEvidence,
    handleBoxSelection,
    handleMouseDown: (e: React.MouseEvent) => selection.handleMouseDown(e, pdfViewer.doc),
    handleMouseMove: selection.handleMouseMove,
    handleMouseUp: () => selection.handleMouseUp(pdfViewer.pageRefs, pdfViewer.pdfContainerRef),
    handleQuickCreate,
    handleEditCreate: selection.handleEditCreate,
    handleCreateEvidenceFromDialog,
    handleLocateHighlight,
    handleUpdateHighlight: highlights.handleUpdateHighlight,
    handleCopyHighlight: highlights.handleCopyHighlight,
    handleRemoveHighlight: highlights.handleRemoveHighlight,
    handleCancelSelection: selection.handleCancelSelection,
    handleCloseToolbar: selection.handleCloseToolbar,
  };
};
