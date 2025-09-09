import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { DailyLog, GlucoseEntry, BolusEntry, BasalEntry, EntryType, MealType } from '../types';
import { StorageService } from '../services/storage';
import { SimpleReminderService } from '../services/SimpleReminderService';
import { useFirebase } from './FirebaseContext';
import { useCompanionMode } from './CompanionContext';
import { AccountRecoveryService } from '../services/AccountRecoveryService';

interface DataState {
  currentDate: string;
  currentLog: DailyLog | null;
}

type DataAction =
  | { type: 'SET_DATE'; payload: string }
  | { type: 'SET_LOG'; payload: DailyLog | null }
  | { type: 'ADD_GLUCOSE_ENTRY'; payload: GlucoseEntry }
  | { type: 'ADD_BOLUS_ENTRY'; payload: BolusEntry }
  | { type: 'SET_BASAL_ENTRY'; payload: BasalEntry }
  | { type: 'UPDATE_NOTES'; payload: string }
  | { type: 'UPDATE_ENTRY_TIME'; payload: { type: EntryType; id: string; newTime: Date } }
  | { type: 'REMOVE_ENTRY'; payload: { type: EntryType; id: string } };

// Função auxiliar para obter data local no formato YYYY-MM-DD
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialState: DataState = {
  currentDate: getLocalDateString(), // Usa data local, não UTC
  currentLog: null,
};

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_DATE':
      return {
        ...state,
        currentDate: action.payload,
        currentLog: StorageService.getDailyLog(action.payload),
      };

    case 'SET_LOG':
      return {
        ...state,
        currentLog: action.payload,
      };

    case 'ADD_GLUCOSE_ENTRY': {
      const currentLog = state.currentLog || {
        date: state.currentDate,
        glucoseEntries: [],
        bolusEntries: [],
      };

      const sortedEntries = [...currentLog.glucoseEntries, action.payload].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      const updatedLog = {
        ...currentLog,
        glucoseEntries: sortedEntries,
      };

      StorageService.saveDailyLog(state.currentDate, updatedLog);

      return {
        ...state,
        currentLog: updatedLog,
      };
    }

    case 'ADD_BOLUS_ENTRY': {
      const currentLog = state.currentLog || {
        date: state.currentDate,
        glucoseEntries: [],
        bolusEntries: [],
      };

      const updatedLog = {
        ...currentLog,
        bolusEntries: [...currentLog.bolusEntries, action.payload].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        ),
      };

      StorageService.saveDailyLog(state.currentDate, updatedLog);

      // Agendar lembrete de glicose após bolus
      try {
        const reminderService = SimpleReminderService.getInstance();
        reminderService.scheduleGlucoseAfterBolus(action.payload.timestamp);
      } catch (error) {
        console.warn('Erro ao agendar lembrete após bolus:', error);
      }

      return {
        ...state,
        currentLog: updatedLog,
      };
    }

    case 'SET_BASAL_ENTRY': {
      const currentLog = state.currentLog || {
        date: state.currentDate,
        glucoseEntries: [],
        bolusEntries: [],
      };

      const updatedLog = {
        ...currentLog,
        basalEntry: action.payload,
      };

      StorageService.saveDailyLog(state.currentDate, updatedLog);

      return {
        ...state,
        currentLog: updatedLog,
      };
    }

    case 'UPDATE_NOTES': {
      const currentLog = state.currentLog || {
        date: state.currentDate,
        glucoseEntries: [],
        bolusEntries: [],
      };

      const updatedLog = {
        ...currentLog,
        notes: action.payload || undefined,
      };

      StorageService.saveDailyLog(state.currentDate, updatedLog);

      return {
        ...state,
        currentLog: updatedLog,
      };
    }

    case 'UPDATE_ENTRY_TIME': {
      if (!state.currentLog) return state;

      let updatedLog = { ...state.currentLog };

      switch (action.payload.type) {
        case 'glucose':
          updatedLog.glucoseEntries = updatedLog.glucoseEntries.map(entry =>
            entry.id === action.payload.id
              ? { ...entry, timestamp: action.payload.newTime }
              : entry
          ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          break;
        case 'bolus':
          updatedLog.bolusEntries = updatedLog.bolusEntries.map(entry =>
            entry.id === action.payload.id
              ? { ...entry, timestamp: action.payload.newTime }
              : entry
          ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          break;
        case 'basal':
          if (updatedLog.basalEntry && updatedLog.basalEntry.id === action.payload.id) {
            updatedLog.basalEntry = { ...updatedLog.basalEntry, timestamp: action.payload.newTime };
          }
          break;
      }

      StorageService.saveDailyLog(state.currentDate, updatedLog);

      return {
        ...state,
        currentLog: updatedLog,
      };
    }

    case 'REMOVE_ENTRY': {
      if (!state.currentLog) return state;

      let updatedLog = { ...state.currentLog };

      switch (action.payload.type) {
        case 'glucose':
          updatedLog.glucoseEntries = updatedLog.glucoseEntries.filter(
            entry => entry.id !== action.payload.id
          );
          break;
        case 'bolus':
          updatedLog.bolusEntries = updatedLog.bolusEntries.filter(
            entry => entry.id !== action.payload.id
          );
          break;
        case 'basal':
          updatedLog.basalEntry = undefined;
          break;
      }

      StorageService.saveDailyLog(state.currentDate, updatedLog);

      return {
        ...state,
        currentLog: updatedLog,
      };
    }

    default:
      return state;
  }
}

