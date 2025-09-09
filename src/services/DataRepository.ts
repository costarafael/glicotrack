/**
 * DataRepository - Interface para abstração de dados
 * Permite diferentes implementações (Local MMKV, Firebase, etc)
 */

import { DailyLog, GlucoseEntry, BolusEntry, BasalEntry } from '../types';

export interface DataRepository {
  // Inicialização
  initialize(): Promise<void>;

  // Operações de log diário
  saveLog(date: string, log: DailyLog): Promise<void>;
  getLog(date: string): Promise<DailyLog>;
  getAllLogs(): Promise<{ [date: string]: DailyLog }>;
  getLogsForMonth(year: number, month: number): Promise<DailyLog[]>;

  // Operações de entradas individuais
  addGlucoseEntry(date: string, entry: GlucoseEntry): Promise<void>;
  addBolusEntry(date: string, entry: BolusEntry): Promise<void>;
  setBasalEntry(date: string, entry: BasalEntry): Promise<void>;
  
  removeGlucoseEntry(date: string, entryId: string): Promise<void>;
  removeBolusEntry(date: string, entryId: string): Promise<void>;
  clearBasalEntry(date: string): Promise<void>;
  
  updateEntryTime(date: string, entryId: string, entryType: 'glucose' | 'bolus' | 'basal', newTime: Date): Promise<void>;

  // Operações de notas
  saveNotes(date: string, notes: string): Promise<void>;
  getNotes(date: string): Promise<string>;

  // Utilidades
  canAddBasal(date: string): Promise<boolean>;

  // Companion Mode - Novos métodos para Modo Acompanhamento
  isReadOnlyMode(): boolean;
  loadExternalData(userKey: string): Promise<void>;
  clearTemporaryData(): Promise<void>;
  setReadOnlyMode(enabled: boolean, userKey?: string): void;
  getActiveUserKey(): string | null;
}

export default DataRepository;