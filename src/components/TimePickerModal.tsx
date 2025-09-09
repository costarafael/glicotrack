/**
 * TimePickerModal - Seletor de tempo customizado
 * Componente simples e intuitivo para seleção de horário
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Text } from '@rneui/themed';

interface TimePickerModalProps {
  visible: boolean;
  initialTime?: string; // HH:MM
  onConfirm: (time: string) => void;
  onCancel: () => void;
  title?: string;
  colors: any;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  initialTime = '08:00',
  onConfirm,
  onCancel,
  title = 'Selecionar Horário',
  colors,
}) => {
  const [hours, setHours] = useState(() => {
    const [h] = initialTime.split(':');
    return parseInt(h, 10);
  });
  
  const [minutes, setMinutes] = useState(() => {
    const [, m] = initialTime.split(':');
    return parseInt(m, 10);
  });

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      // Auto-focus nos valores selecionados quando o modal abre
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({
          y: hours * 48, // 48 é a altura aproximada de cada item (paddingVertical + marginVertical)
          animated: true,
        });
        
        const minuteIndex = Math.floor(minutes / 5);
        minuteScrollRef.current?.scrollTo({
          y: minuteIndex * 48,
          animated: true,
        });
      }, 300);
    }
  }, [visible, hours, minutes]);

  const handleConfirm = () => {
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    onConfirm(timeString);
  };

  const generateNumbers = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
          
          <View style={styles.pickerContainer}>
            {/* Seletor de Horas */}
            <View style={styles.column}>
              <Text style={styles.columnTitle}>Hora</Text>
              <ScrollView 
                ref={hourScrollRef}
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerContent}
              >
                {generateNumbers(0, 23).map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeItem,
                      hours === hour && styles.selectedTimeItem,
                    ]}
                    onPress={() => setHours(hour)}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        hours === hour && styles.selectedTimeText,
                      ]}
                    >
                      {hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Separador */}
            <View style={styles.separator}>
              <Text style={styles.separatorText}>:</Text>
            </View>

            {/* Seletor de Minutos */}
            <View style={styles.column}>
              <Text style={styles.columnTitle}>Minuto</Text>
              <ScrollView 
                ref={minuteScrollRef}
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerContent}
              >
                {generateNumbers(0, 59).filter(m => m % 5 === 0).map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timeItem,
                      minutes === minute && styles.selectedTimeItem,
                    ]}
                    onPress={() => setMinutes(minute)}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        minutes === minute && styles.selectedTimeText,
                      ]}
                    >
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Preview do horário selecionado */}
          <View style={styles.preview}>
            <Text style={styles.previewText}>
              {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
            </Text>
          </View>

          {/* Botões de ação */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.buttonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) => {
  const { width, height } = Dimensions.get('window');
  
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      width: Math.min(width * 0.9, 400),
      maxHeight: height * 0.7,
      padding: 0,
      overflow: 'hidden',
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    pickerContainer: {
      flexDirection: 'row',
      paddingVertical: 20,
      paddingHorizontal: 10,
    },
    column: {
      flex: 1,
      alignItems: 'center',
    },
    columnTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 10,
    },
    picker: {
      height: 200,
      width: '100%',
    },
    pickerContent: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    timeItem: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginVertical: 2,
      borderRadius: 8,
      minWidth: 60,
      alignItems: 'center',
    },
    selectedTimeItem: {
      backgroundColor: colors.primary,
    },
    timeText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    selectedTimeText: {
      color: '#ffffff',
      fontWeight: 'bold',
    },
    separator: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 10,
      marginTop: 30,
    },
    separatorText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    preview: {
      alignItems: 'center',
      paddingVertical: 15,
      marginHorizontal: 20,
      backgroundColor: colors.primary + '10',
      borderRadius: 12,
      marginBottom: 20,
    },
    previewText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.primary,
      fontFamily: 'monospace',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
      borderColor: colors.border,
    },
    confirmButton: {
      flex: 0.7,
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
    cancelButtonText: {
      color: colors.textSecondary,
    },
  });
};

export default TimePickerModal;