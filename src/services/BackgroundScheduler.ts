/**
 * BackgroundScheduler Service
 * Sistema de background tasks para processar relatórios automaticamente
 * Integração com React Native Background Task e scheduler nativo
 */

// Removing deprecated react-native-background-task dependency
// Using AppState and setTimeout for background-like behavior
import { AppState, AppStateStatus } from 'react-native';
import { ReportEmailScheduler } from './ReportEmailScheduler';
import { EmailConfigService } from './EmailConfigService';
import { UserKeyService } from './UserKeyService';
import { MMKV } from 'react-native-mmkv';

export interface BackgroundJobConfig {
  enabled: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
  runInterval: number; // minutos
  errorCount: number;
  lastError: string | null;
}

export interface JobExecutionResult {
  success: boolean;
  duration: number;
  emailsSent: number;
  errors: string[];
  nextRunScheduled: Date;
}

export class BackgroundScheduler {
  private static readonly STORAGE_KEYS = {
    JOB_CONFIG: 'background_job_config',
    JOB_HISTORY: 'background_job_history',
    JOB_LOCK: 'background_job_lock'
  };

  private static storage = new MMKV();
  private static schedulerInterval: NodeJS.Timeout | null = null;
  private static appStateSubscription: any = null;

  /**
   * Inicia o sistema de background jobs
   */
  static start(): void {
    if (this.schedulerInterval !== null) {
      console.log(`⚠️ [BackgroundScheduler] Scheduler já está rodando`);
      return;
    }

    try {
      // Configurar listener para mudanças de estado do app
      this.appStateSubscription = AppState.addEventListener(
        'change',
        this.handleAppStateChange.bind(this)
      );

      // Iniciar scheduler principal (a cada 30 minutos)
      this.schedulerInterval = setInterval(() => {
        this.checkAndRunJobs();
      }, 30 * 60 * 1000);

      // Verificar imediatamente
      this.checkAndRunJobs();

      console.log(`🚀 [BackgroundScheduler] Sistema iniciado com sucesso`);
    } catch (error) {
      console.error(`❌ [BackgroundScheduler] Erro ao iniciar:`, error);
    }
  }

  /**
   * Para o sistema de background jobs
   */
  static stop(): void {
    try {
      if (this.appStateSubscription) {
        this.appStateSubscription?.remove();
        this.appStateSubscription = null;
      }

      if (this.schedulerInterval) {
        clearInterval(this.schedulerInterval);
        this.schedulerInterval = null;
      }

      // Parar o scheduler de emails também
      ReportEmailScheduler.stopScheduler();

      console.log(`🛑 [BackgroundScheduler] Sistema parado`);
    } catch (error) {
      console.error(`❌ [BackgroundScheduler] Erro ao parar:`, error);
    }
  }

  /**
   * Verifica se deve executar jobs e executa se necessário
   */
  private static async checkAndRunJobs(): Promise<void> {
    try {
      const config = this.getJobConfig();
      
      if (!config.enabled) {
        console.log(`📴 [BackgroundScheduler] Jobs desabilitados`);
        return;
      }

      const now = new Date();
      const shouldRun = !config.lastRun || 
        (now.getTime() - config.lastRun.getTime()) >= (config.runInterval * 60 * 1000);

      if (!shouldRun) {
        const nextRun = config.nextRun?.toLocaleTimeString('pt-BR') || 'N/A';
        console.log(`⏰ [BackgroundScheduler] Próxima execução: ${nextRun}`);
        return;
      }

      await this.executeMainJob();
    } catch (error) {
      console.error(`❌ [BackgroundScheduler] Erro no check de jobs:`, error);
    }
  }

