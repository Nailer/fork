import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ForkMark } from '../../../../components/ForkMark';
import { Icon, type IconName } from '../../../../components/Icon';
import { MissingDecision } from '../../../../components/Missing';
import { Text } from '../../../../components/Text';
import { Button, FadeIn, Header, LevelMeter, PathBadge, ProBadge, Screen, SectionLabel } from '../../../../components/ui';
import { LEVEL_LABEL } from '../../../../domain/dimensions';
import { PATH_LETTERS } from '../../../../domain/types';
import { useDecisionParam } from '../../../../hooks/useDecision';
import { track } from '../../../../services/analytics';
import { useSubscription } from '../../../../services/revenuecat/SubscriptionProvider';
import { useForkStore } from '../../../../store/useForkStore';
import { alpha, colors, elevation, pathColor, radius, space } from '../../../../theme/tokens';

function Timeline({ items, color }: { items: string[]; color: string }) {
  return (
    <View style={styles.timeline}>
      {items.map((item, i) => (
        <View key={item} style={styles.tlRow}>
          <View style={styles.tlRail}>
            <View style={[styles.tlDot, { borderColor: color, backgroundColor: i === 0 ? color : colors.bg }]} />
            {i < items.length - 1 ? <View style={[styles.tlLine, { backgroundColor: alpha(color, 0.35) }]} /> : null}
          </View>
          <Text variant="body" color={colors.text} style={styles.tlText}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** A titled group of short points with an icon marker — scannable instead of prose. */
function PointGroup({ title, icon, tint, items }: { title: string; icon: IconName; tint: string; items: string[] }) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHead}>
        <View style={[styles.groupIcon, { backgroundColor: alpha(tint, 0.14) }]}>
          <Icon name={icon} size={14} color={tint} strokeWidth={2.2} />
        </View>
        <Text variant="subheading" color={colors.text}>
          {title}
        </Text>
      </View>
      {items.map((item) => (
        <View key={item} style={styles.point}>
          <View style={[styles.pointDot, { backgroundColor: tint }]} />
          <Text variant="small" color={colors.text} style={styles.flex}>
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
  const nextIndex = (index + 1) % scenarios.length;
  const branches = scenario.branches ?? [];

  return (
    <Screen
      tint={color}
      footer={
        <View style={styles.footerRow}>
          {scenarios.length > 1 ? (
            <Button
              label={`Next: Path ${PATH_LETTERS[nextIndex]}`}
              variant="secondary"
              style={styles.flex}
              onPress={() => router.replace(`/decision/${decision.id}/path/${scenarios[nextIndex].id}`)}
            />
          ) : null}
          <Button label="Compare" icon="compare" style={styles.flex} onPress={() => router.push(`/decision/${decision.id}/compare`)} />
        </View>
      }
    >
      <Header title={decision.analysis.decisionTitle} />

      <FadeIn key={scenario.id}>
        <View style={styles.heroHead}>
          <PathBadge index={index} size={34} />
          <Text variant="label" color={color}>
            Path {PATH_LETTERS[index]} of {scenarios.length} · One possible path
          </Text>
        </View>
        <Text variant="display" accessibilityRole="header" style={styles.heroTitle}>
          {scenario.title}
        </Text>
        <Text style={styles.heroSummary}>{scenario.summary}</Text>

        <View style={[styles.uncertainty, { borderColor: alpha(color, 0.3) }]}>
          <View style={styles.flex}>
            <Text variant="caption">How uncertain is this path?</Text>
            <LevelMeter level={scenario.uncertaintyLevel} color={color} wide label={`${LEVEL_LABEL[scenario.uncertaintyLevel]} uncertainty`} />
          </View>
          <View style={styles.hinges}>
            <Text variant="caption">Hinges on</Text>
            <Text variant="small" color={colors.text} numberOfLines={2}>
              {scenario.importantVariables.slice(0, 2).join(' · ')}
            </Text>
          </View>
        </View>
      </FadeIn>

      <SectionLabel icon="bolt" color={color}>
        What changes immediately
      </SectionLabel>
      <Timeline items={scenario.immediateEffects} color={color} />

      <SectionLabel icon="swap">Weigh it up</SectionLabel>
      <View style={styles.card}>
        <PointGroup title="Potential upside" icon="up" tint={colors.success} items={scenario.benefits} />
        <View style={styles.sep} />
        <PointGroup title="Tradeoffs" icon="swap" tint={colors.warning} items={scenario.tradeoffs} />
        <View style={styles.sep} />
        <PointGroup title="What could go wrong" icon="alert" tint={colors.danger} items={scenario.risks} />
      </View>

      <SectionLabel icon="history">Over time</SectionLabel>
      <View style={styles.card}>
        {scenario.longerTermConsiderations.map((item) => (
          <View key={item} style={styles.point}>
            <Icon name="arrow" size={14} color={colors.textFaint} />
            <Text variant="small" color={colors.text} style={styles.flex}>
              {item}
            </Text>
          </View>
        ))}
      </View>

      <SectionLabel icon="layers">What this path rests on</SectionLabel>
      <View style={[styles.assumptions, { borderColor: alpha(color, 0.4) }]}>
        <Text variant="caption">This path assumes…</Text>
        {scenario.assumptions.map((a) => (
          <Text key={a} variant="body" color={colors.text}>
            {a}
          </Text>
        ))}
        <View style={styles.sep} />
        <Text variant="caption">Uncertain</Text>
        {scenario.uncertainty.map((u) => (
          <Text key={u} variant="small" style={styles.italic}>
            {u}
          </Text>
        ))}
        <View style={styles.sep} />
        <Text variant="caption">What would change this path</Text>
        {scenario.whatWouldChange.map((w) => (
          <Text key={w} variant="small" color={colors.text}>
            {w}
          </Text>
        ))}
      </View>

      <SectionLabel icon="branch" right={!isPro && branches.length ? <ProBadge /> : undefined}>
        Where this path could split
      </SectionLabel>
      {branches.length === 0 ? (
        <Text variant="small">
          {isPro
            ? 'This exploration was built at standard depth. New decisions you explore with Fork Pro show where each path could split.'
            : 'With Fork Pro, every path shows the two ways it could split once you’re on it.'}
        </Text>
      ) : isPro ? (
        <View style={styles.branches}>
          {branches.map((b, k) => (
            <View key={b.label} style={[styles.branch, { borderColor: alpha(color, 0.3) }]}>
              <ForkMark size={26} left={k === 0 ? color : colors.lineStrong} right={k === 1 ? color : colors.lineStrong} />
              <View style={styles.flex}>
                <Text variant="subheading" color={colors.text}>
                  {b.label}
                </Text>
                <Text variant="caption">{b.condition}</Text>
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
          <View style={styles.lockedRow}>
            <Icon name="lock" size={16} color={colors.gold} />
            <Text variant="subheading" color={colors.text}>
              {branches.length} possible next splits
            </Text>
          </View>
          <Text variant="small">See what happens if this path goes well — and if it doesn’t.</Text>
          <Text variant="small" color={colors.gold}>
            Unlock with Fork Pro →
          </Text>
        </Pressable>
      )}

      <SectionLabel icon="question">Questions worth answering</SectionLabel>
      <View style={styles.questions}>
        {scenario.questionsToConsider.map((q, i) => (
          <View key={q} style={styles.question}>
            <Text variant="caption" color={color}>
              {String(i + 1).padStart(2, '0')}
            </Text>
            <Text variant="body" color={colors.text} style={styles.flex}>
              {q}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  italic: { fontStyle: 'italic' },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.xs },
  heroTitle: { marginTop: space.md },
  heroSummary: { marginTop: space.sm },
  uncertainty: {
    marginTop: space.lg,
    flexDirection: 'row',
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  hinges: { flex: 1, gap: space.xs },
  timeline: { paddingLeft: space.xs },
  tlRow: { flexDirection: 'row', gap: space.md },
  tlRail: { width: 14, alignItems: 'center' },
  tlDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginTop: 6 },
  tlLine: { width: 2, flex: 1, marginVertical: 3 },
  tlText: { flex: 1, paddingBottom: space.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: space.md,
    ...elevation.card,
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: space.xs },
  group: { gap: space.sm },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.xxs },
  groupIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  point: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  pointDot: { width: 5, height: 5, borderRadius: 3, marginTop: 8, marginLeft: 10, marginRight: 2 },
  assumptions: { padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', gap: space.sm },
  branches: { gap: space.md },
  branch: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  branchOutcome: { marginTop: space.xs },
  locked: {
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: alpha(colors.gold, 0.45),
    backgroundColor: alpha(colors.gold, 0.05),
    gap: space.sm,
  },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  questions: { gap: space.md },
  question: { flexDirection: 'row', gap: space.md, alignItems: 'baseline' },
  footerRow: { flexDirection: 'row', gap: space.md },
});
