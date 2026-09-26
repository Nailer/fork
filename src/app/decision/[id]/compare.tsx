import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { MissingDecision } from '../../../components/Missing';
import { Text } from '../../../components/Text';
import { Button, Chip, Header, LevelMeter, PathBadge, Screen, SectionLabel } from '../../../components/ui';
import { ALL_DIMENSIONS, DIMENSIONS, FREE_DIMENSIONS } from '../../../domain/dimensions';
import { availableDimensions, buildComparison, toggleDimension } from '../../../domain/compare';
import type { DimensionKey } from '../../../domain/schema';
import { PATH_LETTERS } from '../../../domain/types';
import { useDecisionParam } from '../../../hooks/useDecision';
import { track } from '../../../services/analytics';
import { useSubscription } from '../../../services/revenuecat/SubscriptionProvider';
import { useForkStore } from '../../../store/useForkStore';
import { colors, pathColor, radius, space } from '../../../theme/tokens';

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
    <Screen
      footer={<Button label="Choose a path" onPress={() => router.push(`/decision/${decision.id}/summary`)} />}
    >
      <Header title="Compare paths" />
      <Text variant="display" accessibilityRole="header" style={styles.title}>
        Choose what matters to you.
      </Text>
      <Text style={styles.sub}>
        These are qualitative readings of each path’s assumptions — not scores, and not a ranking. Rows where the paths
        differ most come first.
      </Text>

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
            <Text variant="small" color={colors.text} numberOfLines={1} style={styles.flex}>
              {s.title}
            </Text>
          </View>
        ))}
      </View>

      <SectionLabel>{`${rows.length} ${rows.length === 1 ? 'dimension' : 'dimensions'}`}</SectionLabel>
      <View style={styles.rows}>
        {rows.map((row) => (
          <View key={row.dimension} style={styles.row} accessibilityLabel={`${DIMENSIONS[row.dimension].label} comparison`}>
            <View style={styles.rowHead}>
              <Text variant="heading">{DIMENSIONS[row.dimension].label}</Text>
              <Text variant="caption" color={row.spread > 0 ? colors.gold : colors.textFaint}>
                {row.spread === 2 ? 'Paths differ a lot' : row.spread === 1 ? 'Paths differ' : 'Similar across paths'}
              </Text>
            </View>
            {row.cells.map((cell, i) => (
              <View key={cell.scenarioId} style={styles.cell}>
                <PathBadge index={i} size={22} />
                {cell.rating ? (
                  <View style={styles.flex}>
                    <LevelMeter
                      level={cell.rating.level}
                      color={pathColor(i)}
                      label={DIMENSIONS[row.dimension].levels[cell.rating.level]}
                    />
                    <Text variant="caption" style={styles.note}>
                      {cell.rating.note}
                    </Text>
                  </View>
                ) : (
                  <Text variant="caption">Not assessed for path {PATH_LETTERS[i]}</Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
      {!isPro && available.some((d) => !FREE_DIMENSIONS.includes(d)) ? (
        <Text variant="caption" align="center" style={styles.proHint}>
          Effort, upside and long-term impact comparisons are part of Fork Pro.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginTop: space.sm },
  sub: { marginTop: space.md, marginBottom: space.xl },
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: space.md,
  },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm },
  cell: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  note: { marginTop: 2 },
  proHint: { marginTop: space.lg },
});
