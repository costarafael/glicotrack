/**
 * FirebaseDataRepository - Versão Refatorada
 * Implementação limpa focada apenas na lógica essencial Firebase
 * Delegação de complexidade para serviços especializados
 */

import { DataRepository } from './DataRepository';
import { LocalDataRepository } from './LocalDataRepository';
import { FirebaseService } from './FirebaseService';
import { GlucoseEntry, BolusEntry, BasalEntry, DailyLog } from '../types';
import { MMKV } from 'react-native-mmkv';

export class FirebaseDataRepository implements DataRepository {
  private localRepo: LocalDataRepository;
  private firebaseService: FirebaseService;
  private storage: MMKV;
  private syncEnabled = false;
  
  // Auto Sync System
  private autoSyncInterval?: NodeJS.Timeout;
  private syncInProgress = false;
  
  // Companion Mode Support (Arquitetura do backup)
  private isCompanionMode = false;
  private companionUserKey?: string;
  private companionDataCache = new Map<string, any>(); // ✅ Cache por data específica

  constructor() {
    this.localRepo = LocalDataRepository.getInstance();
    this.firebaseService = FirebaseService.getInstance();
    this.storage = new MMKV({ id: 'firebase-sync' });
  }

  async initialize(): Promise<void> {
    await this.localRepo.initialize();
    await this.firebaseService.initialize();
  }

  /**
   * Recarrega a chave do usuário após account recovery
   * CRÍTICO: Garante que novos dados sejam salvos com a chave correta
   */
  async reloadUserKey(): Promise<void> {
    console.log('🔄 [FirebaseDataRepository] Reloading user key after account recovery...');
    await this.firebaseService.reloadUserKey();
    console.log('✅ [FirebaseDataRepository] User key reloaded successfully');
  }

  // ============================================================================
  // OPERAÇÕES PRINCIPAIS (Delegação para LocalRepository + Sync opcional)
  // ============================================================================

  async getLog(date: string): Promise<DailyLog> {
    // ✅ ARQUITETURA DO BACKUP: Em modo companion, busca dados externos com cache por data
    if (this.isCompanionMode && this.companionUserKey) {
      // ✅ CORREÇÃO CRÍTICA: Busca no cache primeiro (por data específica)
      const cached = this.companionDataCache.get(date);
      if (cached) {
        // Se cached é um objeto DailyLog já convertido, retorna direto
        if (cached.glucoseEntries !== undefined) {
          return cached;
        }
        // Se é dados Firebase brutos, converte
        return this.convertFromFirebaseFormat(cached, date);
      }
      
      // Se não estiver no cache, busca no Firebase
      try {
        const firebaseData = await this.fetchRemoteLog(this.companionUserKey, date);
        if (firebaseData) {
          // ✅ CACHE POR DATA ESPECÍFICA
          this.companionDataCache.set(date, firebaseData);
          return this.convertFromFirebaseFormat(firebaseData, date);
        } else {
          // ✅ Cache dados vazios para evitar re-fetch desnecessário
          const emptyLog = {
            date,
            glucoseEntries: [],
            bolusEntries: [],
          };
          this.companionDataCache.set(date, emptyLog);
          return emptyLog;
        }
      } catch (error) {
        console.error(`❌ [CompanionMode] Error fetching data:`, error);
        return {
          date,
          glucoseEntries: [],
          bolusEntries: [],
        };
      }
    }
    
    // Modo normal, busca dados locais
    return this.localRepo.getLog(date);
  }

  async saveLog(date: string, log: DailyLog): Promise<void> {
    await this.localRepo.saveLog(date, log);
    this.queueForSync(date);
  }

  async addGlucoseEntry(date: string, entry: GlucoseEntry): Promise<void> {
    await this.localRepo.addGlucoseEntry(date, entry);
    this.queueForSync(date);
  }

  async updateGlucoseEntry(date: string, entryId: string, entry: GlucoseEntry): Promise<void> {
    await this.localRepo.updateGlucoseEntry(date, entryId, entry);
    this.queueForSync(date);
  }

