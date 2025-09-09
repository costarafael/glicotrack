/**
 * DataMigrationService - Gerencia migração de dados entre versões
 * Garante que dados da v1.0 sejam preservados na atualização
 */

import { MMKV } from 'react-native-mmkv';
import { StorageService } from './storage';
import { SimpleReminderService } from './SimpleReminderService';
import { DailyLog, AppSettings } from '../types';

const storage = new MMKV();

export interface MigrationResult {
  success: boolean;
  migratedItems: {
    dailyLogs: number;
    settings: boolean;
    reminders: boolean;
  };
  errors: string[];
  version: string;
}

export class DataMigrationService {
  private static readonly MIGRATION_KEY = 'app_migration_status';
  private static readonly CURRENT_VERSION = '2.0'; // Nova versão com Firebase + Lembretes
  private static readonly PREVIOUS_VERSION = '1.0'; // Versão piloto atual

  /**
   * Executa migração se necessário
   */
  static async runMigrationIfNeeded(): Promise<MigrationResult> {
    const migrationStatus = this.getMigrationStatus();
    
    console.log('🔍 Verificando necessidade de migração...');
    console.log('📊 Status atual:', migrationStatus);
    
    // Se já migrou para versão atual, não precisa migrar novamente
    if (migrationStatus.lastMigratedVersion === this.CURRENT_VERSION) {
      console.log('✅ Já está na versão mais recente');
      return {
        success: true,
        migratedItems: { dailyLogs: 0, settings: false, reminders: false },
        errors: [],
        version: this.CURRENT_VERSION
      };
    }
    
    // Executar migração
    return await this.executeMigration();
  }

  /**
   * Executa o processo de migração
   */
  private static async executeMigration(): Promise<MigrationResult> {
    console.log('🚀 Iniciando migração de dados...');
    
    const result: MigrationResult = {
      success: false,
      migratedItems: { dailyLogs: 0, settings: false, reminders: false },
      errors: [],
      version: this.CURRENT_VERSION
    };

    try {
      // 1. Migrar Daily Logs (preservar dados existentes)
      result.migratedItems.dailyLogs = await this.migrateDailyLogs();
      
      // 2. Migrar Settings (preservar configurações de tema)
      result.migratedItems.settings = await this.migrateAppSettings();
      
      // 3. Inicializar sistema de lembretes (novos dados)
      result.migratedItems.reminders = await this.initializeReminders();
      
      // 4. Marcar migração como concluída
      this.markMigrationComplete();
      
      result.success = true;
      
      console.log('✅ Migração concluída com sucesso!');
      console.log('📊 Resultado:', result);
      
    } catch (error) {
      console.error('❌ Erro durante migração:', error);
      result.errors.push(error instanceof Error ? error.message : String(error));
      result.success = false;
    }

    return result;
  }

