// import { MMKV } from 'react-native-mmkv'; // Temporarily disabled
import { MMKV } from './mmkv-mock'; // Mock for testing without MMKV
import { DailyLog, AppSettings } from '../types';

const storage = new MMKV();

export class StorageService {
  // Daily log operations
  static saveDailyLog(date: string, log: DailyLog): void {
    const key = `log-${date}`;
    storage.set(key, JSON.stringify(log));
  }

  static getDailyLog(date: string): DailyLog | null {
    const key = `log-${date}`;
    const data = storage.getString(key);
    
    if (!data) return null;
    
    try {
      const log = JSON.parse(data);
      // Convert timestamp strings back to Date objects
      log.glucoseEntries = log.glucoseEntries.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
      log.bolusEntries = log.bolusEntries.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
      if (log.basalEntry) {
        log.basalEntry.timestamp = new Date(log.basalEntry.timestamp);
      }
      return log;
    } catch {
      return null;
    }
  }

  static getMonthlyLogs(year: number, month: number): DailyLog[] {
    const logs: DailyLog[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const log = this.getDailyLog(date);
      if (log) {
        logs.push(log);
      }
    }
    
    return logs;
  }

  // App settings operations
  static saveSettings(settings: AppSettings): void {
    storage.set('app-settings', JSON.stringify(settings));
  }

  static getSettings(): AppSettings {
    const data = storage.getString('app-settings');
    
    if (!data) {
      // Return default settings
      return {
        theme: 'light',
        notifications: {
          basalReminder: {
            enabled: false,
            time: '08:00',
          },
          dailyLogReminder: {
            enabled: false,
            time: '20:00',
          },
          insulinReminder: {
            enabled: false,
            time: '12:00',
          },
        },
      };
    }
    
    try {
      return JSON.parse(data);
    } catch {
      return {
        theme: 'light',
        notifications: {
          basalReminder: {
            enabled: false,
            time: '08:00',
          },
          dailyLogReminder: {
            enabled: false,
            time: '20:00',
          },
          insulinReminder: {
            enabled: false,
            time: '12:00',
          },
        },
      };
    }
  }

  // Theme preference
  static saveTheme(theme: 'light' | 'dark'): void {
    storage.set('theme-preference', theme);
  }

  static getTheme(): 'light' | 'dark' {
    return storage.getString('theme-preference') as 'light' | 'dark' || 'light';
  }

  // Clear all data (for debugging)
  static clearAll(): void {
    storage.clearAll();
  }

  // Get all storage keys (for account recovery)
  static getAllKeys(): string[] {
    return storage.getAllKeys();
  }
}