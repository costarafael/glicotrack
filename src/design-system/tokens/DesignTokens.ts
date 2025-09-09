/**
 * Design Tokens Básicos - GlicoTrack v2.2
 *
 * Tokens complementares aos sistemas existentes:
 * - ThemeContext (cores)
 * - Typography.ts (tipografia)
 *
 * Foco: Padronizar inconsistências identificadas no código
 */

export const DESIGN_TOKENS = {
  /**
   * Border Radius - Padronização dos 6 valores encontrados para 4 hierárquicos
   *
   * Antes: 6, 8, 12, 16, 20, 24 (inconsistente)
   * Agora: 8, 12, 16, 24 (hierárquico)
   */
  radius: {
    sm: 8,      // Botões pequenos, inputs
    md: 12,     // Cards padrão, containers
    lg: 16,     // Modais, elementos principais
    xl: 24,     // Navegação especial, elementos destaque
  },

  /**
   * Icon Sizes - Sistema hierárquico para tamanhos de ícones
   *
   * Baseado nos tamanhos encontrados: 16, 20, 24
   * Hierarquia visual clara para importância dos elementos
   */
  iconSize: {
    sm: 16,     // Ícones auxiliares, secundários
    md: 20,     // Ações comuns, elementos médios
    lg: 24,     // Principais, headers, navegação
  },

  /**
   * Interaction States - Padronização de estados de interação
   *
   * Resolve inconsistências de feedback tátil e hit areas pequenas
   */
  interaction: {
    activeOpacity: 0.7,
    hitSlop: {
      top: 8,
      bottom: 8,
      left: 8,
      right: 8
    },
  },

  /**
   * Spacing - Valores mais comuns encontrados no código
   *
   * Sistema simples baseado em múltiplos de 4px
   */
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
  }
} as const;

/**
 * Type helpers para TypeScript
 */
export type RadiusToken = keyof typeof DESIGN_TOKENS.radius;
export type IconSizeToken = keyof typeof DESIGN_TOKENS.iconSize;
export type SpacingToken = keyof typeof DESIGN_TOKENS.spacing;

/**
 * Hook para acessar design tokens
 * Uso: const tokens = useDesignTokens()
 */
export const useDesignTokens = () => DESIGN_TOKENS;
