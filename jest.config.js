module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|@react-native-clipboard/clipboard|react-native-mmkv|@react-native-firebase)/)'
  ],
  setupFiles: [
    '<rootDir>/jest.setup.js'
  ],
};
