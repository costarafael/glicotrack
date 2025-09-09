import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { DailyLog, EntryType } from '../types';
import EditTimeModal from './EditTimeModal';
import { formatGlucoseValue, formatInsulinUnits } from '../utils/formatters';
import { formatTime } from '../utils/dateHelpers';
import { MEAL_LABELS } from '../constants/mealTypes';
import CustomAlert from './CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface EntryListProps {
  log: DailyLog;
}

const EntryList: React.FC<EntryListProps> = ({ log }) => {
  const { theme } = useTheme();
  const { removeEntry, updateEntryTime } = useData();
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const [editTimeModal, setEditTimeModal] = useState<{
    visible: boolean;
    entry: any;
    type: EntryType;
  }>({ visible: false, entry: null, type: 'glucose' });

  const handleDeleteEntry = (
    type: EntryType,
    id: string,
    description: string,
  ) => {
    showAlert(
      'Excluir Registro',
      `Tem certeza que deseja excluir o registro de ${description}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => removeEntry(type, id),
        },
      ],
    );
  };

  const handleEditTime = (entry: any, type: EntryType) => {
    setEditTimeModal({ visible: true, entry, type });
  };

  const handleSaveTime = (newTime: Date) => {
    if (editTimeModal.entry) {
      updateEntryTime(editTimeModal.type, editTimeModal.entry.id, newTime);
    }
  };

  const getTimeDifference = (currentTime: Date, previousTime: Date): string => {
    const diffInMinutes = Math.round(
      (currentTime.getTime() - previousTime.getTime()) / 60000,
    );

    if (diffInMinutes < 60) {
      return `+${diffInMinutes}min`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return minutes > 0 ? `+${hours}h${minutes}min` : `+${hours}h`;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingLeft: 16,
    },
    timelineContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    timelineLeft: {
      alignItems: 'center',
      marginRight: 16,
      minWidth: 60,
    },
    timePoint: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.background,
      zIndex: 2,
    },
    timelineVertical: {
      width: 2,
      backgroundColor: theme.colors.border,
      flex: 1,
      marginTop: 6,
    },
    timeText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
      textAlign: 'center',
    },
    timeDiff: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 4,
      fontWeight: '500',
    },
    entryContent: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginTop: -6,
    },
    entryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    entryIcon: {
      marginRight: 8,
    },
    entryType: {
      fontSize: 14,
      fontWeight: 'bold',
      flex: 1,
    },
    entryValue: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
    },
    actionButton: {
      padding: 6,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
      fontStyle: 'italic',
    },
    lastTimelineItem: {
      marginBottom: 0,
    },
  });

  // Combine all entries and sort by timestamp (oldest first) - using useMemo for proper re-rendering
  const allEntries = useMemo(() => {
    const combined = [
      ...log.glucoseEntries.map(entry => ({
        ...entry,
        type: 'glucose' as const,
      })),
      ...log.bolusEntries.map(entry => ({ ...entry, type: 'bolus' as const })),
      ...(log.basalEntry
        ? [{ ...log.basalEntry, type: 'basal' as const }]
        : []),
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return combined;
  }, [log.glucoseEntries, log.bolusEntries, log.basalEntry, log.date]);

  if (allEntries.length === 0) {
    return (
      <Text style={styles.emptyText}>
        Nenhum registro adicionado ainda hoje.
      </Text>
    );
  }

  const getMealLabel = (mealType: string) => {
    return MEAL_LABELS[mealType as keyof typeof MEAL_LABELS] || 'Correção';
  };

  const getEntryDisplay = (entry: any) => {
    switch (entry.type) {
      case 'glucose':
        return {
          title: 'Glicose',
          value: formatGlucoseValue(entry.value),
          icon: 'water-outline',
          color: theme.colors.error,
        };
      case 'bolus':
        return {
          title: `Insulina Bolus - ${getMealLabel(entry.mealType)}`,
          value: formatInsulinUnits(entry.units),
          icon: 'medication-outline',
          color: theme.colors.primary,
        };
      case 'basal':
        return {
          title: 'Insulina Basal',
          value: formatInsulinUnits(entry.units),
          icon: 'clock-outline',
          color: theme.colors.primary,
        };
      default:
        return {
          title: 'Desconhecido',
          value: '',
          icon: 'help',
          color: theme.colors.textSecondary,
        };
    }
  };

  return (
    <View style={styles.container}>
      {allEntries.map((entry, index) => {
        const display = getEntryDisplay(entry);
        const isLast = index === allEntries.length - 1;
        const previousEntry = index > 0 ? allEntries[index - 1] : null;

        return (
          <View
            key={`${entry.id}-${entry.timestamp.getTime()}`}
            style={[
              styles.timelineContainer,
              isLast && styles.lastTimelineItem,
            ]}
          >
            <View style={styles.timelineLeft}>
              <Text style={styles.timeText}>{formatTime(entry.timestamp)}</Text>
              <View style={styles.timePoint} />
              {!isLast && <View style={styles.timelineVertical} />}
              {previousEntry && (
                <Text style={styles.timeDiff}>
                  {getTimeDifference(entry.timestamp, previousEntry.timestamp)}
                </Text>
              )}
            </View>

            <View style={styles.entryContent}>
              <View style={styles.entryHeader}>
                <Icon
                  name={display.icon}
                  size={20}
                  color={display.color}
                  style={styles.entryIcon}
                />
                <Text style={[styles.entryType, { color: display.color }]}>
                  {display.title}
                </Text>
              </View>

              <Text style={styles.entryValue}>{display.value}</Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditTime(entry, entry.type)}
                >
                  <Icon
                    name="clock-outline"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    handleDeleteEntry(entry.type, entry.id, display.title)
                  }
                >
                  <Icon
                    name="delete-outline"
                    size={16}
                    color={theme.colors.error}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}

      <EditTimeModal
        visible={editTimeModal.visible}
        onClose={() =>
          setEditTimeModal({ visible: false, entry: null, type: 'glucose' })
        }
        currentTime={editTimeModal.entry?.timestamp || new Date()}
        onSave={handleSaveTime}
        title={`Editar Hora - ${
          getEntryDisplay(editTimeModal.entry || {}).title
        }`}
      />

      {alertConfig && (
        <CustomAlert
          visible={visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={hideAlert}
        />
      )}
    </View>
  );
};

export default EntryList;
