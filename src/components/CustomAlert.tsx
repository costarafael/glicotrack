import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
} from 'react-native';
import Icon from "@react-native-vector-icons/material-design-icons";
import { useTheme } from '../context/ThemeContext';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onDismiss,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme.colors);

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };


  const getButtonColor = (style: string) => {
    switch (style) {
      case 'destructive':
        return theme.colors.error || '#dc3545';
      case 'cancel':
        return theme.colors.text || '#333';
      default:
        return theme.colors.primary || '#0066CC';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Icon 
                name="information-outline" 
                size={24} 
                color={theme.colors.primary} 
                style={styles.icon}
              />
              <Text style={styles.title}>{title}</Text>
            </View>
            
            {message && (
              <Text style={styles.message}>{message}</Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  index > 0 && styles.buttonBorder,
                ]}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.buttonText,
                  { color: getButtonColor(button.style || 'default') },
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) => {
  const { width } = Dimensions.get('window');
  
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    alertContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      width: Math.min(width - 32, 350),
      maxWidth: 350,
      minWidth: 280,
      borderWidth: 1,
      borderColor: colors.border,
    },
    content: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    icon: {
      marginRight: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    buttonContainer: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      minHeight: 56,
    },
    button: {
      flex: 1,
      backgroundColor: 'transparent',
      paddingVertical: 16,
      paddingHorizontal: 8,
      minHeight: 56,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0,
      borderRadius: 0,
    },
    buttonBorder: {
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      flexWrap: 'wrap',
    },
  });
};

export default CustomAlert;