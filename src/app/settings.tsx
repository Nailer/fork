import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';
import { Banner, Button, Card, ConfirmSheet, Header, ProBadge, Screen, SectionLabel } from '../components/ui';
import { config } from '../services/config';
import { useSubscription } from '../services/revenuecat/SubscriptionProvider';
import { useForkStore } from '../store/useForkStore';
import { colors, space } from '../theme/tokens';

const MODE_LABEL = {
  test: 'RevenueCat Test Store (development)',
  production: 'App Store / Google Play (production)',
  unconfigured: 'Not configured in this build',
} as const;

export default function Settings() {
  const { isPro, mode, managementURL, restore, status } = useSubscription();
  const clearAll = useForkStore((s) => s.clearAll);
  const resetOnboarding = useForkStore((s) => s.resetOnboarding);
  const count = useForkStore((s) => s.decisions.filter((d) => d.saved).length);
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const onRestore = async () => {
    setRestoring(true);
    const outcome = await restore();
    setRestoring(false);
    setMessage(
      outcome.status === 'restored'
        ? 'Fork Pro restored.'
        : outcome.status === 'nothing_to_restore'
          ? 'No active subscription found.'
          : outcome.message,
    );
  };

  return (
    <Screen>
      <Header title="Settings" />

      <SectionLabel>Plan</SectionLabel>
      <Card>
        <View style={styles.planRow}>
          <Text variant="title">{isPro ? 'Fork Pro' : 'Fork Free'}</Text>
          {isPro ? <ProBadge label="ACTIVE" /> : null}
        </View>
        <Text variant="small" style={styles.planBody}>
          {isPro ? 'Unlimited decisions, full history, deeper paths and comparisons.' : '3 explorations a week, up to 5 kept decisions.'}
        </Text>
        <View style={styles.planActions}>
          {!isPro ? (
            <Button label="See Fork Pro" variant="gold" onPress={() => router.push({ pathname: '/paywall', params: { reason: 'upgrade' } })} />
          ) : null}
          {isPro && managementURL ? (
            <Button label="Manage subscription" variant="secondary" onPress={() => Linking.openURL(managementURL)} />
          ) : null}
          {mode !== 'unconfigured' ? (
            <Button
              label="Restore purchases"
              variant="ghost"
              loading={restoring}
              disabled={status === 'loading'}
              onPress={onRestore}
            />
          ) : null}
        </View>
        {message ? (
          <Text variant="small" color={colors.text}>
            {message}
          </Text>
        ) : null}
      </Card>

      <SectionLabel>Your data</SectionLabel>
      <Card>
        <Text variant="small">
          Your decisions ({count} kept) are stored only on this device. When you build new paths, your description is
          sent to Fork’s AI service to generate them and is not stored by Fork. Fork does not use analytics or tracking SDKs.
        </Text>
        <Button label="Delete all my data" variant="secondary" onPress={() => setConfirm(true)} style={styles.dataButton} />
      </Card>

      <SectionLabel>About</SectionLabel>
      <Card>
        <Text variant="small">
          Fork helps you explore decisions. It doesn’t predict outcomes or tell you what to choose, and it isn’t a
          substitute for professional medical, legal or financial advice.
        </Text>
        <View style={styles.meta}>
          <Text variant="caption">Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
          <Text variant="caption">Billing: {MODE_LABEL[mode]}</Text>
          <Text variant="caption">AI service: {config.aiUrl ? 'Connected' : 'Not configured'}</Text>
        </View>
        <Button
          label="Replay introduction"
          variant="ghost"
          onPress={() => {
            resetOnboarding();
            router.replace('/onboarding');
          }}
        />
      </Card>

      {mode === 'unconfigured' ? (
        <View style={styles.dev}>
          <Banner title="Development build" body="RevenueCat keys aren’t set, so purchases are disabled. See README → RevenueCat." />
        </View>
      ) : null}

      <ConfirmSheet
        visible={confirm}
        title="Delete all data?"
        body="This removes every decision, note and usage history from this device. Your subscription is not affected."
        confirmLabel="Delete everything"
        destructive
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          clearAll();
          setConfirm(false);
          router.replace('/onboarding');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planBody: { marginTop: space.xs, marginBottom: space.lg },
  planActions: { gap: space.sm },
  dataButton: { marginTop: space.lg },
  meta: { marginVertical: space.md, gap: 2 },
  dev: { marginTop: space.xl },
});
