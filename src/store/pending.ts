import { create } from 'zustand';

import type { AnalysisDepth, DecisionInput } from '../domain/types';

/** In-memory hand-off between the create screen and the analysis screen. Never persisted. */
type Pending = {
  input: DecisionInput | null;
  depth: AnalysisDepth;
  setPending: (input: DecisionInput, depth: AnalysisDepth) => void;
  clear: () => void;
  /** Remembers what the user typed if they leave the create screen. */
  draft: DecisionInput;
  setDraft: (draft: DecisionInput) => void;
};

const EMPTY: DecisionInput = { description: '' };

export const usePending = create<Pending>((set) => ({
  input: null,
  depth: 'standard',
  setPending: (input, depth) => set({ input, depth }),
  clear: () => set({ input: null }),
  draft: EMPTY,
  setDraft: (draft) => set({ draft }),
}));
