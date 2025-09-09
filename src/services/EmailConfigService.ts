/**
 * EmailConfigService
 * Gerenciamento de configurações de emails para Companion Reports
 * Persistência MMKV, validação e controle de periodicidade
 */

import { MMKV } from 'react-native-mmkv';

export interface EmailConfig {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  verificationToken?: string;
  periods: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
  lastSent: {
    daily?: Date;
    weekly?: Date;
    monthly?: Date;
  };
  createdAt: Date;
  enabled: boolean;
}

export interface EmailSystemConfig {
  enabled: boolean;
  timezone: string;
  sendingHour: number; // 0-23
  maxEmailsPerHour: number;
  retryAttempts: number;
  lastSystemCheck: Date;
}

export class EmailConfigService {
  private static readonly STORAGE_KEYS = {
    EMAIL_CONFIGS: 'companion_emails_config',
    SYSTEM_CONFIG: 'email_system_config',
    EMAIL_QUEUE: 'companion_email_queue',
    LAST_SENT_TRACKING: 'companion_last_sent_tracking'
  };

  private static storage = new MMKV();

  /**
   * Adiciona novo email à configuração
   */
  static async addEmail(
    email: string, 
    name: string, 
    periods: { daily: boolean; weekly: boolean; monthly: boolean }
  ): Promise<EmailConfig> {
    // Validar email
    if (!this.isValidEmail(email)) {
      throw new Error('Email inválido');
    }

    // Verificar se email já existe
    const existingConfigs = this.getAllEmailConfigs();
    if (existingConfigs.find(config => config.email === email)) {
      throw new Error('Email já cadastrado');
    }

    // Criar nova configuração
    const newConfig: EmailConfig = {
      id: this.generateEmailId(),
      email: email.toLowerCase().trim(),
      name: name.trim(),
      verified: false,
      periods,
      lastSent: {},
      createdAt: new Date(),
      enabled: true
    };

    // Salvar
    const allConfigs = [...existingConfigs, newConfig];
    this.saveEmailConfigs(allConfigs);

    console.log(`✅ [EmailConfigService] Email adicionado: ${email}`);
    return newConfig;
  }

  /**
   * Remove email da configuração
   */
  static removeEmail(emailId: string): boolean {
    try {
      const configs = this.getAllEmailConfigs();
      const filteredConfigs = configs.filter(config => config.id !== emailId);
      
      if (filteredConfigs.length === configs.length) {
        console.log(`⚠️ [EmailConfigService] Email ID não encontrado: ${emailId}`);
        return false;
      }

      this.saveEmailConfigs(filteredConfigs);
      console.log(`✅ [EmailConfigService] Email removido: ${emailId}`);
      return true;
    } catch (error) {
      console.error(`❌ [EmailConfigService] Erro ao remover email:`, error);
      return false;
    }
  }

  /**
   * Atualiza configuração de um email
   */
  static updateEmailConfig(
    emailId: string, 
    updates: Partial<Omit<EmailConfig, 'id' | 'createdAt'>>
  ): boolean {
    try {
      const configs = this.getAllEmailConfigs();
      const configIndex = configs.findIndex(config => config.id === emailId);
      
      if (configIndex === -1) {
        console.log(`⚠️ [EmailConfigService] Email ID não encontrado: ${emailId}`);
        return false;
      }

      // Aplicar updates
      configs[configIndex] = {
        ...configs[configIndex],
        ...updates
      };

      this.saveEmailConfigs(configs);
      console.log(`✅ [EmailConfigService] Email atualizado: ${emailId}`);
      return true;
    } catch (error) {
      console.error(`❌ [EmailConfigService] Erro ao atualizar email:`, error);
      return false;
    }
  }

  /**
   * Marca email como verificado
   */
  static verifyEmail(emailId: string, verificationToken: string): boolean {
    try {
      const configs = this.getAllEmailConfigs();
      const config = configs.find(c => c.id === emailId);
      
      if (!config) {
        console.log(`⚠️ [EmailConfigService] Email ID não encontrado: ${emailId}`);
        return false;
      }

      if (config.verificationToken !== verificationToken) {
        console.log(`⚠️ [EmailConfigService] Token inválido para: ${config.email}`);
        return false;
      }

      return this.updateEmailConfig(emailId, {
        verified: true,
        verificationToken: undefined
      });
    } catch (error) {
      console.error(`❌ [EmailConfigService] Erro ao verificar email:`, error);
      return false;
    }
  }

  /**
   * Habilita/desabilita email
   */
  static toggleEmailEnabled(emailId: string): boolean {
    const configs = this.getAllEmailConfigs();
    const config = configs.find(c => c.id === emailId);
    
    if (!config) {
      return false;
    }

    return this.updateEmailConfig(emailId, {
      enabled: !config.enabled
    });
  }

  /**
   * Registra último envio para um email
   */
  static recordEmailSent(
    emailId: string, 
    period: 'daily' | 'weekly' | 'monthly'
  ): boolean {
    const configs = this.getAllEmailConfigs();
    const config = configs.find(c => c.id === emailId);
    
    if (!config) {
      return false;
    }

    const updatedLastSent = {
      ...config.lastSent,
      [period]: new Date()
    };

    return this.updateEmailConfig(emailId, {
      lastSent: updatedLastSent
    });
  }

