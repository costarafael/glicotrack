import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../context/ThemeContext';
import { DESIGN_TOKENS } from '../tokens/DesignTokens';

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * BaseModal Component
 *
 * Estrutura reutilizável para padronizar os 8 modais existentes
 *
 * Estrutura padronizada: overlay → modal → header → content
 * - borderRadius: 16 (padrão encontrado em todos os modais)
 * - Acessibilidade básica incluída
 * - Flexibilidade via children
 * - Keyboard avoiding para iOS/Android
 *
 * Uso:
 * <BaseModal visible={visible} onClose={onClose} title="Meu Modal">
 *   <Text>Conteúdo customizado aqui</Text>
 * </BaseModal>
 */
const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: theme.colors.background,
      borderRadius: DESIGN_TOKENS.radius.lg, // 16
      padding: DESIGN_TOKENS.spacing.xl, // 24
      margin: DESIGN_TOKENS.spacing.lg, // 20
      width: '90%',
      maxWidth: 400,
      elevation: 5,
      shadowColor: theme.colors.textSecondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: DESIGN_TOKENS.spacing.lg, // 20
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.text,
      flex: 1,
    },
    closeButton: {
      padding: DESIGN_TOKENS.spacing.xs, // 4
    },
    content: {
      // Removed flex: 1 to fix modal content visibility
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={styles.modal}
          accessibilityLabel={title ? `Modal: ${title}` : 'Modal'}
        >
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                accessibilityLabel="Fechar modal"
                accessibilityRole="button"
                activeOpacity={DESIGN_TOKENS.interaction.activeOpacity}
                hitSlop={DESIGN_TOKENS.interaction.hitSlop}
              >
                <Icon
                  name="close"
                  size={DESIGN_TOKENS.iconSize.lg}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.content}>{children}</View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default BaseModal;
