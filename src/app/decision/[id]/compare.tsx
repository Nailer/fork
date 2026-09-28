import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '../../../components/Icon';
import { MissingDecision } from '../../../components/Missing';
import { Text } from '../../../components/Text';
import { Button, Chip, FadeIn, Header, PathBadge, Screen, SectionLabel } from '../../../components/ui';
import { ALL_DIMENSIONS, DIMENSIONS, FREE_DIMENSIONS } from '../../../domain/dimensions';
import { availableDimensions, buildComparison, toggleDimension, type ComparisonRow } from '../../../domain/compare';
import type { DimensionKey, Level } from '../../../domain/schema';
import { PATH_LETTERS } from '../../../domain/types';
import { useDecisionParam } from '../../../hooks/useDecision';
import { track } from '../../../services/analytics';
import { useSubscription } from '../../../services/revenuecat/SubscriptionProvider';
import { useForkStore } from '../../../store/useForkStore';
import { alpha, colors, elevation, pathColor, radius, space } from '../../../theme/tokens';

const FILL: Record<Level, number> = { low: 1, moderate: 2, high: 3 };

/** A vertical 3-step bar: tall = more of this dimension. Always labelled in words. */
function Bar({ level, color }: { level: Level; color: string }) {
  return (
    <View style={styles.bar}>
      {[2, 1, 0].map((i) => (
        <View key={i} style={[styles.barSeg, { backgroundColor: i < FILL[level] ? color : colors.line }]} />
      ))}
    </View>
  );
}

function Row({ row, emphasis }: { row: ComparisonRow; emphasis: boolean }) {
  const meta = DIMENSIONS[row.dimension];
  const tag = row.spread === 2 ? 'Paths differ a lot' : row.spread === 1 ? 'Paths differ' : 'Similar across paths';
  return (
    <View
      style={[styles.row, emphasis && styles.rowEmphasis]}
      accessibilityLabel={`${meta.label}: ${row.cells
        .map((c, i) => `path ${PATH_LETTERS[i]} ${c.rating ? meta.levels[c.rating.level] : 'not assessed'}`)
        .join(', ')}`}
    >
      <View style={styles.rowHead}>
        <Text variant="heading">{meta.label}</Text>
        <View style={[styles.tag, row.spread > 0 && { backgroundColor: alpha(colors.gold, 0.12) }]}>
          {emphasis ? <Icon name="spark" size={11} color={colors.gold} strokeWidth={2.2} /> : null}
          <Text variant="caption" color={row.spread > 0 ? colors.gold : colors.textFaint}>
            {emphasis ? 'Biggest difference' : tag}
          </Text>
        </View>
      </View>
      <View style={styles.cells}>
        {row.cells.map((cell, i) => (
          <View key={cell.scenarioId} style={styles.cell}>
            {cell.rating ? (
              <>
                <View style={styles.cellTop}>
                  <Bar level={cell.rating.level} color={pathColor(i)} />
                  <View style={styles.flex}>
                    <Text variant="caption" color={pathColor(i)}>
                      {PATH_LETTERS[i]}
                    </Text>
                    <Text variant="small" color={colors.text} numberOfLines={2} style={styles.levelText}>
                      {meta.levels[cell.rating.level]}
                    </Text>
                  </View>
                </View>
                <Text variant="caption" numberOfLines={4}>
                  {cell.rating.note}
                </Text>
              </>
            ) : (
              <Text variant="caption">Not assessed for {PATH_LETTERS[i]}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function Compare() {
  const { decision } = useDecisionParam();
  const { isPro } = useSubscription();
  const setDimensions = useForkStore((s) => s.setDimensions);

  useEffect(() => {
    if (decision) track('comparison_opened', { paths: decision.analysis.scenarios.length });
  }, [decision?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const scenarios = useMemo(() => decision?.analysis.scenarios ?? [], [decision]);
  const available = useMemo(() => availableDimensions(scenarios, ALL_DIMENSIONS), [scenarios]);
  const allowed = isPro ? available : available.filter((d) => FREE_DIMENSIONS.includes(d));
  const selected = (decision?.selectedDimensions ?? []).filter((d) => allowed.includes(d));
  const effective = selected.length ? selected : allowed.slice(0, 4);
  const effectiveKey = effective.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by content, not array identity
  const rows = useMemo(() => buildComparison(scenarios, effective), [scenarios, effectiveKey]);

  if (!decision) return <MissingDecision />;

  const onToggle = (key: DimensionKey) => {
    if (!allowed.includes(key)) {
      router.push({ pathname: '/paywall', params: { reason: 'compare' } });
      return;
    }
    setDimensions(decision.id, toggleDimension(effective, key));
  };

  return (
    <Screen footer={<Button label="Choose a path" onPress={() => router.push(`/decision/${decision.id}/summary`)} />}>
      <Header title="Compare paths" />
      <FadeIn>
        <Text variant="display" accessibilityRole="header" style={styles.title}>
          Choose what matters to you.
        </Text>
        <Text style={styles.sub}>Qualitative readings of each path’s assumptions — no scores, no winner. The biggest differences rise to the top.</Text>
      </FadeIn>

      <View style={styles.chips}>
        {available.map((d) => (
          <Chip
            key={d}
            label={DIMENSIONS[d].label}
            selected={effective.includes(d)}
            locked={!allowed.includes(d)}
            onPress={() => onToggle(d)}
          />
        ))}
      </View>

      <View style={styles.legend}>
        {scenarios.map((s, i) => (
          <View key={s.id} style={styles.legendItem}>
            <PathBadge index={i} size={22} />
            <Text variant="small" color={colors.text} numberOfLines={2} style={styles.flex}>
              {s.title}
            </Text>
          </View>
        ))}
      </View>

      <SectionLabel>{`${rows.length} ${rows.length === 1 ? 'dimension' : 'dimensions'} · taller bar = more`}</SectionLabel>
      <View style={styles.rows}>
        {rows.map((row, i) => (
          <FadeIn key={row.dimension} delay={i * 50}>
            <Row row={row} emphasis={i === 0 && row.spread === 2} />
          </FadeIn>
        ))}
      </View>
      {!isPro && available.some((d) => !FREE_DIMENSIONS.includes(d)) ? (
        <Text variant="caption" align="center" style={styles.proHint}>
          Effort, upside and short- and long-term impact are part of Fork Pro.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginTop: space.xs },
  sub: { marginTop: space.sm, marginBottom: space.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  legend: {
    marginTop: space.xl,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: space.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rows: { gap: space.md },
  row: {
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: space.md,
    ...elevation.card,
  },
  rowEmphasis: { borderColor: alpha(colors.gold, 0.4) },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: alpha('#FFFFFF', 0.04),
  },
  cells: { flexDirection: 'row', gap: space.md },
  cell: { flex: 1, gap: space.sm },
  cellTop: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  levelText: { lineHeight: 18 },
  bar: { gap: 3 },
  barSeg: { width: 8, height: 9, borderRadius: 2 },
  proHint: { marginTop: space.lg },
});
