import { Highlight } from '../../types';

// Evidence Type Definitions
export type EvidenceType = 'Purpose' | 'Method' | 'Findings' | 'Limitation' | 'Other';

// Extended Highlight type with tag and note (backward compatible)
export interface ExtendedHighlight extends Highlight {
  tag?: string; // User defined short description
  note?: string; // Detailed note
  type?: EvidenceType; // For convenience, maps from evidence_type
  docTitle?: string; // Document title for display
}
