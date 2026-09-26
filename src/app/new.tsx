import { useNetInfo } from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { Banner, Button, Header, Screen, TextLink } from '../components/ui';
import { canExplore, depthFor, nextFreeSlotAt } from '../domain/limits';
import type { DecisionInput } from '../domain/types';
import { openSample } from '../features/openSample';
import { track } from '../services/analytics';
import { config } from '../services/config';
import { useSubscription } from '../services/revenuecat/SubscriptionProvider';
import { usePending } from '../store/pending';
import { useForkStore } from '../store/useForkStore';
import { webNoOutline } from '../theme/web';
import { colors, fonts, radius, space } from '../theme/tokens';

const MIN_CHARS = 8;
const MAX_CHARS = 2000;

const OPTIONAL: { key: keyof Omit<DecisionInput, 'description'>; label: string; placeholder: string }[] = [
  { key: 'priorities', label: 'What matters most?', placeholder: 'e.g. Peace of mind, not wasting money' },
  { key: 'budget', label: 'Budget', placeholder: 'e.g. Around $1,500' },
  { key: 'timeHorizon', label: 'Time horizon', placeholder: 'e.g. The next 12 months' },
];

export default function NewDecision() {
  const { isPro } = useSubscription();
  const explorations = useForkStore((s) => s.explorations);
  const draft = usePending((s) => s.draft);
  const setDraft = usePending((s) => s.setDraft);
  const setPending = usePending((s) => s.setPending);
  const net = useNetInfo();
  const offline = net.isConnected === false || net.isInternetReachable === false;
  const [showMore, setShowMore] = useState(Boolean(draft.priorities || draft.budget || draft.timeHorizon));

  const text = draft.description;
  const tooShort = text.trim().length < MIN_CHARS;
  const allowed = canExplore(explorations, isPro);
  const aiReady = Boolean(config.aiUrl);

  const update = (patch: Partial<DecisionInput>) => setDraft({ ...draft, ...patch });

  const submit = () => {
    if (!allowed) {
      router.push({ pathname: '/paywall', params: { reason: 'limit' } });
      return;
    }
    const input: DecisionInput = {
      description: text.trim(),
      priorities: draft.priorities?.trim() || undefined,
      budget: draft.budget?.trim() || undefined,
      timeHorizon: draft.timeHorizon?.trim() || undefined,
    };
    track('decision_started', { withContext: Boolean(input.priorities || input.budget || input.timeHorizon) });
    setPending(input, depthFor(isPro));
    router.push('/analyzing');
  };

  const nextSlot = nextFreeSlotAt(explorations);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        footer={
          <>
            <Button
              label={allowed ? 'Build my paths' : 'Unlock more explorations'}
              icon={allowed ? 'arrow' : 'lock'}
              variant={allowed ? 'primary' : 'gold'}
              onPress={submit}
              disabled={allowed && (tooShort || offline || !aiReady)}
            />
            <Text variant="caption" align="center">
              Your description is sent securely to an AI model to build your paths and isn’t stored by Fork. Saved decisions stay on this device.
            </Text>
          </>
        }
      >
        <Header />
        <Text variant="display" accessibilityRole="header" style={styles.title}>
          Tell Fork what’s happening.
        </Text>
        <Text style={styles.subtitle}>Describe the choice in your own words. A sentence or two is enough.</Text>

        {offline ? (
          <Banner icon="offline" title="You’re offline" body="Building new paths needs a connection. Your saved decisions are still available." />
        ) : null}
        {!aiReady ? (
          <Banner
            title="Live analysis isn’t set up in this build"
            body="You can still explore the sample decision to see how Fork works."
            action={<TextLink label="Open the sample decision" onPress={openSample} color={colors.text} />}
          />
        ) : null}
        {!allowed ? (
          <Banner
            icon="lock"
            tone="gold"
            title="You’ve used this week’s free explorations"
            body={
              nextSlot
                ? `Your next free exploration unlocks ${new Date(nextSlot).toLocaleDateString(undefined, { weekday: 'long' })}. Fork Pro removes the limit.`
                : 'Fork Pro removes the weekly limit.'
            }
          />
        ) : null}

        <View style={styles.inputWrap}>
          <TextInput
            value={text}
            onChangeText={(v) => update({ description: v.slice(0, MAX_CHARS) })}
            placeholder="Example: I’m deciding whether to buy a new laptop now or keep using my current one for another year."
            placeholderTextColor={colors.textFaint}
            multiline
            autoFocus={!text}
            textAlignVertical="top"
            style={styles.input}
            accessibilityLabel="Describe your decision"
            maxLength={MAX_CHARS}
          />
          <Text variant="caption" align="right">
            {text.length > MAX_CHARS * 0.8 ? `${text.length}/${MAX_CHARS}` : ' '}
          </Text>
        </View>

        <Pressable
          onPress={() => setShowMore((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showMore }}
          style={styles.moreToggle}
        >
          <Icon name={showMore ? 'close' : 'plus'} size={18} color={colors.textDim} />
          <Text variant="small" color={colors.text}>
            {showMore ? 'Hide extra context' : 'Add context (optional)'}
          </Text>
        </Pressable>

        {showMore ? (
          <View style={styles.optional}>
            {OPTIONAL.map((f) => (
              <View key={f.key} style={styles.field}>
                <Text variant="label">{f.label}</Text>
                <TextInput
                  value={draft[f.key] ?? ''}
                  onChangeText={(v) => update({ [f.key]: v.slice(0, 240) })}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.textFaint}
                  style={styles.fieldInput}
                  accessibilityLabel={f.label}
                  returnKeyType="done"
                />
              </View>
            ))}
          </View>
        ) : null}

        {!aiReady ? null : (
          <View style={styles.sampleLink}>
            <TextLink label="Or explore the sample decision" onPress={openSample} />
          </View>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  title: { marginTop: space.lg },
  subtitle: { marginTop: space.sm, marginBottom: space.xl },
  inputWrap: { marginTop: space.lg },
  input: {
    ...webNoOutline,
    minHeight: 180,
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 27,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    paddingTop: space.lg,
  },
  moreToggle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44, marginTop: space.sm },
  optional: { gap: space.lg, marginTop: space.sm },
  field: { gap: space.sm },
  fieldInput: {
    ...webNoOutline,
    minHeight: 48,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
  },
  sampleLink: { marginTop: space.xl },
});
