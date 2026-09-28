import { Platform } from 'react-native';

/**
 * Public, build-time configuration. Only values that are safe to ship inside a
 * mobile app belong here (EXPO_PUBLIC_*). Secrets live on the server.
 *
 * The defaults below are the project's own PUBLIC endpoints, so a fresh clone runs
 * with live AI and RevenueCat Test Store purchases without any .env file:
 * - the Supabase anon key is designed to be public (the edge function keeps the
 *   model key server-side and rate-limits requests);
 * - a RevenueCat `test_` key is a public SDK key for the simulated Test Store.
 * Override any of them with EXPO_PUBLIC_* variables for your own deployment.
 */
const DEFAULT_AI_URL = 'https://gwruqdpbugqjrkyfvipa.supabase.co/functions/v1/analyze-decision';
const DEFAULT_AI_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cnVxZHBidWdxanJreWZ2aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTk3NDMsImV4cCI6MjA5ODM5NTc0M30.r-M2bpe7BVPtcwJEU-GYn4H0RGRhEsGxXSuxIVV_FWY';
const DEFAULT_RC_TEST_KEY = 'test_hpOvIzAjDWcgumcXqMtHjYBrjpG';

const read = (value: string | undefined) => (value && value.trim().length ? value.trim() : undefined);

const rcIos = read(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY);
const rcAndroid = read(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY);
const rcTest = read(process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY) ?? DEFAULT_RC_TEST_KEY;

function revenueCatKey(): string | undefined {
  // Web and Expo Go can only use the Test Store key; native builds prefer the store key.
  if (Platform.OS === 'ios') return rcIos ?? rcTest;
  if (Platform.OS === 'android') return rcAndroid ?? rcTest;
  return rcTest;
}

const customUrl = read(process.env.EXPO_PUBLIC_FORK_API_URL);

export const config = {
  aiUrl: customUrl ?? DEFAULT_AI_URL,
  // Only fall back to the default key when talking to the default endpoint.
  aiKey: read(process.env.EXPO_PUBLIC_FORK_API_KEY) ?? (customUrl ? undefined : DEFAULT_AI_KEY),
  revenueCatKey: revenueCatKey(),
  entitlementId: read(process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT) ?? 'fork_pro',
};

export type BillingMode = 'test' | 'production' | 'unconfigured';

export function billingMode(key = config.revenueCatKey): BillingMode {
  if (!key) return 'unconfigured';
  return key.startsWith('test_') ? 'test' : 'production';
}
