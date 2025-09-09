import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Icon from "@react-native-vector-icons/material-design-icons";
import { useTheme } from '../context/ThemeContext';

interface DateNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;
  dateText: string;
}

const DateNavigation: React.FC<DateNavigationProps> = ({
  onPrevious,
  onNext,
  canGoNext,
  dateText,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    navButton: {
      padding: 12,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    navButtonDisabled: {
      opacity: 0.3,
    },
    dateText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.navButton} onPress={onPrevious}>
        <Icon name="chevron-left" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      
      <Text style={styles.dateText}>{dateText}</Text>
      
      <TouchableOpacity
        style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
        onPress={canGoNext ? onNext : undefined}
        disabled={!canGoNext}
      >
        <Icon
          name="chevron-right"
          size={24}
          color={canGoNext ? theme.colors.primary : theme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

export default DateNavigation;