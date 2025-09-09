/**
 * UserKeyService - Gerencia chave única de usuário anônimo
 * Gera e mantém uma chave fixa por dispositivo para acesso via webapp
 */

import { MMKV } from 'react-native-mmkv';
import { sha256 } from 'js-sha256';
import DeviceInfo from 'react-native-device-info';

export class UserKeyService {
  private static instance: UserKeyService;
  private storage: MMKV;
  private readonly USER_KEY_STORAGE_KEY = 'user_access_key';
  
  private constructor() {
    this.storage = new MMKV({ id: 'user-key-storage' });
  }

  public static getInstance(): UserKeyService {
    if (!UserKeyService.instance) {
      UserKeyService.instance = new UserKeyService();
    }
    return UserKeyService.instance;
  }

  /**
   * Gera ou recupera a chave única do usuário
   * A chave é gerada apenas uma vez e persistida
   */
  public async getUserKey(): Promise<string> {
    // Verifica se já existe uma chave salva
    const existingKey = this.storage.getString(this.USER_KEY_STORAGE_KEY);
    
    if (existingKey) {
      return existingKey;
    }

    // Gera nova chave única
    const newKey = await this.generateUniqueKey();
    
    // Salva a chave permanentemente
    this.storage.set(this.USER_KEY_STORAGE_KEY, newKey);
    
    return newKey;
  }

  /**
   * Gera uma chave única baseada em informações do dispositivo
   * Formato: 8 caracteres alfanuméricos (ex: A1B2C3D4)
   */
  private async generateUniqueKey(): Promise<string> {
    try {
      // Obtém informações únicas do dispositivo
      const deviceId = await DeviceInfo.getUniqueId();
      const deviceBrand = await DeviceInfo.getBrand();
      const deviceModel = await DeviceInfo.getModel();
      const timestamp = Date.now().toString();
      
      // Cria string única para hash
      const uniqueString = `${deviceId}-${deviceBrand}-${deviceModel}-${timestamp}`;
      
      // Gera hash SHA-256
      const hash = sha256(uniqueString);
      
      // Extrai 8 caracteres e converte para formato amigável
      const keyBase = hash.substring(0, 16); // 16 chars hex
      
      // Converte para formato alfanumérico maiúsculo (8 chars)
      let userKey = '';
      for (let i = 0; i < keyBase.length; i += 2) {
        const hexPair = keyBase.substring(i, i + 2);
        const decimal = parseInt(hexPair, 16);
        const char = this.decimalToAlphanumeric(decimal);
        userKey += char;
      }
      
      return userKey.substring(0, 8).toUpperCase();
      
    } catch (error) {
      console.error('❌ Erro ao gerar chave única:', error);
      // Fallback: gera chave baseada apenas no timestamp
      const fallbackHash = sha256(Date.now().toString());
      return fallbackHash.substring(0, 8).toUpperCase();
    }
  }

  /**
   * Converte número decimal para caractere alfanumérico
   */
  private decimalToAlphanumeric(decimal: number): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return chars[decimal % chars.length];
  }

  /**
   * Formata a chave para exibição (com hífens)
   * Ex: A1B2C3D4 -> A1B2-C3D4
   */
  public formatKeyForDisplay(key: string): string {
    if (key.length === 8) {
      return `${key.substring(0, 4)}-${key.substring(4, 8)}`;
    }
    return key;
  }

  /**
   * Valida se uma chave tem o formato correto
   */
  public isValidKey(key: string): boolean {
    const keyRegex = /^[A-Z0-9]{8}$/;
    return keyRegex.test(key);
  }

  /**
   * Remove a chave salva (apenas para testes/reset)
   */
  public clearUserKey(): void {
    this.storage.delete(this.USER_KEY_STORAGE_KEY);
  }

  /**
   * Sets a specific user key (used for account recovery)
   */
  public setUserKey(key: string): void {
    if (!this.isValidKey(key)) {
      throw new Error('Invalid user key format');
    }
    this.storage.set(this.USER_KEY_STORAGE_KEY, key.toUpperCase());
  }

  /**
   * Retorna informações sobre a chave do usuário
   */
  public async getKeyInfo(): Promise<{
    key: string;
    formattedKey: string;
    creationTime: string;
  }> {
    const key = await this.getUserKey();
    return {
      key,
      formattedKey: this.formatKeyForDisplay(key),
      creationTime: new Date().toISOString() // Simplified - could track actual creation
    };
  }
}