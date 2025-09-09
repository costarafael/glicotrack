/**
 * FirebaseContext - Context para gerenciar sincronização Firebase
 * Fornece status de sincronização e controles para o usuário
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import { FirebaseService } from '../services/FirebaseService';
import { FirebaseDataRepository } from '../services/FirebaseDataRepository';
import { UserKeyService } from '../services/UserKeyService';

interface SyncStatus {
  isEnabled: boolean;
  isOnline: boolean;
  pending: number;
  lastSync: Date | null;
  isInitializing: boolean;
  error: string | null;
  userKey: string | null;
  formattedUserKey: string | null;
}

interface FirebaseContextType {
  syncStatus: SyncStatus;
  enableSync: () => Promise<void>;
  disableSync: () => void;
  forceSync: () => Promise<void>;
  syncHistoricalData: () => Promise<void>;
  getRepository: () => FirebaseDataRepository | null;
  getUserKey: () => Promise<string>;
  copyUserKeyToClipboard: () => Promise<void>;
  refreshUserKey: () => Promise<void>; // Nova função para atualizar chave no contexto
  reloadRepository: () => Promise<void>; // Nova função para recarregar repositório após recovery
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isEnabled: false,
    isOnline: false,
    pending: 0,
    lastSync: null,
    isInitializing: false,
    error: null,
    userKey: null,
    formattedUserKey: null,
  });

  const [firebaseRepository, setFirebaseRepository] = useState<FirebaseDataRepository | null>(null);
  const userKeyService = UserKeyService.getInstance();

  useEffect(() => {
    // Verifica se o usuário já habilitou a sincronização anteriormente
    checkSyncPreference();
    
    // Atualiza status periodicamente
    const interval = setInterval(updateSyncStatus, 10000); // A cada 10 segundos
    
    return () => clearInterval(interval);
  }, []);

  const checkSyncPreference = async () => {
    try {
      // Verifica se existe uma chave de usuário salva
      const userKey = await userKeyService.getUserKey();
      if (userKey) {
        console.log('🔄 [FirebaseContext] Found saved user key, auto-enabling sync...');
        
        // Cria instância do repositório Firebase
        const repository = new FirebaseDataRepository();
        await repository.initialize();
        setFirebaseRepository(repository);
        
        // Atualiza estado para mostrar sync habilitado
        const formattedKey = userKeyService.formatKeyForDisplay(userKey);
        setSyncStatus(prev => ({
          ...prev,
          isEnabled: true,
          isOnline: true,
          userKey,
          formattedUserKey: formattedKey,
        }));
        
        // Habilita sincronização automaticamente
        repository.enableSync();
        
        console.log('✅ [FirebaseContext] Auto-enabled sync with key:', formattedKey);
      }
    } catch (error) {
      console.log('ℹ️ [FirebaseContext] No saved sync preference found, leaving disabled');
    }
  };

  const updateSyncStatus = () => {
    if (firebaseRepository) {
      const status = firebaseRepository.getSyncStatus();
      setSyncStatus(prev => ({
        ...prev,
        isOnline: status.isOnline,
        pending: status.pending,
        lastSync: status.lastSync,
      }));
    }
  };

  const enableSync = async (): Promise<void> => {
    setSyncStatus(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      console.log('🔄 Habilitando sincronização Firebase...');
      
      // Gera/recupera chave única do usuário
      const userKey = await userKeyService.getUserKey();
      const formattedKey = userKeyService.formatKeyForDisplay(userKey);
      
      console.log('🔑 Chave do usuário:', formattedKey);
      
      // Cria instância do repositório Firebase
      const repository = new FirebaseDataRepository();
      await repository.initialize();
      
      setFirebaseRepository(repository);
      
      setSyncStatus(prev => ({
        ...prev,
        isEnabled: true,
        isInitializing: false,
        isOnline: true,
        userKey,
        formattedUserKey: formattedKey,
      }));

      // Habilita sincronização
      repository.enableSync();
      
      // Sincroniza automaticamente todos os dados históricos
      await repository.forceSyncAllData();
      
      console.log('✅ Sincronização Firebase habilitada!');
      
    } catch (error) {
      const errorCode = error?.code || 'unknown';
      const errorMessage = error?.message || 'Unknown error';
      console.error('❌ Erro ao habilitar sincronização:', errorCode, errorMessage);
      
      setSyncStatus(prev => ({
        ...prev,
        isEnabled: false,
        isInitializing: false,
        error: 'Não foi possível conectar ao Firebase. Verifique sua conexão.',
        userKey: null,
        formattedUserKey: null,
      }));
      
      // Cria erro padronizado para não quebrar o error handling upstream
      const standardError = new Error(`Firebase sync failed: ${errorMessage}`);
      (standardError as any).code = errorCode;
      throw standardError;
    }
  };;

  const disableSync = () => {
    console.log('⏸️ Desabilitando sincronização Firebase...');
    setFirebaseRepository(null);
    setSyncStatus({
      isEnabled: false,
      isOnline: false,
      pending: 0,
      lastSync: null,
      isInitializing: false,
      error: null,
      userKey: null,
      formattedUserKey: null,
    });
  };

  const forceSync = async (): Promise<void> => {
    if (!firebaseRepository) {
      throw new Error('Sincronização não está habilitada');
    }

    try {
      setSyncStatus(prev => ({ ...prev, error: null }));
      await firebaseRepository.forceSyncAllData();
      updateSyncStatus();
      console.log('✅ Sincronização forçada concluída');
    } catch (error) {
      const errorCode = error?.code || 'unknown';
      const errorMessage = error?.message || 'Unknown error';
      console.error('❌ Erro na sincronização forçada:', errorCode, errorMessage);
      
      setSyncStatus(prev => ({
        ...prev,
        error: 'Erro na sincronização. Tente novamente.',
      }));
      
      // Cria erro padronizado
      const standardError = new Error(`Force sync failed: ${errorMessage}`);
      (standardError as any).code = errorCode;
      throw standardError;
    }
  };;

  const syncHistoricalData = async (): Promise<void> => {
    if (!firebaseRepository) {
      throw new Error('Sincronização não está habilitada');
    }

    try {
      setSyncStatus(prev => ({ ...prev, error: null }));
      await firebaseRepository.forceSyncAllData();
      updateSyncStatus();
      console.log('✅ Sincronização histórica concluída');
    } catch (error) {
      console.error('❌ Erro na sincronização histórica:', error);
      setSyncStatus(prev => ({
        ...prev,
        error: 'Erro na sincronização histórica. Tente novamente.',
      }));
      throw error;
    }
  };

  const getRepository = (): FirebaseDataRepository | null => {
    return firebaseRepository;
  };

  const getUserKey = async (): Promise<string> => {
    return await userKeyService.getUserKey();
  };

  const copyUserKeyToClipboard = async (): Promise<void> => {
    try {
      const userKey = await userKeyService.getUserKey();
      const formattedKey = userKeyService.formatKeyForDisplay(userKey);
      await Clipboard.setString(formattedKey);
      console.log('📋 Chave copiada para o clipboard:', formattedKey);
    } catch (error) {
      console.error('❌ Erro ao copiar chave:', error);
      throw error;
    }
  };

  const refreshUserKey = async (): Promise<void> => {
    try {
      const userKey = await userKeyService.getUserKey();
      const formattedKey = userKeyService.formatKeyForDisplay(userKey);
      
      setSyncStatus(prev => ({
        ...prev,
        userKey,
        formattedUserKey: formattedKey,
      }));
      
      console.log('🔄 [FirebaseContext] User key refreshed in context:', formattedKey);
    } catch (error) {
      console.error('❌ [FirebaseContext] Error refreshing user key:', error);
      throw error;
    }
  };

  const reloadRepository = async (): Promise<void> => {
    try {
      console.log('🔄 [FirebaseContext] Reloading Firebase repository after recovery...');
      
      if (firebaseRepository) {
        // Recarrega a chave no repositório existente
        await firebaseRepository.reloadUserKey();
        console.log('✅ [FirebaseContext] Repository user key reloaded');
      } else {
        console.warn('⚠️ [FirebaseContext] No repository to reload');
      }
    } catch (error) {
      console.error('❌ [FirebaseContext] Error reloading repository:', error);
      throw error;
    }
  };

  const value: FirebaseContextType = {
    syncStatus,
    enableSync,
    disableSync,
    forceSync,
    syncHistoricalData,
    getRepository,
    getUserKey,
    copyUserKeyToClipboard,
    refreshUserKey,
    reloadRepository,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase deve ser usado dentro de um FirebaseProvider');
  }
  return context;
};

export default FirebaseContext;