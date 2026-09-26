import { Pressable, StyleSheet, View } from 'react-native';

import type { Decision } from '../domain/types';
import { PATH_LETTERS } from '../domain/types';
import { colors, pathColor, radius, space } from '../theme/tokens';
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

export function DecisionRow({ decision, onPress }: { decision: Decision; onPress: () => void }) {
  const leaning = leaningLabel(decision);
  const chosenColor = leaning.index >= 0 ? pathColor(leaning.index) : colors.textFaint;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${decision.analysis.decisionTitle}. ${leaning.text}. ${formatDate(decision.updatedAt)}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.mark}>
        <ForkMark
          size={34}
          left={leaning.index === 0 ? chosenColor : colors.lineStrong}
          right={leaning.index > 0 ? chosenColor : colors.lineStrong}
        />
      </View>
      <View style={styles.body}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {decision.analysis.decisionTitle}
        </Text>
        <Text variant="small" color={leaning.index >= 0 ? chosenColor : colors.textDim} numberOfLines={1}>
          {leaning.text}
        </Text>
        <Text variant="caption">
          {formatDate(decision.updatedAt)}
          {decision.source === 'sample' ? ' · Sample' : ''}
        </Text>
      </View>
      <Icon name="arrow" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: { opacity: 0.75 },
  mark: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
});