interface DataContextType {
  state: DataState;
  setCurrentDate: (date: string) => void;
  addGlucoseEntry: (value: number) => Promise<void>;
  addBolusEntry: (units: number, mealType: MealType) => Promise<void>;
  setBasalEntry: (units: number) => Promise<boolean>; // Returns false if basal already exists
  updateNotes: (notes: string) => Promise<void>;
  updateEntryTime: (type: EntryType, id: string, newTime: Date) => Promise<void>;
  removeEntry: (type: EntryType, id: string) => Promise<void>;
  canAddBasal: () => boolean;
  
  // Account Recovery
  recoverAccount: (recoveryKey: string) => Promise<void>;
  
  // Companion Mode integration
  isReadOnlyMode: boolean;
  activeUserKey?: string;
  refreshCurrentLog: () => Promise<void>;
  isLoadingCompanionData?: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { getRepository } = useFirebase();
  const { isCompanionMode, activeKey } = useCompanionMode();
  const [isLoadingCompanionData, setIsLoadingCompanionData] = useState(false);
  const [state, dispatch] = useReducer(dataReducer, {
    ...initialState,
    currentLog: StorageService.getDailyLog(initialState.currentDate),
  });

  // Helper function to save with Firebase sync
  const saveLogWithSync = async (date: string, log: DailyLog) => {
    console.log(`🔍 saveLogWithSync - Date: ${date}, Log date: ${log.date}`);
    console.log(`🔍 Current state date: ${state.currentDate}`);
    
    // Always save locally first
    StorageService.saveDailyLog(date, log);
    
    // If Firebase sync is enabled, also sync to Firebase
    const firebaseRepo = getRepository();
    if (firebaseRepo) {
      try {
        await firebaseRepo.saveLog(date, log);
        console.log(`🔄 Log ${date} marcado para sincronização Firebase`);
      } catch (error) {
        console.warn('⚠️ Erro ao sincronizar com Firebase:', error);
      }
    }
  };

  const setCurrentDate = (date: string) => {
    dispatch({ type: 'SET_DATE', payload: date });
  };

