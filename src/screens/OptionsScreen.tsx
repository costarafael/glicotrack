/**
 * OptionsScreen - Nova Arquitetura v2.2
 * Tela de opções rearquitetada com nova estrutura organizacional
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../context/ThemeContext';
import { isFeatureEnabled, logFeatureFlags } from '../config/featureFlags';

export default function OptionsScreen() {
  const { theme, toggleTheme } = useTheme();
  const navigation = useNavigation();

  // Debug: Log das features ativas no desenvolvimento
  useEffect(() => {
    logFeatureFlags();
  }, []);

  const navigateToReminders = () => {
    // @ts-ignore - Navigation to SimpleRemindersScreen
    navigation.navigate('SimpleReminders');
  };

  const navigateToAccompaniment = () => {
    // @ts-ignore - Navigation to AccompanimentScreen
    navigation.navigate('Accompaniment');
  };

  const navigateToCompanionMode = () => {
    // 🚧 FEATURE DESABILITADA: Esta funcionalidade está oculta mas preservada
    // Para reativar: alterar COMPANION_MODE para true em src/config/featureFlags.ts
    // @ts-ignore - Navigation to CompanionModeScreen
    navigation.navigate('CompanionMode');
  };

  const navigateToAccount = () => {
    // @ts-ignore - Navigation to AccountScreen
    navigation.navigate('Account');
  };

  const OptionItem: React.FC<{
    title: string;
    subtitle?: string;
    icon: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    color?: string;
  }> = ({ title, subtitle, icon, onPress, rightElement, color }) => (
    <TouchableOpacity
      style={[styles.optionItem, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
    >
      <Icon
        name={icon}
        size={24}
        color={color || theme.colors.primary}
        style={styles.optionIcon}
      />
      <View style={styles.optionContent}>
        <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.optionSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        <Icon
          name="chevron-right"
          size={20}
          color={theme.colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Opções
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Configure o aplicativo conforme suas necessidades
          </Text>
        </View>

        {/* Main Options */}
        <View
          style={[styles.section, { backgroundColor: theme.colors.surface }]}
        >
          <OptionItem
            title="Lembretes"
            subtitle="Notificações personalizadas"
            icon="bell-outline"
            onPress={navigateToReminders}
          />

          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />

          <OptionItem
            title="E-mails Acompanhantes"
            subtitle="Relatórios periódicos para vários e-mails"
            icon="email-outline"
            onPress={navigateToAccompaniment}
          />

          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />

          <OptionItem
            title="Modo Escuro"
            subtitle={`Atualmente: ${theme.isDark ? 'Ativo' : 'Inativo'}`}
            icon={theme.isDark ? 'weather-night' : 'weather-sunny'}
            onPress={toggleTheme}
            rightElement={
              <Switch
                value={theme.isDark}
                onValueChange={toggleTheme}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary + '40',
                }}
                thumbColor={
                  theme.isDark
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
            }
          />

          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />

          <OptionItem
            title="Conta"
            subtitle="Configuração de recuperação e chave"
            icon="account-circle-outline"
            onPress={navigateToAccount}
          />
        </View>

        {/* Advanced Features - Condicionalmente renderizada */}
        {isFeatureEnabled('COMPANION_MODE') && (
          <View
            style={[styles.section, { backgroundColor: theme.colors.surface }]}
          >
            <OptionItem
              title="Modo de Acompanhamento"
              subtitle="Visualizar dados de outros usuários"
              icon="supervisor-account"
              onPress={navigateToCompanionMode}
            />
          </View>
        )}

        {/* App Version Text */}
        <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
          GlicoTrack 2.2
        </Text>

        {/* Footer Space */}
        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32, // Increased top padding for better spacing from status bar
  },
  header: {
    paddingVertical: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent', // Fixed: Use transparent border to avoid dark border in dark mode
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIcon: {
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  versionText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  footer: {
    height: 40,
  },
});