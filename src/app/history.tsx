import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DecisionRow } from '../components/DecisionRow';
import { ForkMark } from '../components/ForkMark';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { Button, ConfirmSheet, FadeIn, Header, IconButton, Screen, SectionLabel } from '../components/ui';
import { FREE_SAVED_DECISIONS } from '../domain/limits';
import type { Decision } from '../domain/types';
import { useProgress } from '../hooks/useProgress';
import { useSubscription } from '../services/revenuecat/SubscriptionProvider';
import { savedOf, useForkStore } from '../store/useForkStore';
import { alpha, colors, radius, space } from '../theme/tokens';

const WEEK = 7 * 24 * 3600 * 1000;

const REASONS = [
  { icon: 'history' as const, text: 'See why you chose what you chose, months later.' },
  { icon: 'branch' as const, text: 'Revisit the paths you didn’t take.' },
  { icon: 'spark' as const, text: 'Notice patterns in how you decide.' },
];

function EmptyJournal() {
  const t = useProgress(1200, 'empty-journal', 200);
  return (
    <FadeIn style={styles.empty}>
      <View style={styles.emptyMark}>
        <ForkMark size={72} progress={t} />
      </View>
      <Text variant="title" align="center">
        Your decision journal is empty
      </Text>
      <Text align="center">When you choose a path, keep it here with a note to your future self.</Text>
      <View style={styles.reasons}>
        {REASONS.map((r) => (
          <View key={r.text} style={styles.reason}>
            <Icon name={r.icon} size={16} color={colors.iris} />
            <Text variant="small" color={colors.text} style={styles.flex}>
              {r.text}
            </Text>
          </View>
        ))}
      </View>
      <Button label="Explore a decision" icon="arrow" onPress={() => router.replace('/new')} style={styles.emptyButton} />
    </FadeIn>
  );
}

export default function History() {
  const decisions = useForkStore((s) => s.decisions);
  const deleteDecision = useForkStore((s) => s.deleteDecision);
  const { isPro } = useSubscription();
  const saved = useMemo(() => savedOf(decisions), [decisions]);
  const [pendingDelete, setPendingDelete] = useState<Decision | null>(null);
  // Captured once so grouping stays stable while the screen is open.
  const [now] = useState(() => Date.now());
  const recent = saved.filter((d) => now - d.updatedAt < WEEK);
  const earlier = saved.filter((d) => now - d.updatedAt >= WEEK);

  const renderGroup = (title: string, items: Decision[]) =>
    items.length ? (
      <>
        <SectionLabel>{title}</SectionLabel>
        <View style={styles.list}>
          {items.map((d, i) => (
            <FadeIn key={d.id} delay={i * 50} style={styles.item}>
              <View style={styles.flex}>
                <DecisionRow decision={d} showNote onPress={() => router.push(`/decision/${d.id}`)} />
              </View>
              <IconButton icon="trash" label={`Delete ${d.analysis.decisionTitle}`} color={colors.textFaint} onPress={() => setPendingDelete(d)} />
            </FadeIn>
          ))}
        </View>
      </>
    ) : null;

  return (
    <Screen>
      <Header title="Journal" onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
      <Text variant="display" accessibilityRole="header" style={styles.title}>
        Decision journal
      </Text>
      <View style={styles.meta}>
        <Text variant="small">
          {saved.length} {saved.length === 1 ? 'decision' : 'decisions'} kept
        </Text>
        {!isPro ? (
          <View style={styles.capacity}>
            <Text variant="caption" color={saved.length >= FREE_SAVED_DECISIONS ? colors.gold : colors.textFaint}>
              {saved.length}/{FREE_SAVED_DECISIONS} on Free
            </Text>
          </View>
        ) : null}
      </View>

      {saved.length === 0 ? (
        <EmptyJournal />
      ) : (
        <>
          {renderGroup('This week', recent)}
          {renderGroup('Earlier', earlier)}
        </>
      )}

      <ConfirmSheet
        visible={pendingDelete !== null}
        title="Delete this decision?"
        body={pendingDelete ? `“${pendingDelete.analysis.decisionTitle}” and your note will be removed from this device.` : undefined}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteDecision(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginTop: space.xs },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  capacity: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  list: { gap: space.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  empty: { alignItems: 'center', gap: space.md, marginTop: space.xxl },
  emptyMark: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.iris, 0.08),
    borderWidth: 1,
    borderColor: alpha(colors.iris, 0.2),
    marginBottom: space.md,
  },
  reasons: {
    alignSelf: 'stretch',
    gap: space.md,
    padding: space.lg,
    marginTop: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  reason: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  emptyButton: { alignSelf: 'stretch', marginTop: space.md },
});
