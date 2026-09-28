import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { ForkMark } from '../components/ForkMark';
import { ForkTree } from '../components/ForkTree';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { Button, FadeIn, Screen, TextLink, haptic } from '../components/ui';
import { openSample } from '../features/openSample';
import { useProgress } from '../hooks/useProgress';
import { track } from '../services/analytics';
import { AnalysisError, ERROR_COPY, analyzeDecision, type AnalysisErrorKind } from '../services/ai/analyze';
import { usePending } from '../store/pending';
import { useForkStore } from '../store/useForkStore';
import { MAX_CONTENT_WIDTH, alpha, colors, pathColor, radius, space } from '../theme/tokens';

// These describe what Fork is doing while it waits for the model. They advance on a
// timer and never claim a step has finished; only "ready" is tied to the real result.
const STAGES = ['Understanding your decision', 'Finding the variables that matter', 'Building possible paths'];
const STAGE_MS = 5000;

type Phase = { kind: 'working' } | { kind: 'ready' } | { kind: 'error'; error: AnalysisErrorKind };

const PLACEHOLDER = [
  { id: 'a', title: '' },
  { id: 'b', title: '' },
  { id: 'c', title: '' },
];

/** The fork grows and regrows while waiting — the product's own visual language, not a spinner. */
function GrowingFork({ cycle, width }: { cycle: number; width: number }) {
  const t = useProgress(1900, cycle);
  return <ForkTree width={width} bare progress={t} paths={PLACEHOLDER} />;
}

export default function Analyzing() {
  const input = usePending((s) => s.input);
  const depth = usePending((s) => s.depth);
  const clearPending = usePending((s) => s.clear);
  const setDraft = usePending((s) => s.setDraft);
  const createDecision = useForkStore((s) => s.createDecision);
  const recordExploration = useForkStore((s) => s.recordExploration);
  const { width: screenW } = useWindowDimensions();
  const treeW = Math.min(screenW, MAX_CONTENT_WIDTH) - space.xxxl * 2;

  const [phase, setPhase] = useState<Phase>({ kind: 'working' });
  const [stageIndex, setStageIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const controller = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (!input) return;
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    try {
      const analysis = await analyzeDecision(input, depth, { signal: ac.signal });
      if (ac.signal.aborted) return;
      setPhase({ kind: 'ready' });
      haptic.success();
      const decision = createDecision({ input, analysis, source: 'ai', depth });
      recordExploration();
      track('decision_generated', { paths: analysis.scenarios.length, depth });
      setTimeout(() => {
        clearPending();
        setDraft({ description: '' });
        router.replace(`/decision/${decision.id}`);
      }, 900);
    } catch (e) {
      if (ac.signal.aborted) return;
      setPhase({ kind: 'error', error: e instanceof AnalysisError ? e.kind : 'server' });
    }
  }, [clearPending, createDecision, depth, input, recordExploration, setDraft]);

  useEffect(() => {
    if (!input) {
      router.replace('/home');
      return;
    }
    // run() only sets state after awaiting the network, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run();
    return () => controller.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  useEffect(() => {
    if (phase.kind !== 'working') return;
    const stageTimer = setInterval(() => setStageIndex((s) => Math.min(s + 1, STAGES.length - 1)), STAGE_MS);
    const grow = setInterval(() => setCycle((c) => c + 1), 2600);
    return () => {
      clearInterval(stageTimer);
      clearInterval(grow);
    };
  }, [phase.kind]);

  const cancel = () => {
    controller.current?.abort();
    router.back();
  };

  if (phase.kind === 'error') {
    const copy = ERROR_COPY[phase.error];
    const retryable = !['not_configured', 'refused', 'bad_request'].includes(phase.error);
    return (
      <Screen scroll={false} edges={['top', 'bottom']} contentStyle={styles.center}>
        <FadeIn style={styles.errorWrap}>
          <View style={styles.errorIcon}>
            <Icon name={phase.error === 'offline' ? 'offline' : 'alert'} size={26} color={colors.danger} />
          </View>
          <Text variant="display" align="center" accessibilityRole="header">
            {copy.title}
          </Text>
          <Text align="center" style={styles.errorBody}>
            {copy.body}
          </Text>
          <View style={styles.actions}>
            {retryable ? (
              <Button
                label="Try again"
                onPress={() => {
                  setStageIndex(0);
                  setPhase({ kind: 'working' });
                  setAttempt((a) => a + 1);
                }}
              />
            ) : null}
            {phase.error === 'not_configured' ? (
              <Button
                label="Explore the sample decision"
                onPress={() => {
                  router.back();
                  openSample();
                }}
              />
            ) : null}
            <Button label="Edit description" variant="secondary" onPress={() => router.back()} />
          </View>
        </FadeIn>
      </Screen>
    );
  }

  const ready = phase.kind === 'ready';
  return (
    <Screen scroll={false} edges={['top', 'bottom']} contentStyle={styles.center}>
      <View style={styles.treeWrap} aria-hidden>
        {ready ? <ForkMark size={96} /> : <GrowingFork cycle={cycle} width={treeW} />}
      </View>

      <Text variant="display" align="center" accessibilityLiveRegion="polite" style={styles.headline}>
        {ready ? 'Your fork is ready.' : `${STAGES[stageIndex]}…`}
      </Text>
      {input ? (
        <Text variant="small" align="center" numberOfLines={2} style={styles.quote}>
          “{input.description}”
        </Text>
      ) : null}

      <View style={styles.steps}>
        {STAGES.map((s, i) => {
          const state = ready || i < stageIndex ? 'past' : i === stageIndex ? 'now' : 'next';
          return (
            <View key={s} style={styles.step}>
              <View
                style={[
                  styles.stepDot,
                  state === 'past' && { backgroundColor: pathColor(i), borderColor: pathColor(i) },
                  state === 'now' && { borderColor: pathColor(i) },
                ]}
              />
              <Text variant="small" color={state === 'next' ? colors.textFaint : colors.text}>
                {s}
              </Text>
            </View>
          );
        })}
      </View>

      {!ready ? (
        <>
          <Text variant="caption" align="center" style={styles.hint}>
            {depth === 'deep' ? 'Deeper exploration takes a little longer.' : 'This usually takes under a minute.'}
          </Text>
          <View style={styles.cancel}>
            <TextLink label="Cancel" onPress={cancel} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
  treeWrap: { height: 220, justifyContent: 'center', alignItems: 'center', marginBottom: space.lg },
  headline: { minHeight: 34 },
  quote: { marginTop: space.md, maxWidth: 320, fontStyle: 'italic' },
  steps: {
    marginTop: space.xl,
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignSelf: 'stretch',
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.lineStrong },
  hint: { marginTop: space.lg },
  cancel: { position: 'absolute', bottom: space.lg },
  errorWrap: { alignItems: 'center', alignSelf: 'stretch' },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.danger, 0.12),
    marginBottom: space.xl,
  },
  errorBody: { marginTop: space.sm, marginBottom: space.xl },
  actions: { alignSelf: 'stretch', gap: space.md },
});
