/**
 * SyncSettings - Versão Refatorada
 * Componente limpo focado apenas no controle básico de sincronização Firebase
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../context/ThemeContext';
import { useFirebase } from '../context/FirebaseContext';
import { formatDateTimeBR } from '../utils/dateHelpers';
import { RecoveryKeyModal } from './RecoveryKeyModal';

const SyncSettings: React.FC = () => {
  const { theme } = useTheme();
  const {
    syncStatus,
    enableSync,
    disableSync,
    forceSync,
    copyUserKeyToClipboard,
  } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  const styles = createStyles(theme.colors);

  const handleToggleSync = async () => {
    setIsLoading(true);
    try {
      if (syncStatus.isEnabled) {
        disableSync();
      } else {
        await enableSync();
      }
    } catch (error) {
      console.error(
        'Error toggling sync:',
        error?.code || 'unknown',
        error?.message || 'Unknown error',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceSync = async () => {
    if (!syncStatus.isEnabled) return;

    setIsLoading(true);
    try {
      await forceSync();
    } catch (error) {
      console.error(
        'Error forcing sync:',
        error?.code || 'unknown',
        error?.message || 'Unknown error',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatSyncStatus = () => {
    if (syncStatus.isInitializing) return 'Inicializando...';
    if (!syncStatus.isEnabled) return 'Desabilitada';

    // ✅ NOVO: Usar status simplificado do repository
    if (syncStatus.syncStatus) {
      switch (syncStatus.syncStatus) {
        case 'offline':
          return 'Offline';
        case 'syncing':
          return 'Sincronizando...';
        case 'pending':
          return 'Aguardando conexão';
        case 'synced':
          return 'Atualizado';
        default:
          return 'Aguardando';
      }
    }

    // Fallback para compatibilidade
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.pending > 0) return 'Aguardando conexão';
    return 'Atualizado';
  };

  const getStatusIcon = () => {
    if (syncStatus.isInitializing) return 'timer';
    if (!syncStatus.isEnabled) return 'sync-off';

    // ✅ NOVO: Ícones baseados no status simplificado
    if (syncStatus.syncStatus) {
      switch (syncStatus.syncStatus) {
        case 'offline':
          return 'cloud-off';
        case 'syncing':
          return 'sync';
        case 'pending':
          return 'sync-alert';
        case 'synced':
          return 'cloud-check';
        default:
          return 'sync';
      }
    }

    // Fallback
    if (!syncStatus.isOnline) return 'cloud-off';
    if (syncStatus.pending > 0) return 'sync-alert';
    return 'cloud-check';
  };

  const getStatusColor = () => {
    if (syncStatus.isInitializing) return theme.colors.warning;
    if (!syncStatus.isEnabled) return theme.colors.textSecondary;

    // ✅ NOVO: Cores baseadas no status simplificado
    if (syncStatus.syncStatus) {
      switch (syncStatus.syncStatus) {
        case 'offline':
          return theme.colors.error;
        case 'syncing':
          return theme.colors.primary;
        case 'pending':
          return theme.colors.warning;
        case 'synced':
          return theme.colors.success;
        default:
          return theme.colors.warning;
      }
    }

    // Fallback
    if (!syncStatus.isOnline) return theme.colors.error;
    if (syncStatus.pending > 0) return theme.colors.warning;
    return theme.colors.success;
  };

  return (
    <View style={styles.container}>
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <Icon name={getStatusIcon()} size={24} color={getStatusColor()} />
        <View style={styles.statusText}>
          <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
            Sincronização Firebase
          </Text>
          <Text style={[styles.statusSubtitle, { color: getStatusColor() }]}>
            {formatSyncStatus()}
          </Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Switch
            value={syncStatus.isEnabled}
            onValueChange={handleToggleSync}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary,
            }}
            thumbColor={theme.colors.surface}
          />
        )}
      </View>

      {/* User Key Section */}
      {syncStatus.isEnabled && syncStatus.userKey && (
        <View style={styles.keySection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Sua Chave de Usuário
          </Text>
          <TouchableOpacity
            style={[
              styles.keyButton,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={copyUserKeyToClipboard}
          >
            <Text style={[styles.keyText, { color: theme.colors.text }]}>
              {syncStatus.userKey}
            </Text>
            <Icon name="content-copy" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.keyHint, { color: theme.colors.textSecondary }]}>
            Toque para copiar sua chave
          </Text>
        </View>
      )}

      {/* Account Recovery Section */}
      <View style={styles.recoverySection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recuperação de Conta
        </Text>
        <TouchableOpacity
          style={[
            styles.recoveryButton,
            { backgroundColor: theme.colors.secondary },
          ]}
          onPress={() => setShowRecoveryModal(true)}
        >
          <Icon name="key-outline" size={20} color={theme.colors.primary} />
          <Text
            style={[styles.recoveryButtonText, { color: theme.colors.primary }]}
          >
            Recuperar Conta
          </Text>
        </TouchableOpacity>
        <Text
          style={[styles.recoveryHint, { color: theme.colors.textSecondary }]}
        >
          Use a chave recebida por email para recuperar sua conta
        </Text>
      </View>

      {/* Status Info - Última Sincronização */}
      {syncStatus.isEnabled && syncStatus.lastSync && (
        <View style={styles.infoSection}>
          <Text
            style={[styles.lastSyncText, { color: theme.colors.textSecondary }]}
          >
            Última sincronização: {formatDateTimeBR(syncStatus.lastSync)}
          </Text>
        </View>
      )}

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          A sincronização mantém seus dados seguros na nuvem e permite acesso de
          múltiplos dispositivos.
        </Text>
      </View>

      <RecoveryKeyModal
        visible={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        onSuccess={() => {
          setShowRecoveryModal(false);
          // The modal will handle showing success message
        }}
      />
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    statusText: {
      flex: 1,
      marginLeft: 12,
    },
    statusTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    statusSubtitle: {
      fontSize: 14,
      marginTop: 2,
    },
    keySection: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    keyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    keyText: {
      fontFamily: 'monospace',
      fontSize: 16,
      fontWeight: 'bold',
    },
    keyHint: {
      fontSize: 12,
      marginTop: 4,
      textAlign: 'center',
    },
    actionsSection: {
      marginBottom: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    actionButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    lastSyncText: {
      fontSize: 12,
      textAlign: 'center',
    },
    infoSection: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
    infoText: {
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },
    recoverySection: {
      marginBottom: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
    },
    recoveryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      marginBottom: 8,
    },
    recoveryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    recoveryHint: {
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 16,
    },
  });

export default SyncSettings;
