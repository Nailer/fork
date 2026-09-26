import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '../../../components/Icon';
import { MissingDecision } from '../../../components/Missing';
import { Text } from '../../../components/Text';
import { Button, Header, PathBadge, Screen, SectionLabel, haptic } from '../../../components/ui';
import { DIMENSIONS } from '../../../domain/dimensions';
import { buildComparison, keyDifferences } from '../../../domain/compare';
import { FREE_SAVED_DECISIONS, canSave } from '../../../domain/limits';
import { PATH_LETTERS, type ChosenPath } from '../../../domain/types';
import { useDecisionParam } from '../../../hooks/useDecision';
import { track } from '../../../services/analytics';
import { useSubscription } from '../../../services/revenuecat/SubscriptionProvider';
import { useForkStore } from '../../../store/useForkStore';
import { colors, fonts, pathColor, radius, space } from '../../../theme/tokens';

const UNDECIDED = '__undecided__';

export default function Summary() {
  const { decision } = useDecisionParam();
  const { isPro } = useSubscription();
  const saveDecision = useForkStore((s) => s.saveDecision);
  const savedCount = useForkStore((s) => s.decisions.filter((d) => d.saved).length);

  const initialChoice =
    decision?.chosen?.kind === 'scenario' ? decision.chosen.scenarioId : decision?.chosen ? UNDECIDED : null;
  const [choice, setChoice] = useState<string | null>(initialChoice);
  const [note, setNote] = useState(decision?.note ?? '');
  const [justSaved, setJustSaved] = useState(false);

  const differences = useMemo(() => {
    if (!decision) return [];
    return keyDifferences(buildComparison(decision.analysis.scenarios, decision.selectedDimensions));
  }, [decision]);

  if (!decision) return <MissingDecision />;
  const { analysis } = decision;

  const save = () => {
    if (!choice) return;
    if (!canSave(savedCount, isPro, decision.saved)) {
      router.push({ pathname: '/paywall', params: { reason: 'save' } });
      return;
    }
    const chosen: ChosenPath = choice === UNDECIDED ? { kind: 'undecided' } : { kind: 'scenario', scenarioId: choice };
    saveDecision(decision.id, chosen, note);
    haptic.success();
    track('decision_saved', { undecided: choice === UNDECIDED, withNote: note.trim().length > 0 });
    setJustSaved(true);
  };

  if (justSaved) {
    const idx = analysis.scenarios.findIndex((s) => s.id === choice);
    return (
      <Screen scroll={false} edges={['top', 'bottom']} contentStyle={styles.savedWrap}>
        <View style={[styles.savedIcon, { borderColor: idx >= 0 ? pathColor(idx) : colors.text }]}>
          <Icon name="check" size={36} color={idx >= 0 ? pathColor(idx) : colors.text} strokeWidth={2.4} />
        </View>
        <Text variant="display" align="center" accessibilityRole="header">
          Decision kept.
        </Text>
        <Text align="center" style={styles.savedBody}>
          {idx >= 0
            ? `You’re leaning toward “${analysis.scenarios[idx].title}”. It’s in your history whenever you want to revisit it.`
            : 'You’re still deciding — that’s fine. Come back to it any time from your history.'}
        </Text>
        <View style={styles.savedActions}>
          <Button
            label="Go to my decisions"
            onPress={() => {
              router.dismissTo('/home');
              router.push('/history');
            }}
          />
          <Button label="Back to home" variant="ghost" onPress={() => router.dismissTo('/home')} />
        </View>
      </Screen>
    );
  }

  const options: { id: string; label: string; index: number }[] = [
    ...analysis.scenarios.map((s, i) => ({ id: s.id, label: s.title, index: i })),
    { id: UNDECIDED, label: 'Still deciding', index: -1 },
  ];
  const atFreeLimit = !isPro && !decision.saved && savedCount >= FREE_SAVED_DECISIONS;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        footer={
          <Button
            label={atFreeLimit ? 'Unlock unlimited history' : decision.saved ? 'Update decision' : 'Keep this decision'}
            variant={atFreeLimit ? 'gold' : 'primary'}
            icon={atFreeLimit ? 'lock' : undefined}
            onPress={save}
            disabled={!choice}
          />
        }
      >
        <Header title="Your fork" />
        <Text variant="display" accessibilityRole="header" style={styles.title}>
          Your fork
        </Text>

        <SectionLabel>Decision</SectionLabel>
        <Text variant="bodyStrong">{decision.input.description}</Text>

        <SectionLabel>Paths explored</SectionLabel>
        <View style={styles.paths}>
          {analysis.scenarios.map((s, i) => {
            const viewed = decision.viewedScenarioIds.includes(s.id);
            return (
              <Pressable
                key={s.id}
                onPress={() => router.push(`/decision/${decision.id}/path/${s.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Path ${PATH_LETTERS[i]}: ${s.title}. ${viewed ? 'Explored' : 'Not opened yet'}`}
                style={styles.pathRow}
              >
                <PathBadge index={i} size={24} />
                <Text variant="body" color={colors.text} style={styles.flex}>
                  {s.title}
                </Text>
                <Text variant="caption">{viewed ? 'Explored' : 'Not opened'}</Text>
              </Pressable>
            );
          })}
        </View>

        {differences.length ? (
          <>
            <SectionLabel>Where the paths differ most</SectionLabel>
            <View style={styles.box}>
              {differences.map((row) => (
                <View key={row.dimension} style={styles.diffRow}>
                  <Text variant="bodyStrong">{DIMENSIONS[row.dimension].label}</Text>
                  <Text variant="small">
                    {row.cells
                      .map((c, i) =>
                        c.rating ? `${PATH_LETTERS[i]}: ${DIMENSIONS[row.dimension].levels[c.rating.level].toLowerCase()}` : null,
                      )
                      .filter(Boolean)
                      .join('  ·  ')}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <SectionLabel>Most important tradeoffs</SectionLabel>
        <View style={styles.box}>
          {analysis.scenarios.map((s, i) => (
            <View key={s.id} style={styles.tradeRow}>
              <PathBadge index={i} size={20} />
              <Text variant="small" color={colors.text} style={styles.flex}>
                {s.tradeoffs[0]}
              </Text>
            </View>
          ))}
        </View>

        <SectionLabel>Questions worth answering</SectionLabel>
        <View style={styles.box}>
          {analysis.questions.map((q) => (
            <Text key={q} variant="body" color={colors.text}>
              {q}
            </Text>
          ))}
        </View>

        <SectionLabel>Which path are you leaning toward?</SectionLabel>
        <Text variant="small" style={styles.hint}>
          Fork doesn’t pick for you. This is your call — you can change it later.
        </Text>
        <View style={styles.options} accessibilityRole="radiogroup">
          {options.map((o) => {
            const selected = choice === o.id;
            const color = o.index >= 0 ? pathColor(o.index) : colors.text;
            return (
              <Pressable
                key={o.id}
                onPress={() => {
                  haptic.tap();
                  setChoice(o.id);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={o.index >= 0 ? `Path ${PATH_LETTERS[o.index]}: ${o.label}` : o.label}
                style={[styles.option, selected && { borderColor: color, backgroundColor: colors.raised }]}
              >
                {o.index >= 0 ? (
                  <PathBadge index={o.index} size={26} />
                ) : (
                  <View style={styles.undecidedDot}>
                    <Text variant="caption" color={colors.text}>
                      …
                    </Text>
                  </View>
                )}
                <Text variant="bodyStrong" style={styles.flex}>
                  {o.label}
                </Text>
                <View style={[styles.radio, selected && { borderColor: color }]}>
                  {selected ? <View style={[styles.radioDot, { backgroundColor: color }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <SectionLabel>Why I’m choosing this</SectionLabel>
        <TextInput
          value={note}
          onChangeText={(v) => setNote(v.slice(0, 600))}
          placeholder="Optional — a note to your future self"
          placeholderTextColor={colors.textFaint}
          multiline
          textAlignVertical="top"
          style={styles.note}
          accessibilityLabel="Why I'm choosing this"
        />
        {atFreeLimit ? (
          <Text variant="caption" style={styles.limit}>
            Free accounts keep up to {FREE_SAVED_DECISIONS} decisions. Fork Pro keeps them all.
          </Text>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginTop: space.sm },
  paths: { gap: space.sm },
  pathRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 },
  box: {
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: space.md,
  },
  diffRow: { gap: 2 },
  tradeRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  hint: { marginTop: -space.sm, marginBottom: space.md },
  options: { gap: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    minHeight: 60,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  undecidedDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  note: {
    minHeight: 110,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
  },
  limit: { marginTop: space.md },
  savedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl, gap: space.md },
  savedIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  savedBody: { marginBottom: space.xl },
  savedActions: { alignSelf: 'stretch', gap: space.sm },
});