  const addGlucoseEntry = async (value: number) => {
    // COMPANION MODE PROTECTION
    if (isCompanionMode) {
      throw new Error('Cannot add glucose entry in companion mode (read-only)');
    }
    
    const timestamp = createSmartTimestamp();

    const entry: GlucoseEntry = {
      id: Date.now().toString(),
      value,
      timestamp,
    };
    dispatch({ type: 'ADD_GLUCOSE_ENTRY', payload: entry });
    
    // Sync with Firebase if available
    const currentLog = state.currentLog || {
      date: state.currentDate,
      glucoseEntries: [],
      bolusEntries: [],
    };
    const updatedLog = {
      ...currentLog,
      glucoseEntries: [...currentLog.glucoseEntries, entry].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    };
    await saveLogWithSync(state.currentDate, updatedLog);
  };

  const addBolusEntry = async (units: number, mealType: MealType) => {
    // COMPANION MODE PROTECTION
    if (isCompanionMode) {
      throw new Error('Cannot add bolus entry in companion mode (read-only)');
    }
    
    const timestamp = createSmartTimestamp();

    const entry: BolusEntry = {
      id: Date.now().toString(),
      units,
      timestamp,
      mealType,
    };
    dispatch({ type: 'ADD_BOLUS_ENTRY', payload: entry });
    
    // Sync with Firebase if available
    const currentLog = state.currentLog || {
      date: state.currentDate,
      glucoseEntries: [],
      bolusEntries: [],
    };
    const updatedLog = {
      ...currentLog,
      bolusEntries: [...currentLog.bolusEntries, entry].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    };
    await saveLogWithSync(state.currentDate, updatedLog);
  };

  const setBasalEntry = async (units: number): Promise<boolean> => {
    // COMPANION MODE PROTECTION
    if (isCompanionMode) {
      throw new Error('Cannot set basal entry in companion mode (read-only)');
    }
    
    if (state.currentLog?.basalEntry) {
      return false; // Basal already exists for this day
    }

    const timestamp = createSmartTimestamp();

    const entry: BasalEntry = {
      id: Date.now().toString(),
      units,
      timestamp,
    };
    dispatch({ type: 'SET_BASAL_ENTRY', payload: entry });
    
    // Sync with Firebase if available
    const currentLog = state.currentLog || {
      date: state.currentDate,
      glucoseEntries: [],
      bolusEntries: [],
    };
    const updatedLog = {
      ...currentLog,
      basalEntry: entry,
    };
    await saveLogWithSync(state.currentDate, updatedLog);
    
    return true;
  };

  const removeEntry = async (type: EntryType, id: string) => {
    // COMPANION MODE PROTECTION
    if (isCompanionMode) {
      throw new Error('Cannot remove entry in companion mode (read-only)');
    }
    
    dispatch({ type: 'REMOVE_ENTRY', payload: { type, id } });
    
    // Sincroniza com Firebase após remover entrada
    if (state.currentLog) {
      let updatedLog = { ...state.currentLog };
      
      switch (type) {
        case 'glucose':
          updatedLog.glucoseEntries = updatedLog.glucoseEntries.filter(
            entry => entry.id !== id
          );
          break;
        case 'bolus':
          updatedLog.bolusEntries = updatedLog.bolusEntries.filter(
            entry => entry.id !== id
          );
          break;
        case 'basal':
          updatedLog.basalEntry = undefined;
          break;
      }
      
      await saveLogWithSync(state.currentDate, updatedLog);
    }
  };

  const updateNotes = async (notes: string) => {
    // COMPANION MODE PROTECTION
    if (isCompanionMode) {
      throw new Error('Cannot update notes in companion mode (read-only)');
    }
    
    dispatch({ type: 'UPDATE_NOTES', payload: notes });
    
    // Sincroniza com Firebase após atualizar notas
    if (state.currentLog) {
      const updatedLog = {
        ...state.currentLog,
        notes: notes || undefined,
      };
      
      await saveLogWithSync(state.currentDate, updatedLog);
    }
  };

