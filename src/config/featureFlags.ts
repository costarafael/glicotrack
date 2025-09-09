/**
 * Feature Flags Configuration
 * Sistema para habilitar/desabilitar funcionalidades do app
 * 
 * Para ativar uma feature: altere o valor para true
 * Para desativar: altere o valor para false
 */

interface FeatureFlags {
  // Funcionalidades principais
  COMPANION_MODE: boolean;           // Visualizar dados de outros usuários
  EMAIL_RECOVERY: boolean;           // Sistema de recuperação por email
  ADVANCED_REPORTS: boolean;         // Relatórios avançados
  EXPORT_FEATURES: boolean;          // Funcionalidades de exportação
  
  // Funcionalidades em desenvolvimento
  WEB_SYNC: boolean;                // Sincronização web
  MEDICAL_INTEGRATION: boolean;      // Integração com sistemas médicos
  CHARTS_ANALYTICS: boolean;         // Gráficos e análises avançadas
}

/**
 * CONFIGURAÇÃO DE FEATURES ATIVAS
 * 
 * ⚠️  IMPORTANTE: 
 * - COMPANION_MODE está DESABILITADO para esta versão
 * - O código permanece intacto, apenas oculto da interface
 * - Para reativar: altere COMPANION_MODE para true
 */
export const FEATURE_FLAGS: FeatureFlags = {
  // ❌ DESABILITADO - Modo de acompanhamento (código preservado)
  COMPANION_MODE: false,
  
  // ✅ HABILITADO - Features ativas
  EMAIL_RECOVERY: true,
  ADVANCED_REPORTS: true, 
  EXPORT_FEATURES: true,
  
  // 🚧 EM DESENVOLVIMENTO - Features futuras
  WEB_SYNC: false,
  MEDICAL_INTEGRATION: false,
  CHARTS_ANALYTICS: false,
};

/**
 * Helper function para verificar se uma feature está habilitada
 * @param feature Nome da feature
 * @returns boolean
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return FEATURE_FLAGS[feature];
};

/**
 * Helper function para debug - lista features ativas
 * @returns string[] Array com nomes das features ativas
 */
export const getEnabledFeatures = (): string[] => {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([feature, _]) => feature);
};

/**
 * Para desenvolvimento - log das features ativas
 */
export const logFeatureFlags = (): void => {
  if (__DEV__) {
    console.log('🏗️ [FeatureFlags] Features ativas:', getEnabledFeatures());
    console.log('🏗️ [FeatureFlags] COMPANION_MODE:', FEATURE_FLAGS.COMPANION_MODE ? '✅ ATIVO' : '❌ INATIVO');
  }
};