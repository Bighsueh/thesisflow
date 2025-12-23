import { useState } from 'react';
import { useStore } from '../../../store';
import { ExtendedHighlight, EvidenceType } from '../StudentInterface.types';

export const useHighlights = () => {
  const { documents, currentDocId, addHighlight, removeHighlight, updateHighlight, loadDocuments, activeProjectId } = useStore();
  const [hoveredHighlightId, setHoveredHighlightId] = useState<string | null>(null);
  const [isEvidencePanelOpen, setIsEvidencePanelOpen] = useState(false);

  const doc = documents.find(d => d.id === currentDocId);
  const extendedHighlights: ExtendedHighlight[] = (doc?.highlights || []).map((h) => ({
    ...h,
    type: (h.evidence_type as EvidenceType) || 'Other',
    tag: h.name,
  }));

  const handleLocateHighlight = (highlight: ExtendedHighlight, pageRefs: React.MutableRefObject<Map<number, HTMLDivElement>>) => {
    if (highlight.page) {
      const pageElement = pageRefs.current.get(highlight.page);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    setIsEvidencePanelOpen(false);
  };

  const handleUpdateHighlight = async (id: string, updates: Partial<ExtendedHighlight>) => {
    await updateHighlight(id, {
      name: updates.tag || updates.name,
      evidence_type: updates.type || updates.evidence_type,
    });
    await loadDocuments(activeProjectId || undefined);
  };

  const handleCopyHighlight = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleRemoveHighlight = async (highlightId: string) => {
    try {
      await removeHighlight(highlightId);
    } catch (error: any) {
      throw error;
    }
  };

  const handleQuickCreate = async (
    type: EvidenceType,
    toolbarRect: { x: number; y: number; w: number; h: number } | null,
    pendingSelection: { x: number; y: number; width: number; height: number; page: number; text?: string } | null,
    setToolbarRect: (rect: { x: number; y: number; w: number; h: number } | null) => void,
    setCurrentRect: (rect: { x: number; y: number; w: number; h: number } | null) => void,
    setPendingSelection: (selection: { x: number; y: number; width: number; height: number; page: number; text?: string } | null) => void,
    setCurrentRectPage?: (page: number | null) => void
  ) => {
    if (toolbarRect && currentDocId && pendingSelection) {
      await addHighlight(currentDocId, pendingSelection.text || '選取的內容', {
        evidence_type: type,
        page: pendingSelection.page,
        x: pendingSelection.x,
        y: pendingSelection.y,
        width: pendingSelection.width,
        height: pendingSelection.height,
      });
      setToolbarRect(null);
      setCurrentRect(null);
      setPendingSelection(null);
      if (setCurrentRectPage) setCurrentRectPage(null);
    }
  };

  const handleCreateEvidenceFromDialog = async (
    snippet: string,
    name: string | undefined,
    pendingSelection: { x: number; y: number; width: number; height: number; page: number; text?: string } | null,
    setPendingSelection: (selection: { x: number; y: number; width: number; height: number; page: number; text?: string } | null) => void,
    setIsCreateDialogOpen: (open: boolean) => void,
    setToolbarRect?: (rect: { x: number; y: number; w: number; h: number } | null) => void,
    setCurrentRect?: (rect: { x: number; y: number; w: number; h: number } | null) => void,
    setCurrentRectPage?: (page: number | null) => void
  ) => {
    if (!currentDocId || !pendingSelection) return;
    await addHighlight(currentDocId, snippet, {
      name: name,
      page: pendingSelection.page,
      x: pendingSelection.x,
      y: pendingSelection.y,
      width: pendingSelection.width,
      height: pendingSelection.height,
    });
    setPendingSelection(null);
    setIsCreateDialogOpen(false);
    // 清除選擇框和工具列
    if (setToolbarRect) setToolbarRect(null);
    if (setCurrentRect) setCurrentRect(null);
    if (setCurrentRectPage) setCurrentRectPage(null);
  };

  return {
    extendedHighlights,
    hoveredHighlightId,
    setHoveredHighlightId,
    isEvidencePanelOpen,
    setIsEvidencePanelOpen,
    handleLocateHighlight,
    handleUpdateHighlight,
    handleCopyHighlight,
    handleRemoveHighlight,
    handleQuickCreate,
    handleCreateEvidenceFromDialog,
  };
};

