import { useNetInfo } from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { DecisionRow } from '../components/DecisionRow';
import { ForkMark } from '../components/ForkMark';
import { ForkTree } from '../components/ForkTree';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { FadeIn, IconButton, ProBadge, Screen, SectionLabel, TextLink, haptic } from '../components/ui';
import { FREE_WEEKLY_EXPLORATIONS, remainingExplorations } from '../domain/limits';
import { MIN_DESCRIPTION, startExploration } from '../features/explore';
import { openSample } from '../features/openSample';
import { useProgress } from '../hooks/useProgress';
import { config } from '../services/config';
import { useSubscription } from '../services/revenuecat/SubscriptionProvider';
import { usePending } from '../store/pending';
import { savedOf, useForkStore } from '../store/useForkStore';
import { alpha, colors, elevation, fonts, pathColor, radius, space } from '../theme/tokens';
import { webNoOutline } from '../theme/web';

const EXAMPLES = [
  { label: 'Buy now or wait?', text: 'Should I buy a new laptop now or keep my current one for another year?' },
  { label: 'Take the offer?', text: 'I’ve been offered a job at a startup. Should I take it or stay at my stable job?' },
  { label: 'Weekend plans', text: 'Should I spend this weekend studying for exams or building my side project?' },
  { label: 'Move cities?', text: 'Should I move to a new city for more opportunities or stay close to family?' },
];

/** The full-size tree geometry, scaled down — small widths would crowd the nodes. */
function SamplePreview() {
  const t = useProgress(1400, 'home-sample', 400);
  return (
    <View style={styles.previewBox} aria-hidden>
      <View style={styles.previewScale}>
        <ForkTree
          width={240}
          bare
          progress={t}
          paths={[
            { id: 'a', title: '' },
            { id: 'b', title: '' },
            { id: 'c', title: '' },
          ]}
        />
      </View>
    </View>
  );
}

