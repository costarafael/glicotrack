/**
 * GlicoTrack Design System - Entry Point
 *
 * Sistema de design equilibrado para resolver inconsistências identificadas:
 * - Eliminar duplicação de componentes
 * - Padronizar border radius, ícones, interações
 * - Aproveitar infraestrutura existente (ThemeContext, Typography)
 *
 * Uso:
 * import { UniversalNavigation, BaseModal, DESIGN_TOKENS } from '@/design-system';
 */

// === TOKENS ===
export {
  DESIGN_TOKENS,
  useDesignTokens,
  type RadiusToken,
  type IconSizeToken,
  type SpacingToken,
} from './tokens/DesignTokens';

// === COMPONENTS ===
export { UniversalNavigation, BaseModal, TouchableButton } from './components';

// === TIPOS EXPORTADOS ===
// Tipos disponíveis para uso externo quando necessário
// Componentes podem ser tipados via React.ComponentProps<typeof Component>

/**
 * Hook conveniente para acessar design tokens
 *
 * @example
 * const tokens = useDesignTokens();
 * borderRadius: tokens.radius.md
 */
export { useDesignTokens as useTokens } from './tokens/DesignTokens';
