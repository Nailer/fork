import AsyncStorage from '@react-native-async-storage/async-storage';

import { SAMPLE_ANALYSIS, SAMPLE_INPUT } from '../domain/sample';
import { STORAGE_KEY, pruneDrafts, savedOf, useForkStore } from '../store/useForkStore';

const create = (now: number) =>
  useForkStore.getState().createDecision({ input: SAMPLE_INPUT, analysis: SAMPLE_ANALYSIS, source: 'ai', depth: 'standard', now });

beforeEach(async () => {
  useForkStore.getState().clearAll();
  await AsyncStorage.clear();
});

describe('decision store', () => {
  it('creates a decision with free comparison dimensions preselected', () => {
    const d = create(1000);
    expect(d.saved).toBe(false);
    expect(d.selectedDimensions).toEqual(['cost', 'time', 'flexibility', 'risk']);
    expect(useForkStore.getState().decisions[0].id).toBe(d.id);
  });

  it('saves the chosen path, note and timestamp', () => {
    const d = create(1000);
    useForkStore.getState().saveDecision(d.id, { kind: 'scenario', scenarioId: 'keep-a-year' }, '  Money is tight  ', 2000);
    const saved = useForkStore.getState().decisions.find((x) => x.id === d.id)!;
    expect(saved).toMatchObject({ saved: true, note: 'Money is tight', updatedAt: 2000 });
    expect(saved.chosen).toEqual({ kind: 'scenario', scenarioId: 'keep-a-year' });
  });

  it('supports "still deciding", note updates and deletion', () => {
    const d = create(1000);
    const s = useForkStore.getState();
    s.saveDecision(d.id, { kind: 'undecided' }, '', 1500);
    s.updateNote(d.id, 'Waiting on a quote', 1600);
    expect(useForkStore.getState().decisions[0]).toMatchObject({ note: 'Waiting on a quote', chosen: { kind: 'undecided' } });
    s.deleteDecision(d.id);
    expect(useForkStore.getState().decisions).toHaveLength(0);
  });

  it('tracks which paths were opened, once each', () => {
    const d = create(1000);
    useForkStore.getState().markViewed(d.id, 'buy-now');
    useForkStore.getState().markViewed(d.id, 'buy-now');
    expect(useForkStore.getState().decisions[0].viewedScenarioIds).toEqual(['buy-now']);
  });

  it('records explorations in a rolling window', () => {
    const now = Date.now();
    useForkStore.setState({ explorations: [now - 8 * 24 * 3600 * 1000] });
    useForkStore.getState().recordExploration(now);
    expect(useForkStore.getState().explorations).toEqual([now]);
  });

  it('keeps every saved decision but only the newest few drafts', () => {
    const kept = create(1);
    useForkStore.getState().saveDecision(kept.id, { kind: 'undecided' }, '', 10);
    [2, 3, 4, 5, 6].forEach((t) => create(t));
    const decisions = pruneDrafts(useForkStore.getState().decisions);
    expect(decisions.find((d) => d.id === kept.id)?.saved).toBe(true);
    expect(decisions.filter((d) => !d.saved)).toHaveLength(3);
    expect(savedOf(decisions)).toHaveLength(1);
  });

  it('persists to local storage and can wipe everything', async () => {
    const d = create(1000);
    useForkStore.getState().saveDecision(d.id, { kind: 'undecided' }, 'note', 1100);
    await new Promise((r) => setTimeout(r, 0));
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).toContain(d.id);
    expect(JSON.parse(raw!).state).not.toHaveProperty('hydrated');

    useForkStore.getState().clearAll();
    await new Promise((r) => setTimeout(r, 0));
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!).state.decisions).toEqual([]);
  });
});
