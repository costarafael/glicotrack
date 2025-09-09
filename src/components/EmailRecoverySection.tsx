/**
 * Seção Email Recovery - Gestão de recuperação por email
 * Componente focado na UI de associação/recuperação de email
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from "@react-native-vector-icons/material-design-icons";
import { useTheme } from '../context/ThemeContext';

interface EmailRecoverySectionProps {
  recoveryEmail: string | null;
  currentUserKey: string;
  onOpenAssociateModal: () => void;
  onOpenRecoverModal: () => void;
  onRemoveEmail: () => Promise<void>;
}

export const EmailRecoverySection: React.FC<EmailRecoverySectionProps> = ({
  recoveryEmail,
  currentUserKey,
  onOpenAssociateModal,
  onOpenRecoverModal,
  onRemoveEmail,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme.colors);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon name="email-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.sectionTitle}>Recuperação por Email</Text>
      </View>
      <Text style={styles.sectionDescription}>
        Associe um email para recuperar sua chave em caso de perda do dispositivo
      </Text>
      {recoveryEmail ? (
        // Email já associado
        (<View style={styles.emailAssociatedContainer}>
          <View style={styles.emailInfo}>
            <Icon name="check-circle-outline" size={20} color="#4CAF50" />
            <View style={styles.emailTextContainer}>
              <Text style={styles.emailLabel}>Email associado:</Text>
              <Text style={styles.emailText}>{recoveryEmail}</Text>
            </View>
          </View>
          <View style={styles.emailActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onRemoveEmail}
            >
              <Icon name="delete-outline" size={16} color={theme.colors.error} />
              <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                Remover Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={onOpenAssociateModal}
            >
              <Icon name="pencil-outline" size={16} color="white" />
              <Text style={[styles.actionButtonText, { color: 'white' }]}>
                Alterar Email
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recoveryInfo}>
            <Icon name="information-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.recoveryInfoText}>
              Você pode usar este email para recuperar sua chave se perder acesso ao dispositivo
            </Text>
          </View>
        </View>)
      ) : (
        // Nenhum email associado
        (<View style={styles.noEmailContainer}>
          <View style={styles.warningContainer}>
            <Icon name="alert-outline" size={20} color={theme.colors.warning || '#FF9800'} />
            <Text style={styles.warningText}>
              Nenhum email associado à sua conta
            </Text>
          </View>
          <Text style={styles.warningDescription}>
            Sem um email associado, você não conseguirá recuperar seus dados se perder acesso ao dispositivo.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, styles.fullWidthButton]}
            onPress={onOpenAssociateModal}
          >
            <Icon name="email-outline" size={16} color="white" />
            <Text style={[styles.actionButtonText, { color: 'white' }]}>
              Associar Email
            </Text>
          </TouchableOpacity>
        </View>)
      )}
      {/* Seção de recuperação */}
      <View style={styles.recoverySection}>
        <Text style={styles.recoverySectionTitle}>Perdeu acesso aos seus dados?</Text>
        <Text style={styles.recoverySectionDescription}>
          Se você já associou um email anteriormente, pode recuperar sua chave de usuário
        </Text>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton, styles.fullWidthButton]}
          onPress={onOpenRecoverModal}
        >
          <Icon name="backup-restore" size={16} color={theme.colors.primary} />
          <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
            Recuperar Chave por Email
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  emailAssociatedContainer: {
    marginBottom: 16,
  },
  emailInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  emailTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  emailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  emailActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  recoveryInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 6,
  },
  recoveryInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  noEmailContainer: {
    marginBottom: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning || '#FF9800',
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.warning || '#FF9800',
    marginLeft: 8,
  },
  warningDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  recoverySection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recoverySectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  recoverySectionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fullWidthButton: {
    flex: undefined,
    width: '100%',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});