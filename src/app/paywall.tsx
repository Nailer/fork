import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ForkMark } from '../components/ForkMark';
import { Icon, type IconName } from '../components/Icon';
import { Text } from '../components/Text';
import { Banner, Button, IconButton, TextLink, haptic } from '../components/ui';
import { FREE_WEEKLY_EXPLORATIONS } from '../domain/limits';
import { track } from '../services/analytics';
import { useSubscription } from '../services/revenuecat/SubscriptionProvider';
import { MAX_CONTENT_WIDTH, colors, radius, space } from '../theme/tokens';

const REASONS: Record<string, string> = {
  limit: `You’ve used this week’s ${FREE_WEEKLY_EXPLORATIONS} free explorations.`,
  save: 'Your free decision journal is full.',
  depth: 'See where each path could split once you’re on it.',
  compare: 'Compare paths on every dimension that matters.',
  upgrade: 'For the decisions that deserve more than a coin flip.',
};

const BENEFITS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'plus', title: 'Unlimited decisions', body: `No weekly cap — free includes ${FREE_WEEKLY_EXPLORATIONS} per week.` },
  { icon: 'history', title: 'Save your decision history', body: 'Keep every decision and the reasons behind it.' },
  { icon: 'compare', title: 'Compare more deeply', body: 'Add effort, upside, and short- and long-term impact.' },
  { icon: 'spark', title: 'Explore richer scenarios', body: 'Up to 4 paths, each showing where it could split next.' },
];

type Notice = { tone: 'neutral' | 'gold' | 'danger'; title: string; body?: string } | null;

export default function Paywall() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const { status, mode, isPro, monthly, purchase, restore } = useSubscription();
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    track('paywall_viewed', { reason: reason ?? 'unknown' });
  }, [reason]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  const onBuy = async () => {
    setBusy('buy');
    setNotice(null);
    const outcome = await purchase();
    setBusy(null);
    if (outcome.status === 'success') {
      haptic.success();
      setNotice({ tone: 'gold', title: 'Welcome to Fork Pro', body: 'Everything is unlocked.' });
      setTimeout(close, 900);
    } else if (outcome.status === 'pending') {
      setNotice({ tone: 'neutral', title: 'Purchase pending', body: 'We’ll unlock Pro as soon as the store confirms it.' });
    } else if (outcome.status === 'failed') {
      setNotice({ tone: 'danger', title: 'Purchase didn’t complete', body: outcome.message });
    }
  };

  const onRestore = async () => {
    setBusy('restore');
    setNotice(null);
    const outcome = await restore();
    setBusy(null);
    if (outcome.status === 'restored') {
      haptic.success();
      setNotice({ tone: 'gold', title: 'Fork Pro restored' });
      setTimeout(close, 900);
    } else if (outcome.status === 'nothing_to_restore') {
      setNotice({ tone: 'neutral', title: 'No active subscription found', body: 'Nothing to restore for this account.' });
    } else {
      setNotice({ tone: 'danger', title: 'Restore failed', body: outcome.message });
    }
  };

  const price = monthly?.product.priceString;
  const unavailable = status === 'unavailable' || (status === 'ready' && !monthly);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.column}>
        <View style={styles.top}>
          <View />
          <IconButton icon="close" label="Close" onPress={close} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <ForkMark size={72} left={colors.gold} right={colors.goldDeep} />
            <Text variant="label" color={colors.gold}>
              Fork Pro
            </Text>
            <Text variant="display" align="center" accessibilityRole="header">
              Go deeper with Fork Pro
            </Text>
            <Text align="center">{REASONS[reason ?? 'upgrade'] ?? REASONS.upgrade}</Text>
          </View>

          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b.title} style={styles.benefit}>
                <View style={styles.benefitIcon}>
                  <Icon name={b.icon} size={20} color={colors.gold} />
                </View>
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{b.title}</Text>
                  <Text variant="small">{b.body}</Text>
                </View>
              </View>
            ))}
          </View>

          {notice ? <Banner tone={notice.tone} title={notice.title} body={notice.body} icon={notice.tone === 'gold' ? 'check' : 'info'} /> : null}

          {mode === 'test' ? (
            <Text variant="caption" align="center" style={styles.mode}>
              Test Store mode — purchases are simulated by RevenueCat and no real money is charged.
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {isPro ? (
            <Button label="You’re on Fork Pro" variant="secondary" onPress={close} />
          ) : status === 'loading' ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.text} />
              <Text variant="small">Loading subscription options…</Text>
            </View>
          ) : unavailable ? (
            <>
              <Button label="Start Fork Pro" variant="gold" disabled onPress={() => {}} />
              <Text variant="caption" align="center">
                {mode === 'unconfigured'
                  ? 'Development build: RevenueCat isn’t configured, so purchases are disabled.'
                  : 'Fork Pro isn’t available right now. Check your connection and try again.'}
              </Text>
            </>
          ) : (
            <>
              <Button label="Start Fork Pro" variant="gold" onPress={onBuy} loading={busy === 'buy'} disabled={busy !== null} />
              <Text variant="caption" align="center">
                {price ? `${price} per month, billed through your app store. ` : ''}Cancel anytime in your store settings.
              </Text>
            </>
          )}
          <View style={styles.links}>
            <TextLink label="Not now" onPress={close} />
            {mode !== 'unconfigured' && !isPro ? (
              <TextLink label={busy === 'restore' ? 'Restoring…' : 'Restore purchases'} onPress={onRestore} />
            ) : null}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH },
  flex: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.md, height: 52, alignItems: 'center' },
  content: { paddingHorizontal: space.xl, paddingBottom: space.xl },
  hero: { alignItems: 'center', gap: space.md, marginBottom: space.xxl },
  benefits: {
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gold + '33',
    marginBottom: space.lg,
  },
  benefit: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gold + '1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mode: { marginTop: space.sm },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.md, gap: space.sm },
  loading: { flexDirection: 'row', gap: space.sm, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: space.xl },
});
