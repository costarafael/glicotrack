import React from 'react';
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { DESIGN_TOKENS } from '../tokens/DesignTokens';

interface TouchableButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * TouchableButton Component
 *
 * Padroniza estados de interação para resolver inconsistências:
 * - activeOpacity consistente (0.7)
 * - hitSlop adequado (8px mínimo)
 * - Estados disabled e loading visuais
 * - Acessibilidade básica
 * - Flexibilidade via style props (sem variants complexos)
 *
 * Uso:
 * <TouchableButton onPress={handlePress} accessibilityLabel="Salvar dados">
 *   <Text>Salvar</Text>
 * </TouchableButton>
 *
 * <TouchableButton
 *   onPress={handlePress}
 *   loading={isLoading}
 *   style={{ backgroundColor: theme.colors.primary }}
 * >
 *   <Text style={{ color: 'white' }}>Processar</Text>
 * </TouchableButton>
 */
const TouchableButton: React.FC<TouchableButtonProps> = ({
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
  children,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const isDisabled = disabled || loading;

  const styles = StyleSheet.create({
    button: {
      minHeight: 44, // iOS guideline para área de toque mínima
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    disabled: {
      opacity: 0.6,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginLeft: DESIGN_TOKENS.spacing.sm, // 8px
    },
  });

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.textSecondary} />
          {children && (
            <View style={[styles.loadingText, textStyle]}>{children}</View>
          )}
        </View>
      );
    }

    return children;
  };

  return (
    <TouchableOpacity
      style={[styles.button, style, isDisabled && styles.disabled]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      activeOpacity={DESIGN_TOKENS.interaction.activeOpacity}
      hitSlop={DESIGN_TOKENS.interaction.hitSlop}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

export default TouchableButton;
