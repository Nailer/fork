import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { leaningLabel } from '../../../components/DecisionRow';
import { ForkTree } from '../../../components/ForkTree';
import { Icon } from '../../../components/Icon';
import { MissingDecision } from '../../../components/Missing';
import { Text } from '../../../components/Text';
import {
  Banner,
  Button,
  Chip,
  FadeIn,
  Header,
  LevelMeter,
  PathBadge,
  ProBadge,
  Screen,
  SectionLabel,
  TextLink,
} from '../../../components/ui';
import { DIMENSIONS, LEVEL_LABEL } from '../../../domain/dimensions';
import { ratingFor } from '../../../domain/compare';
import type { DimensionKey, Scenario } from '../../../domain/schema';
import { PATH_LETTERS } from '../../../domain/types';
import { useDecisionParam } from '../../../hooks/useDecision';
import { useProgress } from '../../../hooks/useProgress';
import { useSubscription } from '../../../services/revenuecat/SubscriptionProvider';
import { usePending } from '../../../store/pending';
import { MAX_CONTENT_WIDTH, alpha, colors, elevation, pathColor, radius, space } from '../../../theme/tokens';

const PREVIEW_DIMS: DimensionKey[] = ['cost', 'risk', 'flexibility'];

/** The selected path, previewed right under the tree. */
function Preview({ scenario, index, onOpen }: { scenario: Scenario; index: number; onOpen: () => void }) {
  const color = pathColor(index);
  return (
    <FadeIn key={scenario.id} distance={8}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Explore path ${PATH_LETTERS[index]}: ${scenario.title}`}
        style={({ pressed }) => [styles.preview, { borderColor: alpha(color, 0.45) }, pressed && styles.pressed]}
      >
        <View style={[styles.previewGlow, { backgroundColor: color }]} />
        <View style={styles.previewHead}>
          <PathBadge index={index} size={30} />
          <View style={styles.flex}>
            <Text variant="label" color={color}>
              Path {PATH_LETTERS[index]} · Uncertainty {LEVEL_LABEL[scenario.uncertaintyLevel].toLowerCase()}
            </Text>
            <Text variant="title">{scenario.title}</Text>
          </View>
        </View>
        <Text variant="small" numberOfLines={3}>
          {scenario.summary}
        </Text>
        <View style={styles.previewDims}>
          {PREVIEW_DIMS.map((d) => {
            const r = ratingFor(scenario, d);
            if (!r) return null;
            return (
              <View key={d} style={styles.previewDim}>
                <Text variant="caption">{DIMENSIONS[d].label}</Text>
                <LevelMeter level={r.level} color={color} label={DIMENSIONS[d].levels[r.level]} />
              </View>
            );
          })}
        </View>
        <View style={[styles.previewCta, { backgroundColor: alpha(color, 0.14) }]}>
          <Text variant="button" color={color}>
            Explore this path
          </Text>
          <Icon name="arrow" size={17} color={color} strokeWidth={2.2} />
        </View>
      </Pressable>
    </FadeIn>
  );
}

function PathRow({ scenario, index, viewed, onPress }: { scenario: Scenario; index: number; viewed: boolean; onPress: () => void }) {
  const color = pathColor(index);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Path ${PATH_LETTERS[index]}: ${scenario.title}. ${viewed ? 'Explored.' : ''}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.rowRail, { backgroundColor: color }]} />
      <PathBadge index={index} size={26} />
      <View style={styles.flex}>
        <Text variant="heading" numberOfLines={2}>
          {scenario.title}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {scenario.tradeoffs[0]}
        </Text>
      </View>
      {viewed ? (
        <View style={styles.viewed}>
          <Icon name="check" size={12} color={colors.textDim} strokeWidth={2.4} />
          <Text variant="caption">Explored</Text>
        </View>
      ) : (
        <Icon name="arrow" size={16} color={colors.textFaint} />
      )}
    </Pressable>
  );
}

export default function ForkScreen() {
  const { decision } = useDecisionParam();
  const { isPro } = useSubscription();
  const { width: screenW } = useWindowDimensions();
  const treeWidth = Math.min(screenW, MAX_CONTENT_WIDTH) - space.xl * 2;
  const t = useProgress(1700, decision?.id, 150);
  const setDraft = usePending((s) => s.setDraft);
  const [selected, setSelected] = useState<string | null>(null);

  if (!decision) return <MissingDecision />;

  const { analysis } = decision;
  const hasBranches = analysis.scenarios.some((s) => s.branches?.length);
  const showTwigs = isPro && hasBranches;
  const leaning = decision.saved ? leaningLabel(decision) : null;
  const open = (sid: string) => router.push(`/decision/${decision.id}/path/${sid}`);
  const selectedIndex = analysis.scenarios.findIndex((s) => s.id === selected);

  return (
    <Screen
      tint={selectedIndex >= 0 ? pathColor(selectedIndex) : undefined}
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

      <FadeIn>
        <Text variant="display" accessibilityRole="header" style={styles.title}>
          {analysis.decisionTitle}
        </Text>
      </FadeIn>

      {analysis.caution ? (
        <View style={styles.bannerGap}>
          <Banner icon="info" tone="gold" title="Worth talking to a professional" body={analysis.caution.message} />
        </View>
      ) : null}

      {leaning ? (
        <View style={styles.bannerGap}>
          <Banner
            icon="check"
            tone="success"
            title={leaning.index >= 0 ? `You leaned toward ${leaning.text}` : 'You were still deciding'}
            body={decision.note ? `“${decision.note}”` : undefined}
            action={
              <TextLink
                label="Explore this decision again"
                color={colors.text}
                onPress={() => {
                  // Starts a fresh exploration from the same words; the saved one stays as it was.
                  setDraft({ ...decision.input });
                  router.push('/new');
                }}
              />
            }
          />
        </View>
      ) : null}

      <View style={styles.stage}>
        <ForkTree
          width={treeWidth}
          progress={t}
          showTwigs={showTwigs}
          activeId={selected}
          onSelect={(id) => setSelected((cur) => (cur === id ? null : id))}
          paths={analysis.scenarios.map((s) => ({ id: s.id, title: s.title, twigs: s.branches?.map((b) => b.label) }))}
        />
      </View>

      {selectedIndex >= 0 ? (
        <Preview scenario={analysis.scenarios[selectedIndex]} index={selectedIndex} onOpen={() => open(analysis.scenarios[selectedIndex].id)} />
      ) : (
        <Text variant="caption" align="center" style={styles.hint}>
          Tap a branch to preview it. Paths are possibilities, not predictions.
        </Text>
      )}

      {hasBranches && !isPro ? (
        <Pressable
          onPress={() => router.push({ pathname: '/paywall', params: { reason: 'depth' } })}
          accessibilityRole="button"
          accessibilityLabel="See where each path could split next with Fork Pro"
          style={({ pressed }) => [styles.teaser, pressed && styles.pressed]}
        >
          <Icon name="branch" size={18} color={colors.gold} />
          <Text variant="small" color={colors.text} style={styles.flex}>
            See where each path could split next
          </Text>
          <ProBadge />
        </Pressable>
      ) : null}

      <SectionLabel>The situation</SectionLabel>
      <Text>{analysis.summary}</Text>

      <SectionLabel>{`All ${analysis.scenarios.length} paths`}</SectionLabel>
      <View style={styles.rows}>
        {analysis.scenarios.map((s, i) => (
          <PathRow key={s.id} scenario={s} index={i} viewed={decision.viewedScenarioIds.includes(s.id)} onPress={() => open(s.id)} />
        ))}
      </View>

      <SectionLabel icon="layers">Factors that matter</SectionLabel>
      <View style={styles.factors}>
        {analysis.variables.map((v, i) => (
          <View key={v.name} style={styles.factor}>
            <Text variant="caption" color={colors.textFaint}>
              {String(i + 1).padStart(2, '0')}
            </Text>
            <View style={styles.flex}>
              <Text variant="subheading" color={colors.text}>
                {v.name}
              </Text>
              <Text variant="small">{v.why}</Text>
            </View>
          </View>
        ))}
      </View>

      {analysis.missingInformation.length ? (
        <>
          <SectionLabel icon="question">What Fork doesn’t know</SectionLabel>
          <View style={styles.unknowns}>
            {analysis.missingInformation.map((m) => (
              <View key={m} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text variant="small" style={styles.flex}>
                  {m}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginTop: space.xs, marginBottom: space.md },
  bannerGap: { marginTop: space.xs },
  stage: { alignItems: 'center', marginTop: space.sm },
  hint: { marginTop: space.xs },
  preview: {
    marginTop: space.xs,
    padding: space.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.card,
    gap: space.md,
    overflow: 'hidden',
    ...elevation.raised,
  },
  previewGlow: { position: 'absolute', top: -140, right: -120, width: 260, height: 260, borderRadius: 130, opacity: 0.08 },
  previewHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  previewDims: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  previewDim: { gap: space.xs },
  previewCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: 46,
    borderRadius: radius.pill,
  },
  teaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: alpha(colors.gold, 0.35),
    backgroundColor: alpha(colors.gold, 0.05),
    minHeight: 48,
  },
  rows: { gap: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    paddingLeft: space.lg + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  rowRail: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  viewed: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pressed: { opacity: 0.8 },
  factors: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: space.lg,
    gap: space.lg,
  },
  factor: { flexDirection: 'row', gap: space.md },
  unknowns: { gap: space.sm },
  bulletRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.iris, marginTop: 7 },
  footerRow: { flexDirection: 'row', gap: space.md },
});
