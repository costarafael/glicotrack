import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Icon from "@react-native-vector-icons/material-design-icons";
import { useTheme } from '../../context/ThemeContext';
import { DESIGN_TOKENS } from '../tokens/DesignTokens';

interface UniversalNavigationProps {
  type: 'date' | 'month';
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;
  displayText: string;
}

/**
 * UniversalNavigation Component
 *
 * Substitui DateNavigation.tsx e MonthNavigation.tsx
 * Elimina duplicação de código mantendo funcionalidade idêntica
 *
 * Benefícios:
 * - 50% redução código duplicado
 * - Manutenção centralizada
 * - Padronização com design tokens
 * - Acessibilidade básica
 */
const UniversalNavigation: React.FC<UniversalNavigationProps> = ({
  type,
  onPrevious,
  onNext,
  canGoNext,
  displayText,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    },
    navButton: {
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.xl, // 24 - mantém estilo original
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    navButtonDisabled: {
      opacity: 0.3,
    },
    displayText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      flex: 1,
    },
  });

  // Labels para acessibilidade
  const getAccessibilityLabels = () => {
    const context = type === 'date' ? 'dia' : 'mês';
    return {
      previous: `${context} anterior`,
      next: `próximo ${context}`,
      current: `${displayText} atual`,
    };
  };

  const labels = getAccessibilityLabels();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={onPrevious}
        accessibilityLabel={labels.previous}
        accessibilityRole="button"
        activeOpacity={DESIGN_TOKENS.interaction.activeOpacity}
        hitSlop={DESIGN_TOKENS.interaction.hitSlop}
      >
        <Icon
          name="chevron-left"
          size={DESIGN_TOKENS.iconSize.lg}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      <Text
        style={styles.displayText}
        accessibilityLabel={labels.current}
        accessibilityRole="text"
      >
        {displayText}
      </Text>

      <TouchableOpacity
        style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
        onPress={canGoNext ? onNext : undefined}
        disabled={!canGoNext}
        accessibilityLabel={labels.next}
        accessibilityRole="button"
        activeOpacity={DESIGN_TOKENS.interaction.activeOpacity}
        hitSlop={DESIGN_TOKENS.interaction.hitSlop}
      >
        <Icon
          name="chevron-right"
          size={DESIGN_TOKENS.iconSize.lg}
          color={canGoNext ? theme.colors.primary : theme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

export default UniversalNavigation;
