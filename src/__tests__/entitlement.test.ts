import type { CustomerInfo } from 'react-native-purchases';

import { modeForKey } from '../services/config';
import { describePurchaseError, hasProEntitlement } from '../services/revenuecat/purchases';

const info = (active: Record<string, { isActive: boolean }>) =>
  ({ entitlements: { active, all: active } }) as unknown as CustomerInfo;

describe('Fork Pro entitlement', () => {
  it('is active only when the fork_pro entitlement is active', () => {
    expect(hasProEntitlement(info({ fork_pro: { isActive: true } }))).toBe(true);
    expect(hasProEntitlement(info({ fork_pro: { isActive: false } }))).toBe(false);
    expect(hasProEntitlement(info({ something_else: { isActive: true } }))).toBe(false);
    expect(hasProEntitlement(null)).toBe(false);
    expect(hasProEntitlement(undefined)).toBe(false);
  });
});

describe('purchase error handling', () => {
  it('treats user cancellation as a non-error', () => {
    expect(describePurchaseError({ userCancelled: true })).toEqual({ status: 'cancelled' });
    expect(describePurchaseError({ code: '1' })).toEqual({ status: 'cancelled' });
  });

  it('recognises pending payments', () => {
    expect(describePurchaseError({ code: '20' })).toEqual({ status: 'pending' });
  });

  it('gives friendly messages for failures, never raw errors', () => {
    const offline = describePurchaseError({ code: '10', message: 'raw network stack' });
    expect(offline).toMatchObject({ status: 'failed' });
    expect(JSON.stringify(offline)).not.toContain('raw network stack');
    expect(describePurchaseError(new Error('boom'))).toMatchObject({ status: 'failed' });
    expect(describePurchaseError(undefined)).toMatchObject({ status: 'failed' });
  });
});

describe('billing mode', () => {
  it('distinguishes test, production and unconfigured', () => {
    expect(modeForKey(undefined)).toBe('unconfigured');
    expect(modeForKey('test_abc')).toBe('test');
    expect(modeForKey('appl_abc')).toBe('production');
    expect(modeForKey('goog_abc')).toBe('production');
  });
});
