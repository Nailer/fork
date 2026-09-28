import { useNetInfo } from '@react-native-community/netinfo';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { Banner, Button, FadeIn, Header, Screen, TextLink } from '../components/ui';
import { canExplore, nextFreeSlotAt } from '../domain/limits';
import type { DecisionInput } from '../domain/types';
import { MIN_DESCRIPTION, startExploration } from '../features/explore';
import { openSample } from '../features/openSample';
import { config } from '../services/config';
import { useSubscription } from '../services/revenuecat/SubscriptionProvider';
import { usePending } from '../store/pending';
import { useForkStore } from '../store/useForkStore';
import { alpha, colors, fonts, radius, space } from '../theme/tokens';
import { webNoOutline } from '../theme/web';

const MAX_CHARS = 2000;

const OPTIONAL: { key: keyof Omit<DecisionInput, 'description'>; label: string; placeholder: string; icon: 'spark' | 'layers' | 'history' }[] = [
  { key: 'priorities', label: 'What matters most', placeholder: 'e.g. Peace of mind, not wasting money', icon: 'spark' },
  { key: 'budget', label: 'Budget', placeholder: 'e.g. Around $1,500', icon: 'layers' },
  { key: 'timeHorizon', label: 'Time horizon', placeholder: 'e.g. The next 12 months', icon: 'history' },
];

export default function NewDecision() {
  const { isPro } = useSubscription();
  const explorations = useForkStore((s) => s.explorations);
  const draft = usePending((s) => s.draft);
  const setDraft = usePending((s) => s.setDraft);
  const net = useNetInfo();
  const offline = net.isConnected === false || net.isInternetReachable === false;
  const [showMore, setShowMore] = useState(Boolean(draft.priorities || draft.budget || draft.timeHorizon));
  const [focused, setFocused] = useState(false);

  const text = draft.description;
  const tooShort = text.trim().length < MIN_DESCRIPTION;
  const allowed = canExplore(explorations, isPro);
  const aiReady = Boolean(config.aiUrl);
  const nextSlot = nextFreeSlotAt(explorations);

  const update = (patch: Partial<DecisionInput>) => setDraft({ ...draft, ...patch });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        footer={
          <>
            <Button
              label={allowed ? 'Build my paths' : 'Unlock more explorations'}
              icon={allowed ? 'arrow' : 'lock'}
              variant={allowed ? 'primary' : 'gold'}
              onPress={() => startExploration(draft, isPro)}
              disabled={allowed && (tooShort || offline || !aiReady)}
            />
            <Text variant="caption" align="center">
              Sent securely to an AI model to build your paths. Fork doesn’t store it — saved decisions stay on this device.
            </Text>
          </>
        }
      >
        <Header />
        <FadeIn>
          <Text variant="display" accessibilityRole="header" style={styles.title}>
            Tell Fork what’s happening.
          </Text>
          <Text style={styles.subtitle}>Describe the choice in your own words. A sentence or two is enough.</Text>
        </FadeIn>

        {offline ? (
          <Banner icon="offline" tone="danger" title="You’re offline" body="Building new paths needs a connection. Your saved decisions are still available." />
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

        <FadeIn delay={100}>
          <View style={[styles.inputWrap, focused && styles.inputFocused]}>
            <TextInput
              value={text}
              onChangeText={(v) => update({ description: v.slice(0, MAX_CHARS) })}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Example: I’m deciding whether to buy a new laptop now or keep using my current one for another year."
              placeholderTextColor={colors.textFaint}
              multiline
              autoFocus={!text}
              textAlignVertical="top"
              style={styles.input}
              accessibilityLabel="Describe your decision"
              maxLength={MAX_CHARS}
            />
            <View style={styles.inputFoot}>
              <Text variant="caption" color={tooShort && text.length > 0 ? colors.warning : colors.textFaint}>
                {tooShort && text.length > 0 ? 'A little more detail helps' : text.length > MAX_CHARS * 0.8 ? `${text.length}/${MAX_CHARS}` : ' '}
              </Text>
            </View>
          </View>
        </FadeIn>

        <Pressable
          onPress={() => setShowMore((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showMore }}
          style={styles.moreToggle}
        >
          <View style={styles.moreIcon}>
            <Icon name={showMore ? 'close' : 'plus'} size={14} color={colors.text} strokeWidth={2} />
          </View>
          <Text variant="subheading" color={colors.text}>
            {showMore ? 'Hide extra context' : 'Add context'}
          </Text>
          <Text variant="caption">optional</Text>
        </Pressable>

        {showMore ? (
          <FadeIn style={styles.optional}>
            {OPTIONAL.map((f) => (
              <View key={f.key} style={styles.field}>
                <View style={styles.fieldLabel}>
                  <Icon name={f.icon} size={14} color={colors.textFaint} strokeWidth={2} />
                  <Text variant="label">{f.label}</Text>
                </View>
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
          </FadeIn>
        ) : null}

        {aiReady ? (
          <View style={styles.sampleLink}>
            <TextLink label="Or explore the sample decision" onPress={openSample} />
          </View>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  title: { marginTop: space.md },
  subtitle: { marginTop: space.sm, marginBottom: space.xl },
  inputWrap: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    padding: space.lg,
  },
  inputFocused: { borderColor: alpha(colors.iris, 0.6), boxShadow: `0 0 0 4px ${alpha(colors.iris, 0.12)}` },
  input: {
    ...webNoOutline,
    minHeight: 168,
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 27,
    color: colors.text,
  },
  inputFoot: { flexDirection: 'row', justifyContent: 'flex-end' },
  moreToggle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 48, marginTop: space.md },
  moreIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optional: { gap: space.lg, marginTop: space.xs },
  field: { gap: space.sm },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  fieldInput: {
    ...webNoOutline,
    minHeight: 50,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
  },
  sampleLink: { marginTop: space.xl },
});
