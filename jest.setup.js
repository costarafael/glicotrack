// Basic mocks for RN Native Modules often used in this project

// Updated mocks for new per-family icon packages
jest.mock('@react-native-vector-icons/material-icons', () => 'Icon');
jest.mock('@react-native-vector-icons/material-design-icons', () => 'Icon');

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn().mockResolvedValue(''),
}));

jest.mock('react-native-mmkv', () => {
  class MMKV {
    store = new Map();
    getString(key) {
      return this.store.get(key) || null;
    }
    set(key, value) {
      this.store.set(key, value);
    }
    delete(key) {
      this.store.delete(key);
    }
    getBoolean(key) {
      return this.store.get(key) || false;
    }
    clearAll() {
      this.store.clear();
    }
  }
  return { MMKV };
});

jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn().mockResolvedValue('device-123'),
  getBrand: jest.fn().mockResolvedValue('brand'),
  getModel: jest.fn().mockResolvedValue('model'),
}));

jest.mock('react-native-fs', () => ({}));
jest.mock('react-native-blob-util', () => ({}));
jest.mock('@notifee/react-native', () => ({
  createChannel: jest.fn(),
  displayNotification: jest.fn(),
}));

// Firebase mocks (simplified)
jest.mock('@react-native-firebase/app', () => ({}));
jest.mock('@react-native-firebase/auth', () => ({}));
jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
}));
