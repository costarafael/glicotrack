import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import Icon from '@react-native-vector-icons/material-design-icons';

import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useCompanionMode } from '../context/CompanionContext';
import {
  formatDateDisplay,
  addDays,
  subtractDays,
  isFuture,
  formatTime,
} from '../utils/dateHelpers';
import { formatInsulinUnits } from '../utils/formatters';
import { UniversalNavigation } from '../design-system';
import EntryList from '../components/EntryList';
import AddEntryModal from '../components/AddEntryModal';
import NotesModal from '../components/NotesModal';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { EntryType } from '../types';

const DailyLogScreen: React.FC = () => {
  const { theme } = useTheme();
  const { state, setCurrentDate, removeEntry, isReadOnlyMode } = useData();
  const { isCompanionMode, activeKey } = useCompanionMode();
  const {
    alertConfig,
    visible: alertVisible,
    showAlert,
    hideAlert,
  } = useCustomAlert();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedEntryType, setSelectedEntryType] =
    useState<EntryType>('glucose');

  const handlePreviousDay = () => {
    const previousDate = subtractDays(state.currentDate, 1);
    setCurrentDate(previousDate);
  };

  const handleNextDay = () => {
    const nextDate = addDays(state.currentDate, 1);
    if (!isFuture(nextDate)) {
      setCurrentDate(nextDate);
    }
  };

  const handleAddEntry = (type: EntryType) => {
    // Verifica se está em modo somente leitura
    if (isReadOnlyMode) {
      showAlert(
        'Modo Somente Leitura',
        `Você está visualizando dados de ${activeKey?.name}. Não é possível adicionar registros neste modo.`,
        [{ text: 'Entendi', onPress: hideAlert }],
      );
      return;
    }

    setSelectedEntryType(type);
    setShowAddModal(true);
  };

  const handleNotesPress = () => {
    // Verifica se está em modo somente leitura
    if (isReadOnlyMode) {
      showAlert(
        'Modo Somente Leitura',
        `Você está visualizando dados de ${activeKey?.name}. Não é possível editar notas neste modo.`,
        [{ text: 'Entendi', onPress: hideAlert }],
      );
      return;
    }

    setShowNotesModal(true);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: 16,
      paddingTop: 32, // Increased top padding for better spacing from status bar
    },
    contextSwitcherSection: {
      marginBottom: 16,
    },
    companionBanner: {
      backgroundColor: theme.colors.warning + '20',
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.warning,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    companionBannerText: {
      fontSize: 14,
      color: theme.colors.warning,
      fontWeight: '500',
    },
    dateSection: {
      marginBottom: 24,
    },
    actionsSection: {
      marginBottom: 24,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 12,
      elevation: 2,
      shadowColor: theme.colors.textSecondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    glucoseButton: {
      backgroundColor: theme.colors.error,
    },
    bolusButton: {
      backgroundColor: theme.colors.primary,
    },
    actionButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    basalCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 1,
      shadowColor: theme.colors.textSecondary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    basalCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    basalCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 8,
    },
    basalCardContent: {
      alignItems: 'center',
    },
    basalCardValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    basalCardTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    basalCardEdit: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    basalCardEditText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
    basalCardEmpty: {
      alignItems: 'center',
      paddingVertical: 20,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
      borderRadius: 8,
    },
    basalCardEmptyText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.primary,
      marginTop: 8,
    },
    basalCardEmptySubtext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    notesSection: {
      marginTop: 16,
      marginBottom: 24,
    },
    notesButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
    },
    notesButtonText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    notesPreview: {
      marginTop: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    notesPreviewText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    entriesSection: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 32,
      fontStyle: 'italic',
    },
    // Read-only mode styles
    readOnlyButton: {
      backgroundColor: theme.colors.border,
      opacity: 0.6,
    },
    readOnlyButtonText: {
      color: '#999',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Companion mode info banner */}
        {isCompanionMode && activeKey && (
          <View style={styles.contextSwitcherSection}>
            <View style={styles.companionBanner}>
              <Text style={styles.companionBannerText}>
                👁️ Visualizando dados de: {activeKey.name} ({activeKey.key})
              </Text>
            </View>
          </View>
        )}

        <View style={styles.dateSection}>
          <UniversalNavigation
            type="date"
            onPrevious={handlePreviousDay}
            onNext={handleNextDay}
            canGoNext={!isFuture(addDays(state.currentDate, 1))}
            displayText={formatDateDisplay(state.currentDate)}
          />
        </View>

        <View style={styles.actionsSection}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.glucoseButton,
                isReadOnlyMode && styles.readOnlyButton,
              ]}
              onPress={() => handleAddEntry('glucose')}
              disabled={isReadOnlyMode}
            >
              <Icon
                name="water-outline"
                size={24}
                color={isReadOnlyMode ? '#999' : 'white'}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  isReadOnlyMode && styles.readOnlyButtonText,
                ]}
              >
                {isReadOnlyMode ? 'Visualizando' : 'Registrar Glicose'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.bolusButton,
                isReadOnlyMode && styles.readOnlyButton,
              ]}
              onPress={() => handleAddEntry('bolus')}
              disabled={isReadOnlyMode}
            >
              <Icon
                name="medication-outline"
                size={24}
                color={isReadOnlyMode ? '#999' : 'white'}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  isReadOnlyMode && styles.readOnlyButtonText,
                ]}
              >
                {isReadOnlyMode ? 'Visualizando' : 'Registrar Bolus'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card especial para Insulina Basal */}
          <View style={styles.basalCard}>
            <View style={styles.basalCardHeader}>
              <Icon
                name="clock-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.basalCardTitle}>Insulina Basal do Dia</Text>
            </View>
            {state.currentLog?.basalEntry ? (
              <View style={styles.basalCardContent}>
                <Text style={styles.basalCardValue}>
                  {formatInsulinUnits(state.currentLog.basalEntry.units)}
                </Text>
                <Text style={styles.basalCardTime}>
                  Registrado às{' '}
                  {formatTime(state.currentLog.basalEntry.timestamp)}
                </Text>
                <TouchableOpacity
                  style={styles.basalCardEdit}
                  onPress={() => {
                    if (isReadOnlyMode) {
                      showAlert(
                        'Modo Somente Leitura',
                        `Você está visualizando dados de ${activeKey?.name}. Não é possível editar registros neste modo.`,
                        [{ text: 'Entendi', onPress: hideAlert }],
                      );
                      return;
                    }
                    showAlert(
                      'Editar Basal',
                      'Você pode excluir e criar um novo registro.',
                      [
                        { text: 'Cancelar', onPress: hideAlert },
                        {
                          text: 'Excluir',
                          style: 'destructive',
                          onPress: () => {
                            removeEntry(
                              'basal',
                              state.currentLog!.basalEntry!.id,
                            );
                            hideAlert();
                          },
                        },
                      ],
                    );
                  }}
                  disabled={isReadOnlyMode}
                >
                  <Icon
                    name="pencil-outline"
                    size={16}
                    color={isReadOnlyMode ? '#999' : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.basalCardEditText,
                      isReadOnlyMode && styles.readOnlyButtonText,
                    ]}
                  >
                    {isReadOnlyMode ? 'Visualizar' : 'Editar'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.basalCardEmpty,
                  isReadOnlyMode && styles.readOnlyButton,
                ]}
                onPress={() => handleAddEntry('basal')}
                disabled={isReadOnlyMode}
              >
                <Icon
                  name="plus"
                  size={32}
                  color={isReadOnlyMode ? '#999' : theme.colors.primary}
                />
                <Text
                  style={[
                    styles.basalCardEmptyText,
                    isReadOnlyMode && styles.readOnlyButtonText,
                  ]}
                >
                  {isReadOnlyMode
                    ? 'Visualizando dados'
                    : 'Definir Insulina Basal'}
                </Text>
                <Text
                  style={[
                    styles.basalCardEmptySubtext,
                    isReadOnlyMode && styles.readOnlyButtonText,
                  ]}
                >
                  {isReadOnlyMode ? 'Modo somente leitura' : 'Uma vez por dia'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.entriesSection}>
          <Text style={styles.sectionTitle}>Registros do Dia</Text>
          {state.currentLog ? (
            <EntryList log={state.currentLog} />
          ) : (
            <Text style={styles.emptyText}>
              Nenhum registro encontrado para este dia.
            </Text>
          )}
        </View>

        {/* Seção de Notas - Simplificada */}
        <View style={styles.notesSection}>
          <TouchableOpacity
            style={styles.notesButton}
            onPress={handleNotesPress}
          >
            <Icon
              name="note-outline"
              size={20}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.notesButtonText}>
              {state.currentLog?.notes
                ? 'Editar notas do dia'
                : 'Adicionar notas do dia'}
            </Text>
          </TouchableOpacity>

          {state.currentLog?.notes && (
            <TouchableOpacity
              style={styles.notesPreview}
              onPress={handleNotesPress}
            >
              <Text
                style={styles.notesPreviewText}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {state.currentLog.notes}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <AddEntryModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        entryType={selectedEntryType}
      />

      <NotesModal
        visible={showNotesModal}
        onClose={() => setShowNotesModal(false)}
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

export default DailyLogScreen;
