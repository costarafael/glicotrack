const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Configurações para React Native 0.80.2 com Nova Arquitetura
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    unstable_enableSymlinks: false,
  },
};

module.exports = mergeConfig(defaultConfig, config);