  const updateEntryTime = async (type: EntryType, id: string, newTime: Date) => {
    // COMPANION MODE PROTECTION
    if (isCompanionMode) {
      throw new Error('Cannot update entry time in companion mode (read-only)');
    }
    
    dispatch({ type: 'UPDATE_ENTRY_TIME', payload: { type, id, newTime } });
    
    // Sincroniza com Firebase após atualizar o timestamp
    if (state.currentLog) {
      let updatedLog = { ...state.currentLog };
      
      switch (type) {
        case 'glucose':
          updatedLog.glucoseEntries = updatedLog.glucoseEntries.map(entry =>
            entry.id === id
              ? { ...entry, timestamp: newTime }
              : entry
          ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          break;
        case 'bolus':
          updatedLog.bolusEntries = updatedLog.bolusEntries.map(entry =>
            entry.id === id
              ? { ...entry, timestamp: newTime }
              : entry
          ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          break;
        case 'basal':
          if (updatedLog.basalEntry && updatedLog.basalEntry.id === id) {
            updatedLog.basalEntry = { ...updatedLog.basalEntry, timestamp: newTime };
          }
          break;
      }
      
      await saveLogWithSync(state.currentDate, updatedLog);
    }
  };

  const canAddBasal = (): boolean => {
    return !state.currentLog?.basalEntry;
  };

  /**
   * Recarrega os dados do dia atual (útil quando mudando de companion mode)
   */
  /**
   * Recovers an account using the provided recovery key
   * @param recoveryKey The 8-character recovery key
   */
  const recoverAccount = async (recoveryKey: string): Promise<void> => {
    try {
      console.log(`🔄 [DataContext] Starting account recovery for key: ${recoveryKey}`);
      
      const recoveryService = AccountRecoveryService.getInstance();
      
      // Perform the recovery process
      await recoveryService.performRecovery(recoveryKey);
      
      console.log('✅ [DataContext] Account recovery completed successfully');
      
      // After successful recovery, refresh the current log to show merged data
      await refreshCurrentLog();
      
    } catch (error) {
      console.error('❌ [DataContext] Error during account recovery:', error);
      throw error;
    }
  };
  const refreshCurrentLog = async () => {
    console.log(`🔍 [DataContext] refreshCurrentLog - companion: ${isCompanionMode}, key: ${activeKey?.key}`);
    console.log(`🔍 [DataContext] activeKey object:`, activeKey);
    console.log(`🔍 [DataContext] Current date: ${state.currentDate}`);
    
    if (isCompanionMode && activeKey) {
      // Em companion mode, precisa de Firebase repository
      console.log(`🎯 [DataContext] ENTERING COMPANION MODE for key: ${activeKey.key}`);
      setIsLoadingCompanionData(true);
      try {
        // Verifica se já temos repository do Firebase context
        let repository = getRepository();
        console.log(`🔍 [DataContext] Repository from FirebaseContext:`, repository ? 'EXISTS' : 'NULL');
        console.log(`🔍 [DataContext] Repository type:`, typeof repository);
        console.log(`🔍 [DataContext] Repository value:`, repository);
        console.log(`🔍 [DataContext] Repository === null:`, repository === null);
        console.log(`🔍 [DataContext] Repository === undefined:`, repository === undefined);
        
        // Se não tiver repository (Firebase sync desabilitado), cria um específico para companion mode
        if (!repository) {
          console.log(`🔧 [DataContext] Creating dedicated repository for companion mode`);
          try {
            console.log(`🔍 [DataContext] Importing FirebaseDataRepository...`);
            const { FirebaseDataRepository } = await import('../services/FirebaseDataRepository');
            console.log(`🔍 [DataContext] FirebaseDataRepository imported successfully`);
            console.log(`🔍 [DataContext] Creating new FirebaseDataRepository instance...`);
            repository = new FirebaseDataRepository();
            console.log(`🔍 [DataContext] FirebaseDataRepository instance created`);
            console.log(`🔍 [DataContext] Initializing FirebaseDataRepository...`);
            await repository.initialize();
            console.log(`🔍 [DataContext] FirebaseDataRepository initialized successfully`);
          } catch (error) {
            console.error(`❌ [DataContext] CRITICAL ERROR creating/initializing FirebaseDataRepository:`);
            console.error(`❌ [DataContext] Error message:`, error?.message);
            console.error(`❌ [DataContext] Error stack:`, error?.stack);
            console.error(`❌ [DataContext] Error object:`, error);
            // Propagar o erro para que apareça nos logs
            throw error;
          }
        }
        
        // Configura o modo companion no repository
        if (repository && 'setCompanionMode' in repository) {
          console.log(`🔧 [DataContext] Setting companion mode on repository: ${activeKey.key}`);
          (repository as any).setCompanionMode(true, activeKey.key);
        } else {
          console.error(`❌ [DataContext] Repository does not support companion mode!`);
        }
        
        console.log(`🔍 [DataContext] Fetching companion data for date: ${state.currentDate}`);
        const log = await repository.getLog(state.currentDate);
        console.log(`🔍 [DataContext] Companion data fetched:`, log ? 'Found' : 'Not found');
        if (log) {
          console.log(`📋 [DataContext] Companion data preview:`, {
            hasGlucose: log.glucoseEntries?.length || 0,
            hasBolus: log.bolusEntries?.length || 0,
            hasBasal: !!log.basalEntry,
            hasNotes: !!log.notes,
            notes: log.notes
          });
        }
        dispatch({ type: 'SET_LOG', payload: log });
      } catch (error) {
        console.error('❌ [DataContext] Error refreshing companion data:', error);
        dispatch({ type: 'SET_LOG', payload: null });
      } finally {
        setIsLoadingCompanionData(false);
      }
    } else {
      // Modo normal, busca dados locais
      console.log(`🏠 [DataContext] NORMAL MODE - Fetching local data for date: ${state.currentDate}`);
      const log = StorageService.getDailyLog(state.currentDate);
      console.log(`🏠 [DataContext] Local data fetched:`, log ? 'Found' : 'Not found');
      if (log) {
        console.log(`📋 [DataContext] Local data preview:`, {
          hasGlucose: log.glucoseEntries?.length || 0,
          hasBolus: log.bolusEntries?.length || 0,
          hasBasal: !!log.basalEntry,
          hasNotes: !!log.notes,
          notes: log.notes
        });
      }
      dispatch({ type: 'SET_LOG', payload: log });
      
      // Desativa companion mode no repository se existir
      const repository = getRepository();
      if (repository && 'setCompanionMode' in repository) {
        console.log(`🔧 [DataContext] Disabling companion mode on repository`);
        (repository as any).setCompanionMode(false);
      }
    }
  };

  // Effect para recarregar dados quando muda de companion mode
  useEffect(() => {
    refreshCurrentLog();
  }, [isCompanionMode, activeKey?.key, state.currentDate]);

  /**
   * Cria timestamp combinando data selecionada no diário com hora atual
   */
  const createSmartTimestamp = (): Date => {
    const now = new Date();
    
    // Parse da data no formato YYYY-MM-DD evitando problemas de timezone
    // Usa split para extrair ano, mês e dia diretamente
    const [year, month, day] = state.currentDate.split('-').map(Number);
    
    // Cria timestamp usando o timezone local, não UTC
    const timestamp = new Date(
      year,
      month - 1, // JavaScript usa mês 0-indexed
      day,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    );
    
    return timestamp;
  };

  return (
    <DataContext.Provider
      value={{
        state,
        setCurrentDate,
        addGlucoseEntry,
        addBolusEntry,
        setBasalEntry,
        updateNotes,
        updateEntryTime,
        removeEntry,
        canAddBasal,
        
        // Account Recovery
        recoverAccount,
        
        // Companion Mode integration
        isReadOnlyMode: isCompanionMode,
        activeUserKey: activeKey?.key,
        refreshCurrentLog,
        isLoadingCompanionData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};