/**
 * Minimal product-event hook. Events carry no decision text or personal data —
 * only the event name and small, non-identifying properties. No third-party
 * analytics SDK is bundled; events are only printed in development builds.
 */
export type ProductEvent =
  | 'onboarding_completed'
  | 'decision_started'
  | 'decision_generated'
  | 'sample_opened'
  | 'scenario_opened'
  | 'comparison_opened'
  | 'decision_saved'
  | 'paywall_viewed'
  | 'purchase_started'
  | 'purchase_completed';

type Props = Record<string, string | number | boolean>;

export function track(event: ProductEvent, props?: Props) {
  if (__DEV__) console.log(`[event] ${event}`, props ?? '');
}
