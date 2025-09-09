/**
 * FirebaseService - Serviço híbrido que usa implementação nativa no Android e Web SDK no iOS
 * Detecta automaticamente a plataforma e usa a implementação apropriada
 */

import { Platform } from 'react-native';
import { FirebaseServiceInterface } from './firebase/FirebaseServiceInterface';
import FirebaseServiceAndroid from './firebase/FirebaseServiceAndroid';
import FirebaseServiceIOS from './firebase/FirebaseServiceIOS';
import { UserKeyService } from './UserKeyService';

export class FirebaseService {
  private static instance: FirebaseService;
  private platformService: FirebaseServiceInterface;
  private userKey: string | null = null;
  private userKeyService: UserKeyService;

  private constructor() {
    this.userKeyService = UserKeyService.getInstance();
    
    // Detecta plataforma e usa implementação apropriada
    if (Platform.OS === 'android') {
      this.platformService = new FirebaseServiceAndroid();
    } else {
      this.platformService = new FirebaseServiceIOS();
    }
  }

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Inicializa o Firebase com a implementação apropriada para a plataforma
   */
  async initialize(): Promise<void> {
    try {
      // Gera/recupera chave única do usuário
      this.userKey = await this.userKeyService.getUserKey();
      
      // Inicializa serviço da plataforma
      await this.platformService.initialize();
      
    } catch (error) {
      console.error('❌ Erro ao inicializar Firebase:', error);
      throw error;
    }
  }

  /**
   * Retorna o usuário atual
   */
  getCurrentUser(): any {
    return this.platformService.getCurrentUser();
  }

  /**
   * Retorna o UID do usuário atual
   */
  getCurrentUserId(): string | null {
    return this.platformService.getCurrentUserId();
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.platformService.isAuthenticated();
  }

  /**
   * Retorna a chave única do usuário
   */
  getUserKey(): string | null {
    return this.userKey;
  }

  /**
   * Recarrega a chave do usuário do armazenamento
   * Usado após account recovery para atualizar a chave em cache
   */
  async reloadUserKey(): Promise<void> {
    try {
      console.log('🔄 [FirebaseService] Reloading user key from storage...');
      const oldKey = this.userKey;
      this.userKey = await this.userKeyService.getUserKey();
      console.log(`🔑 [FirebaseService] User key updated: ${oldKey} → ${this.userKey}`);
    } catch (error) {
      console.error('❌ [FirebaseService] Error reloading user key:', error);
      throw error;
    }
  }

  /**
   * Queries daily logs for a user within a date range using optimized Firebase query
   * Uses document ID (YYYY-MM-DD format) for range filtering
   * @param userKey The user key to query for
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format
   * @returns Promise<Array<{id: string, data: any}>> Array of matching documents
   */
  async queryDailyLogsByDateRange(userKey: string, startDate: string, endDate: string): Promise<Array<{id: string, data: any}>> {
    try {
      console.log(`🔍 [FirebaseService] Range query for ${userKey}: ${startDate} to ${endDate}`);
      
      // Delegate to platform-specific implementation
      return await this.platformService.queryCollectionByDocumentId(
        `users/${userKey}/daily_logs`,
        startDate,
        endDate
      );
    } catch (error) {
      console.error(`❌ [FirebaseService] Error in range query for ${userKey}:`, error);
      throw error;
    }
  }

  /**
   * Retorna referência do Firestore para o usuário atual
   * Utiliza a chave única como identificador
   */
  getUserCollection(): any {
    if (!this.userKey) {
      throw new Error('Chave do usuário não disponível');
    }
    
    // Cria caminho compatível com ambas implementações
    const path = `users/${this.userKey}`;
    return this.platformService.doc(path);
  }

  /**
   * Retorna referência para logs diários do usuário
   */
  getDailyLogsCollection(): any {
    if (!this.userKey) {
      throw new Error('Chave do usuário não disponível');
    }
    return this.platformService.collection(`users/${this.userKey}/daily_logs`);
  }

  /**
   * Salva um log diário
   */
  async saveDailyLog(date: string, data: any): Promise<void> {
    if (!this.userKey) {
      throw new Error('Chave do usuário não disponível');
    }
    
    const path = `users/${this.userKey}/daily_logs/${date}`;
    await this.platformService.setDocument(path, {
      ...data,
      lastModified: new Date().toISOString()
    });
  }

  /**
   * Busca um log diário
   */
  async getDailyLog(date: string): Promise<any> {
    if (!this.userKey) {
      throw new Error('Chave do usuário não disponível');
    }
    
    const path = `users/${this.userKey}/daily_logs/${date}`;
    return this.platformService.getDocument(path);
  }

  /**
   * Busca um log diário de outro usuário (para companion mode)
   */
  async getExternalUserLog(externalUserKey: string, date: string): Promise<any> {
    const path = `users/${externalUserKey}/daily_logs/${date}`;
    console.log(`🔍 [FirebaseService] Fetching external user log: ${path}`);
    const result = await this.platformService.getDocument(path);
    return result;
  }

  /**
   * Busca todos os logs
   */
  async getAllLogs(): Promise<any[]> {
    if (!this.userKey) {
      throw new Error('Chave do usuário não disponível');
    }
    
    const path = `users/${this.userKey}/daily_logs`;
    return this.platformService.getCollection(path);
  }

  /**
   * Retorna referência para lembretes do usuário
   */
  getRemindersCollection(): any {
    if (!this.userKey) {
      throw new Error('Chave do usuário não disponível');
    }
    return this.platformService.collection(`users/${this.userKey}/reminders`);
  }

  /**
   * Retorna referência para configurações do usuário
   */
  getSettingsDocument(): any {
    if (!this.userKey) {
      throw new Error('Chave do usuário não disponível');
    }
    return this.platformService.doc(`users/${this.userKey}/settings/app_settings`);
  }

  /**
   * Salva configurações
   */
  async saveSettings(settings: any): Promise<void> {
    if (!this.userKey) {
      throw new Error('Chave do usuário não disponível');
    }
    
    const path = `users/${this.userKey}/settings/app_settings`;
    await this.platformService.setDocument(path, {
      ...settings,
      lastModified: new Date().toISOString()
    });
  }

  /**
   * Verifica conectividade com Firebase
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      // Tenta escrever e ler um documento de teste
      const testPath = `connectivity_test/${Date.now()}`;
      await this.platformService.setDocument(testPath, { test: true });
      await this.platformService.deleteDocument(testPath);
      return true;
    } catch (error) {
      console.error('❌ Teste de conectividade falhou:', error);
      return false;
    }
  }

  /**
   * Limpa dados locais (para debugging)
   */
  async clearCache(): Promise<void> {
    await this.platformService.clearCache();
  }

  /**
   * Retorna a instância do Firestore (para uso direto se necessário)
   */
  getFirestore(): any {
    return this.platformService.getFirestoreInstance();
  }

  /**
   * Retorna a instância do Auth (para uso direto se necessário)
   */
  getAuth(): any {
    return this.platformService.getAuthInstance();
  }
}

export default FirebaseService;