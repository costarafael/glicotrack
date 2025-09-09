import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTheme } from '../context/ThemeContext';
import EmailRecoveryService from '../services/EmailRecoveryService';
import Icon from "@react-native-vector-icons/material-design-icons";
import { useToast } from '../hooks/useToast';
import { Toast } from './Toast';

interface EmailRecoveryModalProps {
  visible: boolean;
  onClose: () => void;
  userKey: string;
  onSuccess?: () => void;
  mode: 'associate' | 'recover';
}

export function EmailRecoveryModal({
  visible,
  onClose,
  userKey,
  onSuccess,
  mode = 'associate',
}: EmailRecoveryModalProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  
  // Refs for code input fields
  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Reset state when modal opens
    if (visible) {
      setEmail('');
      setError('');
      setFieldError('');
      setVerificationCode(['', '', '', '', '', '']);
      setShowVerificationModal(false);
      setLoading(false);
      setVerifying(false);
    }
  }, [visible]);

  // Handle paste from clipboard
  useEffect(() => {
    if (showVerificationModal) {
      checkClipboard();
    }
  }, [showVerificationModal]);

  const checkClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      if (/^\d{6}$/.test(clipboardContent)) {
        const digits = clipboardContent.split('');
        setVerificationCode(digits);
      }
    } catch (error) {
      console.log('Clipboard check failed:', error);
    }
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Por favor, digite seu e-mail');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let result;
      if (mode === 'associate') {
        result = await EmailRecoveryService.associateEmailWithKey(email, userKey);
      } else {
        result = await EmailRecoveryService.recoverKeyByEmail(email);
      }

      if (result.success) {
        if (mode === 'associate') {
          // Modo de associação: mostrar tela de verificação
          setShowVerificationModal(true);
          setFieldError('');
          showSuccess('Código enviado! Verifique seu email.');
        } else {
          // Modo de recuperação: chave foi enviada diretamente, fechar modal
          showSuccess('Chave enviada para seu email!');
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 1000); // Pequeno delay para mostrar o toast
        }
      } else {
        if (result.error?.includes('não cadastrado')) {
          showError('Email não encontrado');
        } else {
          showError(result.error || 'Erro ao enviar');
        }
        setError(result.error || 'Erro ao enviar código');
      }
    } catch (error) {
      console.error('Error sending code:', error);
      setError('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6);
      const digits = pastedCode.split('');
      const newCode = [...verificationCode];
      digits.forEach((digit, i) => {
        if (i < 6 && /\d/.test(digit)) {
          newCode[i] = digit;
        }
      });
      setVerificationCode(newCode);
      
      // Focus last filled input or last input
      const lastIndex = Math.min(digits.length - 1, 5);
      codeInputRefs.current[lastIndex]?.focus();
    } else if (/\d/.test(value) || value === '') {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);

      // Auto-focus next field
      if (value && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      // Move to previous field on backspace
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setFieldError('Digite o código completo');
      return;
    }

    setFieldError('');
    setVerifying(true);

    try {
      let result;
      if (mode === 'associate') {
        result = await EmailRecoveryService.verifyCode(email, code);
      } else {
        result = await EmailRecoveryService.verifyRecoveryCode(email, code);
      }

      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setFieldError(result.error || 'Código inválido');
        // Clear code for retry
        setVerificationCode(['', '', '', '', '', '']);
        codeInputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setFieldError('Erro ao verificar código');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setFieldError('');
    setVerificationCode(['', '', '', '', '', '']);
    setShowVerificationModal(false);
    handleSendCode();
  };

  const renderEmailInput = () => (
    <>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        disabled={loading}
      >
        <Icon name="close" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.iconContainer}>
        <Icon
          name={mode === 'associate' ? 'email-plus' : 'email-search'}
          size={48}
          color={colors.primary}
        />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {mode === 'associate' ? 'Adicionar E-mail de Recuperação' : 'Recuperar Conta'}
      </Text>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {mode === 'associate'
          ? 'Digite seu e-mail para poder recuperar sua chave futuramente'
          : 'Digite o e-mail cadastrado. Enviaremos sua chave diretamente.'}
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
        placeholder="seu@email.com"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!loading}
      />

      {error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : null}

      {mode === 'recover' && (
        <View style={[styles.warningBox, { backgroundColor: colors.warning + '20' }]}>
          <Icon name="alert" size={20} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.text }]}>
            Ao recuperar sua conta, os dados locais atuais serão substituídos
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: loading ? colors.disabled : colors.primary,
          },
        ]}
        onPress={handleSendCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.buttonText}>
            {mode === 'associate' ? 'Enviar Código' : 'Recuperar Chave'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onClose}
        disabled={loading}
      >
        <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
          Cancelar
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderVerificationInput = () => (
    <>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setShowVerificationModal(false)}
        disabled={verifying}
      >
        <Icon name="arrow-left" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.iconContainer}>
        <Icon name="email-check" size={48} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        Verificação de E-mail
      </Text>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Enviamos um código para:
      </Text>

      <Text style={[styles.emailText, { color: colors.text }]}>{email}</Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Digite o código de 6 dígitos:
      </Text>

      <View style={styles.codeContainer}>
        {verificationCode.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (codeInputRefs.current[index] = ref)}
            style={[
              styles.codeInput,
              {
                backgroundColor: verifying ? colors.disabled : colors.surface,
                color: colors.text,
                borderColor: fieldError ? colors.error : colors.border,
              },
            ]}
            value={digit}
            onChangeText={(value) => handleCodeChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="numeric"
            maxLength={1}
            editable={!verifying}
            selectTextOnFocus
          />
        ))}
      </View>

      {fieldError ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{fieldError}</Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: verifying ? colors.disabled : colors.primary,
          },
        ]}
        onPress={handleVerifyCode}
        disabled={verifying}
      >
        {verifying ? (
          <View style={styles.loadingButton}>
            <ActivityIndicator color="white" size="small" />
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>Verificando...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Verificar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResendCode}
        disabled={verifying}
      >
        <Text style={[styles.resendButtonText, { color: colors.primary }]}>
          Reenviar código
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={[styles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: colors.background },
              ]}
            >
              {showVerificationModal
                ? renderVerificationInput()
                : renderEmailInput()}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  codeInput: {
    width: 45,
    height: 50,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    borderWidth: 1,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
  },
  resendButton: {
    padding: 12,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});