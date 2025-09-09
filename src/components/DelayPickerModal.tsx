/**
 * DelayPickerModal - Seletor de delay para lembretes dinâmicos
 * Permite selecionar horas (0-9) e minutos (0-55, de 5 em 5)
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

interface DelayPickerModalProps {
  visible: boolean;
  initialHours: number;
  initialMinutes: number;
  onConfirm: (hours: number, minutes: number) => void;
  onCancel: () => void;
  title?: string;
  colors: any;
}

const DelayPickerModal: React.FC<DelayPickerModalProps> = ({
  visible,
  initialHours = 2,
  initialMinutes = 0,
  onConfirm,
  onCancel,
  title = 'Tempo após Bolus',
  colors,
}) => {
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      // Auto-focus nos valores selecionados quando o modal abre
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({
          y: hours * 48, // 48 é a altura aproximada de cada item
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

  // Atualizar valores quando initialHours/initialMinutes mudam
  useEffect(() => {
    setHours(initialHours);
    setMinutes(initialMinutes);
  }, [initialHours, initialMinutes]);

  const handleConfirm = () => {
    onConfirm(hours, minutes);
  };

  const generateHours = () => {
    return Array.from({ length: 10 }, (_, i) => i); // 0-9 horas
  };

  const generateMinutes = () => {
    return Array.from({ length: 12 }, (_, i) => i * 5); // 0-55, de 5 em 5
  };

  const formatTime = () => {
    if (hours === 0 && minutes === 0) {
      return 'Imediatamente';
    }
    
    const parts = [];
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }
    return parts.join(' ');
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
            <Text style={styles.subtitle}>
              Quanto tempo depois da aplicação de bolus?
            </Text>
          </View>
          
          <View style={styles.pickerContainer}>
            {/* Seletor de Horas */}
            <View style={styles.column}>
              <Text style={styles.columnTitle}>Horas</Text>
              <ScrollView 
                ref={hourScrollRef}
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerContent}
              >
                {generateHours().map((hour) => (
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
                      {hour}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Separador */}
            <View style={styles.separator}>
              <Text style={styles.separatorText}>+</Text>
            </View>

            {/* Seletor de Minutos */}
            <View style={styles.column}>
              <Text style={styles.columnTitle}>Minutos</Text>
              <ScrollView 
                ref={minuteScrollRef}
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerContent}
              >
                {generateMinutes().map((minute) => (
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
                      {minute}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Preview do tempo selecionado */}
          <View style={styles.preview}>
            <Text style={styles.previewLabel}>Lembrete será disparado:</Text>
            <Text style={styles.previewText}>{formatTime()} após o bolus</Text>
          </View>

          {/* Exemplos de uso */}
          <View style={styles.examples}>
            <Text style={styles.examplesTitle}>Sugestões:</Text>
            <View style={styles.exampleButtons}>
              <TouchableOpacity
                style={[styles.exampleButton, hours === 1 && minutes === 30 && styles.selectedExample]}
                onPress={() => {
                  setHours(1);
                  setMinutes(30);
                  // Auto-scroll para os valores selecionados
                  setTimeout(() => {
                    hourScrollRef.current?.scrollTo({ y: 1 * 48, animated: true });
                    minuteScrollRef.current?.scrollTo({ y: 6 * 48, animated: true }); // 30min = index 6
                  }, 100);
                }}
              >
                <Text style={[styles.exampleText, hours === 1 && minutes === 30 && styles.selectedExampleText]}>
                  1h30m
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.exampleButton, hours === 2 && minutes === 0 && styles.selectedExample]}
                onPress={() => {
                  setHours(2);
                  setMinutes(0);
                  // Auto-scroll para os valores selecionados
                  setTimeout(() => {
                    hourScrollRef.current?.scrollTo({ y: 2 * 48, animated: true });
                    minuteScrollRef.current?.scrollTo({ y: 0, animated: true });
                  }, 100);
                }}
              >
                <Text style={[styles.exampleText, hours === 2 && minutes === 0 && styles.selectedExampleText]}>
                  2h
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.exampleButton, hours === 2 && minutes === 30 && styles.selectedExample]}
                onPress={() => {
                  setHours(2);
                  setMinutes(30);
                  // Auto-scroll para os valores selecionados
                  setTimeout(() => {
                    hourScrollRef.current?.scrollTo({ y: 2 * 48, animated: true });
                    minuteScrollRef.current?.scrollTo({ y: 6 * 48, animated: true }); // 30min = index 6
                  }, 100);
                }}
              >
                <Text style={[styles.exampleText, hours === 2 && minutes === 30 && styles.selectedExampleText]}>
                  2h30m
                </Text>
              </TouchableOpacity>
            </View>
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
      maxHeight: height * 0.8,
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
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
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
      height: 160,
      width: '100%',
    },
    pickerContent: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    timeItem: {
      paddingVertical: 10,
      paddingHorizontal: 16,
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
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textSecondary,
    },
    preview: {
      alignItems: 'center',
      paddingVertical: 15,
      marginHorizontal: 20,
      backgroundColor: colors.primary + '10',
      borderRadius: 12,
      marginBottom: 15,
    },
    previewLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    previewText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
    },
    examples: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    examplesTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 10,
    },
    exampleButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    exampleButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: colors.border + '40',
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedExample: {
      backgroundColor: colors.secondary + '20',
      borderColor: colors.secondary,
    },
    exampleText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    selectedExampleText: {
      color: colors.secondary,
      fontWeight: 'bold',
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

export default DelayPickerModal;