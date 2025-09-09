/**
 * AccompanimentScreen - E-mails Acompanhantes
 * Permite gerenciar e-mails que recebem relatórios automáticos
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/useToast';
import { useCompanionEmails } from '../hooks/useCompanionEmails';
import { Toast } from '../components/Toast';
import { CompanionEmailItem } from '../components/CompanionEmailItem';
import { companionEmailsStyles } from '../styles/companionEmailsStyles';

export default function AccompanimentScreen() {
  const { theme } = useTheme();
  const { toast, hideToast } = useToast();

  const {
    // State
    emails,
    newEmail,
    isAddingEmail,
    confirmationCodes,
    // Actions
    setNewEmail,
    setIsAddingEmail,
    updateConfirmationCode,
    addEmail,
    removeEmail,
    confirmEmail,
    resendConfirmation,
    updateEmailSettings,
  } = useCompanionEmails();

  return (
    <View
      style={[
        companionEmailsStyles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView
        style={companionEmailsStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={companionEmailsStyles.header}>
          <Text
            style={[companionEmailsStyles.title, { color: theme.colors.text }]}
          >
            E-mails Acompanhantes
          </Text>
          <Text
            style={[
              companionEmailsStyles.subtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Configure e-mails para receber relatórios automáticos dos seus dados
          </Text>
        </View>

        {/* Adicionar Novo E-mail */}
        <View
          style={[
            companionEmailsStyles.section,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[
              companionEmailsStyles.sectionTitle,
              { color: theme.colors.text },
            ]}
          >
            Adicionar E-mail
          </Text>

          {!isAddingEmail ? (
            <TouchableOpacity
              style={companionEmailsStyles.addButton}
              onPress={() => setIsAddingEmail(true)}
            >
              <Icon name="plus" size={20} color={theme.colors.primary} />
              <Text
                style={[
                  companionEmailsStyles.addButtonText,
                  { color: theme.colors.primary },
                ]}
              >
                Adicionar E-mail Acompanhante
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={companionEmailsStyles.addEmailForm}>
              <TextInput
                style={[
                  companionEmailsStyles.emailInput,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                placeholder="Digite o e-mail (ex: medico@clinica.com)"
                placeholderTextColor={theme.colors.textSecondary}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <View style={companionEmailsStyles.formButtons}>
                <TouchableOpacity
                  style={[
                    companionEmailsStyles.formButton,
                    companionEmailsStyles.cancelButton,
                  ]}
                  onPress={() => {
                    setIsAddingEmail(false);
                    setNewEmail('');
                  }}
                >
                  <Text
                    style={[
                      companionEmailsStyles.formButtonText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    companionEmailsStyles.formButton,
                    companionEmailsStyles.confirmButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={addEmail}
                >
                  <Text style={companionEmailsStyles.confirmButtonText}>
                    Adicionar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Lista de E-mails */}
        {emails.length > 0 && (
          <View
            style={[
              companionEmailsStyles.section,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text
              style={[
                companionEmailsStyles.sectionTitle,
                { color: theme.colors.text },
              ]}
            >
              E-mails Cadastrados ({emails.length})
            </Text>

            {emails.map(email => (
              <CompanionEmailItem
                key={email.id}
                email={email}
                confirmationCode={confirmationCodes[email.id] || ''}
                onUpdateConfirmationCode={code =>
                  updateConfirmationCode(email.id, code)
                }
                onConfirm={() => confirmEmail(email.id)}
                onResend={() => resendConfirmation(email)}
                onRemove={() => removeEmail(email.id)}
                onUpdateSettings={(setting, value) =>
                  updateEmailSettings(email.id, setting, value)
                }
              />
            ))}
          </View>
        )}

        {/* Info quando não há e-mails */}
        {emails.length === 0 && (
          <View
            style={[
              companionEmailsStyles.emptyState,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Icon
              name="email-outline"
              size={48}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                companionEmailsStyles.emptyTitle,
                { color: theme.colors.text },
              ]}
            >
              Nenhum E-mail Cadastrado
            </Text>
            <Text
              style={[
                companionEmailsStyles.emptySubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              Adicione e-mails para que familiares ou médicos possam acompanhar
              seus dados através de relatórios automáticos.
            </Text>
          </View>
        )}

        {/* Footer Space */}
        <View style={companionEmailsStyles.footer} />
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}
