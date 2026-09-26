import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import { useForkStore } from '../../store/useForkStore';
import { billingMode, type BillingMode } from '../config';
import { track } from '../analytics';
import {
  configurePurchases,
  getCurrentOffering,
  getCustomerInfo,
  hasProEntitlement,
  onCustomerInfo,
  purchase as purchasePackage,
  restore as restorePurchases,
  type PurchaseOutcome,
  type RestoreOutcome,
} from './purchases';

type Status = 'loading' | 'ready' | 'unavailable';

type SubscriptionContextValue = {
  status: Status;
  mode: BillingMode;
  isPro: boolean;
  monthly: PurchasesPackage | null;
  managementURL: string | null;
  purchase: () => Promise<PurchaseOutcome>;
  restore: () => Promise<RestoreOutcome>;
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const mode = billingMode();
  const proCache = useForkStore((s) => s.proCache);
  const setProCache = useForkStore((s) => s.setProCache);
  // Configure once, synchronously, so the first render already knows whether billing exists.
  const [configured] = useState(() => mode !== 'unconfigured' && configurePurchases());
  const [status, setStatus] = useState<Status>(configured ? 'loading' : 'unavailable');
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [monthly, setMonthly] = useState<PurchasesPackage | null>(null);
  const started = useRef(false);

  const applyInfo = useCallback(
    (next: CustomerInfo | null) => {
      if (!next) return;
      setInfo(next);
      setProCache(hasProEntitlement(next));
    },
    [setProCache],
  );

  const loadOffering = useCallback(async () => {
    const offering = await getCurrentOffering();
    setMonthly(offering?.monthly ?? offering?.availablePackages[0] ?? null);
  }, []);

  const refresh = useCallback(async () => {
    applyInfo(await getCustomerInfo());
  }, [applyInfo]);

  useEffect(() => {
    if (started.current || !configured) return;
    started.current = true;
    const unsubscribe = onCustomerInfo(applyInfo);
    Promise.all([refresh(), loadOffering()]).finally(() => setStatus('ready'));
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      unsubscribe();
      sub.remove();
    };
  }, [applyInfo, configured, loadOffering, refresh]);

  const purchase = useCallback(async () => {
    let pkg = monthly;
    if (!pkg) {
      const offering = await getCurrentOffering();
      pkg = offering?.monthly ?? offering?.availablePackages[0] ?? null;
      setMonthly(pkg);
    }
    if (!pkg) return { status: 'failed', message: 'Fork Pro isn’t available right now.' } as const;
    track('purchase_started');
    const outcome = await purchasePackage(pkg);
    if (outcome.status === 'success') {
      applyInfo(outcome.customerInfo);
      track('purchase_completed');
    }
    return outcome;
  }, [applyInfo, monthly]);

  const restore = useCallback(async () => {
    const outcome = await restorePurchases();
    if (outcome.status !== 'failed') applyInfo(outcome.customerInfo);
    return outcome;
  }, [applyInfo]);

  // Until RevenueCat answers, trust the last known entitlement so Pro users aren't
  // locked out when offline. Once RevenueCat answers, it is the only source of truth.
  const isPro = info ? hasProEntitlement(info) : mode !== 'unconfigured' && proCache;

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      status,
      mode,
      isPro,
      monthly,
      managementURL: info?.managementURL ?? null,
      purchase,
      restore,
      refresh,
    }),
    [info?.managementURL, isPro, mode, monthly, purchase, refresh, restore, status],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider');
  return ctx;
}
