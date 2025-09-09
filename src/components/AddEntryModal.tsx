import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { EntryType, MealType } from '../types';
import {
  validateGlucoseValue,
  validateInsulinUnits,
  parseNumericInput,
} from '../utils/formatters';
import { MEAL_LABELS, MEAL_ICONS } from '../constants/mealTypes';
import CustomAlert from './CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface AddEntryModalProps {
  visible: boolean;
  onClose: () => void;
  entryType: EntryType;
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({
  visible,
  onClose,
  entryType,
}) => {
  const { theme } = useTheme();
  const { addGlucoseEntry, addBolusEntry, setBasalEntry, canAddBasal } =
    useData();
  const {
    alertConfig,
    visible: alertVisible,
    showAlert,
    hideAlert,
  } = useCustomAlert();
  const [value, setValue] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('correction');
  const [loading, setLoading] = useState(false);

  const mealOptions: { type: MealType; label: string; icon: string }[] =
    Object.entries(MEAL_LABELS).map(([type, label]) => ({
      type: type as MealType,
      label,
      icon: MEAL_ICONS[type as MealType],
    }));

  const getModalConfig = () => {
    switch (entryType) {
      case 'glucose':
        return {
          title: 'Adicionar Glicose',
          icon: 'water-outline',
          placeholder: 'Valor da glicose (mg/dL)',
          keyboardType: 'numeric' as const,
          validate: validateGlucoseValue,
        };
      case 'bolus':
        return {
          title: 'Adicionar Insulina Bolus',
          icon: 'medication-outline',
          placeholder: 'Unidades de insulina',
          keyboardType: 'decimal-pad' as const,
          validate: validateInsulinUnits,
        };
      case 'basal':
      default:
        return {
          title: 'Adicionar Insulina Basal',
          icon: 'clock-outline',
          placeholder: 'Unidades de insulina',
          keyboardType: 'decimal-pad' as const,
          validate: validateInsulinUnits,
        };
    }
  };

  const config = getModalConfig();

  const handleSave = async () => {
    if (!value.trim()) {
      showAlert('Erro', 'Por favor, insira um valor.', [{ text: 'Entendi' }]);
      return;
    }

    if (!config.validate(value)) {
      const errorMessage =
        entryType === 'glucose'
          ? 'Valor de glicose inválido. Digite um valor entre 1 e 600 mg/dL.'
          : 'Valor de insulina inválido. Digite um valor entre 0.1 e 100 unidades.';
      showAlert('Erro', errorMessage, [{ text: 'Entendi' }]);
      return;
    }

    const numericValue = parseNumericInput(value);
    if (numericValue === null) {
      showAlert('Erro', 'Valor inválido.', [{ text: 'Entendi' }]);
      return;
    }

    setLoading(true);

    try {
      switch (entryType) {
        case 'glucose':
          addGlucoseEntry(numericValue);
          break;
        case 'bolus':
          addBolusEntry(numericValue, selectedMeal);
          break;
        case 'basal':
          if (!canAddBasal()) {
            showAlert(
              'Erro',
              'Já existe um registro de insulina basal para este dia.',
              [{ text: 'Entendi' }],
            );
            setLoading(false);
            return;
          }
          const success = setBasalEntry(numericValue);
          if (!success) {
            showAlert(
              'Erro',
              'Já existe um registro de insulina basal para este dia.',
              [{ text: 'Entendi' }],
            );
            setLoading(false);
            return;
          }
          break;
      }

      setValue('');
      onClose();
    } catch (error) {
      showAlert('Erro', 'Não foi possível salvar o registro.', [
        { text: 'Entendi' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setValue('');
    setSelectedMeal('correction');
    onClose();
  };

  const handleValueChange = (text: string) => {
    // Permitir apenas números, ponto e vírgula
    const numericText = text.replace(/[^0-9.,]/g, '');
    setValue(numericText);
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      padding: 24,
      margin: 20,
      width: '90%',
      maxWidth: 400,
      elevation: 5,
      shadowColor: theme.colors.textSecondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.text,
      marginLeft: 12,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      maxHeight: 300,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 16,
      ...theme.typography.body,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      marginBottom: 20,
      minHeight: 50,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
      gap: 12,
    },
    cancelButton: {
      flex: 0.3,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    saveButton: {
      flex: 0.7,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
    },
    cancelButtonText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    saveButtonText: {
      ...theme.typography.button,
      color: 'white',
    },
    mealSection: {
      marginBottom: 20,
    },
    mealLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    mealOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    mealOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      marginBottom: 8,
    },
    mealOptionSelected: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.secondary,
    },
    mealOptionText: {
      ...theme.typography.caption,
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: 6,
    },
    mealOptionTextSelected: {
      color: 'white',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Icon name={config.icon} size={24} color={theme.colors.primary} />
            <Text style={styles.title}>{config.title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Icon name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              style={styles.input}
              placeholder={config.placeholder}
              placeholderTextColor={theme.colors.textSecondary}
              value={value}
              onChangeText={handleValueChange}
              keyboardType={config.keyboardType}
              autoFocus
            />

            {entryType === 'bolus' && (
              <View style={styles.mealSection}>
                <View style={styles.mealOptions}>
                  {mealOptions.map(meal => (
                    <TouchableOpacity
                      key={meal.type}
                      style={[
                        styles.mealOption,
                        selectedMeal === meal.type && styles.mealOptionSelected,
                      ]}
                      onPress={() => setSelectedMeal(meal.type)}
                    >
                      <Icon
                        name={meal.icon}
                        size={16}
                        color={
                          selectedMeal === meal.type
                            ? 'white'
                            : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.mealOptionText,
                          selectedMeal === meal.type &&
                            styles.mealOptionTextSelected,
                        ]}
                      >
                        {meal.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {alertConfig && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={hideAlert}
        />
      )}
    </Modal>
  );
};

export default AddEntryModal;
