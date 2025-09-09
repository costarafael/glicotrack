/**
 * SimpleRemindersScreen - Versão corrigida sem problemas de key props
 * Usando componentes nativos para evitar conflitos com @rneui/themed
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Text,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import TimePickerModal from '../components/TimePickerModal';
import DelayPickerModal from '../components/DelayPickerModal';

import { useTheme } from '../context/ThemeContext';
import { SimpleReminderService } from '../services/SimpleReminderService';
import {
  SimpleReminder,
  BasalReminder,
  DailyLogReminder,
  GlucoseAfterBolusReminder,
  GlucoseFixedReminder,
} from '../types/simpleReminders';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const SimpleRemindersScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme.colors);
  const {
    alertConfig,
    visible: alertVisible,
    showAlert,
    hideAlert,
  } = useCustomAlert();

  const [reminders, setReminders] = useState<SimpleReminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para modais de edição
  const [editingReminder, setEditingReminder] = useState<SimpleReminder | null>(
    null,
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDelayPicker, setShowDelayPicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('08:00');
  const [editingTimeIndex, setEditingTimeIndex] = useState<number>(-1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const service = SimpleReminderService.getInstance();
      await service.initialize();

      setReminders(service.getAllReminders());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showAlert('Erro', 'Não foi possível carregar os lembretes');
    }
  };

  const toggleReminderEnabled = async (
    reminderId: string,
    enabled: boolean,
  ) => {
    try {
      setIsLoading(true);
      const service = SimpleReminderService.getInstance();

      const success = service.updateReminder(reminderId, { enabled });
      if (success) {
        setReminders(prev =>
          prev.map(r => (r.id === reminderId ? { ...r, enabled } : r)),
        );
      }
    } catch (error) {
      console.error('Erro ao atualizar lembrete:', error);
      showAlert('Erro', 'Não foi possível atualizar o lembrete');
    } finally {
      setIsLoading(false);
    }
  };

  const openTimeEditor = (reminder: SimpleReminder, timeIndex: number = -1) => {
    setEditingReminder(reminder);
    setEditingTimeIndex(timeIndex);

    let initialTime = '08:00';

    if (reminder.type === 'basal') {
      initialTime = (reminder as BasalReminder).time;
    } else if (reminder.type === 'daily_log') {
      initialTime = (reminder as DailyLogReminder).checkTime;
    } else if (reminder.type === 'glucose_fixed' && timeIndex >= 0) {
      const times = (reminder as GlucoseFixedReminder).times;
      if (times[timeIndex]) {
        initialTime = times[timeIndex];
      }
    }

    setSelectedTime(initialTime);
    setShowTimePicker(true);
  };

  const saveTimeChange = (timeString: string) => {
    if (!editingReminder) return;

    const service = SimpleReminderService.getInstance();

    let updates: Partial<SimpleReminder> = {};

    switch (editingReminder.type) {
      case 'basal':
        updates = { time: timeString };
        break;
      case 'daily_log':
        updates = { checkTime: timeString };
        break;
      case 'glucose_fixed':
        const fixedReminder = editingReminder as GlucoseFixedReminder;
        if (editingTimeIndex >= 0) {
          // Editando horário existente
          const newTimes = [...fixedReminder.times];
          newTimes[editingTimeIndex] = timeString;
          updates = { times: newTimes };
        } else {
          // Adicionando novo horário
          updates = { times: [...fixedReminder.times, timeString].sort() };
        }
        break;
    }

    const success = service.updateReminder(editingReminder.id, updates);
    if (success) {
      setReminders(service.getAllReminders());
    }
  };

  const removeFixedTime = (reminderId: string, timeIndex: number) => {
    const reminder = reminders.find(
      r => r.id === reminderId,
    ) as GlucoseFixedReminder;
    if (!reminder) return;

    const newTimes = reminder.times.filter((_, index) => index !== timeIndex);

    const service = SimpleReminderService.getInstance();
    const success = service.updateReminder(reminderId, { times: newTimes });

    if (success) {
      setReminders(service.getAllReminders());
    }
  };

  const openDelayEditor = (reminder: GlucoseAfterBolusReminder) => {
    setEditingReminder(reminder);
    setShowDelayPicker(true);
  };

  const saveDelayChange = (hours: number, minutes: number) => {
    if (!editingReminder || editingReminder.type !== 'glucose_after_bolus')
      return;

    const service = SimpleReminderService.getInstance();
    const success = service.updateReminder(editingReminder.id, {
      delayHours: hours,
      delayMinutes: minutes,
    });

    if (success) {
      setReminders(service.getAllReminders());
    }
  };

  const getReminderIcon = (type: string): string => {
    switch (type) {
      case 'basal':
        return 'medication-outline';
      case 'daily_log':
        return 'file-document-outline';
      case 'glucose_after_bolus':
        return 'opacity';
      case 'glucose_fixed':
        return 'clock-outline';
      default:
        return 'clock-outline';
    }
  };

  // Render functions usando componentes nativos
  const renderReminderItem = (reminder: SimpleReminder) => {
    const iconName = getReminderIcon(reminder.type);

    return (
      <View key={`reminder-${reminder.id}`} style={styles.reminderCard}>
        <View style={styles.reminderHeader}>
          <View style={styles.reminderIcon}>
            <Icon name={iconName} size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderTitle}>{reminder.name}</Text>
            <Text style={styles.reminderSubtitle}>{reminder.description}</Text>
          </View>
          <Switch
            value={reminder.enabled}
            onValueChange={enabled =>
              toggleReminderEnabled(reminder.id, enabled)
            }
            disabled={isLoading}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary + '40',
            }}
            thumbColor={
              reminder.enabled
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
        </View>

        {renderReminderContent(reminder)}
      </View>
    );
  };

  const renderReminderContent = (reminder: SimpleReminder) => {
    switch (reminder.type) {
      case 'basal':
        const basalReminder = reminder as BasalReminder;
        return (
          <TouchableOpacity
            key={`basal-time-${reminder.id}`}
            style={styles.timeButton}
            onPress={() => openTimeEditor(reminder)}
          >
            <Icon name="clock-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.timeText}>{basalReminder.time}</Text>
            <Icon
              name="pencil-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        );

      case 'daily_log':
        const dailyReminder = reminder as DailyLogReminder;
        return (
          <TouchableOpacity
            key={`daily-time-${reminder.id}`}
            style={styles.timeButton}
            onPress={() => openTimeEditor(reminder)}
          >
            <Icon name="clock-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.timeText}>
              Verificar às {dailyReminder.checkTime}
            </Text>
            <Icon
              name="pencil-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        );

      case 'glucose_after_bolus':
        const bolusReminder = reminder as GlucoseAfterBolusReminder;
        return (
          <TouchableOpacity
            key={`bolus-delay-${reminder.id}`}
            style={styles.timeButton}
            onPress={() => openDelayEditor(bolusReminder)}
          >
            <Icon name="timer-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.timeText}>
              {bolusReminder.delayHours}h
              {bolusReminder.delayMinutes > 0
                ? bolusReminder.delayMinutes + 'm'
                : ''}{' '}
              após bolus
            </Text>
            <Icon
              name="pencil-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        );

      case 'glucose_fixed':
        const fixedReminder = reminder as GlucoseFixedReminder;
        return (
          <View key={`fixed-times-${reminder.id}`} style={styles.timesList}>
            {fixedReminder.times.map((time, index) => (
              <View
                key={`time-chip-${reminder.id}-${index}-${time}`}
                style={styles.timeChip}
              >
                <TouchableOpacity
                  style={styles.timeChipContent}
                  onPress={() => openTimeEditor(reminder, index)}
                >
                  <Text style={styles.timeChipText}>{time}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeTimeButton}
                  onPress={() => removeFixedTime(reminder.id, index)}
                >
                  <Icon name="close" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              key={`add-time-${reminder.id}`}
              style={styles.addTimeButton}
              onPress={() => openTimeEditor(reminder, -1)}
            >
              <Icon name="plus" size={20} color={theme.colors.primary} />
              <Text style={styles.addTimeText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Lista de Lembretes */}
        <View style={styles.remindersCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Seus Lembretes</Text>
          </View>

          {reminders.map(reminder => renderReminderItem(reminder))}
        </View>
      </ScrollView>

      {/* Modal de Seleção de Horário */}
      <TimePickerModal
        visible={showTimePicker}
        initialTime={selectedTime}
        onConfirm={time => {
          saveTimeChange(time);
          setShowTimePicker(false);
          setEditingReminder(null);
          setEditingTimeIndex(-1);
        }}
        onCancel={() => {
          setShowTimePicker(false);
          setEditingReminder(null);
          setEditingTimeIndex(-1);
        }}
        title="Selecionar Horário"
        colors={theme.colors}
      />

      {/* Modal de Seleção de Delay */}
      <DelayPickerModal
        visible={showDelayPicker}
        initialHours={
          (editingReminder as GlucoseAfterBolusReminder)?.delayHours || 2
        }
        initialMinutes={
          (editingReminder as GlucoseAfterBolusReminder)?.delayMinutes || 0
        }
        onConfirm={(hours, minutes) => {
          saveDelayChange(hours, minutes);
          setShowDelayPicker(false);
          setEditingReminder(null);
        }}
        onCancel={() => {
          setShowDelayPicker(false);
          setEditingReminder(null);
        }}
        title="Tempo após Bolus"
        colors={theme.colors}
      />

      {alertConfig && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={hideAlert}
        />
      )}
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
    },

    // Cards principais
    remindersCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },

    // Reminder items
    reminderCard: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    reminderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    reminderIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    reminderInfo: {
      flex: 1,
    },
    reminderTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    reminderSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    // Time controls
    timeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '10',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    timeText: {
      fontSize: 14,
      color: colors.primary,
      marginHorizontal: 6,
      fontWeight: '500',
    },

    // Times list (glucose fixed)
    timesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    timeChip: {
      flexDirection: 'row',
      backgroundColor: colors.primary + '10',
      borderRadius: 16,
      overflow: 'hidden',
    },
    timeChipContent: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    timeChipText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    removeTimeButton: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
    },
    addTimeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '10',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      borderStyle: 'dashed',
    },
    addTimeText: {
      fontSize: 14,
      color: colors.primary,
      marginLeft: 4,
      fontWeight: '500',
    },
  });

export default SimpleRemindersScreen;
