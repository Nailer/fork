import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DecisionRow } from '../components/DecisionRow';
import { ForkMark } from '../components/ForkMark';
import { Text } from '../components/Text';
import { Button, ConfirmSheet, Header, IconButton, Screen } from '../components/ui';
import { FREE_SAVED_DECISIONS } from '../domain/limits';
import type { Decision } from '../domain/types';
import { useSubscription } from '../services/revenuecat/SubscriptionProvider';
import { savedOf, useForkStore } from '../store/useForkStore';
import { colors, space } from '../theme/tokens';

export default function History() {
  const decisions = useForkStore((s) => s.decisions);
  const deleteDecision = useForkStore((s) => s.deleteDecision);
  const { isPro } = useSubscription();
  const saved = useMemo(() => savedOf(decisions), [decisions]);
  const [pendingDelete, setPendingDelete] = useState<Decision | null>(null);

  return (
    <Screen>
      <Header title="Your decisions" onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
      <Text variant="display" accessibilityRole="header" style={styles.title}>
        Decision journal
      </Text>
      <Text style={styles.sub}>
        {isPro
          ? 'Every decision you keep, with the path you leaned toward and why.'
          : `Every decision you keep, with the path you leaned toward and why. Free accounts keep up to ${FREE_SAVED_DECISIONS}.`}
      </Text>

      {saved.length === 0 ? (
        <View style={styles.empty}>
          <ForkMark size={72} left={colors.lineStrong} right={colors.lineStrong} />
          <Text variant="title" align="center">
            Nothing kept yet
          </Text>
          <Text align="center">When you explore a decision and choose a direction, keep it here to revisit later.</Text>
          <Button label="Explore a decision" icon="arrow" onPress={() => router.replace('/new')} style={styles.emptyButton} />
        </View>
      ) : (
        <View style={styles.list}>
          {saved.map((d) => (
            <View key={d.id} style={styles.item}>
              <View style={styles.flex}>
                <DecisionRow decision={d} onPress={() => router.push(`/decision/${d.id}`)} />
              </View>
              <IconButton icon="trash" label={`Delete ${d.analysis.decisionTitle}`} color={colors.textFaint} onPress={() => setPendingDelete(d)} />
            </View>
          ))}
        </View>
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
  title: { marginTop: space.sm },
  sub: { marginTop: space.sm, marginBottom: space.xl },
  list: { gap: space.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  empty: { alignItems: 'center', gap: space.md, marginTop: space.xxl },
  emptyButton: { alignSelf: 'stretch', marginTop: space.lg },
});
