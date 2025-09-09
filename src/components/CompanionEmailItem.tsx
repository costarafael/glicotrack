/**
 * CompanionEmailItem - Component for displaying and managing a companion email
 */

import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Switch } from 'react-native';
import Icon from "@react-native-vector-icons/material-design-icons";
import { useTheme } from '../context/ThemeContext';
import { CompanionEmail } from '../types/companionEmails';
import { companionEmailsStyles } from '../styles/companionEmailsStyles';

interface CompanionEmailItemProps {
  email: CompanionEmail;
  confirmationCode: string;
  onUpdateConfirmationCode: (code: string) => void;
  onConfirm: () => void;
  onResend: () => void;
  onRemove: () => void;
  onUpdateSettings: (setting: keyof CompanionEmail['settings'], value: boolean) => void;
}

export const CompanionEmailItem: React.FC<CompanionEmailItemProps> = ({
  email,
  confirmationCode,
  onUpdateConfirmationCode,
  onConfirm,
  onResend,
  onRemove,
  onUpdateSettings,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[companionEmailsStyles.emailItem, { backgroundColor: theme.colors.surface }]}>
      <View style={companionEmailsStyles.emailHeader}>
        <View style={companionEmailsStyles.emailInfo}>
          <Text style={[companionEmailsStyles.emailAddress, { color: theme.colors.text }]}>
            {email.email}
          </Text>
          <View style={companionEmailsStyles.statusContainer}>
            <Icon 
              name={email.confirmed ? 'verified' : 'pending'} 
              size={16} 
              color={email.confirmed ? theme.colors.success : theme.colors.warning} 
            />
            <Text style={[
              companionEmailsStyles.statusText, 
              { color: email.confirmed ? theme.colors.success : theme.colors.warning }
            ]}>
              {email.confirmed ? 'Confirmado' : 'Aguardando confirmação'}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={onRemove}
          style={companionEmailsStyles.removeButton}
        >
          <Icon name="delete-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      {/* Configurações de Relatórios */}
      <View style={companionEmailsStyles.settingsContainer}>
        <Text style={[companionEmailsStyles.settingsTitle, { color: theme.colors.text }]}>
          Relatórios:
        </Text>
        
        <View style={companionEmailsStyles.settingItem}>
          <Text style={[companionEmailsStyles.settingLabel, { color: theme.colors.text }]}>
            Relatório Diário
          </Text>
          <Switch
            value={email.settings.dailyReport}
            onValueChange={(value) => onUpdateSettings('dailyReport', value)}
            trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
            thumbColor={email.settings.dailyReport ? theme.colors.surface : theme.colors.textSecondary}
          />
        </View>

        <View style={companionEmailsStyles.settingItem}>
          <Text style={[companionEmailsStyles.settingLabel, { color: theme.colors.text }]}>
            Relatório Semanal
          </Text>
          <Switch
            value={email.settings.weeklyReport}
            onValueChange={(value) => onUpdateSettings('weeklyReport', value)}
            trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
            thumbColor={email.settings.weeklyReport ? theme.colors.surface : theme.colors.textSecondary}
          />
        </View>

        <View style={companionEmailsStyles.settingItem}>
          <View style={companionEmailsStyles.monthlyReportContainer}>
            <Text style={[companionEmailsStyles.settingLabel, { color: theme.colors.text }]}>
              Relatório Mensal
            </Text>
            <Text style={[companionEmailsStyles.alwaysOnLabel, { color: theme.colors.textSecondary }]}>
              (sempre ativo)
            </Text>
          </View>
          <Switch
            value={true}
            disabled={true}
            trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
            thumbColor={theme.colors.surface}
          />
        </View>
      </View>

      {/* Confirmação por Código */}
      {!email.confirmed && (
        <View style={companionEmailsStyles.confirmationContainer}>
          <Text style={[companionEmailsStyles.confirmationTitle, { color: theme.colors.text }]}>
            Confirmar E-mail
          </Text>
          <Text style={[companionEmailsStyles.confirmationSubtitle, { color: theme.colors.textSecondary }]}>
            Digite o código de 6 dígitos enviado para o e-mail
          </Text>
          
          <View style={companionEmailsStyles.confirmationInputContainer}>
            <TextInput
              style={[
                companionEmailsStyles.confirmationInput,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="000000"
              placeholderTextColor={theme.colors.textSecondary}
              value={confirmationCode}
              onChangeText={onUpdateConfirmationCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity 
              style={[
                companionEmailsStyles.confirmButton, 
                { 
                  backgroundColor: (confirmationCode?.length === 6) 
                    ? theme.colors.success 
                    : theme.colors.disabled 
                }
              ]}
              onPress={onConfirm}
              disabled={confirmationCode?.length !== 6}
            >
              <Icon 
                name="check" 
                size={16} 
                color={(confirmationCode?.length === 6) ? "white" : theme.colors.textSecondary} 
              />
              <Text style={[
                companionEmailsStyles.confirmButtonTextConfirm,
                { 
                  color: (confirmationCode?.length === 6) 
                    ? "white" 
                    : theme.colors.textSecondary 
                }
              ]}>
                Confirmar
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[companionEmailsStyles.resendButton, { backgroundColor: theme.colors.primary }]}
            onPress={onResend}
          >
            <Icon name="refresh" size={16} color="white" />
            <Text style={companionEmailsStyles.resendButtonText}>Reenviar Código</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};