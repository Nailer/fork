import { router } from 'expo-router';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { leaningLabel } from '../../../components/DecisionRow';
import { ForkTree } from '../../../components/ForkTree';
import { Icon } from '../../../components/Icon';
import { MissingDecision } from '../../../components/Missing';
import { Text } from '../../../components/Text';
import { Banner, Button, Chip, Header, PathBadge, ProBadge, Screen, SectionLabel } from '../../../components/ui';
import { DIMENSIONS, LEVEL_LABEL } from '../../../domain/dimensions';
import { ratingFor } from '../../../domain/compare';
import type { DimensionKey, Scenario } from '../../../domain/schema';
import { useDecisionParam } from '../../../hooks/useDecision';
import { useProgress } from '../../../hooks/useProgress';
import { useSubscription } from '../../../services/revenuecat/SubscriptionProvider';
import { MAX_CONTENT_WIDTH, colors, pathColor, radius, space } from '../../../theme/tokens';

const CARD_DIMS: DimensionKey[] = ['cost', 'risk', 'flexibility'];

function ScenarioCard({
  scenario,
  index,
  viewed,
  onPress,
}: {
  scenario: Scenario;
  index: number;
  viewed: boolean;
  onPress: () => void;
}) {
  const color = pathColor(index);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Path ${String.fromCharCode(65 + index)}: ${scenario.title}. ${scenario.summary}`}
      style={({ pressed }) => [styles.card, { borderColor: color + '44' }, pressed && styles.pressed]}
    >
      <View style={[styles.cardStripe, { backgroundColor: color }]} />
      <View style={styles.cardHead}>
        <PathBadge index={index} />
        <Text variant="heading" style={styles.flex} numberOfLines={2}>
          {scenario.title}
        </Text>
        {viewed ? <Icon name="check" size={18} color={colors.textFaint} /> : null}
      </View>
      <Text variant="small" numberOfLines={3} style={styles.cardSummary}>
        {scenario.summary}
      </Text>
      <View style={styles.cardDims}>
        {CARD_DIMS.map((d) => {
          const r = ratingFor(scenario, d);
          if (!r) return null;
          return (
            <View key={d} style={styles.dimPill}>
              <Text variant="caption">{DIMENSIONS[d].label}</Text>
              <Text variant="caption" color={colors.text}>
                {LEVEL_LABEL[r.level]}
              </Text>
            </View>
          );
        })}
        <View style={styles.dimPill}>
          <Text variant="caption">Uncertainty</Text>
          <Text variant="caption" color={colors.text}>
            {LEVEL_LABEL[scenario.uncertaintyLevel]}
          </Text>
        </View>
      </View>
      <View style={styles.cardFoot}>
        <Text variant="small" color={color}>
          Explore this path
        </Text>
        <Icon name="arrow" size={16} color={color} />
      </View>
    </Pressable>
  );
}

export default function ForkScreen() {
  const { decision } = useDecisionParam();
  const { isPro } = useSubscription();
  const { width: screenW } = useWindowDimensions();
  const treeWidth = Math.min(screenW, MAX_CONTENT_WIDTH) - space.xl * 2;
  const t = useProgress(1600, decision?.id, 150);

  if (!decision) return <MissingDecision />;

  const { analysis } = decision;
  const hasBranches = analysis.scenarios.some((s) => s.branches?.length);
  const showTwigs = isPro && hasBranches;
  const leaning = decision.saved ? leaningLabel(decision) : null;
  const open = (sid: string) => router.push(`/decision/${decision.id}/path/${sid}`);

  return (
    <Screen
      footer={
        <View style={styles.footerRow}>
          <Button
            label="Compare"
            icon="compare"
            variant="secondary"
            style={styles.flex}
            onPress={() => router.push(`/decision/${decision.id}/compare`)}
          />
          <Button
            label={decision.saved ? 'Your fork' : 'Choose a path'}
            style={styles.flex}
            onPress={() => router.push(`/decision/${decision.id}/summary`)}
          />
        </View>
      }
    >
      <Header
        onBack={() => (router.canDismiss() ? router.dismissTo('/home') : router.replace('/home'))}
        right={decision.source === 'sample' ? <Chip label="Sample" color={colors.gold} /> : undefined}
      />

      <Text variant="display" accessibilityRole="header" style={styles.title}>
        {analysis.decisionTitle}
      </Text>
      <Text style={styles.summary}>{analysis.summary}</Text>

      {analysis.caution ? (
        <Banner
          icon="info"
          tone="gold"
          title="Worth talking to a professional"
          body={analysis.caution.message}
        />
      ) : null}

      {leaning ? (
        <Banner
          icon="check"
          title={leaning.index >= 0 ? `You leaned toward ${leaning.text}` : 'You were still deciding'}
          body={decision.note ? `“${decision.note}”` : undefined}
        />
      ) : null}

      <View style={styles.tree}>
        <ForkTree
          width={treeWidth}
          progress={t}
          showTwigs={showTwigs}
          onOpen={open}
          paths={analysis.scenarios.map((s) => ({ id: s.id, title: s.title, twigs: s.branches?.map((b) => b.label) }))}
        />
      </View>
      <Text variant="caption" align="center">
        Tap a path to explore what it changes. Paths are possibilities, not predictions.
      </Text>

      {hasBranches && !isPro ? (
        <Pressable
          onPress={() => router.push({ pathname: '/paywall', params: { reason: 'depth' } })}
          accessibilityRole="button"
          accessibilityLabel="See where each path could split next with Fork Pro"
          style={({ pressed }) => [styles.teaser, pressed && styles.pressed]}
        >
          <Icon name="spark" size={18} color={colors.gold} />
          <Text variant="small" color={colors.text} style={styles.flex}>
            See where each path could split next
          </Text>
          <ProBadge />
        </Pressable>
      ) : null}

      <SectionLabel>{`${analysis.scenarios.length} paths`}</SectionLabel>
      <View style={styles.cards}>
        {analysis.scenarios.map((s, i) => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            index={i}
            viewed={decision.viewedScenarioIds.includes(s.id)}
            onPress={() => open(s.id)}
          />
        ))}
      </View>

      <SectionLabel>Factors that matter</SectionLabel>
      <View style={styles.factors}>
        {analysis.variables.map((v) => (
          <View key={v.name} style={styles.factor}>
            <Text variant="bodyStrong">{v.name}</Text>
            <Text variant="small">{v.why}</Text>
          </View>
        ))}
      </View>

      {analysis.missingInformation.length ? (
        <>
          <SectionLabel>What Fork doesn’t know</SectionLabel>
          {analysis.missingInformation.map((m) => (
            <View key={m} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text variant="small" style={styles.flex}>
                {m}
              </Text>
            </View>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginTop: space.sm },
  summary: { marginTop: space.md, marginBottom: space.lg },
  tree: { alignItems: 'center', marginTop: space.lg },
  teaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
    padding: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold + '55',
    minHeight: 48,
  },
  cards: { gap: space.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.lg,
    paddingLeft: space.lg + 4,
    overflow: 'hidden',
    gap: space.md,
  },
  cardStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  cardSummary: {},
  cardDims: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  dimPill: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.raised,
  },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  pressed: { opacity: 0.78 },
  factors: { gap: space.md },
  factor: {
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 2,
  },
  bulletRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', marginBottom: space.sm },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textFaint, marginTop: 8 },
  footerRow: { flexDirection: 'row', gap: space.md },
});
