import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { FREE_DIMENSIONS } from '../domain/dimensions';
import { availableDimensions } from '../domain/compare';
import { recentExplorations } from '../domain/limits';
import type { DecisionAnalysis, DimensionKey } from '../domain/schema';
import type { AnalysisDepth, ChosenPath, Decision, DecisionInput, DecisionSource } from '../domain/types';

export const STORAGE_KEY = 'fork:v1';
const MAX_UNSAVED_DRAFTS = 3;

type PersistedState = {
  onboarded: boolean;
  decisions: Decision[];
  explorations: number[];
  proCache: boolean;
};

type Actions = {
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  createDecision: (args: {
    input: DecisionInput;
    analysis: DecisionAnalysis;
    source: DecisionSource;
    depth: AnalysisDepth;
    now?: number;
  }) => Decision;
  recordExploration: (now?: number) => void;
  markViewed: (id: string, scenarioId: string) => void;
  setDimensions: (id: string, dims: DimensionKey[]) => void;
  saveDecision: (id: string, chosen: ChosenPath, note: string, now?: number) => void;
  updateNote: (id: string, note: string, now?: number) => void;
  deleteDecision: (id: string) => void;
  setProCache: (isPro: boolean) => void;
  clearAll: () => void;
};

export type ForkState = PersistedState & Actions & { hydrated: boolean };

const initial: PersistedState = {
  onboarded: false,
  decisions: [],
  explorations: [],
  proCache: false,
};

export const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const patch = (decisions: Decision[], id: string, fn: (d: Decision) => Decision) =>
  decisions.map((d) => (d.id === id ? fn(d) : d));

/** Keeps every saved decision plus only the newest few unsaved drafts. */
export function pruneDrafts(decisions: Decision[]): Decision[] {
  const drafts = decisions
    .filter((d) => !d.saved)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_UNSAVED_DRAFTS)
    .map((d) => d.id);
  const keep = new Set(drafts);
  return decisions.filter((d) => d.saved || keep.has(d.id));
}

export const useForkStore = create<ForkState>()(
  persist(
    (set, get) => ({
      ...initial,
      hydrated: false,

      completeOnboarding: () => set({ onboarded: true }),
      resetOnboarding: () => set({ onboarded: false }),

      createDecision: ({ input, analysis, source, depth, now = Date.now() }) => {
        const dims = availableDimensions(analysis.scenarios, FREE_DIMENSIONS);
        const decision: Decision = {
          id: newId(),
          createdAt: now,
          updatedAt: now,
          input,
          analysis,
          source,
          depth,
          selectedDimensions: dims.length ? dims : [...FREE_DIMENSIONS],
          viewedScenarioIds: [],
          chosen: null,
          note: '',
          saved: false,
        };
        set({ decisions: pruneDrafts([decision, ...get().decisions]) });
        return decision;
      },

      recordExploration: (now = Date.now()) =>
        set({ explorations: [...recentExplorations(get().explorations, now), now] }),

      markViewed: (id, scenarioId) =>
        set({
          decisions: patch(get().decisions, id, (d) =>
            d.viewedScenarioIds.includes(scenarioId)
              ? d
              : { ...d, viewedScenarioIds: [...d.viewedScenarioIds, scenarioId] },
          ),
        }),

      setDimensions: (id, dims) =>
        set({ decisions: patch(get().decisions, id, (d) => ({ ...d, selectedDimensions: dims })) }),

      saveDecision: (id, chosen, note, now = Date.now()) =>
        set({
          decisions: patch(get().decisions, id, (d) => ({
            ...d,
            chosen,
            note: note.trim(),
            saved: true,
            updatedAt: now,
          })),
        }),

      updateNote: (id, note, now = Date.now()) =>
        set({
          decisions: patch(get().decisions, id, (d) => ({ ...d, note: note.trim(), updatedAt: now })),
        }),

      deleteDecision: (id) => set({ decisions: get().decisions.filter((d) => d.id !== id) }),

      setProCache: (isPro) => set({ proCache: isPro }),

      clearAll: () => set({ ...initial }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ onboarded, decisions, explorations, proCache }) => ({
        onboarded,
        decisions,
        explorations,
        proCache,
      }),
      onRehydrateStorage: () => () => {
        useForkStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Pure helper — call inside useMemo, never as a zustand selector (it returns a new array). */
export const savedOf = (decisions: Decision[]) =>
  decisions.filter((d) => d.saved).sort((a, b) => b.updatedAt - a.updatedAt);

export const getDecision = (id: string | undefined) =>
  id ? useForkStore.getState().decisions.find((d) => d.id === id) : undefined;
