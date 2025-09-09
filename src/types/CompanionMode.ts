/**
 * CompanionMode Domain Entities
 * Tipos TypeScript para o Modo Acompanhamento
 */

// ============================================
// INTERFACES PRINCIPAIS
// ============================================

export interface CompanionKey {
  id: string;                    // UUID único gerado automaticamente
  key: string;                   // Chave de acesso normalizada (A1B2C3D4)
  name: string;                  // Nome personalizado do usuário (2-20 chars)
  isActive: boolean;             // Se está sendo visualizada no momento
  addedAt: Date;                 // Timestamp de quando foi adicionada
  lastAccessed?: Date;           // Último acesso aos dados desta chave
}

export interface CompanionState {
  isActive: boolean;
  activeKey?: CompanionKey;
  savedKeys: CompanionKey[];
}

export interface CompanionModeData {
  isEnabled: boolean;            // Se o modo acompanhamento está ativo
  keys: CompanionKey[];          // Lista de chaves adicionadas
  activeKeyId?: string;          // ID da chave atualmente ativa
  originalDataBackup?: string;   // Backup serializado dos dados locais
}

export interface CompanionModeConfig {
  maxKeys: number;
  keyValidationTimeout: number;
  cacheEnabled: boolean;
}

// ============================================
// ERROR HANDLING
// ============================================

export enum CompanionModeErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_KEY = 'INVALID_KEY',
  BACKUP_FAILED = 'BACKUP_FAILED',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  RATE_LIMITED = 'RATE_LIMITED',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

export interface CompanionModeError {
  type: CompanionModeErrorType;
  message: string;
  recoveryAction: 'RETRY' | 'FORCE_DISABLE' | 'RESTORE_BACKUP' | 'CLEAR_CACHE';
  timestamp: Date;
}

// ============================================
// SERVICE RESPONSES
// ============================================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: CompanionModeError;
  timestamp: Date;
}

// ============================================
// CONTEXT INTERFACES
// ============================================

export interface CompanionModeContextType {
  // Estado
  isCompanionMode: boolean;
  companionKeys: CompanionKey[];
  activeKey?: CompanionKey;
  isLoading: boolean;
  error?: CompanionModeError;
  
  // Actions com responses padronizadas
  addKey: (key: string, name: string) => Promise<ServiceResponse<CompanionKey>>;
  removeKey: (keyId: string) => Promise<ServiceResponse<void>>;
  enableMode: (keyId: string) => Promise<ServiceResponse<void>>;
  disableMode: () => Promise<ServiceResponse<void>>;
  
  // Utilitários
  clearError: () => void;
  refreshKeys: () => Promise<void>;
  validateKey: (key: string) => Promise<ServiceResponse<boolean>>;
}

// ============================================
// VALIDATION CONSTANTS
// ============================================

export const VALIDATION_RULES = {
  KEY_FORMAT: /^[A-Z0-9]{8}$/,              // Regex para formato de chave (sem hífen)
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 20,
  MAX_COMPANION_KEYS: 10                    // Limite máximo de chaves
} as const;

// ============================================
// CONSTANTS FOR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  INVALID_KEY_FORMAT: 'Formato de chave inválido. Use o formato A1B2C3D4',
  KEY_NOT_EXISTS: 'Esta chave não existe ou não tem dados disponíveis',
  KEY_ALREADY_ADDED: 'Esta chave já foi adicionada',
  NAME_REQUIRED: 'Nome é obrigatório (2-20 caracteres)',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente'
} as const;

// ============================================
// UTILITY TYPES
// ============================================

export type LoadingState = 
  | 'VALIDATING_KEY'
  | 'FETCHING_DATA' 
  | 'BACKING_UP_LOCAL'
  | 'SWITCHING_CONTEXT'
  | 'RESTORING_DATA';

export type CompanionModeState = 'NORMAL' | 'COMPANION';