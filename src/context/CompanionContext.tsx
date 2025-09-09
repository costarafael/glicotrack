/**
 * CompanionContext - Context para gerenciar o Modo de Acompanhamento
 * Implementação funcional baseada na versão v2.5
 */

import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useEffect, 
  useCallback, 
  ReactNode 
} from 'react';
import { 
  CompanionKey, 
  CompanionModeContextType, 
  CompanionModeError, 
  CompanionModeErrorType,
  ServiceResponse,
  LoadingState,
  ERROR_MESSAGES
} from '../types/CompanionMode';

// ============================================
// TYPES AND INTERFACES
// ============================================

interface CompanionModeState {
  isCompanionMode: boolean;
  companionKeys: CompanionKey[];
  activeKey?: CompanionKey;
  isLoading: boolean;
  loadingState?: LoadingState;
  error?: CompanionModeError;
}

type CompanionModeAction =
  | { type: 'SET_LOADING'; loading: boolean; state?: LoadingState }
  | { type: 'SET_ERROR'; error?: CompanionModeError }
  | { type: 'SET_COMPANION_MODE'; enabled: boolean }
  | { type: 'SET_KEYS'; keys: CompanionKey[] }
  | { type: 'SET_ACTIVE_KEY'; key?: CompanionKey };

// ============================================
// REDUCER
// ============================================

const initialState: CompanionModeState = {
  isCompanionMode: false,
  companionKeys: [],
  activeKey: undefined,
  isLoading: false
};

function companionModeReducer(
  state: CompanionModeState,
  action: CompanionModeAction
): CompanionModeState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.loading,
        loadingState: action.state,
        error: action.loading ? undefined : state.error
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isLoading: false,
        loadingState: undefined
      };

    case 'SET_COMPANION_MODE':
      return {
        ...state,
        isCompanionMode: action.enabled,
        activeKey: action.enabled ? state.activeKey : undefined
      };

    case 'SET_KEYS':
      return {
        ...state,
        companionKeys: action.keys
      };

    case 'SET_ACTIVE_KEY':
      return {
        ...state,
        activeKey: action.key,
        isCompanionMode: !!action.key
      };

    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

const CompanionContext = createContext<CompanionModeContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

interface CompanionProviderProps {
  children: ReactNode;
}

