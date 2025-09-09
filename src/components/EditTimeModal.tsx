import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../context/ThemeContext';

interface EditTimeModalProps {
  visible: boolean;
  onClose: () => void;
  currentTime: Date;
  onSave: (newTime: Date) => void;
  title: string;
}

const EditTimeModal: React.FC<EditTimeModalProps> = ({
  visible,
  onClose,
  currentTime,
  onSave,
  title,
}) => {
  const { theme } = useTheme();
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  useEffect(() => {
    if (visible) {
      const currentHours = currentTime.getHours().toString().padStart(2, '0');
      const currentMinutes = currentTime
        .getMinutes()
        .toString()
        .padStart(2, '0');
      setHours(currentHours);
      setMinutes(currentMinutes);
    }
  }, [visible, currentTime]);

  const handleSave = () => {
    const hoursNum = parseInt(hours, 10);
    const minutesNum = parseInt(minutes, 10);

    if (isNaN(hoursNum) || hoursNum < 0 || hoursNum > 23) {
      Alert.alert('Erro', 'Hora deve estar entre 00 e 23');
      return;
    }

    if (isNaN(minutesNum) || minutesNum < 0 || minutesNum > 59) {
      Alert.alert('Erro', 'Minutos devem estar entre 00 e 59');
      return;
    }

    // Manter a data original (do diário selecionado) e alterar apenas hora/minuto
    const newTime = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      currentTime.getDate(),
      hoursNum,
      minutesNum,
      0, // segundos zerados
      0, // milissegundos zerados
    );

    onSave(newTime);
    onClose();
  };

  const handleHoursChange = (text: string) => {
    // Remove caracteres não numéricos e limita a 2 dígitos
    const cleanText = text.replace(/[^0-9]/g, '').substring(0, 2);
    setHours(cleanText);
  };

  const handleMinutesChange = (text: string) => {
    // Remove caracteres não numéricos e limita a 2 dígitos
    const cleanText = text.replace(/[^0-9]/g, '').substring(0, 2);
    setMinutes(cleanText);
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 24,
      margin: 20,
      width: '80%',
      elevation: 5,
      shadowColor: theme.colors.textSecondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginLeft: 12,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    timeInput: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      width: 60,
    },
    timeSeparator: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginHorizontal: 8,
    },
    timeLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    inputGroup: {
      alignItems: 'center',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
      gap: 12,
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      flex: 0.3,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    saveButton: {
      flex: 0.7,
      backgroundColor: theme.colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: theme.colors.textSecondary,
    },
    saveButtonText: {
      color: 'white',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Icon name="clock-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.timeContainer}>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.timeInput}
                value={hours}
                onChangeText={handleHoursChange}
                placeholder="00"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                maxLength={2}
                selectTextOnFocus
              />
              <Text style={styles.timeLabel}>Hora</Text>
            </View>

            <Text style={styles.timeSeparator}>:</Text>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.timeInput}
                value={minutes}
                onChangeText={handleMinutesChange}
                placeholder="00"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                maxLength={2}
                selectTextOnFocus
              />
              <Text style={styles.timeLabel}>Min</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                Salvar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EditTimeModal;
