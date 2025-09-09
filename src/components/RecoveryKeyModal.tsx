import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useFirebase } from '../context/FirebaseContext';
import { AccountRecoveryService } from '../services/AccountRecoveryService';

interface RecoveryKeyModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RecoveryKeyModal({
  visible,
  onClose,
  onSuccess,
}: RecoveryKeyModalProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { recoverAccount } = useData();
  const { refreshUserKey, reloadRepository } = useFirebase();

  const [recoveryKey, setRecoveryKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (visible) {
      setRecoveryKey('');
      setError('');
      setLoading(false);
      setValidating(false);
      setShowConfirmation(false);
    }
  }, [visible]);

  const formatKey = (text: string) => {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Limit to 8 characters
    const limited = cleaned.slice(0, 8);

    // Add hyphen after 4 characters if applicable
    if (limited.length > 4) {
      return `${limited.slice(0, 4)}-${limited.slice(4)}`;
    }

    return limited;
  };

  const validateKeyFormat = (key: string) => {
    const cleanKey = key.replace(/[^A-Z0-9]/gi, '');
    return /^[A-Z0-9]{8}$/i.test(cleanKey);
  };

  const handleKeyChange = (text: string) => {
    const formatted = formatKey(text);
    setRecoveryKey(formatted);
    setError('');
  };

  const handleValidateKey = async () => {
    const cleanKey = recoveryKey.replace(/[^A-Z0-9]/gi, '');

    if (!validateKeyFormat(cleanKey)) {
      setError('Chave deve ter exatamente 8 caracteres');
      return;
    }

    setError('');
    setValidating(true);

    try {
      // Check if the key exists in Firebase
      const keyExists = await checkKeyExists(cleanKey);

      if (keyExists) {
        setShowConfirmation(true);
      } else {
        setError(
          'Chave inválida ou não encontrada. Verifique a chave e sua conexão.',
        );
      }
    } catch (error) {
      console.error('Error validating key:', error);
      setError('Erro ao verificar a chave. Verifique sua conexão.');
    } finally {
      setValidating(false);
    }
  };

  const checkKeyExists = async (key: string): Promise<boolean> => {
    const recoveryService = AccountRecoveryService.getInstance();
    return await recoveryService.validateRecoveryKey(key);
  };

  const handleConfirmRecovery = async () => {
    const cleanKey = recoveryKey.replace(/[^A-Z0-9]/gi, '');
    setLoading(true);
    setError('');

    try {
      await recoverAccount(cleanKey);

      // CRÍTICO: Refresh Firebase context and reload repository
      await refreshUserKey();
      await reloadRepository();

      onSuccess?.();
      onClose();

      Alert.alert(
        'Sucesso',
        'Conta recuperada com sucesso! Seus dados foram mesclados e sincronizados.',
        [{ text: 'OK' }],
      );
    } catch (error) {
      console.error('Error recovering account:', error);
      setError('Ocorreu um erro durante a recuperação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  if (!visible) return null;

  const renderConfirmationDialog = () => (
    <Modal visible={showConfirmation} transparent animationType="fade">
      <View style={styles.confirmationOverlay}>
        <View
          style={[
            styles.confirmationContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.confirmationIcon}>
            <Icon name="alert-outline" size={48} color={colors.warning} />
          </View>

          <Text style={[styles.confirmationTitle, { color: colors.text }]}>
            Confirmar Recuperação?
          </Text>

          <Text style={[styles.confirmationMessage, { color: colors.text }]}>
            Encontramos dados na nuvem para a chave informada. Deseja mesclar
            esses dados com os registros feitos neste aparelho? A chave atual
            será substituída.
          </Text>

          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[
                styles.confirmationButton,
                styles.cancelButton,
                { backgroundColor: colors.border },
              ]}
              onPress={handleCancelConfirmation}
              disabled={loading}
            >
              <Text
                style={[styles.confirmationButtonText, { color: colors.text }]}
              >
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmationButton,
                styles.confirmButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleConfirmRecovery}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text
                  style={[
                    styles.confirmationButtonText,
                    { color: colors.background },
                  ]}
                >
                  Confirmar Merge
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={loading || validating}
            >
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Icon name="key-outline" size={48} color={colors.primary} />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Recuperar Conta
            </Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Digite a chave de 8 caracteres que você recebeu por email
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: error ? colors.error : colors.border,
                  },
                ]}
                value={recoveryKey}
                onChangeText={handleKeyChange}
                placeholder="XXXX-XXXX"
                placeholderTextColor={colors.textSecondary}
                maxLength={9} // 8 chars + 1 hyphen
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading && !validating}
                returnKeyType="done"
                onSubmitEditing={handleValidateKey}
              />

              {error ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              ) : null}
            </View>

            <View style={styles.hint}>
              <Icon
                name="information-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                A chave tem o formato XXXX-XXXX (exemplo: V60P-FBX1)
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: validateKeyFormat(
                    recoveryKey.replace(/[^A-Z0-9]/gi, ''),
                  )
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={handleValidateKey}
              disabled={
                !validateKeyFormat(recoveryKey.replace(/[^A-Z0-9]/gi, '')) ||
                validating ||
                loading
              }
            >
              {validating ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.background }]}>
                  Recuperar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {renderConfirmationDialog()}
    </>
  );
}

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: Math.min(screenWidth * 0.9, 400),
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontFamily: 'monospace',
    textAlign: 'center',
    letterSpacing: 2,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  hintText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Confirmation dialog styles
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationContainer: {
    width: Math.min(screenWidth * 0.9, 380),
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  confirmationIcon: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmationButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    marginRight: 6,
  },
  confirmButton: {
    marginLeft: 6,
  },
  confirmationButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
