import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DecisionRow } from '../components/DecisionRow';
import { ForkMark } from '../components/ForkMark';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { Button, IconButton, ProBadge, Screen, SectionLabel, TextLink, haptic } from '../components/ui';
import { FREE_WEEKLY_EXPLORATIONS, remainingExplorations } from '../domain/limits';
import { openSample } from '../features/openSample';
import { useSubscription } from '../services/revenuecat/SubscriptionProvider';
import { usePending } from '../store/pending';
import { savedOf, useForkStore } from '../store/useForkStore';
import { colors, fonts, pathColor, radius, space } from '../theme/tokens';

const PROMPTS = [
  { label: 'Should I buy this?', starter: 'I’m deciding whether to buy ' },
  { label: 'Should I take this opportunity?', starter: 'I’ve been offered ' },
  { label: 'How should I spend my weekend?', starter: 'This weekend I could either ' },
  { label: 'Should I wait or act now?', starter: 'I’m not sure whether to act now or wait on ' },
];

export default function Home() {
  const { isPro } = useSubscription();
  const decisions = useForkStore((s) => s.decisions);
  const explorations = useForkStore((s) => s.explorations);
  const setDraft = usePending((s) => s.setDraft);
  const saved = useMemo(() => savedOf(decisions), [decisions]);
  const remaining = remainingExplorations(explorations, isPro);

  const startWith = (starter?: string) => {
    if (starter) setDraft({ description: starter });
    router.push('/new');
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <ForkMark size={26} />
          <Text variant="title" style={styles.wordmark}>
            Fork
          </Text>
          {isPro ? <ProBadge /> : null}
        </View>
        <View style={styles.topActions}>
          <IconButton icon="history" label="Decision history" onPress={() => router.push('/history')} />
          <IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />
        </View>
      </View>

      <View style={styles.hero}>
        <Text variant="hero" accessibilityRole="header">
          What’s on your mind?
        </Text>
        <Text style={styles.heroBody}>Turn a difficult decision into a set of paths you can explore.</Text>
      </View>

      <Button label="Explore a decision" icon="arrow" onPress={() => startWith()} />

      <Pressable
        onPress={() => (isPro ? undefined : router.push({ pathname: '/paywall', params: { reason: 'upgrade' } }))}
        disabled={isPro}
        accessibilityRole={isPro ? 'text' : 'button'}
        accessibilityLabel={
          isPro
            ? 'Fork Pro. Unlimited explorations.'
            : `${remaining} of ${FREE_WEEKLY_EXPLORATIONS} free explorations left this week. Tap to see Fork Pro.`
        }
        style={styles.allowance}
      >
        {isPro ? (
          <Text variant="small" color={colors.gold}>
            Fork Pro · Unlimited explorations
          </Text>
        ) : (
          <>
            <View style={styles.pips}>
              {Array.from({ length: FREE_WEEKLY_EXPLORATIONS }).map((_, i) => (
                <View key={i} style={[styles.pip, i < remaining && styles.pipOn]} />
              ))}
            </View>
            <Text variant="small">
              {remaining} of {FREE_WEEKLY_EXPLORATIONS} free explorations left this week
            </Text>
          </>
        )}
      </Pressable>

      <SectionLabel>Start from a prompt</SectionLabel>
      <View style={styles.grid}>
        {PROMPTS.map((p, i) => (
          <Pressable
            key={p.label}
            onPress={() => {
              haptic.tap();
              startWith(p.starter);
            }}
            accessibilityRole="button"
            accessibilityLabel={p.label}
            style={({ pressed }) => [styles.prompt, pressed && styles.pressed]}
          >
            <View style={[styles.promptDot, { backgroundColor: pathColor(i) }]} />
            <Text variant="bodyStrong" style={styles.promptText}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={openSample}
        accessibilityRole="button"
        accessibilityLabel="See an example fork: new laptop now or one more year. Sample decision."
        style={({ pressed }) => [styles.sample, pressed && styles.pressed]}
      >
        <View style={styles.sampleText}>
          <Text variant="label" color={colors.gold}>
            See an example
          </Text>
          <Text variant="title">New laptop now, or one more year?</Text>
          <Text variant="small">A sample fork you can explore freely — no allowance used.</Text>
        </View>
        <Icon name="arrow" color={colors.text} />
      </Pressable>

      <SectionLabel right={saved.length > 3 ? <TextLink label="See all" onPress={() => router.push('/history')} /> : undefined}>
        Your decisions
      </SectionLabel>
      {saved.length === 0 ? (
        <Text variant="small">Decisions you keep will live here, so you can revisit why you chose what you chose.</Text>
      ) : (
        <View style={styles.list}>
          {saved.slice(0, 3).map((d) => (
            <DecisionRow key={d.id} decision={d} onPress={() => router.push(`/decision/${d.id}`)} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.sm },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  wordmark: { marginRight: space.xs },
  topActions: { flexDirection: 'row', marginRight: -space.sm },
  hero: { marginTop: space.xxl, marginBottom: space.xl, gap: space.md },
  heroBody: { fontSize: 18, lineHeight: 27 },
  allowance: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md, alignSelf: 'center', minHeight: 32 },
  pips: { flexDirection: 'row', gap: 4 },
  pip: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lineStrong },
  pipOn: { backgroundColor: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  prompt: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 96,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'space-between',
    gap: space.md,
  },
  promptDot: { width: 10, height: 10, borderRadius: 5 },
  promptText: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  pressed: { opacity: 0.75 },
  sample: {
    marginTop: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gold + '55',
    backgroundColor: colors.raised,
  },
  sampleText: { flex: 1, gap: space.xs },
  list: { gap: space.md },
});