export function CompanionProvider({ children }: CompanionProviderProps) {
  const [state, dispatch] = useReducer(companionModeReducer, initialState);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    initializeCompanionMode();
  }, []);

  const initializeCompanionMode = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true, state: 'FETCHING_DATA' });
      
      // Para esta implementação simplificada, carregamos apenas estado vazio
      // Em uma implementação completa, carregaríamos do storage
      dispatch({ type: 'SET_COMPANION_MODE', enabled: false });
      dispatch({ type: 'SET_KEYS', keys: [] });
      
    } catch (error) {
      console.error('Error initializing companion mode:', error);
      dispatch({
        type: 'SET_ERROR',
        error: {
          type: CompanionModeErrorType.NETWORK_ERROR,
          message: ERROR_MESSAGES.NETWORK_ERROR,
          recoveryAction: 'RETRY',
          timestamp: new Date()
        }
      });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  // ============================================
  // KEY MANAGEMENT
  // ============================================

  const addKey = useCallback(
    async (key: string, name: string): Promise<ServiceResponse<CompanionKey>> => {
      dispatch({ type: 'SET_LOADING', loading: true, state: 'VALIDATING_KEY' });
      
      try {
        // Simulação de validação de chave
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Para esta implementação simplificada, sempre retornamos sucesso
        const newKey: CompanionKey = {
          id: Date.now().toString(),
          key: key.toUpperCase(),
          name,
          isActive: false,
          addedAt: new Date()
        };

        const updatedKeys = [...state.companionKeys, newKey];
        dispatch({ type: 'SET_KEYS', keys: updatedKeys });

        return {
          success: true,
          data: newKey,
          timestamp: new Date()
        };
        
      } catch (error) {
        const errorResponse: ServiceResponse<CompanionKey> = {
          success: false,
          error: {
            type: CompanionModeErrorType.NETWORK_ERROR,
            message: ERROR_MESSAGES.NETWORK_ERROR,
            recoveryAction: 'RETRY',
            timestamp: new Date()
          },
          timestamp: new Date()
        };
        dispatch({ type: 'SET_ERROR', error: errorResponse.error });
        return errorResponse;
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    },
    [state.companionKeys]
  );

  const removeKey = useCallback(
    async (keyId: string): Promise<ServiceResponse<void>> => {
      dispatch({ type: 'SET_LOADING', loading: true });
      
      try {
        const updatedKeys = state.companionKeys.filter(k => k.id !== keyId);
        dispatch({ type: 'SET_KEYS', keys: updatedKeys });
        
        // Se a chave removida era a ativa, desabilitar companion mode
        if (state.activeKey?.id === keyId) {
          dispatch({ type: 'SET_ACTIVE_KEY', key: undefined });
          dispatch({ type: 'SET_COMPANION_MODE', enabled: false });
        }

        return {
          success: true,
          timestamp: new Date()
        };
        
      } catch (error) {
        const errorResponse: ServiceResponse<void> = {
          success: false,
          error: {
            type: CompanionModeErrorType.NETWORK_ERROR,
            message: ERROR_MESSAGES.NETWORK_ERROR,
            recoveryAction: 'RETRY',
            timestamp: new Date()
          },
          timestamp: new Date()
        };
        dispatch({ type: 'SET_ERROR', error: errorResponse.error });
        return errorResponse;
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    },
    [state.companionKeys, state.activeKey]
  );

  const enableMode = useCallback(
    async (keyId: string): Promise<ServiceResponse<void>> => {
      dispatch({ type: 'SET_LOADING', loading: true, state: 'BACKING_UP_LOCAL' });
      
      try {
        const keyToActivate = state.companionKeys.find(k => k.id === keyId);
        
        if (!keyToActivate) {
          throw new Error('Key not found');
        }

        // Marcar todas as outras chaves como inativas
        const updatedKeys = state.companionKeys.map(k => ({
          ...k,
          isActive: k.id === keyId
        }));

        dispatch({ type: 'SET_KEYS', keys: updatedKeys });
        dispatch({ type: 'SET_ACTIVE_KEY', key: { ...keyToActivate, isActive: true } });
        dispatch({ type: 'SET_COMPANION_MODE', enabled: true });

        return {
          success: true,
          timestamp: new Date()
        };
        
      } catch (error) {
        const errorResponse: ServiceResponse<void> = {
          success: false,
          error: {
            type: CompanionModeErrorType.NETWORK_ERROR,
            message: ERROR_MESSAGES.NETWORK_ERROR,
            recoveryAction: 'RETRY',
            timestamp: new Date()
          },
          timestamp: new Date()
        };
        dispatch({ type: 'SET_ERROR', error: errorResponse.error });
        return errorResponse;
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    },
    [state.companionKeys]
  );

  const disableMode = useCallback(
    async (): Promise<ServiceResponse<void>> => {
      dispatch({ type: 'SET_LOADING', loading: true, state: 'RESTORING_DATA' });
      
      try {
        // Marcar todas as chaves como inativas
        const updatedKeys = state.companionKeys.map(k => ({
          ...k,
          isActive: false
        }));

        dispatch({ type: 'SET_KEYS', keys: updatedKeys });
        dispatch({ type: 'SET_ACTIVE_KEY', key: undefined });
        dispatch({ type: 'SET_COMPANION_MODE', enabled: false });

        return {
          success: true,
          timestamp: new Date()
        };
        
      } catch (error) {
        const errorResponse: ServiceResponse<void> = {
          success: false,
          error: {
            type: CompanionModeErrorType.NETWORK_ERROR,
            message: ERROR_MESSAGES.NETWORK_ERROR,
            recoveryAction: 'RETRY',
            timestamp: new Date()
          },
          timestamp: new Date()
        };
        dispatch({ type: 'SET_ERROR', error: errorResponse.error });
        return errorResponse;
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    },
    [state.companionKeys]
  );

  const validateKey = useCallback(
    async (key: string): Promise<ServiceResponse<boolean>> => {
      dispatch({ type: 'SET_LOADING', loading: true, state: 'VALIDATING_KEY' });
      
      try {
        // Simulação de validação
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Para esta implementação simplificada, validamos apenas o formato
        const isValid = /^[A-Z0-9]{8}$/.test(key.toUpperCase());
        
        return {
          success: true,
          data: isValid,
          timestamp: new Date()
        };
        
      } catch (error) {
        const errorResponse: ServiceResponse<boolean> = {
          success: false,
          error: {
            type: CompanionModeErrorType.NETWORK_ERROR,
            message: ERROR_MESSAGES.NETWORK_ERROR,
            recoveryAction: 'RETRY',
            timestamp: new Date()
          },
          timestamp: new Date()
        };
        dispatch({ type: 'SET_ERROR', error: errorResponse.error });
        return errorResponse;
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    },
    []
  );

  // ============================================
  // UTILITIES
  // ============================================

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR' });
  }, []);

  const refreshKeys = useCallback(async () => {
    await initializeCompanionMode();
  }, [initializeCompanionMode]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const contextValue: CompanionModeContextType = {
    // Estado
    isCompanionMode: state.isCompanionMode,
    companionKeys: state.companionKeys,
    activeKey: state.activeKey,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    addKey,
    removeKey,
    enableMode,
    disableMode,

    // Utilitários
    clearError,
    refreshKeys,
    validateKey
  };

  return (
    <CompanionContext.Provider value={contextValue}>
      {children}
    </CompanionContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useCompanionMode(): CompanionModeContextType {
  const context = useContext(CompanionContext);
  if (!context) {
    throw new Error('useCompanionMode must be used within a CompanionProvider');
  }
  return context;
}

export { CompanionContext };