import { Platform } from 'react-native';

/**
 * Hides purely decorative graphics from assistive tech on every platform.
 * Native uses the RN props; on web react-native-svg forwards props to the DOM,
 * so we pass the standard aria attribute instead of RN-only ones (which React
 * would warn about as unknown DOM attributes).
 */
export const decorative: Record<string, unknown> =
  Platform.OS === 'web'
    ? { 'aria-hidden': true }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };
