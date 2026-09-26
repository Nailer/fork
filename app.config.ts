import type { ExpoConfig } from 'expo/config';

// Bundle identifiers are configurable so the app can be published under the
// owner's own developer account without editing code.
const bundleId = process.env.APP_BUNDLE_ID ?? 'io.github.nailer.fork';

const config: ExpoConfig = {
  name: 'Fork',
  slug: 'fork',
  scheme: 'fork',
  version: '1.0.0',
  description: 'Explore the paths behind difficult decisions.',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0A0B0F',
  ios: {
    bundleIdentifier: bundleId,
    buildNumber: '1',
    supportsTablet: false,
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: bundleId,
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#0A0B0F',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    // RevenueCat adds BILLING itself; nothing else is needed.
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    output: 'single',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 120,
        resizeMode: 'contain',
        backgroundColor: '#0A0B0F',
      },
    ],
    'expo-font',
  ],
  experiments: { typedRoutes: false },
  extra: {
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
};

export default config;