export default function Home() {
  const { isPro } = useSubscription();
  const decisions = useForkStore((s) => s.decisions);
  const explorations = useForkStore((s) => s.explorations);
  const draft = usePending((s) => s.draft);
  const setDraft = usePending((s) => s.setDraft);
  const saved = useMemo(() => savedOf(decisions), [decisions]);
  const remaining = remainingExplorations(explorations, isPro);
  const [focused, setFocused] = useState(false);
  const net = useNetInfo();
  // On web, NetInfo may probe the GitHub Pages account root (e.g. /) rather
  // than this project path (/fork/). That root can legitimately return 404 and
  // must not be treated as an offline signal. Use the browser's native online
  // status on web, while keeping NetInfo reachability checks for native apps.
  const offline =
    Platform.OS === 'web'
      ? typeof navigator !== 'undefined' && navigator.onLine === false
      : net.isConnected === false || net.isInternetReachable === false;

  const text = draft.description;
  const ready = text.trim().length >= MIN_DESCRIPTION;
  const aiReady = Boolean(config.aiUrl);

  const submit = () => {
    if (!ready) return;
    if (offline || !aiReady || remaining === 0) {
      // The create screen explains what's wrong and offers the right next step.
      router.push('/new');
      return;
    }
    startExploration(draft, isPro);
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <ForkMark size={24} />
          <Text variant="title" style={styles.wordmark}>
            Fork
          </Text>
          {isPro ? <ProBadge /> : null}
        </View>
        <View style={styles.topActions}>
          <IconButton icon="history" label="Decision journal" onPress={() => router.push('/history')} framed />
          <IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} framed />
        </View>
      </View>

      <FadeIn style={styles.hero}>
        <Text variant="hero" accessibilityRole="header">
          Don’t ask what to choose.
        </Text>
        <Text variant="hero" color={colors.textDim} style={styles.heroItalic}>
          Explore what each choice changes.
        </Text>
      </FadeIn>

      <FadeIn delay={120}>
        <View style={[styles.composer, focused && styles.composerFocused]}>
          <Text variant="label" color={colors.iris}>
            What’s on your mind?
          </Text>
          <TextInput
            value={text}
            onChangeText={(v) => setDraft({ ...draft, description: v.slice(0, 2000) })}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Describe a decision you’re weighing…"
            placeholderTextColor={colors.textFaint}
            multiline
            textAlignVertical="top"
            style={styles.input}
            accessibilityLabel="Describe a decision"
            maxLength={2000}
          />
          <View style={styles.composerFoot}>
            <Pressable
              onPress={() => (isPro ? undefined : router.push({ pathname: '/paywall', params: { reason: 'upgrade' } }))}
              disabled={isPro}
              accessibilityRole={isPro ? 'text' : 'button'}
              accessibilityLabel={
                isPro
                  ? 'Fork Pro. Unlimited explorations.'
                  : `${remaining} of ${FREE_WEEKLY_EXPLORATIONS} free explorations left this week. Opens Fork Pro.`
              }
              style={styles.allowance}
              hitSlop={6}
            >
              {isPro ? (
                <>
                  <Icon name="infinity" size={16} color={colors.gold} />
                  <Text variant="caption" color={colors.gold}>
                    Unlimited
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.pips}>
                    {Array.from({ length: FREE_WEEKLY_EXPLORATIONS }).map((_, i) => (
                      <View key={i} style={[styles.pip, i < remaining && styles.pipOn]} />
                    ))}
                  </View>
                  <Text variant="caption" numberOfLines={1}>
                    {remaining} left this week
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                haptic.impact();
                submit();
              }}
              disabled={!ready}
              accessibilityRole="button"
              accessibilityLabel="Build my paths"
              accessibilityState={{ disabled: !ready }}
              style={({ pressed }) => [styles.go, !ready && styles.goDisabled, pressed && styles.pressed]}
            >
              <Text variant="button" color={colors.bg}>
                Build my paths
              </Text>
              <Icon name="arrow" size={17} color={colors.bg} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
        <View style={styles.contextLink}>
          <TextLink label="Add budget, priorities or timeframe" onPress={() => router.push('/new')} />
        </View>
      </FadeIn>

      <FadeIn delay={220}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.examples}
          style={styles.examplesWrap}
          keyboardShouldPersistTaps="handled"
        >
          {EXAMPLES.map((e, i) => (
            <Pressable
              key={e.label}
              onPress={() => {
                haptic.tap();
                setDraft({ description: e.text });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Example: ${e.text}`}
              style={({ pressed }) => [styles.example, pressed && styles.pressed]}
            >
              <View style={[styles.exampleDot, { backgroundColor: pathColor(i) }]} />
              <Text variant="small" color={colors.text} style={styles.exampleText}>
                {e.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </FadeIn>

      <FadeIn delay={300}>
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
            <View style={styles.sampleCta}>
              <Text variant="small">Explore a sample fork</Text>
              <Icon name="arrow" size={15} color={colors.textDim} />
            </View>
          </View>
          <SamplePreview />
        </Pressable>
      </FadeIn>

      {!isPro ? (
        <Pressable
          onPress={() => router.push({ pathname: '/paywall', params: { reason: 'upgrade' } })}
          accessibilityRole="button"
          accessibilityLabel="Fork Pro: unlimited explorations and deeper paths"
          style={({ pressed }) => [styles.pro, pressed && styles.pressed]}
        >
          <View style={styles.proIcon}>
            <Icon name="spark" size={18} color={colors.gold} />
          </View>
          <View style={styles.flex}>
            <Text variant="subheading" color={colors.text}>
              Fork Pro
            </Text>
            <Text variant="caption">Unlimited explorations, deeper paths, full journal</Text>
          </View>
          <Icon name="arrow" size={18} color={colors.gold} />
        </Pressable>
      ) : null}

      <SectionLabel right={saved.length > 3 ? <TextLink label="See all" onPress={() => router.push('/history')} /> : undefined}>
        Recent decisions
      </SectionLabel>
      {saved.length === 0 ? (
        <View style={styles.emptyRecent}>
          <Icon name="history" size={18} color={colors.textFaint} />
          <Text variant="small" style={styles.flex}>
            Decisions you keep appear here, with the path you leaned toward and why.
          </Text>
        </View>
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
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.sm },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  wordmark: { marginRight: space.xs },
  topActions: { flexDirection: 'row', gap: space.sm },
  hero: { marginTop: space.xl, marginBottom: space.xl },
  heroItalic: { fontFamily: fonts.displayItalic },
  composer: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    padding: space.lg,
    gap: space.sm,
    ...elevation.raised,
  },
  composerFocused: { borderColor: alpha(colors.iris, 0.6) },
  input: {
    ...webNoOutline,
    minHeight: 92,
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 26,
    color: colors.text,
    paddingVertical: space.xs,
  },
  composerFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  allowance: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 36, flexShrink: 1 },
  pips: { flexDirection: 'row', gap: 4 },
  pip: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lineStrong },
  pipOn: { backgroundColor: colors.text },
  go: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    minHeight: 46,
    paddingHorizontal: space.lg,
  },
  goDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  contextLink: { alignItems: 'flex-start', marginTop: space.xs },
  examplesWrap: { marginHorizontal: -space.xl, marginTop: space.sm },
  examples: { paddingHorizontal: space.xl, gap: space.sm },
  example: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 40,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: alpha('#FFFFFF', 0.03),
  },
  exampleDot: { width: 7, height: 7, borderRadius: 4 },
  exampleText: { fontFamily: fonts.medium },
  sample: {
    marginTop: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    paddingRight: space.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  sampleText: { flex: 1, gap: space.xs },
  previewBox: { width: 116, height: 116, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  previewScale: { width: 240, height: 232, transform: [{ scale: 0.5 }] },
  sampleCta: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs },
  pro: {
    marginTop: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: alpha(colors.gold, 0.3),
    backgroundColor: alpha(colors.gold, 0.06),
  },
  proIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.gold, 0.14),
  },
  emptyRecent: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
  },
  list: { gap: space.md },
});
