/**
 * GlicoTrack - Glucose Monitoring App
 * Built with React Native New Architecture
 */

import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@rneui/themed';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { ThemeProvider as CustomThemeProvider } from './src/context/ThemeContext';
import { DataProvider } from './src/context/DataContext';
import { FirebaseProvider } from './src/context/FirebaseContext';
import { CompanionProvider } from './src/context/CompanionContext';
import AppNavigator from './src/navigation/AppNavigator';
import { DataMigrationService } from './src/services/DataMigrationService';
import { requestStartupPermissions } from './src/utils/permissions';

// Silence Firebase deprecation warnings temporarily until we can rebuild
if (__DEV__) {
  console.warn = (warning, ...args) => {
    if (typeof warning === 'string' && warning.includes('deprecated (as well as all React Native Firebase namespaced API)')) {
      return; // Skip Firebase deprecation warnings
    }
    console.log('WARN:', warning, ...args);
  };
}

function App(): React.JSX.Element {
  const [isInitializing, setIsInitializing] = useState(true);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing GlicoTrack with REFACTORED ARCHITECTURE v2.5...');
      console.log('📦 Service Container, DI System, and Modular Architecture ACTIVE');
      
      // Check and execute data migrations
      await DataMigrationService.runMigrationIfNeeded();
      
      // Request essential permissions on startup (especially for PDF export)
      console.log('🔒 Requesting startup permissions...');
      const permissionResult = await requestStartupPermissions();
      if (permissionResult.granted) {
        console.log('✅ Startup permissions granted');
      } else {
        console.warn('⚠️ Some startup permissions were not granted:', permissionResult.error);
        // Continue initialization even if permissions are not granted
        // User can still use the app, but PDF export might not work
      }
      
      console.log('✅ App initialization completed successfully');
      setIsInitializing(false);
      
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      setMigrationError(error instanceof Error ? error.message : 'Unknown error');
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Inicializando GlicoTrack...</Text>
          <Text style={styles.subText}>Verificando atualizações de dados</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (migrationError) {
    return (
      <SafeAreaProvider>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Erro na Inicialização</Text>
          <Text style={styles.errorMessage}>{migrationError}</Text>
          <Text style={styles.errorSubText}>
            Por favor, reinicie o aplicativo. Se o problema persistir, entre em contato com o suporte.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <CustomThemeProvider>
        <FirebaseProvider>
          <CompanionProvider>
            <DataProvider>
              <ThemeProvider>
                <AppNavigator />
              </ThemeProvider>
            </DataProvider>
          </CompanionProvider>
        </FirebaseProvider>
      </CustomThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default App;
