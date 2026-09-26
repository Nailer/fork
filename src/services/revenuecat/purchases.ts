import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

import { billingMode, config } from '../config';

/**
 * Thin, centralised wrapper around the RevenueCat SDK. Screens never import
 * react-native-purchases directly — they go through this module (via the
 * SubscriptionProvider), so every call has consistent error handling.
 */

export const ENTITLEMENT_ID = config.entitlementId;

let configured = false;

export function isBillingAvailable() {
  return billingMode() !== 'unconfigured';
}

export function configurePurchases(): boolean {
  if (configured) return true;
  const apiKey = config.revenueCatKey;
  if (!apiKey) return false;
  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey });
    configured = true;
  } catch {
    configured = false;
  }
  return configured;
}

export function hasProEntitlement(info: CustomerInfo | null | undefined, entitlementId = ENTITLEMENT_ID) {
  return Boolean(info?.entitlements?.active?.[entitlementId]?.isActive);
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

export type PurchaseOutcome =
  | { status: 'success'; customerInfo: CustomerInfo }
  | { status: 'cancelled' }
  | { status: 'pending' }
  | { status: 'failed'; message: string };

type PurchasesErrorLike = { code?: string; userCancelled?: boolean | null; message?: string };

export function describePurchaseError(error: unknown): PurchaseOutcome {
  const e = (error ?? {}) as PurchasesErrorLike;
  if (e.userCancelled || e.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
    return { status: 'cancelled' };
  }
  if (e.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return { status: 'pending' };
  if (e.code === PURCHASES_ERROR_CODE.NETWORK_ERROR || e.code === PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR) {
    return { status: 'failed', message: 'You appear to be offline. Check your connection and try again.' };
  }
  if (e.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
    return { status: 'failed', message: 'You already own Fork Pro. Try “Restore purchases”.' };
  }
  if (e.code === PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR) {
    return { status: 'failed', message: 'Purchases aren’t allowed on this device.' };
  }
  return { status: 'failed', message: 'The purchase didn’t go through. You haven’t been charged.' };
}

export async function purchase(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  if (!configured) return { status: 'failed', message: 'Purchases aren’t available in this build.' };
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { status: 'success', customerInfo };
  } catch (error) {
    return describePurchaseError(error);
  }
}

export type RestoreOutcome =
  | { status: 'restored'; customerInfo: CustomerInfo }
  | { status: 'nothing_to_restore'; customerInfo: CustomerInfo }
  | { status: 'failed'; message: string };

export async function restore(): Promise<RestoreOutcome> {
  if (!configured) return { status: 'failed', message: 'Purchases aren’t available in this build.' };
  try {
    const customerInfo = await Purchases.restorePurchases();
    return hasProEntitlement(customerInfo)
      ? { status: 'restored', customerInfo }
      : { status: 'nothing_to_restore', customerInfo };
  } catch {
    return { status: 'failed', message: 'Couldn’t restore purchases. Check your connection and try again.' };
  }
}

export function onCustomerInfo(listener: (info: CustomerInfo) => void): () => void {
  if (!configured) return () => {};
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}
