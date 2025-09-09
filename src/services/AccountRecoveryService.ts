import { DailyLog, GlucoseEntry, BolusEntry, BasalEntry } from '../types';
import { FirebaseDataRepository } from './FirebaseDataRepository';
import { LocalDataRepository } from './LocalDataRepository';
import { UserKeyService } from './UserKeyService';
import { StorageService } from './storage';

/**
 * AccountRecoveryService
 * 
 * Handles the complete account recovery process including:
 * - Validating recovery keys
 * - Fetching remote data 
 * - Merging local and remote data with conflict resolution
 * - Updating the user's account with recovered data
 */
export class AccountRecoveryService {
  private static instance: AccountRecoveryService;
  private firebaseRepo: FirebaseDataRepository;
  private localRepo: LocalDataRepository;

  private constructor() {
    this.firebaseRepo = new FirebaseDataRepository();
    this.localRepo = LocalDataRepository.getInstance();
  }

  static getInstance(): AccountRecoveryService {
    if (!AccountRecoveryService.instance) {
      AccountRecoveryService.instance = new AccountRecoveryService();
    }
    return AccountRecoveryService.instance;
  }

  /**
   * Validates if a recovery key exists in Firebase
   * @param recoveryKey The 8-character recovery key
   * @returns Promise<boolean> True if key exists, false otherwise
   */
  async validateRecoveryKey(recoveryKey: string): Promise<boolean> {
    try {
      console.log(`🔍 [AccountRecoveryService] Validating recovery key: ${recoveryKey}`);
      
      // Clean and validate key format
      const cleanKey = recoveryKey.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (!/^[A-Z0-9]{8}$/.test(cleanKey)) {
        console.error('❌ [AccountRecoveryService] Invalid key format');
        return false;
      }

      // Check if key exists in Firebase
      const exists = await this.firebaseRepo.doesUserExist(cleanKey);
      console.log(`${exists ? '✅' : '❌'} [AccountRecoveryService] Key validation result: ${exists}`);
      
      return exists;
    } catch (error) {
      console.error('❌ [AccountRecoveryService] Error validating recovery key:', error);
      return false;
    }
  }

