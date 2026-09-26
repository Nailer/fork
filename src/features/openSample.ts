import { router } from 'expo-router';

import { SAMPLE_ANALYSIS, SAMPLE_INPUT } from '../domain/sample';
import { track } from '../services/analytics';
import { useForkStore } from '../store/useForkStore';

/** Opens the bundled sample decision. It is labelled "Sample" and never uses an exploration. */
export function openSample() {
  const decision = useForkStore.getState().createDecision({
    input: SAMPLE_INPUT,
    analysis: SAMPLE_ANALYSIS,
    source: 'sample',
    depth: 'deep',
  });
  track('sample_opened');
  router.push(`/decision/${decision.id}`);
}
