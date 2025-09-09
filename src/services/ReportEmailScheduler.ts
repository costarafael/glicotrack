/**
 * ReportEmailScheduler Service
 * Sistema de agendamento e envio automático de relatórios por email
 * Integração com Resend API e controle de periodicidade
 */

import { EmailConfigService, EmailConfig } from './EmailConfigService';
import { CompanionReportGenerator, ReportData } from './CompanionReportGenerator';
import { EmailTemplateService } from './EmailTemplateService';
import ResendEmailService from './ResendEmailService';
import { MMKV } from 'react-native-mmkv';

export interface EmailQueueItem {
  id: string;
  emailId: string;
  userKey: string;
  period: 'daily' | 'weekly' | 'monthly';
  scheduledFor: Date;
  attempts: number;
  lastAttempt?: Date;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  errorMessage?: string;
  reportData?: ReportData;
}

export interface SendResult {
  success: boolean;
  emailId: string;
  period: 'daily' | 'weekly' | 'monthly';
  sentAt?: Date;
  error?: string;
}

export class ReportEmailScheduler {
  private static readonly STORAGE_KEYS = {
    EMAIL_QUEUE: 'companion_email_queue',
    PROCESSING_LOCK: 'email_processing_lock',
    LAST_PROCESS_TIME: 'last_email_process_time'
  };

  private static storage = new MMKV();
  private static processingInterval: NodeJS.Timeout | null = null;

  /**
   * Inicia o scheduler automático
   */
  static startScheduler(): void {
    if (this.processingInterval) {
      console.log(`⚠️ [ReportEmailScheduler] Scheduler já está rodando`);
      return;
    }

    // Processa a fila a cada 5 minutos
    this.processingInterval = setInterval(() => {
      this.processEmailQueue();
    }, 5 * 60 * 1000);

    console.log(`🚀 [ReportEmailScheduler] Scheduler iniciado`);
  }

