/**
 * Interface simplificada para DataRepository
 * Contrato essencial para operações de dados (local/Firebase)
 */
import { GlucoseEntry, BolusEntry, BasalEntry, DailyLog } from '../types';

export interface IDataRepository {
  /**
   * Inicialização do repositório
   */
  initialize(): Promise<void>;

  /**
   * Operações de Daily Logs
   */
  getDailyLog(date: string): Promise<DailyLog>;
  saveDailyLog(date: string, log: DailyLog): Promise<void>;
  deleteDailyLog(date: string): Promise<void>;

  /**
   * Operações de entrada individual
   */
  addGlucoseEntry(date: string, entry: GlucoseEntry): Promise<void>;
  updateGlucoseEntry(date: string, entryId: string, entry: GlucoseEntry): Promise<void>;
  deleteGlucoseEntry(date: string, entryId: string): Promise<void>;

  addBolusEntry(date: string, entry: BolusEntry): Promise<void>;
  updateBolusEntry(date: string, entryId: string, entry: BolusEntry): Promise<void>;
  deleteBolusEntry(date: string, entryId: string): Promise<void>;

  setBasalEntry(date: string, entry: BasalEntry): Promise<void>;
  clearBasalEntry(date: string): Promise<void>;

  /**
   * Operações de notas
   */
  setNotes(date: string, notes: string): Promise<void>;

  /**
   * Operações de lote
   */
  getLogsForMonth(year: number, month: number): Promise<DailyLog[]>;
  getLogsForDateRange(startDate: string, endDate: string): Promise<DailyLog[]>;
  getAllLogs(): Promise<DailyLog[]>;

  /**
   * Limpeza
   */
  clearAllData(): Promise<void>;
}