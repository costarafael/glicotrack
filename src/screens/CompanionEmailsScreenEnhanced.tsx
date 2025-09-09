/**
 * CompanionEmailsScreen Enhanced - Sistema Completo de E-mails Acompanhantes
 * Tela completa com gerenciamento de emails, configuração de períodos e dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  RefreshControl,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../context/ThemeContext';
import {
  EmailConfigService,
  EmailConfig,
} from '../services/EmailConfigService';
import { BackgroundScheduler } from '../services/BackgroundScheduler';
import { ReportEmailScheduler } from '../services/ReportEmailScheduler';
import { EmailTemplateService } from '../services/EmailTemplateService';
import ResendEmailService from '../services/ResendEmailService';
import { UserKeyService } from '../services/UserKeyService';
import { CompanionReportGenerator } from '../services/CompanionReportGenerator';

interface EmailFormData {
  email: string;
  name: string;
  periods: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
}

export default function CompanionEmailsScreenEnhanced() {
  const { theme } = useTheme();

  // Estado
  const [emails, setEmails] = useState<EmailConfig[]>([]);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [emailForm, setEmailForm] = useState<EmailFormData>({
    email: '',
    name: '',
    periods: { daily: false, weekly: true, monthly: true },
  });
  const [stats, setStats] = useState<any>(null);
  const [queueStats, setQueueStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Estados para confirmação de email
  const [pendingEmail, setPendingEmail] = useState<{
    email: string;
    name: string;
    periods: any;
    token: string;
  } | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadEmails();
    loadStats();
  }, []);

  const loadEmails = async () => {
    try {
      const emailConfigs = EmailConfigService.getAllEmailConfigs();
      setEmails(emailConfigs);
    } catch (error) {
      console.error('Erro ao carregar emails:', error);
    }
  };

  const loadStats = async () => {
    try {
      const systemStats = EmailConfigService.getSystemStats();
      const schedulerStats = BackgroundScheduler.getStats();
      const emailQueue = ReportEmailScheduler.getQueueStats();

      setStats(systemStats);
      setQueueStats(emailQueue);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadEmails();
    await loadStats();
    setIsRefreshing(false);
  };

  const handleAddEmail = async () => {
    if (!emailForm.email.trim() || !emailForm.name.trim()) {
      Alert.alert('Erro', 'Preencha email e nome');
      return;
    }

    try {
      const userKeyService = UserKeyService.getInstance();
      const userKey = await userKeyService.getUserKey();
      if (!userKey) {
        throw new Error('Chave do usuário não encontrada');
      }

      // Gerar token de confirmação
      const confirmationToken =
        Date.now().toString() + Math.random().toString(36).substr(2, 9);

      // Enviar email de confirmação
      console.log('📧 Enviando email de confirmação...');
      const emailResult =
        await ResendEmailService.sendCompanionConfirmationEmail(
          emailForm.email,
          confirmationToken,
          userKey,
        );

      if (emailResult.success) {
        // Salvar email como pendente
        setPendingEmail({
          email: emailForm.email,
          name: emailForm.name,
          periods: emailForm.periods,
          token: confirmationToken,
        });

        // Limpar formulário de adição e mostrar formulário de confirmação
        setEmailForm({
          email: '',
          name: '',
          periods: { daily: false, weekly: true, monthly: true },
        });
        setIsAddingEmail(false);

        Alert.alert(
          'Email Enviado!',
          `Código de confirmação enviado para ${emailForm.email}. Verifique sua caixa de entrada e digite o código recebido.`,
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert('Erro', `Falha ao enviar email: ${emailResult.error}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', errorMessage);
    }
  };

  const handleConfirmEmail = async () => {
    if (!pendingEmail) return;

    if (!confirmationCode.trim()) {
      Alert.alert('Erro', 'Digite o código de confirmação');
      return;
    }

    setIsConfirming(true);
    try {
      // Gerar código esperado baseado no token (usando mesma lógica do ResendEmailService)
      const expectedCode = generateConfirmationCode(pendingEmail.token);

      if (confirmationCode === expectedCode) {
        // Código correto - adicionar email como verificado
        const newEmailConfig = await EmailConfigService.addEmail(
          pendingEmail.email,
          pendingEmail.name,
          pendingEmail.periods,
        );

        // Marcar como verificado
        EmailConfigService.updateEmailConfig(newEmailConfig.id, {
          verified: true,
        });

        // Enviar email de boas-vindas
        await sendTestEmail(newEmailConfig);

        // Limpar estado de confirmação
        setPendingEmail(null);
        setConfirmationCode('');

        // Recarregar lista
        await loadEmails();
        await loadStats();

        Alert.alert('Sucesso!', 'Email confirmado e adicionado com sucesso!');
      } else {
        Alert.alert(
          'Código Inválido',
          'O código digitado está incorreto. Verifique o email recebido.',
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsConfirming(false);
    }
  };

  const generateConfirmationCode = (token: string): string => {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const code = Math.abs(hash % 1000000)
      .toString()
      .padStart(6, '0');
    return code;
  };

  const sendTestEmail = async (emailConfig: EmailConfig) => {
    try {
      const userKeyService = UserKeyService.getInstance();
      const userKey = await userKeyService.getUserKey();
      const testTemplate = EmailTemplateService.generateTestEmailTemplate(
        userKey || 'DEMO',
        emailConfig.email,
      );

      await ResendEmailService.sendEmail({
        to: emailConfig.email,
        subject: '✅ GlicoTrack - Email Configurado com Sucesso',
        html: testTemplate,
      });

      console.log(`✅ Email de teste enviado para: ${emailConfig.email}`);
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
    }
  };

  const handleRemoveEmail = (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    Alert.alert(
      'Remover Email',
      `Deseja remover "${email.name}" (${email.email})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            EmailConfigService.removeEmail(emailId);
            await loadEmails();
            await loadStats();
          },
        },
      ],
    );
  };

  const handleToggleEmail = async (emailId: string) => {
    EmailConfigService.toggleEmailEnabled(emailId);
    await loadEmails();
    await loadStats();
  };

  const handleUpdatePeriods = async (
    emailId: string,
    periods: { daily: boolean; weekly: boolean; monthly: boolean },
  ) => {
    EmailConfigService.updateEmailConfig(emailId, { periods });
    await loadEmails();
    await loadStats();
  };

  const handleSendTestReports = async () => {
    if (emails.filter(e => e.enabled).length === 0) {
      Alert.alert('Aviso', 'Nenhum email ativo para envio');
      return;
    }

    setIsSending(true);
    try {
      const userKeyService = UserKeyService.getInstance();
      const userKey = await userKeyService.getUserKey();
      if (!userKey) {
        throw new Error('Chave do usuário não encontrada');
      }

      console.log(
        '🧪 [TestReports] Enviando emails de teste para todos os emails ativos...',
      );

      // Enviar diretamente para todos os emails ativos (bypass do scheduler)
      let emailsSent = 0;
      const activeEmails = emails.filter(e => e.enabled && e.verified);

      for (const emailConfig of activeEmails) {
        try {
          console.log(`📧 [TestReports] Enviando para: ${emailConfig.email}`);

          // Criar dados de amostra para relatório médico real
          const sampleDailyLog = {
            date: new Date().toISOString().split('T')[0],
            glucoseEntries: [
              {
                timestamp: new Date('2025-01-01T07:30:00'),
                value: 88,
                mealType: 'breakfast',
              },
              {
                timestamp: new Date('2025-01-01T09:15:00'),
                value: 152,
                mealType: 'post_breakfast',
              },
              {
                timestamp: new Date('2025-01-01T12:30:00'),
                value: 95,
                mealType: 'lunch',
              },
              {
                timestamp: new Date('2025-01-01T14:45:00'),
                value: 168,
                mealType: 'post_lunch',
              },
              {
                timestamp: new Date('2025-01-01T19:00:00'),
                value: 125,
                mealType: 'dinner',
              },
              {
                timestamp: new Date('2025-01-01T21:30:00'),
                value: 142,
                mealType: 'post_dinner',
              },
              {
                timestamp: new Date('2025-01-01T23:15:00'),
                value: 105,
                mealType: 'bedtime',
              },
            ],
            bolusEntries: [
              { timestamp: new Date('2025-01-01T07:30:00'), value: 6 },
              { timestamp: new Date('2025-01-01T12:30:00'), value: 8 },
              { timestamp: new Date('2025-01-01T19:00:00'), value: 7 },
            ],
            basalEntry: { value: 24 },
            notes:
              'Dia regular com exercício leve pela manhã. Pequeno lanche antes do jantar.',
          };

          // Gerar relatório médico completo com análises reais
          const reportData = await CompanionReportGenerator.generateDailyReport(
            sampleDailyLog,
            userKey,
          );

          // Usar template HTML de relatório médico profissional
          const reportTemplate =
            EmailTemplateService.generateDailyReportTemplate(reportData);

          // Enviar diretamente via ResendEmailService
          const result = await ResendEmailService.sendEmail({
            to: emailConfig.email,
            subject: `📊 GlicoTrack - Prévia de Relatório Médico (${new Date().toLocaleDateString(
              'pt-BR',
            )})`,
            html: reportTemplate,
          });

          if (result.success) {
            emailsSent++;
            console.log(
              `✅ [TestReports] Relatório médico enviado para ${emailConfig.email}`,
            );
          } else {
            console.error(
              `❌ [TestReports] Falha para ${emailConfig.email}:`,
              result.error,
            );
          }
        } catch (emailError) {
          console.error(
            `❌ [TestReports] Erro ao enviar para ${emailConfig.email}:`,
            emailError,
          );
        }
      }

      if (emailsSent > 0) {
        Alert.alert(
          'Sucesso',
          `${emailsSent} relatórios médicos de amostra enviados! Verifique as caixas de entrada para ver como será o formato dos relatórios.`,
        );
      } else {
        Alert.alert(
          'Aviso',
          'Nenhum email foi enviado. Verifique se há emails verificados e ativos.',
        );
      }

      await loadStats();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Falha no envio: ${errorMessage}`);
      console.error('❌ [TestReports] Erro geral:', error);
    } finally {
      setIsSending(false);
    }
  };

  const renderEmailItem = (email: EmailConfig) => (
    <View
      key={email.id}
      style={[
        styles.emailItem,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Header do Email */}
      <View style={styles.emailHeader}>
        <View style={styles.emailInfo}>
          <Text style={[styles.emailName, { color: theme.colors.text }]}>
            {email.name}
          </Text>
          <Text
            style={[styles.emailAddress, { color: theme.colors.textSecondary }]}
          >
            {email.email}
          </Text>
        </View>

        <View style={styles.emailControls}>
          <Switch
            value={email.enabled}
            onValueChange={() => handleToggleEmail(email.id)}
            trackColor={{ true: theme.colors.primary }}
          />
          <TouchableOpacity
            onPress={() => handleRemoveEmail(email.id)}
            style={styles.removeButton}
          >
            <Icon name="delete-outline" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: email.verified
                ? theme.colors.success
                : theme.colors.warning,
            },
          ]}
        >
          <Text style={styles.statusText}>
            {email.verified ? '✅ Verificado' : '⏳ Pendente'}
          </Text>
        </View>

        {email.enabled && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={styles.statusText}>🔔 Ativo</Text>
          </View>
        )}
      </View>

      {/* Períodos */}
      <View style={styles.periodsSection}>
        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
          Relatórios:
        </Text>

        <View style={styles.periodToggles}>
          {[
            { key: 'daily', label: 'Diário' },
            { key: 'weekly', label: 'Semanal' },
            { key: 'monthly', label: 'Mensal' },
          ].map(period => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                {
                  backgroundColor: email.periods[
                    period.key as keyof typeof email.periods
                  ]
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                const newPeriods = {
                  ...email.periods,
                  [period.key]:
                    !email.periods[period.key as keyof typeof email.periods],
                };
                handleUpdatePeriods(email.id, newPeriods);
              }}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color: email.periods[
                      period.key as keyof typeof email.periods
                    ]
                      ? 'white'
                      : theme.colors.text,
                  },
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Último Envio */}
      {(email.lastSent.daily ||
        email.lastSent.weekly ||
        email.lastSent.monthly) && (
        <View style={styles.lastSentSection}>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}
          >
            Último envio:
          </Text>
          {email.lastSent.daily && (
            <Text
              style={[
                styles.lastSentText,
                { color: theme.colors.textSecondary },
              ]}
            >
              • Diário:{' '}
              {new Date(email.lastSent.daily).toLocaleDateString('pt-BR')}
            </Text>
          )}
          {email.lastSent.weekly && (
            <Text
              style={[
                styles.lastSentText,
                { color: theme.colors.textSecondary },
              ]}
            >
              • Semanal:{' '}
              {new Date(email.lastSent.weekly).toLocaleDateString('pt-BR')}
            </Text>
          )}
          {email.lastSent.monthly && (
            <Text
              style={[
                styles.lastSentText,
                { color: theme.colors.textSecondary },
              ]}
            >
              • Mensal:{' '}
              {new Date(email.lastSent.monthly).toLocaleDateString('pt-BR')}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            📧 E-mails Acompanhantes
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Relatórios automáticos enviados por email
          </Text>
        </View>

        {/* Dashboard Stats */}
        {stats && (
          <View
            style={[
              styles.statsContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text
                  style={[styles.statNumber, { color: theme.colors.primary }]}
                >
                  {stats.enabledEmails}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Ativos
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text
                  style={[styles.statNumber, { color: theme.colors.success }]}
                >
                  {queueStats?.sent || 0}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Enviados
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text
                  style={[styles.statNumber, { color: theme.colors.warning }]}
                >
                  {queueStats?.pending || 0}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Pendentes
                </Text>
              </View>
            </View>

            {stats.lastDailySent && (
              <Text
                style={[
                  styles.lastActivity,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Último envio:{' '}
                {new Date(stats.lastDailySent).toLocaleString('pt-BR')}
              </Text>
            )}
          </View>
        )}

        {/* Lista de Emails */}
        <View style={styles.emailsList}>{emails.map(renderEmailItem)}</View>

        {/* Formulário de Confirmação de Email */}
        {pendingEmail && (
          <View
            style={[
              styles.confirmationForm,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>
              📧 Confirme seu Email
            </Text>

            <Text
              style={[
                styles.confirmationMessage,
                { color: theme.colors.textSecondary },
              ]}
            >
              Enviamos um código de 6 dígitos para:
            </Text>
            <Text
              style={[styles.emailToConfirm, { color: theme.colors.primary }]}
            >
              {pendingEmail.email}
            </Text>

            <TextInput
              style={[
                styles.confirmationInput,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Digite o código (6 dígitos)"
              placeholderTextColor={theme.colors.textSecondary}
              value={confirmationCode}
              onChangeText={setConfirmationCode}
              keyboardType="numeric"
              maxLength={6}
              autoCapitalize="none"
              textAlign="center"
            />

            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: theme.colors.border },
                ]}
                onPress={() => {
                  setPendingEmail(null);
                  setConfirmationCode('');
                }}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: theme.colors.text },
                  ]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: theme.colors.success,
                    opacity: isConfirming ? 0.7 : 1,
                  },
                ]}
                onPress={handleConfirmEmail}
                disabled={isConfirming}
              >
                <Text style={styles.confirmButtonText}>
                  {isConfirming ? 'Confirmando...' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.confirmationHelp,
                { color: theme.colors.textSecondary },
              ]}
            >
              Não recebeu o código? Verifique a pasta de spam.
            </Text>
          </View>
        )}

        {/* Formulário Adicionar Email */}
        {isAddingEmail ? (
          <View
            style={[styles.addForm, { backgroundColor: theme.colors.surface }]}
          >
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>
              Novo Email
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="email@exemplo.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={emailForm.email}
              onChangeText={email => setEmailForm(prev => ({ ...prev, email }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Nome do acompanhante"
              placeholderTextColor={theme.colors.textSecondary}
              value={emailForm.name}
              onChangeText={name => setEmailForm(prev => ({ ...prev, name }))}
            />

            {/* Seleção de Períodos */}
            <View style={styles.periodsForm}>
              <Text style={[styles.formLabel, { color: theme.colors.text }]}>
                Relatórios:
              </Text>

              {[
                { key: 'daily', label: 'Diário (8h da manhã)' },
                { key: 'weekly', label: 'Semanal (Segunda-feira)' },
                { key: 'monthly', label: 'Mensal (Dia 1)' },
              ].map(period => (
                <TouchableOpacity
                  key={period.key}
                  style={styles.periodCheckbox}
                  onPress={() => {
                    setEmailForm(prev => ({
                      ...prev,
                      periods: {
                        ...prev.periods,
                        [period.key]:
                          !prev.periods[
                            period.key as keyof typeof prev.periods
                          ],
                      },
                    }));
                  }}
                >
                  <Icon
                    name={
                      emailForm.periods[
                        period.key as keyof typeof emailForm.periods
                      ]
                        ? 'check-box'
                        : 'check-box-outline-blank'
                    }
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.periodCheckboxText,
                      { color: theme.colors.text },
                    ]}
                  >
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: theme.colors.border },
                ]}
                onPress={() => setIsAddingEmail(false)}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: theme.colors.text },
                  ]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.addButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleAddEmail}
              >
                <Text style={styles.addButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.addNewButton,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setIsAddingEmail(true)}
          >
            <Icon name="plus" size={24} color="white" />
            <Text style={styles.addNewButtonText}>Adicionar Email</Text>
          </TouchableOpacity>
        )}

        {/* Ações */}
        {emails.length > 0 && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[
                styles.testButton,
                {
                  backgroundColor: theme.colors.success,
                  opacity: isSending ? 0.7 : 1,
                },
              ]}
              onPress={handleSendTestReports}
              disabled={isSending}
            >
              <Icon
                name={isSending ? 'hourglass-empty' : 'send'}
                size={20}
                color="white"
              />
              <Text style={styles.testButtonText}>
                {isSending ? 'Enviando...' : 'Enviar Relatórios Teste'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  statsContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center' as const,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  lastActivity: {
    textAlign: 'center' as const,
    fontSize: 12,
    fontStyle: 'italic' as const,
  },
  emailsList: {
    marginBottom: 20,
  },
  emailItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  emailHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  emailInfo: {
    flex: 1,
  },
  emailName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  emailAddress: {
    fontSize: 14,
    marginTop: 2,
  },
  emailControls: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  removeButton: {
    padding: 8,
  },
  statusRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  periodsSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  periodToggles: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  lastSentSection: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  lastSentText: {
    fontSize: 12,
    marginTop: 2,
  },
  addForm: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  periodsForm: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  periodCheckbox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  periodCheckboxText: {
    marginLeft: 8,
    fontSize: 14,
  },
  formButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  addNewButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addNewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  actionsSection: {
    marginBottom: 20,
  },
  testButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  footer: {
    height: 40,
  },
  confirmationForm: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  confirmationMessage: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center' as const,
  },
  emailToConfirm: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  confirmationInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 16,
    fontSize: 20,
    fontWeight: 'bold' as const,
    letterSpacing: 4,
  },
  confirmationButtons: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  confirmationHelp: {
    fontSize: 12,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
};
