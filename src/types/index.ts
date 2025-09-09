export interface GlucoseEntry {
  id: string;
  value: number;
  timestamp: Date;
}

export type MealType = 'breakfast' | 'lunch' | 'afternoon_snack' | 'snack' | 'dinner' | 'correction';

export interface BolusEntry {
  id: string;
  units: number;
  timestamp: Date;
  mealType: MealType;
}

export interface BasalEntry {
  id: string;
  units: number;
  timestamp: Date;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD format
  glucoseEntries: GlucoseEntry[];
  bolusEntries: BolusEntry[];
  basalEntry?: BasalEntry;
  notes?: string;
}

export type EntryType = 'glucose' | 'bolus' | 'basal' | 'notes';

export interface AppSettings {
  theme: 'light' | 'dark';
  notifications: {
    basalReminder: {
      enabled: boolean;
      time: string; // HH:MM format
    };
    dailyLogReminder: {
      enabled: boolean;
      time: string;
    };
    insulinReminder: {
      enabled: boolean;
      time: string;
    };
  };
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface Theme {
  colors: ThemeColors;
  typography: any;
  isDark: boolean;
}