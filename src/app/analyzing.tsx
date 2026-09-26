import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { ForkMark } from '../components/ForkMark';
import { Text } from '../components/Text';
import { Button, Screen, TextLink, haptic } from '../components/ui';
import { openSample } from '../features/openSample';
import { useProgress } from '../hooks/useProgress';
import { track } from '../services/analytics';
import { AnalysisError, ERROR_COPY, analyzeDecision, type AnalysisErrorKind } from '../services/ai/analyze';
import { usePending } from '../store/pending';
import { useForkStore } from '../store/useForkStore';
import { colors, pathColors, space } from '../theme/tokens';

// These describe what Fork is doing while it waits for the model. They rotate on a
// timer and never claim a specific step has finished; only "ready" is tied to the result.
const MESSAGES = ['Understanding your decision…', 'Finding the factors that matter…', 'Building possible paths…'];

type Phase = { kind: 'working' } | { kind: 'ready' } | { kind: 'error'; error: AnalysisErrorKind };

function GrowingMark({ cycle }: { cycle: number }) {
  const t = useProgress(1500, cycle);
  const colorsForCycle = [pathColors[cycle % 4], pathColors[(cycle + 1) % 4]];
  return <ForkMark size={112} progress={t} left={colorsForCycle[0]} right={colorsForCycle[1]} />;
}

export default function Analyzing() {
  const input = usePending((s) => s.input);
  const depth = usePending((s) => s.depth);
  const clearPending = usePending((s) => s.clear);
  const setDraft = usePending((s) => s.setDraft);
  const createDecision = useForkStore((s) => s.createDecision);
  const recordExploration = useForkStore((s) => s.recordExploration);

  const [phase, setPhase] = useState<Phase>({ kind: 'working' });
  const [message, setMessage] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const controller = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (!input) return;
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    setPhase({ kind: 'working' });
    setMessage(0);
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
      }, 700);
    } catch (e) {
      if (ac.signal.aborted) return;
      const kind = e instanceof AnalysisError ? e.kind : 'server';
      setPhase({ kind: 'error', error: kind });
    }
  }, [clearPending, createDecision, depth, input, recordExploration, setDraft]);

  useEffect(() => {
    if (!input) {
      router.replace('/home');
      return;
    }
    void run();
    return () => controller.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  useEffect(() => {
    if (phase.kind !== 'working') return;
    const timer = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setMessage((m) => Math.min(m + 1, MESSAGES.length - 1));
        Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    }, 2600);
    const grow = setInterval(() => setCycle((c) => c + 1), 1900);
    return () => {
      clearInterval(timer);
      clearInterval(grow);
    };
  }, [fade, phase.kind]);

  const cancel = () => {
    controller.current?.abort();
    router.back();
  };

  if (phase.kind === 'error') {
    const copy = ERROR_COPY[phase.error];
    const retryable = !['not_configured', 'refused', 'bad_request'].includes(phase.error);
    return (
      <Screen scroll={false} edges={['top', 'bottom']} contentStyle={styles.center}>
        <ForkMark size={72} left={colors.lineStrong} right={colors.lineStrong} />
        <Text variant="title" align="center" style={styles.errorTitle} accessibilityRole="header">
          {copy.title}
        </Text>
        <Text align="center" style={styles.errorBody}>
          {copy.body}
        </Text>
        <View style={styles.actions}>
          {retryable ? <Button label="Try again" onPress={() => setAttempt((a) => a + 1)} /> : null}
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
      </Screen>
    );
  }

  return (
    <Screen scroll={false} edges={['top', 'bottom']} contentStyle={styles.center}>
      <View style={styles.markWrap} accessibilityElementsHidden>
        {phase.kind === 'ready' ? <ForkMark size={112} /> : <GrowingMark cycle={cycle} />}
      </View>
      <Animated.View style={{ opacity: phase.kind === 'ready' ? 1 : fade }} accessibilityLiveRegion="polite">
        <Text variant="title" align="center">
          {phase.kind === 'ready' ? 'Your fork is ready.' : MESSAGES[message]}
        </Text>
      </Animated.View>
      {phase.kind === 'working' ? (
        <>
          <Text variant="small" align="center" style={styles.hint}>
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
  markWrap: { height: 140, justifyContent: 'center', marginBottom: space.xl },
  hint: { marginTop: space.md },
  cancel: { position: 'absolute', bottom: space.xl },
  errorTitle: { marginTop: space.xl },
  errorBody: { marginTop: space.sm, marginBottom: space.xl },
  actions: { alignSelf: 'stretch', gap: space.md },
});
