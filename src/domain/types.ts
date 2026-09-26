import type { DecisionAnalysis, DimensionKey } from './schema';

export type DecisionInput = {
  description: string;
  priorities?: string;
  budget?: string;
  timeHorizon?: string;
};

export type AnalysisDepth = 'standard' | 'deep';

/** 'ai' = generated live, 'sample' = the bundled example decision (clearly labelled in the UI). */
export type DecisionSource = 'ai' | 'sample';

export type ChosenPath = { kind: 'scenario'; scenarioId: string } | { kind: 'undecided' };

export type Decision = {
  id: string;
  createdAt: number;
  updatedAt: number;
  input: DecisionInput;
  analysis: DecisionAnalysis;
  source: DecisionSource;
  depth: AnalysisDepth;
  selectedDimensions: DimensionKey[];
  viewedScenarioIds: string[];
  chosen: ChosenPath | null;
  note: string;
  saved: boolean;
};

export const PATH_LETTERS = ['A', 'B', 'C', 'D'] as const;