  /**
   * Obtém emails que precisam receber relatório
   */
  static getEmailsForPeriod(period: 'daily' | 'weekly' | 'monthly'): EmailConfig[] {
    const configs = this.getAllEmailConfigs();
    const now = new Date();
    
    return configs.filter(config => {
      // Deve estar habilitado e verificado
      if (!config.enabled || !config.verified) {
        return false;
      }

      // Deve ter o período configurado
      if (!config.periods[period]) {
        return false;
      }

      // Verificar se já foi enviado hoje/semana/mês
      const lastSent = config.lastSent[period];
      if (!lastSent) {
        return true; // Nunca enviado
      }

      const lastSentDate = new Date(lastSent);
      
      switch (period) {
        case 'daily':
          // Não enviado hoje
          return !this.isSameDay(lastSentDate, now);
          
        case 'weekly':
          // Não enviado nesta semana (segunda-feira)
          const weeksSince = Math.floor((now.getTime() - lastSentDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
          return weeksSince >= 1;
          
        case 'monthly':
          // Não enviado neste mês
          return lastSentDate.getMonth() !== now.getMonth() || 
                 lastSentDate.getFullYear() !== now.getFullYear();
                 
        default:
          return false;
      }
    });
  }

  /**
   * Obtém todas as configurações de email
   */
  static getAllEmailConfigs(): EmailConfig[] {
    try {
      const configsJson = this.storage.getString(this.STORAGE_KEYS.EMAIL_CONFIGS);
      if (!configsJson) {
        return [];
      }

      const configs = JSON.parse(configsJson);
      return configs.map((config: any) => ({
        ...config,
        createdAt: new Date(config.createdAt),
        lastSent: {
          daily: config.lastSent.daily ? new Date(config.lastSent.daily) : undefined,
          weekly: config.lastSent.weekly ? new Date(config.lastSent.weekly) : undefined,
          monthly: config.lastSent.monthly ? new Date(config.lastSent.monthly) : undefined,
        }
      }));
    } catch (error) {
      console.error(`❌ [EmailConfigService] Erro ao carregar configurações:`, error);
      return [];
    }
  }

  /**
   * Obtém configuração de um email específico
   */
  static getEmailConfig(emailId: string): EmailConfig | null {
    const configs = this.getAllEmailConfigs();
    return configs.find(config => config.id === emailId) || null;
  }

  /**
   * Configuração do sistema de emails
   */
  static getSystemConfig(): EmailSystemConfig {
    try {
      const configJson = this.storage.getString(this.STORAGE_KEYS.SYSTEM_CONFIG);
      if (!configJson) {
        return this.getDefaultSystemConfig();
      }

      const config = JSON.parse(configJson);
      return {
        ...config,
        lastSystemCheck: new Date(config.lastSystemCheck)
      };
    } catch (error) {
      console.error(`❌ [EmailConfigService] Erro ao carregar config sistema:`, error);
      return this.getDefaultSystemConfig();
    }
  }

  /**
   * Atualiza configuração do sistema
   */
  static updateSystemConfig(updates: Partial<EmailSystemConfig>): boolean {
    try {
      const currentConfig = this.getSystemConfig();
      const newConfig = {
        ...currentConfig,
        ...updates,
        lastSystemCheck: new Date()
      };

      this.storage.set(this.STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(newConfig));
      console.log(`✅ [EmailConfigService] Configuração do sistema atualizada`);
      return true;
    } catch (error) {
      console.error(`❌ [EmailConfigService] Erro ao atualizar config sistema:`, error);
      return false;
    }
  }

  /**
   * Estatísticas do sistema
   */
  static getSystemStats() {
    const configs = this.getAllEmailConfigs();
    
    return {
      totalEmails: configs.length,
      verifiedEmails: configs.filter(c => c.verified).length,
      enabledEmails: configs.filter(c => c.enabled).length,
      dailyEmails: configs.filter(c => c.periods.daily && c.enabled && c.verified).length,
      weeklyEmails: configs.filter(c => c.periods.weekly && c.enabled && c.verified).length,
      monthlyEmails: configs.filter(c => c.periods.monthly && c.enabled && c.verified).length,
      lastDailySent: this.getLastSentDate('daily'),
      lastWeeklySent: this.getLastSentDate('weekly'),
      lastMonthlySent: this.getLastSentDate('monthly')
    };
  }

  /**
   * Limpa todas as configurações (debugging)
   */
  static clearAllConfigs(): void {
    this.storage.delete(this.STORAGE_KEYS.EMAIL_CONFIGS);
    this.storage.delete(this.STORAGE_KEYS.SYSTEM_CONFIG);
    this.storage.delete(this.STORAGE_KEYS.EMAIL_QUEUE);
    this.storage.delete(this.STORAGE_KEYS.LAST_SENT_TRACKING);
    console.log(`🧹 [EmailConfigService] Todas as configurações foram limpas`);
  }

  // MÉTODOS PRIVADOS

  private static saveEmailConfigs(configs: EmailConfig[]): void {
    this.storage.set(this.STORAGE_KEYS.EMAIL_CONFIGS, JSON.stringify(configs));
  }

  private static generateEmailId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  private static getDefaultSystemConfig(): EmailSystemConfig {
    return {
      enabled: true,
      timezone: 'America/Sao_Paulo',
      sendingHour: 8, // 08:00 AM
      maxEmailsPerHour: 20,
      retryAttempts: 3,
      lastSystemCheck: new Date()
    };
  }

  private static getLastSentDate(period: 'daily' | 'weekly' | 'monthly'): Date | null {
    const configs = this.getAllEmailConfigs();
    let latestDate: Date | null = null;

    configs.forEach(config => {
      const lastSent = config.lastSent[period];
      if (lastSent) {
        const sentDate = new Date(lastSent);
        if (!latestDate || sentDate > latestDate) {
          latestDate = sentDate;
        }
      }
    });

    return latestDate;
  }
}