  /**
   * Performs the complete account recovery process
   * @param recoveryKey The 8-character recovery key
   * @returns Promise<void>
   */
  async performRecovery(recoveryKey: string): Promise<void> {
    try {
      console.log(`🚀 [AccountRecoveryService] Starting account recovery for key: ${recoveryKey}`);
      
      const cleanKey = recoveryKey.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      
      // Step 1: Fetch remote data (using optimized Firebase query)
      console.log('📥 [AccountRecoveryService] Step 1: Fetching remote data...');
      
      const fetchStartTime = Date.now();
      const remoteData = await this.firebaseRepo.fetchAllDataForUser(cleanKey);
      const fetchDuration = Date.now() - fetchStartTime;
      
      console.log(`📊 [AccountRecoveryService] Found ${remoteData.length} remote logs in ${fetchDuration}ms`);

      // Step 2: Fetch local data
      console.log('📚 [AccountRecoveryService] Step 2: Fetching local data...');
      const localData = await this.localRepo.getAllLocalLogs();
      console.log(`📊 [AccountRecoveryService] Found ${localData.length} local logs`);

      // Step 3: Merge data with conflict resolution
      console.log('🔄 [AccountRecoveryService] Step 3: Merging data...');
      const mergedData = await this.mergeData(remoteData, localData);
      console.log(`📊 [AccountRecoveryService] Merged result: ${Object.keys(mergedData).length} unique dates`);

      // Step 4: Clear existing local data and save merged data
      console.log('🗑️ [AccountRecoveryService] Step 4: Clearing existing data...');
      await this.clearExistingLocalData();

      // Step 5: Save merged data locally
      console.log('💾 [AccountRecoveryService] Step 5: Saving merged data...');
      await this.saveMergedData(mergedData);

      // Step 6: Update user key
      console.log('🔑 [AccountRecoveryService] Step 6: Updating user key...');
      const userKeyService = UserKeyService.getInstance();
      userKeyService.setUserKey(cleanKey);

      // Step 6.1: CRÍTICO - Reload user key in Firebase services
      console.log('🔄 [AccountRecoveryService] Step 6.1: Reloading user key in Firebase services...');
      await this.firebaseRepo.reloadUserKey();

      // Step 7: Enable Firebase sync with new key
      console.log('🔄 [AccountRecoveryService] Step 7: Enabling sync with recovered key...');
      this.firebaseRepo.enableSync();

      // Step 8: Force sync of all merged data to Firebase
      console.log('🚀 [AccountRecoveryService] Step 8: Force syncing merged data to Firebase...');
      await this.firebaseRepo.forceSyncAllData();

      console.log('✅ [AccountRecoveryService] Account recovery completed successfully!');
    } catch (error) {
      console.error('❌ [AccountRecoveryService] Error during account recovery:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Account recovery failed: ${errorMessage}`);
    }
  }

  /**
   * Merges remote and local data with conflict resolution
   * @param remoteData Array of daily logs from Firebase
   * @param localData Array of daily logs from local storage
   * @returns Promise<Map<string, DailyLog>> Merged data by date
   */
  private async mergeData(
    remoteData: DailyLog[], 
    localData: DailyLog[]
  ): Promise<Map<string, DailyLog>> {
    const mergedData = new Map<string, DailyLog>();

    // First, add all remote data
    console.log('📥 [AccountRecoveryService] Processing remote data...');
    for (const remoteLog of remoteData) {
      mergedData.set(remoteLog.date, { ...remoteLog });
    }

    // Then, merge local data with conflict resolution
    console.log('🔄 [AccountRecoveryService] Merging local data with conflict resolution...');
    for (const localLog of localData) {
      const existingLog = mergedData.get(localLog.date);
      
      if (!existingLog) {
        // No conflict - just add local data
        mergedData.set(localLog.date, { ...localLog });
        console.log(`➕ [AccountRecoveryService] Added local data for ${localLog.date}`);
      } else {
        // Conflict detected - merge entries
        console.log(`⚠️ [AccountRecoveryService] Conflict detected for ${localLog.date} - merging entries`);
        const resolvedLog = this.resolveConflict(existingLog, localLog);
        mergedData.set(localLog.date, resolvedLog);
      }
    }

    return mergedData;
  }

  /**
   * Resolves conflicts between remote and local data for the same date
   * @param remoteLog Remote daily log
   * @param localLog Local daily log
   * @returns DailyLog Resolved daily log
   */
  private resolveConflict(remoteLog: DailyLog, localLog: DailyLog): DailyLog {
    console.log(`🔧 [AccountRecoveryService] Resolving conflict for ${remoteLog.date}`);

    // Step 1: Merge glucose entries (deduplicating by timestamp)
    const glucoseMap = new Map<number, GlucoseEntry>();
    
    // Add remote glucose entries first
    remoteLog.glucoseEntries.forEach(entry => {
      const timestamp = entry.timestamp.getTime();
      glucoseMap.set(timestamp, entry);
    });
    
    // Add local glucose entries (may overwrite if same timestamp)
    localLog.glucoseEntries.forEach(entry => {
      const timestamp = entry.timestamp.getTime();
      glucoseMap.set(timestamp, entry);
    });

    // Step 2: Merge bolus entries (deduplicating by timestamp)
    const bolusMap = new Map<number, BolusEntry>();
    
    // Add remote bolus entries first
    remoteLog.bolusEntries.forEach(entry => {
      const timestamp = entry.timestamp.getTime();
      bolusMap.set(timestamp, entry);
    });
    
    // Add local bolus entries (may overwrite if same timestamp)
    localLog.bolusEntries.forEach(entry => {
      const timestamp = entry.timestamp.getTime();
      bolusMap.set(timestamp, entry);
    });

    // Step 3: Resolve basal entry (keep the one with latest timestamp)
    let resolvedBasal: BasalEntry | undefined;
    if (remoteLog.basalEntry && localLog.basalEntry) {
      // Keep the one with the latest timestamp
      resolvedBasal = remoteLog.basalEntry.timestamp > localLog.basalEntry.timestamp 
        ? remoteLog.basalEntry 
        : localLog.basalEntry;
    } else {
      // Keep whichever one exists
      resolvedBasal = remoteLog.basalEntry || localLog.basalEntry;
    }

    // Step 4: Resolve notes (keep the note from the log with the most recent entry)
    let resolvedNotes: string | undefined;
    const remoteLatestTime = this.getLatestEntryTime(remoteLog);
    const localLatestTime = this.getLatestEntryTime(localLog);
    
    if (remoteLatestTime && localLatestTime) {
      resolvedNotes = remoteLatestTime > localLatestTime ? remoteLog.notes : localLog.notes;
    } else if (remoteLatestTime || localLatestTime) {
      resolvedNotes = remoteLatestTime ? remoteLog.notes : localLog.notes;
    } else {
      // If no entries with timestamps, prefer remote notes
      resolvedNotes = remoteLog.notes || localLog.notes;
    }

    // Step 5: Create resolved log
    const resolvedLog: DailyLog = {
      date: remoteLog.date,
      glucoseEntries: Array.from(glucoseMap.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
      bolusEntries: Array.from(bolusMap.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
      basalEntry: resolvedBasal,
      notes: resolvedNotes,
    };

    const totalEntries = resolvedLog.glucoseEntries.length + resolvedLog.bolusEntries.length + (resolvedLog.basalEntry ? 1 : 0);
    console.log(`✅ [AccountRecoveryService] Resolved conflict for ${remoteLog.date}: ${totalEntries} total entries`);

    return resolvedLog;
  }

  /**
   * Gets the latest entry timestamp from a daily log
   * @param log DailyLog to analyze
   * @returns Date | null Latest timestamp or null if no entries
   */
  private getLatestEntryTime(log: DailyLog): Date | null {
    const timestamps: Date[] = [];
    
    log.glucoseEntries.forEach(entry => timestamps.push(entry.timestamp));
    log.bolusEntries.forEach(entry => timestamps.push(entry.timestamp));
    if (log.basalEntry) {
      timestamps.push(log.basalEntry.timestamp);
    }
    
    if (timestamps.length === 0) return null;
    
    return new Date(Math.max(...timestamps.map(t => t.getTime())));
  }

  /**
   * Clears all existing local data (logs and settings related to the old user)
   */
  private async clearExistingLocalData(): Promise<void> {
    try {
      const allKeys = StorageService.getAllKeys();
      const logKeys = allKeys.filter(key => key.startsWith('log-'));
      
      console.log(`🗑️ [AccountRecoveryService] Clearing ${logKeys.length} existing log entries`);
      
      // Import MMKV to access the storage directly for clearing
      const { MMKV } = await import('react-native-mmkv');
      const storage = new MMKV();
      
      // Clear all log entries but preserve app settings and theme preferences
      logKeys.forEach(key => {
        storage.delete(key);
      });
      
      // Also clear Firebase sync settings (will be recreated with new key)
      const syncKeys = allKeys.filter(key => 
        key.includes('sync') || 
        key.includes('firebase') || 
        key === 'user_key'
      );
      
      syncKeys.forEach(key => {
        storage.delete(key);
      });
      
      console.log(`🗑️ [AccountRecoveryService] Cleared ${logKeys.length + syncKeys.length} storage keys`);
    } catch (error) {
      console.error('❌ [AccountRecoveryService] Error clearing existing data:', error);
      throw error;
    }
  }

  /**
   * Saves merged data to local storage
   * @param mergedData Map of merged daily logs
   */
  private async saveMergedData(mergedData: Map<string, DailyLog>): Promise<void> {
    try {
      const entries = Array.from(mergedData.entries());
      console.log(`💾 [AccountRecoveryService] Saving ${entries.length} merged logs to local storage`);
      
      for (const [date, log] of entries) {
        await this.localRepo.saveLog(date, log);
      }
      
      console.log('✅ [AccountRecoveryService] Successfully saved all merged data');
    } catch (error) {
      console.error('❌ [AccountRecoveryService] Error saving merged data:', error);
      throw error;
    }
  }
}

export default AccountRecoveryService;