  /**
   * Executa o job principal
   */
  private static async executeMainJob(): Promise<JobExecutionResult> {
    const startTime = Date.now();
    let emailsSent = 0;
    const errors: string[] = [];

    try {
      // Verificar se já está executando (lock)
      if (this.isJobLocked()) {
        console.log(`🔒 [BackgroundScheduler] Job já está em execução`);
        throw new Error('Job já está em execução');
      }

      this.setJobLock(true);
      console.log(`🚀 [BackgroundScheduler] Iniciando job principal`);

      // 1. Verificar configuração do sistema
      const systemConfig = EmailConfigService.getSystemConfig();
      if (!systemConfig.enabled) {
        console.log(`📴 [BackgroundScheduler] Sistema de emails desabilitado`);
        return this.buildJobResult(startTime, emailsSent, ['Sistema de emails desabilitado']);
      }

      // 2. Obter chave do usuário
      const userKeyService = UserKeyService.getInstance();
      const userKey = await userKeyService.getUserKey();
      if (!userKey) {
        throw new Error('Chave do usuário não encontrada');
      }

      // 3. Verificar se há emails configurados
      const stats = EmailConfigService.getSystemStats();
      if (stats.enabledEmails === 0) {
        console.log(`📭 [BackgroundScheduler] Nenhum email configurado`);
        return this.buildJobResult(startTime, emailsSent, ['Nenhum email configurado']);
      }

      console.log(`📧 [BackgroundScheduler] ${stats.enabledEmails} emails ativos encontrados`);

      // 4. Agendar relatórios pendentes
      await ReportEmailScheduler.scheduleAllReports(userKey);

      // 5. Processar fila de emails
      await ReportEmailScheduler.processEmailQueue();

      // 6. Obter estatísticas finais
      const queueStats = ReportEmailScheduler.getQueueStats();
      emailsSent = queueStats.sent;

      console.log(`✅ [BackgroundScheduler] Job concluído - ${emailsSent} emails enviados`);

      // 7. Atualizar configuração
      const nextRun = this.calculateNextRun();
      this.updateJobConfig({
        lastRun: new Date(),
        nextRun,
        errorCount: 0,
        lastError: null
      });

      return this.buildJobResult(startTime, emailsSent, errors, nextRun);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push(errorMessage);
      
      console.error(`❌ [BackgroundScheduler] Erro no job principal:`, error);

      // Atualizar contador de erros
      const config = this.getJobConfig();
      this.updateJobConfig({
        errorCount: config.errorCount + 1,
        lastError: errorMessage,
        lastRun: new Date()
      });

      return this.buildJobResult(startTime, emailsSent, errors);

    } finally {
      this.setJobLock(false);
    }
  }

  /**
   * Manipula mudanças de estado do app (foreground/background)
   */
  private static handleAppStateChange(nextAppState: AppStateStatus): void {
    console.log(`📱 [BackgroundScheduler] App state changed to: ${nextAppState}`);
    
    if (nextAppState === 'active') {
      // App voltou ao foreground - verificar se há jobs pendentes
      this.checkAndRunJobs();
    } else if (nextAppState === 'background') {
      // App foi para background - agendar verificação futura
      setTimeout(() => {
        if (AppState.currentState === 'background') {
          this.checkAndRunJobs();
        }
      }, 5 * 60 * 1000); // 5 minutos
    }
  }

  /**
   * Força execução de job (para testes)
   */
  static async forceRun(): Promise<JobExecutionResult> {
    console.log(`🔧 [BackgroundScheduler] Execução forçada iniciada`);
    return await this.executeMainJob();
  }

  /**
   * Configura job para executar em horário específico
   */
  static scheduleForTime(hour: number, minute: number = 0): void {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    // Se o horário já passou hoje, agendar para amanhã
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    this.updateJobConfig({
      nextRun: scheduledTime
    });

    console.log(`⏰ [BackgroundScheduler] Agendado para ${scheduledTime.toLocaleString('pt-BR')}`);
  }

  // MÉTODOS DE CONFIGURAÇÃO

  private static getJobConfig(): BackgroundJobConfig {
    try {
      const configJson = this.storage.getString(this.STORAGE_KEYS.JOB_CONFIG);
      if (!configJson) {
        return this.getDefaultJobConfig();
      }

      const config = JSON.parse(configJson);
      return {
        ...config,
        lastRun: config.lastRun ? new Date(config.lastRun) : null,
        nextRun: config.nextRun ? new Date(config.nextRun) : null
      };
    } catch (error) {
      console.error(`❌ [BackgroundScheduler] Erro ao carregar config:`, error);
      return this.getDefaultJobConfig();
    }
  }

