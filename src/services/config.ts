import { Platform } from 'react-native';

/**
 * Public, build-time configuration. Only values that are safe to ship inside a
 * mobile app belong here (EXPO_PUBLIC_*). Secrets live on the server.
 */
const read = (value: string | undefined) => (value && value.trim().length ? value.trim() : undefined);

const rcIos = read(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY);
const rcAndroid = read(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY);
const rcTest = read(process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY);

function revenueCatKey(): string | undefined {
  // Web and Expo Go can only use the Test Store key; native builds prefer the store key.
  if (Platform.OS === 'ios') return rcIos ?? rcTest;
  if (Platform.OS === 'android') return rcAndroid ?? rcTest;
  return rcTest;
}

export const config = {
  aiUrl: read(process.env.EXPO_PUBLIC_FORK_API_URL),
  aiKey: read(process.env.EXPO_PUBLIC_FORK_API_KEY),
  revenueCatKey: revenueCatKey(),
  entitlementId: read(process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT) ?? 'fork_pro',
};

export type BillingMode = 'test' | 'production' | 'unconfigured';

export function billingMode(key = config.revenueCatKey): BillingMode {
  if (!key) return 'unconfigured';
  return key.startsWith('test_') ? 'test' : 'production';
}
