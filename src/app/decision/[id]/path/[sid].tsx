import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ForkMark } from '../../../../components/ForkMark';
import { Icon } from '../../../../components/Icon';
import { MissingDecision } from '../../../../components/Missing';
import { Text } from '../../../../components/Text';
import { Button, Chip, Header, PathBadge, ProBadge, Screen, SectionLabel } from '../../../../components/ui';
import { LEVEL_LABEL } from '../../../../domain/dimensions';
import { PATH_LETTERS } from '../../../../domain/types';
import { useDecisionParam } from '../../../../hooks/useDecision';
import { track } from '../../../../services/analytics';
import { useSubscription } from '../../../../services/revenuecat/SubscriptionProvider';
import { useForkStore } from '../../../../store/useForkStore';
import { colors, pathColor, radius, space } from '../../../../theme/tokens';

function Timeline({ items, color }: { items: string[]; color: string }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={item} style={styles.tlRow}>
          <View style={styles.tlRail}>
            <View style={[styles.tlDot, { borderColor: color }]} />
            {i < items.length - 1 ? <View style={[styles.tlLine, { backgroundColor: color + '55' }]} /> : null}
          </View>
          <Text variant="body" color={colors.text} style={styles.tlText}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function List({ items, marker }: { items: string[]; marker: string }) {
  return (
    <View style={styles.listCard}>
      {items.map((item) => (
        <View key={item} style={styles.listRow}>
          <Text variant="bodyStrong" color={colors.textFaint} style={styles.marker}>
            {marker}
          </Text>
          <Text variant="body" color={colors.text} style={styles.flex}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function PathDetail() {
  const { id, sid, decision } = useDecisionParam();
  const markViewed = useForkStore((s) => s.markViewed);
  const { isPro } = useSubscription();
  const index = decision?.analysis.scenarios.findIndex((s) => s.id === sid) ?? -1;

  useEffect(() => {
    if (id && sid && index >= 0) {
      markViewed(id, sid);
      track('scenario_opened', { index });
    }
  }, [id, sid, index, markViewed]);

  if (!decision || index < 0) return <MissingDecision />;

  const scenario = decision.analysis.scenarios[index];
  const color = pathColor(index);
  const scenarios = decision.analysis.scenarios;
  const next = scenarios[(index + 1) % scenarios.length];
  const branches = scenario.branches ?? [];

  return (
    <Screen
      footer={
        <View style={styles.footerRow}>
          {scenarios.length > 1 ? (
            <Button
              label={`Path ${PATH_LETTERS[(index + 1) % scenarios.length]}`}
              variant="secondary"
              style={styles.flex}
              onPress={() => router.replace(`/decision/${decision.id}/path/${next.id}`)}
            />
          ) : null}
          <Button label="Compare paths" style={styles.flex} onPress={() => router.push(`/decision/${decision.id}/compare`)} />
        </View>
      }
    >
      <Header title={decision.analysis.decisionTitle} />

      <View style={[styles.hero, { borderColor: color + '55' }]}>
        <View style={[styles.heroGlow, { backgroundColor: color }]} />
        <View style={styles.heroHead}>
          <PathBadge index={index} size={36} />
          <Text variant="label" color={color}>
            Path {PATH_LETTERS[index]} · One possible path
          </Text>
        </View>
        <Text variant="display" accessibilityRole="header">
          {scenario.title}
        </Text>
        <Text style={styles.heroSummary}>{scenario.summary}</Text>
        <View style={styles.chips}>
          <Chip label={`Uncertainty: ${LEVEL_LABEL[scenario.uncertaintyLevel]}`} />
          {scenario.importantVariables.slice(0, 3).map((v) => (
            <Chip key={v} label={v} />
          ))}
        </View>
      </View>

      <SectionLabel>What changes immediately</SectionLabel>
      <Timeline items={scenario.immediateEffects} color={color} />

      <SectionLabel>Potential upside</SectionLabel>
      <List items={scenario.benefits} marker="+" />

      <SectionLabel>Tradeoffs</SectionLabel>
      <List items={scenario.tradeoffs} marker="⇄" />

      <SectionLabel>What could go wrong</SectionLabel>
      <List items={scenario.risks} marker="!" />

      <SectionLabel>Over time</SectionLabel>
      <List items={scenario.longerTermConsiderations} marker="→" />

      <SectionLabel>This path assumes</SectionLabel>
      <View style={[styles.assumptions, { borderColor: color + '44' }]}>
        {scenario.assumptions.map((a) => (
          <Text key={a} variant="body" color={colors.text} style={styles.assumption}>
            {a}
          </Text>
        ))}
        {scenario.uncertainty.map((u) => (
          <Text key={u} variant="small" style={styles.uncertainty}>
            Uncertain: {u}
          </Text>
        ))}
      </View>

      <SectionLabel>What would change this path</SectionLabel>
      <List items={scenario.whatWouldChange} marker="?" />

      <SectionLabel right={!isPro && branches.length ? <ProBadge /> : undefined}>Where this path could split</SectionLabel>
      {branches.length === 0 ? (
        <Text variant="small">
          {isPro
            ? 'This exploration was built at standard depth. New decisions you explore with Fork Pro include where each path could split.'
            : 'With Fork Pro, every path shows the two ways it could split once you’re on it.'}
        </Text>
      ) : isPro ? (
        <View style={styles.branches}>
          {branches.map((b, k) => (
            <View key={b.label} style={[styles.branch, { borderColor: color + '44' }]}>
              <ForkMark size={28} left={k === 0 ? color : colors.lineStrong} right={k === 1 ? color : colors.lineStrong} />
              <View style={styles.flex}>
                <Text variant="bodyStrong">{b.label}</Text>
                <Text variant="small" color={colors.textFaint}>
                  {b.condition}
                </Text>
                <Text variant="small" color={colors.text} style={styles.branchOutcome}>
                  {b.outcome}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Pressable
          onPress={() => router.push({ pathname: '/paywall', params: { reason: 'depth' } })}
          accessibilityRole="button"
          accessibilityLabel="Unlock where this path could split with Fork Pro"
          style={({ pressed }) => [styles.locked, pressed && { opacity: 0.8 }]}
        >
          {branches.map((b) => (
            <View key={b.label} style={styles.lockedRow}>
              <Icon name="lock" size={16} color={colors.gold} />
              <Text variant="bodyStrong" color={colors.textDim}>
                {b.label}
              </Text>
            </View>
          ))}
          <Text variant="small" color={colors.gold}>
            Unlock deeper exploration with Fork Pro
          </Text>
        </Pressable>
      )}

      <SectionLabel>Questions to consider</SectionLabel>
      <List items={scenario.questionsToConsider} marker="·" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    marginTop: space.sm,
    padding: space.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    gap: space.md,
  },
  heroGlow: { position: 'absolute', top: -120, right: -120, width: 240, height: 240, borderRadius: 120, opacity: 0.12 },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  heroSummary: {},
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tlRow: { flexDirection: 'row', gap: space.md },
  tlRail: { width: 14, alignItems: 'center' },
  tlDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginTop: 6, backgroundColor: colors.bg },
  tlLine: { width: 2, flex: 1, marginVertical: 2 },
  tlText: { flex: 1, paddingBottom: space.lg },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: space.md,
  },
  listRow: { flexDirection: 'row', gap: space.md },
  marker: { width: 16, textAlign: 'center' },
  assumptions: { padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', gap: space.sm },
  assumption: {},
  uncertainty: { fontStyle: 'italic' },
  branches: { gap: space.md },
  branch: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  branchOutcome: { marginTop: space.xs },
  locked: {
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gold + '55',
    backgroundColor: colors.surface,
    gap: space.md,
  },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  footerRow: { flexDirection: 'row', gap: space.md },
});