  /**
   * Para o scheduler automático
   */
  static stopScheduler(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log(`🛑 [ReportEmailScheduler] Scheduler parado`);
    }
  }

  /**
   * Agenda relatórios para todos os períodos
   */
  static async scheduleAllReports(userKey: string): Promise<void> {
    const now = new Date();
    
    // Agendar para cada período
    await this.scheduleReportsForPeriod(userKey, 'daily', now);
    await this.scheduleReportsForPeriod(userKey, 'weekly', now);  
    await this.scheduleReportsForPeriod(userKey, 'monthly', now);

    console.log(`📅 [ReportEmailScheduler] Relatórios agendados para usuário: ${userKey}`);
  }

  /**
   * Agenda relatórios para um período específico
   */
  static async scheduleReportsForPeriod(
    userKey: string,
    period: 'daily' | 'weekly' | 'monthly',
    baseDate: Date = new Date()
  ): Promise<void> {
    // Obter emails que precisam receber este período
    const emailsForPeriod = EmailConfigService.getEmailsForPeriod(period);
    
    if (emailsForPeriod.length === 0) {
      console.log(`📧 [ReportEmailScheduler] Nenhum email configurado para período: ${period}`);
      return;
    }

    // Calcular horário de envio
    const systemConfig = EmailConfigService.getSystemConfig();
    const scheduledTime = this.calculateScheduledTime(period, baseDate, systemConfig.sendingHour);

    // Adicionar à fila
    for (const emailConfig of emailsForPeriod) {
      await this.addToQueue(userKey, emailConfig, period, scheduledTime);
    }

    console.log(`📅 [ReportEmailScheduler] ${emailsForPeriod.length} relatórios ${period} agendados para ${scheduledTime.toLocaleString('pt-BR')}`);
  }

  /**
   * Processa a fila de emails
   */
  static async processEmailQueue(): Promise<void> {
    // Verificar lock de processamento
    if (this.isProcessingLocked()) {
      console.log(`🔒 [ReportEmailScheduler] Processamento já em andamento`);
      return;
    }

    try {
      this.setProcessingLock(true);
      const queue = this.getEmailQueue();
      const now = new Date();
      
      // Filtrar emails que devem ser enviados agora
      const readyToSend = queue.filter(item => 
        item.status === 'pending' && 
        item.scheduledFor <= now &&
        item.attempts < 3
      );

      if (readyToSend.length === 0) {
        console.log(`📭 [ReportEmailScheduler] Nenhum email pronto para envio`);
        return;
      }

      console.log(`📤 [ReportEmailScheduler] Processando ${readyToSend.length} emails`);

      // Processar em lotes para respeitar rate limits
      const systemConfig = EmailConfigService.getSystemConfig();
      const batchSize = Math.min(readyToSend.length, systemConfig.maxEmailsPerHour);
      
      for (let i = 0; i < batchSize; i++) {
        const queueItem = readyToSend[i];
        await this.processQueueItem(queueItem);
        
        // Delay entre emails para respeitar rate limits
        if (i < batchSize - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3s entre emails
        }
      }

      this.storage.set(this.STORAGE_KEYS.LAST_PROCESS_TIME, JSON.stringify(now));
      console.log(`✅ [ReportEmailScheduler] Processamento concluído`);

    } catch (error) {
      console.error(`❌ [ReportEmailScheduler] Erro no processamento:`, error);
    } finally {
      this.setProcessingLock(false);
    }
  }

  /**
   * Processa um item individual da fila
   */
  private static async processQueueItem(queueItem: EmailQueueItem): Promise<void> {
    try {
      // Marcar como enviando
      this.updateQueueItem(queueItem.id, {
        status: 'sending',
        lastAttempt: new Date(),
        attempts: queueItem.attempts + 1
      });

      // Obter configuração do email
      const emailConfig = EmailConfigService.getEmailConfig(queueItem.emailId);
      if (!emailConfig) {
        throw new Error(`Configuração de email não encontrada: ${queueItem.emailId}`);
      }

      // Gerar relatório se não existir
      let reportData = queueItem.reportData;
      if (!reportData) {
        reportData = await this.generateReport(queueItem.userKey, queueItem.period);
        this.updateQueueItem(queueItem.id, { reportData });
      }

      // Gerar template HTML
      const htmlTemplate = EmailTemplateService.generateTemplate(reportData);

      // Enviar email via Resend
      const subject = this.generateEmailSubject(queueItem.period, reportData.period.start);
      await ResendEmailService.sendEmail({
        to: emailConfig.email,
        subject,
        html: htmlTemplate
      });

      // Marcar como enviado com sucesso
      this.updateQueueItem(queueItem.id, {
        status: 'sent'
      });

      // Registrar no histórico de envios
      EmailConfigService.recordEmailSent(queueItem.emailId, queueItem.period);

      console.log(`✅ [ReportEmailScheduler] Email enviado: ${emailConfig.email} (${queueItem.period})`);

    } catch (error) {
      console.error(`❌ [ReportEmailScheduler] Erro ao enviar email:`, error);
      
      // Marcar como falhado
      this.updateQueueItem(queueItem.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Adiciona item à fila de emails
   */
  private static async addToQueue(
    userKey: string,
    emailConfig: EmailConfig,
    period: 'daily' | 'weekly' | 'monthly',
    scheduledFor: Date
  ): Promise<void> {
    const queueItem: EmailQueueItem = {
      id: this.generateQueueId(),
      emailId: emailConfig.id,
      userKey,
      period,
      scheduledFor,
      attempts: 0,
      status: 'pending'
    };

    const queue = this.getEmailQueue();
    queue.push(queueItem);
    this.saveEmailQueue(queue);
  }

  /**
   * Gera relatório baseado no período
   */
  private static async generateReport(
    userKey: string,
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<ReportData> {
    // NOTA: Esta implementação é simplificada.
    // Na implementação real, você precisará:
    // 1. Buscar dados do Firebase para o userKey
    // 2. Filtrar dados pelo período
    // 3. Gerar relatório usando CompanionReportGenerator

    const now = new Date();
    const mockDailyLog = {
      date: now.toISOString().split('T')[0],
      glucoseEntries: [
        { timestamp: now, value: 120, mealType: 'breakfast' },
        { timestamp: new Date(now.getTime() + 4 * 60 * 60 * 1000), value: 180, mealType: 'lunch' },
        { timestamp: new Date(now.getTime() + 8 * 60 * 60 * 1000), value: 150, mealType: 'dinner' }
      ],
      bolusEntries: [
        { timestamp: now, value: 4 },
        { timestamp: new Date(now.getTime() + 4 * 60 * 60 * 1000), value: 6 }
      ],
      basalEntry: { value: 20 },
      notes: 'Mock data para teste do sistema de emails'
    };

    switch (period) {
      case 'daily':
        return await CompanionReportGenerator.generateDailyReport(mockDailyLog, userKey);
      
      case 'weekly':
        const weeklyLogs = Array(7).fill(mockDailyLog).map((log, index) => ({
          ...log,
          date: new Date(now.getTime() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }));
        return await CompanionReportGenerator.generateWeeklyReport(weeklyLogs, userKey, now);
      
      case 'monthly':
        const monthlyLogs = Array(30).fill(mockDailyLog).map((log, index) => ({
          ...log,
          date: new Date(now.getTime() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }));
        return await CompanionReportGenerator.generateMonthlyReport(monthlyLogs, userKey, now);
      
      default:
        throw new Error(`Período não suportado: ${period}`);
    }
  }

  /**
   * Calcula horário de envio baseado no período
   */
  private static calculateScheduledTime(
    period: 'daily' | 'weekly' | 'monthly',
    baseDate: Date,
    sendingHour: number
  ): Date {
    const scheduledDate = new Date(baseDate);
    
    switch (period) {
      case 'daily':
        // Enviar no mesmo dia às sendingHour
        scheduledDate.setHours(sendingHour, 0, 0, 0);
        break;
        
      case 'weekly':
        // Enviar na próxima segunda-feira às sendingHour
        const daysUntilMonday = (1 + 7 - scheduledDate.getDay()) % 7 || 7;
        scheduledDate.setDate(scheduledDate.getDate() + daysUntilMonday);
        scheduledDate.setHours(sendingHour, 0, 0, 0);
        break;
        
      case 'monthly':
        // Enviar no dia 1 do próximo mês às sendingHour
        scheduledDate.setMonth(scheduledDate.getMonth() + 1, 1);
        scheduledDate.setHours(sendingHour, 0, 0, 0);
        break;
    }

    // Se o horário já passou hoje, agendar para o próximo ciclo
    if (scheduledDate <= baseDate && period === 'daily') {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    return scheduledDate;
  }

  /**
   * Gera subject do email baseado no período
   */
  private static generateEmailSubject(
    period: 'daily' | 'weekly' | 'monthly',
    reportDate: Date
  ): string {
    const dateStr = reportDate.toLocaleDateString('pt-BR');
    
    switch (period) {
      case 'daily':
        return `📊 Relatório Diário GlicoTrack - ${dateStr}`;
      case 'weekly':
        const weekEndDate = new Date(reportDate.getTime() + 6 * 24 * 60 * 60 * 1000);
        return `📊 Relatório Semanal GlicoTrack - ${dateStr} a ${weekEndDate.toLocaleDateString('pt-BR')}`;
      case 'monthly':
        const monthYear = reportDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
        return `📊 Relatório Mensal GlicoTrack - ${monthYear}`;
      default:
        return `📊 Relatório GlicoTrack`;
    }
  }

  // MÉTODOS DE FILA

  private static getEmailQueue(): EmailQueueItem[] {
    try {
      const queueJson = this.storage.getString(this.STORAGE_KEYS.EMAIL_QUEUE);
      if (!queueJson) return [];

      const queue = JSON.parse(queueJson);
      return queue.map((item: any) => ({
        ...item,
        scheduledFor: new Date(item.scheduledFor),
        lastAttempt: item.lastAttempt ? new Date(item.lastAttempt) : undefined
      }));
    } catch (error) {
      console.error(`❌ [ReportEmailScheduler] Erro ao carregar fila:`, error);
      return [];
    }
  }

  private static saveEmailQueue(queue: EmailQueueItem[]): void {
    this.storage.set(this.STORAGE_KEYS.EMAIL_QUEUE, JSON.stringify(queue));
  }

  private static updateQueueItem(queueId: string, updates: Partial<EmailQueueItem>): void {
    const queue = this.getEmailQueue();
    const itemIndex = queue.findIndex(item => item.id === queueId);
    
    if (itemIndex !== -1) {
      queue[itemIndex] = { ...queue[itemIndex], ...updates };
      this.saveEmailQueue(queue);
    }
  }

  private static generateQueueId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private static isProcessingLocked(): boolean {
    const lockJson = this.storage.getString(this.STORAGE_KEYS.PROCESSING_LOCK);
    if (!lockJson) return false;
    
    try {
      const lockData = JSON.parse(lockJson);
      const lockTime = new Date(lockData.timestamp);
      const now = new Date();
      
      // Lock expira em 15 minutos
      return (now.getTime() - lockTime.getTime()) < 15 * 60 * 1000;
    } catch {
      return false;
    }
  }

  private static setProcessingLock(locked: boolean): void {
    if (locked) {
      this.storage.set(this.STORAGE_KEYS.PROCESSING_LOCK, JSON.stringify({
        locked: true,
        timestamp: new Date()
      }));
    } else {
      this.storage.delete(this.STORAGE_KEYS.PROCESSING_LOCK);
    }
  }

  /**
   * Obtém estatísticas da fila
   */
  static getQueueStats() {
    const queue = this.getEmailQueue();
    
    return {
      totalItems: queue.length,
      pending: queue.filter(item => item.status === 'pending').length,
      sending: queue.filter(item => item.status === 'sending').length,
      sent: queue.filter(item => item.status === 'sent').length,
      failed: queue.filter(item => item.status === 'failed').length,
      oldestPending: queue
        .filter(item => item.status === 'pending')
        .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())[0],
      lastProcessed: this.storage.getString(this.STORAGE_KEYS.LAST_PROCESS_TIME) 
        ? new Date(JSON.parse(this.storage.getString(this.STORAGE_KEYS.LAST_PROCESS_TIME)!))
        : null
    };
  }

  /**
   * Limpa fila (debugging)
   */
  static clearQueue(): void {
    this.storage.delete(this.STORAGE_KEYS.EMAIL_QUEUE);
    this.storage.delete(this.STORAGE_KEYS.PROCESSING_LOCK);
    console.log(`🧹 [ReportEmailScheduler] Fila de emails limpa`);
  }
}