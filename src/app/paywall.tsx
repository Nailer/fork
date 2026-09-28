import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ForkMark } from '../components/ForkMark';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { Backdrop, Banner, Button, FadeIn, IconButton, TextLink, haptic } from '../components/ui';
import { FREE_SAVED_DECISIONS, FREE_WEEKLY_EXPLORATIONS, PRO_MAX_PATHS, FREE_MAX_PATHS } from '../domain/limits';
import { track } from '../services/analytics';
import { useSubscription } from '../services/revenuecat/SubscriptionProvider';
import { MAX_CONTENT_WIDTH, alpha, colors, elevation, fonts, radius, space } from '../theme/tokens';

const REASONS: Record<string, string> = {
  limit: `You’ve used this week’s ${FREE_WEEKLY_EXPLORATIONS} free explorations.`,
  save: `Your free journal holds ${FREE_SAVED_DECISIONS} decisions — and it’s full.`,
  depth: 'See where each path could split once you’re on it.',
  compare: 'Compare paths on every dimension that matters.',
  upgrade: 'For the decisions that deserve more than a coin flip.',
};

/** Only features that exist in the app. */
const ROWS: { label: string; free: string; pro: string }[] = [
  { label: 'Decision explorations', free: `${FREE_WEEKLY_EXPLORATIONS} / week`, pro: 'Unlimited' },
  { label: 'Paths per decision', free: `Up to ${FREE_MAX_PATHS}`, pro: `Up to ${PRO_MAX_PATHS}` },
  { label: 'Where each path could split', free: '—', pro: 'Included' },
  { label: 'Comparison dimensions', free: '4', pro: 'All 8' },
  { label: 'Decision journal', free: `${FREE_SAVED_DECISIONS} decisions`, pro: 'Unlimited' },
];

type Notice = { tone: 'neutral' | 'gold' | 'danger'; title: string; body?: string } | null;

const STORE_NAME = Platform.OS === 'ios' ? 'App Store' : Platform.OS === 'android' ? 'Google Play' : 'store';

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
      setTimeout(close, 1200);
    } else if (outcome.status === 'pending') {
      setNotice({ tone: 'neutral', title: 'Purchase pending', body: 'Pro unlocks as soon as the store confirms it.' });
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
      setTimeout(close, 1200);
    } else if (outcome.status === 'nothing_to_restore') {
      setNotice({ tone: 'neutral', title: 'No active subscription found', body: 'There’s nothing to restore for this account.' });
    } else {
      setNotice({ tone: 'danger', title: 'Restore failed', body: outcome.message });
    }
  };

  const price = monthly?.product.priceString;
  const unavailable = status === 'unavailable' || (status === 'ready' && !monthly);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Backdrop tint={colors.gold} />
      <View style={styles.column}>
        <View style={styles.top}>
          <View />
          <IconButton icon="close" label="Close" onPress={close} framed />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FadeIn style={styles.hero}>
            <View style={styles.markRing}>
              <ForkMark size={56} left={colors.gold} right={colors.goldDeep} />
            </View>
            <Text variant="label" color={colors.gold}>
              Fork Pro
            </Text>
            <Text variant="display" align="center" accessibilityRole="header">
              Explore more possibilities.
            </Text>
            <Text align="center">{REASONS[reason ?? 'upgrade'] ?? REASONS.upgrade}</Text>
          </FadeIn>

          <FadeIn delay={100}>
            <View style={styles.table} accessibilityLabel="Free compared with Fork Pro">
              <View style={styles.tableHead}>
                <Text variant="label" style={styles.tableLabel}>
                  {' '}
                </Text>
                <Text variant="label" style={styles.tableCell}>
                  Free
                </Text>
                <Text variant="label" color={colors.gold} style={styles.tableCell}>
                  Pro
                </Text>
              </View>
              {ROWS.map((r) => (
                <View key={r.label} style={styles.tableRow} accessibilityLabel={`${r.label}: Free ${r.free}, Pro ${r.pro}`}>
                  <Text variant="small" color={colors.text} style={styles.tableLabel}>
                    {r.label}
                  </Text>
                  <Text variant="caption" style={styles.tableCell}>
                    {r.free}
                  </Text>
                  <View style={[styles.tableCell, styles.proCell]}>
                    <Icon name="check" size={12} color={colors.gold} strokeWidth={2.6} />
                    <Text variant="caption" color={colors.text}>
                      {r.pro}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeIn>

          {!isPro ? (
            <FadeIn delay={180}>
              <View style={styles.plan} accessibilityLabel={`Monthly plan${price ? `, ${price} per month` : ''}`}>
                <View style={styles.radio}>
                  <View style={styles.radioDot} />
                </View>
                <View style={styles.flex}>
                  <Text variant="heading">Monthly</Text>
                  <Text variant="caption">Billed monthly · cancel anytime</Text>
                </View>
                {status === 'loading' ? (
                  <ActivityIndicator color={colors.gold} />
                ) : price ? (
                  <View style={styles.priceWrap}>
                    <Text style={styles.price}>{price}</Text>
                    <Text variant="caption">/ month</Text>
                  </View>
                ) : (
                  <Text variant="caption">Unavailable</Text>
                )}
              </View>
              {mode === 'test' && monthly ? (
                <Text variant="caption" align="center" style={styles.mode}>
                  RevenueCat Test Store · {monthly.product.identifier} · no real money is charged
                </Text>
              ) : null}
            </FadeIn>
          ) : null}

          {notice ? (
            <View style={styles.notice}>
              <Banner tone={notice.tone} title={notice.title} body={notice.body} icon={notice.tone === 'gold' ? 'check' : 'info'} />
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {isPro ? (
            <Button label="You’re on Fork Pro" variant="secondary" onPress={close} />
          ) : unavailable ? (
            <>
              <Button label="Continue with Fork Pro" variant="gold" disabled onPress={() => {}} />
              <Text variant="caption" align="center">
                {mode === 'unconfigured'
                  ? 'Purchases aren’t configured in this build.'
                  : 'Fork Pro couldn’t load. Check your connection and reopen this screen.'}
              </Text>
            </>
          ) : (
            <>
              <Button
                label="Continue with Fork Pro"
                variant="gold"
                onPress={onBuy}
                loading={busy === 'buy'}
                disabled={busy !== null || status === 'loading'}
              />
              <Text variant="caption" align="center">
                {price ? `${price} per month. ` : ''}Renews automatically until cancelled. Cancel anytime in your {STORE_NAME} account settings at least
                24 hours before renewal.
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
  top: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.lg, height: 56, alignItems: 'center' },
  content: { paddingHorizontal: space.xl, paddingBottom: space.xl },
  hero: { alignItems: 'center', gap: space.sm, marginBottom: space.xl },
  markRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.gold, 0.08),
    borderWidth: 1,
    borderColor: alpha(colors.gold, 0.3),
    marginBottom: space.sm,
  },
  table: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    overflow: 'hidden',
    ...elevation.card,
  },
  tableHead: { flexDirection: 'row', paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.surface },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  tableLabel: { flex: 1.6 },
  tableCell: { flex: 1 },
  proCell: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  plan: {
    marginTop: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: alpha(colors.gold, 0.06),
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  priceWrap: { alignItems: 'flex-end' },
  price: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.text },
  mode: { marginTop: space.sm },
  notice: { marginTop: space.lg },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.md, gap: space.sm },
  links: { flexDirection: 'row', justifyContent: 'center', gap: space.xl },
});