  async deleteGlucoseEntry(date: string, entryId: string): Promise<void> {
    await this.localRepo.deleteGlucoseEntry(date, entryId);
    this.queueForSync(date);
  }

  async addBolusEntry(date: string, entry: BolusEntry): Promise<void> {
    await this.localRepo.addBolusEntry(date, entry);
    this.queueForSync(date);
  }

  async updateBolusEntry(date: string, entryId: string, entry: BolusEntry): Promise<void> {
    await this.localRepo.updateBolusEntry(date, entryId, entry);
    this.queueForSync(date);
  }

  async deleteBolusEntry(date: string, entryId: string): Promise<void> {
    await this.localRepo.deleteBolusEntry(date, entryId);
    this.queueForSync(date);
  }

  async setBasalEntry(date: string, entry: BasalEntry): Promise<void> {
    await this.localRepo.setBasalEntry(date, entry);
    this.queueForSync(date);
  }

  async deleteBasalEntry(date: string): Promise<void> {
    await this.localRepo.deleteBasalEntry(date);
    this.queueForSync(date);
  }

  async setNotes(date: string, notes: string): Promise<void> {
    await this.localRepo.setNotes(date, notes);
    this.queueForSync(date);
  }

  // ============================================================================
  // OPERAÇÕES DE CONSULTA (Direto do LocalRepository)
  // ============================================================================

  async getAllLogs(): Promise<{ [date: string]: DailyLog }> {
    return this.localRepo.getAllLogs();
  }

  async getLogsForMonth(year: number, month: number): Promise<DailyLog[]> {
    // ✅ COMPANION MODE: Se estiver em modo companion, buscar dados externos por mês
    if (this.isCompanionMode && this.companionUserKey) {
      console.log(`📊 [FirebaseDataRepository] Getting month data for companion ${this.companionUserKey}: ${year}-${month}`);
      
      try {
        const monthlyLogs: DailyLog[] = [];
        
        // Gerar todas as datas do mês solicitado
        const daysInMonth = new Date(year, month, 0).getDate();
        const dates: string[] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          dates.push(dateStr);
        }
        
        // Buscar dados para cada data do mês
        for (const date of dates) {
          try {
            const log = await this.getLog(date); // getLog já suporta companion mode
            
            // Só adicionar logs que têm dados (não vazios)
            if (!this.isEmptyLog(log)) {
              monthlyLogs.push(log);
            }
          } catch (error) {
            console.warn(`⚠️ [FirebaseDataRepository] Failed to get companion data for ${date}:`, error);
            // Continue para próxima data mesmo se uma falhar
          }
        }
        
        // Ordenar por data (mais recente primeiro)
        monthlyLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        console.log(`✅ [FirebaseDataRepository] Loaded ${monthlyLogs.length} companion logs for ${year}-${month}`);
        return monthlyLogs;
        
      } catch (error) {
        console.error(`❌ [FirebaseDataRepository] Error loading companion month data:`, error);
        return []; // Retorna array vazio em caso de erro
      }
    }
    