  /**
   * Migra daily logs existentes (preserva TODOS os dados do usuário)
   */
  private static async migrateDailyLogs(): Promise<number> {
    console.log('📋 Migrando daily logs...');
    
    let migratedCount = 0;
    const allKeys = storage.getAllKeys();
    const logKeys = allKeys.filter(key => key.startsWith('log-'));
    
    console.log(`📊 Encontrados ${logKeys.length} logs para verificar`);
    
    for (const key of logKeys) {
      try {
        const data = storage.getString(key);
        if (!data) continue;
        
        const log = JSON.parse(data);
        
        // Verificar se é um log válido com dados
        if (this.isValidDailyLog(log)) {
          // Garantir formato correto (conversão de timestamps)
          const migratedLog = this.normalizeDailyLog(log);
          
          // Re-salvar com formato normalizado
          const date = key.replace('log-', '');
          StorageService.saveDailyLog(date, migratedLog);
          migratedCount++;
          
          if (migratedCount % 10 === 0) {
            console.log(`📊 Progresso: ${migratedCount} logs migrados`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao migrar log ${key}:`, error);
      }
    }
    
    console.log(`✅ ${migratedCount} daily logs migrados com sucesso`);
    return migratedCount;
  }

  /**
   * Migra configurações da app (preserva tema e preferências)
   */
  private static async migrateAppSettings(): Promise<boolean> {
    console.log('⚙️ Migrando configurações...');
    
    try {
      // Verificar se há configurações existentes
      const existingSettings = StorageService.getSettings();
      const existingTheme = StorageService.getTheme();
      
      // Se há dados personalizados, preservar
      if (existingTheme !== 'light' || this.hasCustomSettings(existingSettings)) {
        console.log('📱 Preservando configurações personalizadas do usuário');
        // Dados já estão salvos, apenas confirmar integridade
        StorageService.saveSettings(existingSettings);
        StorageService.saveTheme(existingTheme);
      } else {
        console.log('📱 Usando configurações padrão (primeira execução)');
      }
      
      console.log('✅ Configurações migradas');
      return true;
    } catch (error) {
      console.error('❌ Erro ao migrar configurações:', error);
      return false;
    }
  }

  /**
   * Inicializa sistema de lembretes (funcionalidade nova)
   */
  private static async initializeReminders(): Promise<boolean> {
    console.log('🔔 Inicializando sistema de lembretes...');
    
    try {
      const reminderService = SimpleReminderService.getInstance();
      await reminderService.initialize();
      
      console.log('✅ Sistema de lembretes inicializado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar lembretes:', error);
      return false;
    }
  }

  /**
   * Verifica se um daily log é válido
   */
  private static isValidDailyLog(log: any): boolean {
    return log && 
           typeof log === 'object' &&
           log.date &&
           Array.isArray(log.glucoseEntries) &&
           Array.isArray(log.bolusEntries) &&
           (log.glucoseEntries.length > 0 || 
            log.bolusEntries.length > 0 || 
            log.basalEntry || 
            (log.notes && log.notes.trim().length > 0));
  }

  /**
   * Normaliza daily log para formato correto
   */
  private static normalizeDailyLog(log: any): DailyLog {
    // Garantir que timestamps sejam Date objects
    const normalizedLog: DailyLog = {
      date: log.date,
      glucoseEntries: (log.glucoseEntries || []).map((entry: any) => ({
        ...entry,
        timestamp: entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp)
      })),
      bolusEntries: (log.bolusEntries || []).map((entry: any) => ({
        ...entry,
        timestamp: entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp)
      })),
      notes: log.notes || undefined
    };

    // Tratar basalEntry se existir
    if (log.basalEntry) {
      normalizedLog.basalEntry = {
        ...log.basalEntry,
        timestamp: log.basalEntry.timestamp instanceof Date ? 
          log.basalEntry.timestamp : 
          new Date(log.basalEntry.timestamp)
      };
    }

    return normalizedLog;
  }

  /**
   * Verifica se há configurações personalizadas
   */
  private static hasCustomSettings(settings: AppSettings): boolean {
    // Verificar se alguma notificação foi habilitada
    return settings.notifications.basalReminder.enabled ||
           settings.notifications.dailyLogReminder.enabled ||
           settings.notifications.insulinReminder.enabled ||
           settings.notifications.basalReminder.time !== '08:00' ||
           settings.notifications.dailyLogReminder.time !== '20:00' ||
           settings.notifications.insulinReminder.time !== '12:00';
  }

  /**
   * Obtém status da migração
   */
  private static getMigrationStatus(): { lastMigratedVersion?: string; migratedAt?: Date } {
    const data = storage.getString(this.MIGRATION_KEY);
    if (!data) return {};
    
    try {
      const status = JSON.parse(data);
      return {
        ...status,
        migratedAt: status.migratedAt ? new Date(status.migratedAt) : undefined
      };
    } catch {
      return {};
    }
  }

  /**
   * Marca migração como concluída
   */
  private static markMigrationComplete(): void {
    const migrationStatus = {
      lastMigratedVersion: this.CURRENT_VERSION,
      migratedAt: new Date().toISOString(),
      fromVersion: this.PREVIOUS_VERSION
    };
    
    storage.set(this.MIGRATION_KEY, JSON.stringify(migrationStatus));
    console.log('📝 Migração marcada como concluída');
  }

  /**
   * Obtém estatísticas de dados do usuário
   */
  static getUserDataStats(): { 
    totalLogs: number; 
    dateRange: { oldest?: string; newest?: string };
    hasCustomSettings: boolean;
  } {
    const allKeys = storage.getAllKeys();
    const logKeys = allKeys.filter(key => key.startsWith('log-'));
    
    let validLogs = 0;
    let dates: string[] = [];
    
    for (const key of logKeys) {
      try {
        const data = storage.getString(key);
        if (data) {
          const log = JSON.parse(data);
          if (this.isValidDailyLog(log)) {
            validLogs++;
            dates.push(log.date);
          }
        }
      } catch {
        // Ignorar logs inválidos
      }
    }
    
    dates.sort();
    const settings = StorageService.getSettings();
    
    return {
      totalLogs: validLogs,
      dateRange: {
        oldest: dates[0],
        newest: dates[dates.length - 1]
      },
      hasCustomSettings: this.hasCustomSettings(settings)
    };
  }

  /**
   * Força re-migração (para debugging)
   */
  static async forceMigration(): Promise<MigrationResult> {
    console.log('🔧 Forçando re-migração...');
    storage.delete(this.MIGRATION_KEY);
    return await this.runMigrationIfNeeded();
  }
}

export default DataMigrationService;