/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-purchases', () => {
  const Purchases = {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
  };
  return {
    __esModule: true,
    default: Purchases,
    LOG_LEVEL: { WARN: 'WARN', DEBUG: 'DEBUG' },
    PURCHASES_ERROR_CODE: {
      PURCHASE_CANCELLED_ERROR: '1',
      PAYMENT_PENDING_ERROR: '20',
      NETWORK_ERROR: '10',
      OFFLINE_CONNECTION_ERROR: '35',
      PRODUCT_ALREADY_PURCHASED_ERROR: '6',
      PURCHASE_NOT_ALLOWED_ERROR: '3',
    },
  };
});
