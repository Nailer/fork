import { Pressable, StyleSheet, View } from 'react-native';

import type { Decision } from '../domain/types';
import { PATH_LETTERS } from '../domain/types';
import { alpha, colors, pathColor, radius, space } from '../theme/tokens';
import { ForkMark } from './ForkMark';
import { Icon } from './Icon';
import { Text } from './Text';

export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function leaningLabel(decision: Decision) {
  const chosen = decision.chosen;
  if (!chosen || chosen.kind === 'undecided') return { text: 'Still deciding', index: -1 };
  const index = decision.analysis.scenarios.findIndex((s) => s.id === chosen.scenarioId);
  if (index === -1) return { text: 'Still deciding', index: -1 };
  return { text: `Path ${PATH_LETTERS[index]} · ${decision.analysis.scenarios[index].title}`, index };
}

/** A journal entry: the decision, the path you leaned toward and your note. */
export function DecisionRow({ decision, onPress, showNote = false }: { decision: Decision; onPress: () => void; showNote?: boolean }) {
  const leaning = leaningLabel(decision);
  const chosenColor = leaning.index >= 0 ? pathColor(leaning.index) : colors.textFaint;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${decision.analysis.decisionTitle}. ${leaning.text}. ${formatDate(decision.updatedAt)}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.rail, { backgroundColor: chosenColor }]} />
      <View style={[styles.mark, { backgroundColor: alpha(chosenColor, 0.1) }]}>
        <ForkMark size={30} left={leaning.index === 0 ? chosenColor : colors.lineStrong} right={leaning.index > 0 ? chosenColor : colors.lineStrong} />
      </View>
      <View style={styles.body}>
        <Text variant="caption">
          {formatDate(decision.updatedAt)}
          {decision.source === 'sample' ? ' · Sample' : ''}
        </Text>
        <Text variant="heading" numberOfLines={2}>
          {decision.analysis.decisionTitle}
        </Text>
        <View style={styles.leaning}>
          {leaning.index >= 0 ? <View style={[styles.dot, { backgroundColor: chosenColor }]} /> : null}
          <Text variant="small" color={leaning.index >= 0 ? chosenColor : colors.textDim} numberOfLines={1} style={styles.flex}>
            {leaning.text}
          </Text>
        </View>
        {showNote && decision.note ? (
          <Text variant="small" numberOfLines={2} style={styles.note}>
            “{decision.note}”
          </Text>
        ) : null}
      </View>
      <Icon name="arrow" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    paddingLeft: space.lg + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  rail: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  pressed: { opacity: 0.8 },
  mark: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  leaning: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  note: { fontStyle: 'italic', marginTop: space.xs },
});