    // Modo normal, buscar dados locais
    return this.localRepo.getLogsForMonth(year, month);
  }

  async getNotes(date: string): Promise<string> {
    return this.localRepo.getNotes(date);
  }

  async canAddBasal(date: string): Promise<boolean> {
    return this.localRepo.canAddBasal(date);
  }

  // ============================================================================
  // SINCRONIZAÇÃO FIREBASE (Implementação Simplificada)
  // ============================================================================

  enableSync(): void {
    this.syncEnabled = true;
    this.storage.set('sync_enabled', true);
    console.log('🔄 Firebase sync enabled');
    
    // ✅ NOVO: Iniciar sincronização automática em background
    this.startAutoSync();
    
    // ✅ NOVO: Sincronizar dados existentes imediatamente
    this.processSyncQueue().catch(error => {
      console.warn('⚠️ Initial sync failed:', error);
    });
  }

  disableSync(): void {
    this.syncEnabled = false;
    this.storage.set('sync_enabled', false);
    console.log('⏸️ Firebase sync disabled');
    
    // ✅ NOVO: Parar sincronização automática
    this.stopAutoSync();
  }

  isSyncEnabled(): boolean {
    return this.storage.getBoolean('sync_enabled') ?? false;
  }

  getSyncStatus() {
    const enabled = this.isSyncEnabled();
    const pending = this.getPendingSyncCount();
    const lastSync = this.storage.getString('last_sync');
    const isOnline = this.firebaseService.isAuthenticated();

    // ✅ NOVO: Status mais simples e claro
    let syncStatus: 'synced' | 'syncing' | 'pending' | 'offline' = 'synced';
    
    if (!isOnline) {
      syncStatus = 'offline';
    } else if (this.syncInProgress) {
      syncStatus = 'syncing';
    } else if (pending > 0) {
      syncStatus = 'pending';
    } else {
      syncStatus = 'synced';
    }

    return {
      enabled,
      isOnline,
      pending,
      lastSync: lastSync ? new Date(lastSync) : null,
      userKey: this.firebaseService.getUserKey(),
      // ✅ NOVO: Status simplificado
      syncStatus,
      isSyncing: this.syncInProgress,
    };
  }

  async forceSyncAllData(): Promise<void> {
    if (!this.isSyncEnabled() || !this.firebaseService.isAuthenticated()) {
      throw new Error('Sync not available');
    }

    console.log('🚀 Starting full data sync...');
    
    try {
      const allLogs = await this.localRepo.getAllLogs();
      let syncedCount = 0;

      for (const [date, log] of Object.entries(allLogs)) {
        if (!this.isEmptyLog(log)) {
          await this.syncLogToFirebase(date, log);
          syncedCount++;
        }
      }

      this.storage.set('last_sync', new Date().toISOString());
      console.log(`✅ Synced ${syncedCount} logs to Firebase`);
    } catch (error) {
      console.error('❌ Full sync failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS (Lógica interna simplificada)
  // ============================================================================

  private queueForSync(date: string): void {
    if (!this.isSyncEnabled()) return;

    const pending = this.getPendingSync();
    if (!pending.includes(date)) {
      pending.push(date);
      this.storage.set('pending_sync', JSON.stringify(pending));
    }

    // Sync IMEDIATAMENTE (não aguardar timeout)
    this.processSyncQueue().catch(error => {
      console.warn(`⚠️ [FirebaseDataRepository] Immediate sync failed for ${date}:`, error);
    });
  }

  private async processSyncQueue(): Promise<void> {
    // ✅ CORREÇÃO: Evitar processamento concorrente
    if (this.syncInProgress) {
      return;
    }

    if (!this.firebaseService.isAuthenticated()) {
      return;
    }

    const pending = this.getPendingSync();
    if (pending.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      // Processar TODOS os itens pendentes, não apenas o primeiro
      for (const date of pending) {
        try {
          const log = await this.localRepo.getLog(date);
          if (!this.isEmptyLog(log)) {
            await this.syncLogToFirebase(date, log);
            // syncLogToFirebase já remove da fila em caso de sucesso
          } else {
            // Remove logs vazios da fila
            this.removePendingSync(date);
            console.log(`🗑️ [FirebaseDataRepository] Removed empty log ${date} from sync queue`);
          }
        } catch (error) {
          console.error(`❌ Sync failed for ${date}:`, error);
          // Em caso de erro, manter na fila para tentar novamente depois
          break; // Para de processar se um item falhar
        }
      }
    } finally {
      this.syncInProgress = false;
      const remainingPending = this.getPendingSyncCount();
    }
  }

  private async syncLogToFirebase(date: string, log: DailyLog): Promise<void> {
    try {
      const firebaseData = this.convertToFirebaseFormat(log);
      
      await this.firebaseService.saveDailyLog(date, firebaseData);
      
      // ✅ CORREÇÃO CRÍTICA: Remover da fila de pendências após sucesso
      this.removePendingSync(date);
      
      // Atualizar timestamp de última sincronização
      this.storage.set('last_sync', new Date().toISOString());
      
      console.log(`✅ Synced log ${date} to Firebase. Remaining pending: ${this.getPendingSyncCount()}`);
    } catch (error) {
      console.error(`❌ Failed to sync ${date} to Firebase:`, error);
      throw error; // Re-throw para que o caller saiba que falhou
    }
  }

  private convertToFirebaseFormat(log: DailyLog): any {
    return {
      date: log.date,
      glucoseEntries: log.glucoseEntries.map(entry => ({
        id: entry.id,
        value: entry.value,
        timestamp: this.safeToISOString(entry.timestamp),
      })),
      bolusEntries: log.bolusEntries.map(entry => ({
        id: entry.id,
        units: entry.units,
        mealType: entry.mealType,
        timestamp: this.safeToISOString(entry.timestamp),
      })),
      basalEntry: log.basalEntry ? {
        id: log.basalEntry.id,
        units: log.basalEntry.units,
        timestamp: this.safeToISOString(log.basalEntry.timestamp),
      } : null,
      notes: log.notes || '',
      lastUpdated: new Date().toISOString(),
    };
  }

  private safeToISOString(timestamp: any): string {
    try {
      if (timestamp instanceof Date) {
        return timestamp.toISOString();
      }
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toISOString();
      }
      if (typeof timestamp === 'number') {
        return new Date(timestamp).toISOString();
      }
      // Fallback para timestamp atual se inválido
      console.warn('⚠️ Invalid timestamp:', timestamp, 'using current time');
      return new Date().toISOString();
    } catch (error) {
      console.error('❌ Error converting timestamp:', error);
      return new Date().toISOString();
    }
  }

  private isEmptyLog(log: DailyLog): boolean {
    return log.glucoseEntries.length === 0 && 
           log.bolusEntries.length === 0 && 
           !log.basalEntry && 
           !log.notes?.trim();
  }

  private getPendingSync(): string[] {
    const pending = this.storage.getString('pending_sync') || '[]';
    return JSON.parse(pending);
  }

  private removePendingSync(date: string): void {
    const pending = this.getPendingSync();
    const filtered = pending.filter(d => d !== date);
    this.storage.set('pending_sync', JSON.stringify(filtered));
  }

  private getPendingSyncCount(): number {
    return this.getPendingSync().length;
  }

  // ============================================================================
  // SISTEMA DE SINCRONIZAÇÃO AUTOMÁTICA
  // ============================================================================

  /**
   * Inicia sincronização automática em background
   */
  private startAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    // Sincronizar a cada 10 segundos se houver pendências
    this.autoSyncInterval = setInterval(() => {
      if (!this.syncInProgress && this.isSyncEnabled()) {
        const pendingCount = this.getPendingSyncCount();
        if (pendingCount > 0) {
          console.log(`🔄 [AutoSync] Processing ${pendingCount} pending items...`);
          this.processSyncQueue().catch(error => {
            console.warn('⚠️ [AutoSync] Background sync failed:', error);
          });
        }
      }
    }, 10000); // 10 segundos

    console.log('🔄 [AutoSync] Auto-sync started (every 10s)');
  }

  /**
   * Para sincronização automática
   */
  private stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = undefined;
      console.log('⏸️ [AutoSync] Auto-sync stopped');
    }
  }

  // ============================================================================
  // COMPANION MODE SUPPORT (Adicionar dados externos)
  // ============================================================================

  /**
   * Configura o modo companion para buscar dados de outro usuário
   * @param enabled Se o modo companion deve estar ativo
   * @param userKey Chave do usuário externo (opcional)
   */
  setCompanionMode(enabled: boolean, userKey?: string): void {
    this.isCompanionMode = enabled;
    this.companionUserKey = enabled ? userKey : undefined;
    
    if (enabled && userKey) {
      // ✅ Limpar cache ao trocar de usuário
      if (this.companionDataCache && this.companionDataCache.size > 0) {
        this.companionDataCache.clear();
      }
    } else {
      // ✅ ARQUITETURA DO BACKUP: Limpar cache ao sair do companion mode
      if (this.companionDataCache) {
        this.companionDataCache.clear();
      }
    }
  }

  /**
   * Busca dados Firebase de um usuário externo
   * @param userKey Chave única do usuário
   * @param date Data no formato YYYY-MM-DD
   * @returns Dados Firebase ou null
   */
  private async fetchRemoteLog(userKey: string, date: string): Promise<any | null> {
    try {
      const path = `users/${userKey}/daily_logs/${date}`;
      
      // IMPORTANTE: Garantir que não estamos buscando dados do usuário atual
      const currentUserKey = this.firebaseService.getUserKey();
      if (userKey === currentUserKey) {
        return null; // Não buscar dados do próprio usuário
      }
      
      // Busca dados reais do Firebase usando a chave externa
      try {
        const docSnapshot = await this.firebaseService.getExternalUserLog(userKey, date);
        
        // Verificar se o documento existe (compatível com FirebaseServiceAndroid)
        let exists = false;
        let data = null;
        
        if (docSnapshot) {
          // FirebaseServiceAndroid retorna: { exists: function, data: any, id: string }
          if (typeof docSnapshot.exists === 'function') {
            exists = docSnapshot.exists();
            data = exists ? docSnapshot.data : null;
          } else if (typeof docSnapshot.exists === 'boolean') {
            // Fallback para outras implementações Firebase
            exists = docSnapshot.exists;
            data = docSnapshot.data;
          }
        }
        
        if (exists && data) {
          return data;
        }
      } catch (firebaseError) {
        console.error(`❌ [FirebaseDataRepository] Firebase fetch error:`, firebaseError);
      }
      
      // Se chegou aqui, não há dados reais - retornar null
      return null;
      
    } catch (error) {
      console.error(`❌ [FirebaseDataRepository] Critical error in fetchRemoteLog:`, error);
      return null;
    }
  }

  /**
   * Converte dados do formato Firebase para DailyLog
   */
  private convertFromFirebaseFormat(firebaseData: any, date: string): DailyLog {
    // ✅ SAFETY CHECK: Se firebaseData é null ou undefined
    if (!firebaseData || typeof firebaseData !== 'object') {
      return {
        date,
        glucoseEntries: [],
        bolusEntries: [],
      };
    }
    
    // ✅ CORREÇÃO CRÍTICA: Suporte a formatos antigos E novos
    const glucoseArray = firebaseData.glucoseEntries || firebaseData.glucose || [];
    const bolusArray = firebaseData.bolusEntries || firebaseData.bolus || [];
    
    let result;
    try {
      result = {
        date,
        glucoseEntries: glucoseArray.map((entry: any) => ({
          id: entry.id,
          value: entry.value,
          timestamp: this.convertFirebaseTimestamp(entry.timestamp),
        })),
        bolusEntries: bolusArray.map((entry: any) => ({
          id: entry.id,
          units: entry.units || entry.value, // Compatibilidade: units OU value
          mealType: entry.mealType || 'correction', // Fallback se não tiver mealType
          timestamp: this.convertFirebaseTimestamp(entry.timestamp),
        })),
        basalEntry: firebaseData.basalEntry ? {
          id: firebaseData.basalEntry.id,
          units: firebaseData.basalEntry.units || firebaseData.basalEntry.value,
          timestamp: this.convertFirebaseTimestamp(firebaseData.basalEntry.timestamp),
        } : undefined,
        notes: firebaseData.notes || undefined,
      };
    } catch (error) {
      console.error(`❌ [FirebaseDataRepository] Error converting Firebase data:`, error);
      // Retorna dados vazios em caso de erro
      return {
        date,
        glucoseEntries: [],
        bolusEntries: [],
      };
    }
    
    return result;
  }

  /**
   * Converte timestamp do Firebase (Firestore Timestamp) para Date JavaScript
   */
  private convertFirebaseTimestamp(timestamp: any): Date {
    try {
      // Se já é uma Date, retorna como está
      if (timestamp instanceof Date) {
        return timestamp;
      }
      
      // Se é um Firestore Timestamp, tem método toDate()
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      
      // Se é string ISO, converte para Date
      if (typeof timestamp === 'string') {
        return new Date(timestamp);
      }
      
      // Se é timestamp Unix, converte
      if (typeof timestamp === 'number') {
        return new Date(timestamp);
      }
      
      // Fallback: timestamp atual
      console.warn('⚠️ [FirebaseDataRepository] Invalid timestamp format:', timestamp, 'using current time');
      return new Date();
    } catch (error) {
      console.error('❌ [FirebaseDataRepository] Error converting timestamp:', error);
      return new Date();
    }
  }

  /**
   * Retorna se está em modo companion
   */
  getCompanionMode(): { isCompanionMode: boolean; userKey?: string } {
    return {
      isCompanionMode: this.isCompanionMode,
      userKey: this.companionUserKey,
    };
  }

  // ============================================================================
  // ACCOUNT RECOVERY METHODS
  // ============================================================================

  /**
   * Checks if a user exists in Firebase by attempting to access their data
   * @param userKey The user key to validate
   * @returns Promise<boolean> True if the user exists, false otherwise
   */
  async doesUserExist(userKey: string): Promise<boolean> {
    try {
      // Don't check against current user key
      const currentUserKey = this.firebaseService.getUserKey();
      if (userKey === currentUserKey) {
        return false;
      }

      // Try to access the user's root document or any daily log
      const testDoc = await this.firebaseService.getExternalUserLog(userKey, '2024-01-01');
      
      // If we get any response (even empty), the user collection exists
      // If the user doesn't exist, Firebase should throw an error or return null
      return testDoc !== null;
    } catch (error) {
      console.error(`❌ [FirebaseDataRepository] Error checking if user exists:`, error);
      return false;
    }
  }

  /**
   * Fetches all daily logs for a specific user
   * @param userKey The user key to fetch data for
   * @returns Promise<DailyLog[]> Array of daily logs from Firebase
   */
  async fetchAllDataForUser(userKey: string): Promise<DailyLog[]> {
    try {
      // Don't fetch data from current user
      const currentUserKey = this.firebaseService.getUserKey();
      if (userKey === currentUserKey) {
        console.warn('⚠️ [FirebaseDataRepository] Cannot fetch data from current user');
        return [];
      }

      console.log(`🚀 [FirebaseDataRepository] Using OPTIMIZED range query for user: ${userKey}`);

      // Define date range for search (last 2 years)
      const currentDate = new Date();
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(currentDate.getFullYear() - 2);
      
      const startDateStr = twoYearsAgo.toISOString().split('T')[0]; // YYYY-MM-DD
      const endDateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD

      console.log(`📅 [FirebaseDataRepository] Range query: ${startDateStr} to ${endDateStr}`);

      // Use Firebase range query with document ID (MUCH faster than individual queries)
      const queryResult = await this.firebaseService.queryDailyLogsByDateRange(userKey, startDateStr, endDateStr);
      
      if (!queryResult || queryResult.length === 0) {
        console.log(`ℹ️ [FirebaseDataRepository] No logs found for user ${userKey}`);
        return [];
      }

      // Convert Firebase documents to DailyLog format
      const allLogs: DailyLog[] = [];
      for (const doc of queryResult) {
        try {
          const dailyLog = this.convertFromFirebaseFormat(doc.data, doc.id);
          if (!this.isEmptyLog(dailyLog)) {
            allLogs.push(dailyLog);
          }
        } catch (error) {
          console.warn(`⚠️ [FirebaseDataRepository] Error converting log ${doc.id}:`, error);
        }
      }

      console.log(`✅ [FirebaseDataRepository] OPTIMIZED query found ${allLogs.length} logs for user ${userKey} (single query!)`);
      
      // Sort by date (newest first)
      allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return allLogs;
    } catch (error) {
      console.error(`❌ [FirebaseDataRepository] Error in optimized fetch for user ${userKey}:`, error);
      throw error;
    }
  }
}