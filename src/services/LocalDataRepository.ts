/**
 * LocalDataRepository - Implementação local usando MMKV
 * Utiliza o StorageService existente para compatibilidade
 */

import { DataRepository } from './DataRepository';
import { StorageService } from './storage';
import { DailyLog, GlucoseEntry, BolusEntry, BasalEntry } from '../types';

export class LocalDataRepository implements DataRepository {
  private static instance: LocalDataRepository;

  private constructor() {}

  static getInstance(): LocalDataRepository {
    if (!LocalDataRepository.instance) {
      LocalDataRepository.instance = new LocalDataRepository();
    }
    return LocalDataRepository.instance;
  }

  async initialize(): Promise<void> {
    // MMKV não precisa de inicialização especial
  }

  // ============================================================================
  // OPERAÇÕES DE LOG DIÁRIO
  // ============================================================================

  async saveLog(date: string, log: DailyLog): Promise<void> {
    StorageService.saveDailyLog(date, log);
  }

  async getLog(date: string): Promise<DailyLog> {
    const log = StorageService.getDailyLog(date);
    
    if (log) {
      return log;
    }
    
    // Retorna log vazio se não existir
    return {
      date,
      glucoseEntries: [],
      bolusEntries: [],
      basalEntry: undefined,
      notes: undefined,
    };
  }

  async getAllLogs(): Promise<{ [date: string]: DailyLog }> {
    const logs: { [date: string]: DailyLog } = {};
    
    // Busca os últimos 12 meses de dados
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 12, 1);
    
    while (startDate <= today) {
      // Usa formatação local para evitar problemas de fuso horário
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const log = StorageService.getDailyLog(dateStr);
      
      if (log && (log.glucoseEntries.length > 0 || log.bolusEntries.length > 0 || log.basalEntry || (log.notes && log.notes.trim() !== ''))) {
        logs[dateStr] = log;
      }
      
      startDate.setDate(startDate.getDate() + 1);
    }
    
    return logs;
  }

  /**
   * Gets ALL local logs without date restrictions (used for account recovery)
   * @returns Promise<DailyLog[]> Array of all daily logs stored locally
   */
  async getAllLocalLogs(): Promise<DailyLog[]> {
    console.log('📚 [LocalDataRepository] Getting all local logs for account recovery...');
    
    try {
      // Get all keys from MMKV that start with 'log-'
      const allKeys = StorageService.getAllKeys?.() || [];
      const logKeys = allKeys.filter(key => key.startsWith('log-'));
      
      console.log(`📋 [LocalDataRepository] Found ${logKeys.length} log keys in storage`);
      
      const allLocalLogs: DailyLog[] = [];
      
      for (const key of logKeys) {
        try {
          // Extract date from key (format: "log-YYYY-MM-DD")
          const date = key.replace('log-', '');
          
          // Validate date format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            console.warn(`⚠️ [LocalDataRepository] Invalid date format in key: ${key}`);
            continue;
          }
          
          const log = StorageService.getDailyLog(date);
          
          if (log && !this.isEmptyLog(log)) {
            allLocalLogs.push(log);
          }
        } catch (error) {
          console.warn(`⚠️ [LocalDataRepository] Failed to load log from key ${key}:`, error);
          // Continue processing other logs even if one fails
        }
      }
      
      // Sort by date (newest first)
      allLocalLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log(`✅ [LocalDataRepository] Loaded ${allLocalLogs.length} local logs for recovery`);
      return allLocalLogs;
    } catch (error) {
      console.error('❌ [LocalDataRepository] Error getting all local logs:', error);
      return [];
    }
  }

  /**
   * Helper method to check if a log is empty
   */
  private isEmptyLog(log: DailyLog): boolean {
    return log.glucoseEntries.length === 0 && 
           log.bolusEntries.length === 0 && 
           !log.basalEntry && 
           !log.notes?.trim();
  }

  async getLogsForMonth(year: number, month: number): Promise<DailyLog[]> {
    return StorageService.getMonthlyLogs(year, month);
  }

  // ============================================================================
  // OPERAÇÕES DE ENTRADAS INDIVIDUAIS
  // ============================================================================

  async addGlucoseEntry(date: string, entry: GlucoseEntry): Promise<void> {
    const log = await this.getLog(date);
    log.glucoseEntries.push(entry);
    log.glucoseEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    await this.saveLog(date, log);
  }

  async addBolusEntry(date: string, entry: BolusEntry): Promise<void> {
    const log = await this.getLog(date);
    log.bolusEntries.push(entry);
    log.bolusEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    await this.saveLog(date, log);
  }

  async setBasalEntry(date: string, entry: BasalEntry): Promise<void> {
    const log = await this.getLog(date);
    log.basalEntry = entry;
    await this.saveLog(date, log);
  }

  async removeGlucoseEntry(date: string, entryId: string): Promise<void> {
    const log = await this.getLog(date);
    log.glucoseEntries = log.glucoseEntries.filter(entry => entry.id !== entryId);
    await this.saveLog(date, log);
  }

  async removeBolusEntry(date: string, entryId: string): Promise<void> {
    const log = await this.getLog(date);
    log.bolusEntries = log.bolusEntries.filter(entry => entry.id !== entryId);
    await this.saveLog(date, log);
  }

  async clearBasalEntry(date: string): Promise<void> {
    const log = await this.getLog(date);
    log.basalEntry = undefined;
    await this.saveLog(date, log);
  }

  async updateEntryTime(date: string, entryId: string, entryType: 'glucose' | 'bolus' | 'basal', newTime: Date): Promise<void> {
    const log = await this.getLog(date);

    switch (entryType) {
      case 'glucose':
        const glucoseEntry = log.glucoseEntries.find(entry => entry.id === entryId);
        if (glucoseEntry) {
          glucoseEntry.timestamp = newTime;
          log.glucoseEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        }
        break;
        
      case 'bolus':
        const bolusEntry = log.bolusEntries.find(entry => entry.id === entryId);
        if (bolusEntry) {
          bolusEntry.timestamp = newTime;
          log.bolusEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        }
        break;
        
      case 'basal':
        if (log.basalEntry && log.basalEntry.id === entryId) {
          log.basalEntry.timestamp = newTime;
        }
        break;
    }

    await this.saveLog(date, log);
  }

  // ============================================================================
  // OPERAÇÕES DE NOTAS
  // ============================================================================

  async saveNotes(date: string, notes: string): Promise<void> {
    const log = await this.getLog(date);
    log.notes = notes;
    await this.saveLog(date, log);
  }

  async getNotes(date: string): Promise<string> {
    const log = await this.getLog(date);
    return log.notes || '';
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  async canAddBasal(date: string): Promise<boolean> {
    const log = await this.getLog(date);
    return !log.basalEntry;
  }

  // ============================================================================
  // COMPANION MODE METHODS (Default implementations)
  // ============================================================================

  /**
   * LocalDataRepository não suporta companion mode por design
   * Estes métodos fornecem implementações padrão
   */
  isReadOnlyMode(): boolean {
    return false; // LocalRepository nunca está em read-only
  }

  async loadExternalData(userKey: string): Promise<void> {
    throw new Error('LocalDataRepository does not support external data loading');
  }

  async clearTemporaryData(): Promise<void> {
    // No-op para LocalDataRepository
  }

  setReadOnlyMode(enabled: boolean, userKey?: string): void {
    if (enabled) {
      throw new Error('LocalDataRepository does not support read-only mode');
    }
    // No-op se disabled
  }

  getActiveUserKey(): string | null {
    // LocalDataRepository sempre retorna null pois não tem conceito de user key
    return null;
  }
}

export default LocalDataRepository;