import { router } from 'expo-router';

import { canExplore, depthFor } from '../domain/limits';
import type { DecisionInput } from '../domain/types';
import { track } from '../services/analytics';
import { usePending } from '../store/pending';
import { useForkStore } from '../store/useForkStore';

export const MIN_DESCRIPTION = 8;

export function cleanInput(input: DecisionInput): DecisionInput {
  return {
    description: input.description.trim(),
    priorities: input.priorities?.trim() || undefined,
    budget: input.budget?.trim() || undefined,
    timeHorizon: input.timeHorizon?.trim() || undefined,
  };
}

/**
 * Starts a new exploration from any screen: enforces the free weekly limit
 * (routing to the paywall) and hands the request to the analysis screen.
 */
export function startExploration(raw: DecisionInput, isPro: boolean) {
  const input = cleanInput(raw);
  if (input.description.length < MIN_DESCRIPTION) return false;
  if (!canExplore(useForkStore.getState().explorations, isPro)) {
    router.push({ pathname: '/paywall', params: { reason: 'limit' } });
    return false;
  }
  track('decision_started', { withContext: Boolean(input.priorities || input.budget || input.timeHorizon) });
  usePending.getState().setPending(input, depthFor(isPro));
  router.push('/analyzing');
  return true;
}