  private static updateJobConfig(updates: Partial<BackgroundJobConfig>): void {
    const currentConfig = this.getJobConfig();
    const newConfig = { ...currentConfig, ...updates };
    this.storage.set(this.STORAGE_KEYS.JOB_CONFIG, JSON.stringify(newConfig));
  }

  private static getDefaultJobConfig(): BackgroundJobConfig {
    return {
      enabled: true,
      lastRun: null,
      nextRun: this.calculateNextRun(),
      runInterval: 60, // 1 hora
      errorCount: 0,
      lastError: null
    };
  }

  private static calculateNextRun(): Date {
    const now = new Date();
    const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora
    return nextRun;
  }

  // MÉTODOS DE LOCK

  private static isJobLocked(): boolean {
    const lockJson = this.storage.getString(this.STORAGE_KEYS.JOB_LOCK);
    if (!lockJson) return false;

    try {
      const lockData = JSON.parse(lockJson);
      const lockTime = new Date(lockData.timestamp);
      const now = new Date();
      
      // Lock expira em 30 minutos
      return (now.getTime() - lockTime.getTime()) < 30 * 60 * 1000;
    } catch {
      return false;
    }
  }

  private static setJobLock(locked: boolean): void {
    if (locked) {
      this.storage.set(this.STORAGE_KEYS.JOB_LOCK, JSON.stringify({
        locked: true,
        timestamp: new Date(),
        pid: process.pid
      }));
    } else {
      this.storage.delete(this.STORAGE_KEYS.JOB_LOCK);
    }
  }

  // MÉTODOS UTILITÁRIOS

  private static buildJobResult(
    startTime: number,
    emailsSent: number,
    errors: string[],
    nextRunScheduled?: Date
  ): JobExecutionResult {
    return {
      success: errors.length === 0,
      duration: Date.now() - startTime,
      emailsSent,
      errors,
      nextRunScheduled: nextRunScheduled || this.calculateNextRun()
    };
  }

  /**
   * Obtém estatísticas do scheduler
   */
  static getStats() {
    const config = this.getJobConfig();
    const queueStats = ReportEmailScheduler.getQueueStats();
    const emailStats = EmailConfigService.getSystemStats();

    return {
      scheduler: {
        enabled: config.enabled,
        lastRun: config.lastRun,
        nextRun: config.nextRun,
        runInterval: config.runInterval,
        errorCount: config.errorCount,
        lastError: config.lastError,
        isRunning: this.schedulerInterval !== null
      },
      emails: emailStats,
      queue: queueStats
    };
  }

  /**
   * Habilita/desabilita jobs
   */
  static setEnabled(enabled: boolean): void {
    this.updateJobConfig({ enabled });
    
    if (enabled) {
      console.log(`✅ [BackgroundScheduler] Jobs habilitados`);
    } else {
      console.log(`❌ [BackgroundScheduler] Jobs desabilitados`);
    }
  }

  /**
   * Define intervalo de execução (em minutos)
   */
  static setRunInterval(minutes: number): void {
    if (minutes < 15) {
      throw new Error('Intervalo mínimo é de 15 minutos');
    }

    this.updateJobConfig({ 
      runInterval: minutes,
      nextRun: this.calculateNextRun()
    });

    console.log(`⏰ [BackgroundScheduler] Intervalo definido para ${minutes} minutos`);
  }

  /**
   * Limpa configurações e histórico (debugging)
   */
  static clearAll(): void {
    this.storage.delete(this.STORAGE_KEYS.JOB_CONFIG);
    this.storage.delete(this.STORAGE_KEYS.JOB_HISTORY);
    this.storage.delete(this.STORAGE_KEYS.JOB_LOCK);
    
    console.log(`🧹 [BackgroundScheduler] Todas as configurações foram limpas`);
  }
}