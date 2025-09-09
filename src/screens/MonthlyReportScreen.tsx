import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Button } from '@rneui/themed';
import Icon from '@react-native-vector-icons/material-design-icons';

import { useTheme } from '../context/ThemeContext';
import { useCompanionMode } from '../context/CompanionContext';
import { getMonthName } from '../utils/dateHelpers';
import { formatGlucoseValue, formatInsulinUnits } from '../utils/formatters';
import { UniversalNavigation } from '../design-system';
import { PDFGenerator } from '../services/PDFGenerator';
import { MEAL_LABELS_SHORT } from '../constants/mealTypes';
import { useMonthlyReport } from '../hooks/useMonthlyReport';
import { ExportModal } from '../components/ExportModal';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import {
  requestStoragePermission,
  showPermissionDeniedAlert,
} from '../utils/permissions';

const MonthlyReportScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isCompanionMode, activeKey } = useCompanionMode();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [useAdvancedReport, setUseAdvancedReport] = useState(true);
  const {
    alertConfig,
    visible: alertVisible,
    showAlert,
    hideAlert,
  } = useCustomAlert();

  const { logs: monthlyLogs, statistics } = useMonthlyReport(
    currentMonth,
    currentYear,
  );

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const today = new Date();
    const isCurrentMonth =
      currentMonth === today.getMonth() + 1 &&
      currentYear === today.getFullYear();

    if (!isCurrentMonth) {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const canGoNext = () => {
    const today = new Date();
    return !(
      currentMonth === today.getMonth() + 1 &&
      currentYear === today.getFullYear()
    );
  };

  const handleExportPDF = async (type: 'save' | 'share') => {
    setExportLoading(true);

    try {
      // Solicitar permissão de armazenamento primeiro
      const permissionResult = await requestStoragePermission();
      if (!permissionResult.granted) {
        showPermissionDeniedAlert();
        setExportLoading(false);
        setShowExportModal(false);
        return;
      }

      const result = useAdvancedReport
        ? await PDFGenerator.generateAdvancedMonthlyReport(
            monthlyLogs,
            currentMonth,
            currentYear,
            {
              includeCharts: true,
              includeAdvancedStats: true,
              reportType: 'advanced',
            },
            type,
          )
        : await PDFGenerator.generateMonthlyReport(
            monthlyLogs,
            currentMonth,
            currentYear,
            type,
          );

      if (result.success) {
        if (type === 'save') {
          showAlert(
            'PDF Salvo',
            `Relatório salvo com sucesso!\nLocal: ${result.filePath}`,
            [{ text: 'Entendi' }],
          );
        } else {
          showAlert(
            'PDF Compartilhado',
            'Relatório compartilhado com sucesso!',
            [{ text: 'Entendi' }],
          );
        }
      } else {
        showAlert('Erro', result.error || 'Erro desconhecido', [
          { text: 'Entendi' },
        ]);
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      showAlert('Erro', 'Não foi possível exportar o relatório.', [
        { text: 'Entendi' },
      ]);
    }

    setExportLoading(false);
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
    header: {
      marginBottom: 24,
    },
    exportButton: {
      backgroundColor: theme.colors.primary,
      marginBottom: 16,
      marginTop: 16,
    },
    statisticsSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statisticsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    statItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statLabel: {
      fontSize: 16,
      color: theme.colors.text,
    },
    statValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    logsSection: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    logItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    logDate: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 8,
    },
    logEntries: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    entryChip: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    entryText: {
      fontSize: 12,
      color: theme.colors.text,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 32,
      fontStyle: 'italic',
    },
    notesContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: 8,
    },
    notesText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      lineHeight: 18,
    },
    reportTypeSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    reportTypeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    reportTypeInfo: {
      flex: 1,
      marginRight: 16,
    },
    reportTypeTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    reportTypeDescription: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
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
                📖 Visualizando dados de: {activeKey.name} ({activeKey.key})
              </Text>
            </View>
          </View>
        )}

        <View style={styles.header}>
          <UniversalNavigation
            type="month"
            onPrevious={handlePreviousMonth}
            onNext={handleNextMonth}
            canGoNext={canGoNext()}
            displayText={`${getMonthName(currentMonth)} ${currentYear}`}
          />
        </View>

        <View style={styles.statisticsSection}>
          <Text style={styles.statisticsTitle}>Estatísticas do Mês</Text>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Dias com registros:</Text>
            <Text style={styles.statValue}>{statistics.totalDays}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Medições de glicose:</Text>
            <Text style={styles.statValue}>{statistics.glucoseReadings}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Glicose média:</Text>
            <Text style={styles.statValue}>
              {statistics.averageGlucose > 0
                ? formatGlucoseValue(Math.round(statistics.averageGlucose))
                : '-'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total insulina bolus:</Text>
            <Text style={styles.statValue}>
              {statistics.totalBolus > 0
                ? formatInsulinUnits(statistics.totalBolus)
                : '-'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total insulina basal:</Text>
            <Text style={styles.statValue}>
              {statistics.totalBasal > 0
                ? formatInsulinUnits(statistics.totalBasal)
                : '-'}
            </Text>
          </View>
        </View>

        {/* Report Type Selector */}
        <View style={styles.reportTypeSection}>
          <Text style={styles.sectionTitle}>Tipo de Relatório</Text>
          <View style={styles.reportTypeRow}>
            <View style={styles.reportTypeInfo}>
              <Text style={styles.reportTypeTitle}>
                {useAdvancedReport
                  ? '📊 Relatório Avançado'
                  : '📋 Relatório Básico'}
              </Text>
              <Text style={styles.reportTypeDescription}>
                {useAdvancedReport
                  ? 'Inclui gráficos, análises por refeição, cobertura mensal e padrões semanais'
                  : 'Inclui apenas estatísticas básicas e registros detalhados'}
              </Text>
            </View>
            <Switch
              value={useAdvancedReport}
              onValueChange={setUseAdvancedReport}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={
                useAdvancedReport ? '#ffffff' : theme.colors.textSecondary
              }
              ios_backgroundColor={theme.colors.border}
            />
          </View>
        </View>

        <Button
          title={exportLoading ? 'Exportando...' : 'Exportar PDF'}
          onPress={() => setShowExportModal(true)}
          buttonStyle={styles.exportButton}
          loading={exportLoading}
          disabled={exportLoading}
          icon={
            !exportLoading
              ? {
                  name: 'picture-as-pdf',
                  type: 'material',
                  color: 'white',
                  size: 16,
                }
              : undefined
          }
        />

        <View style={styles.logsSection}>
          <Text style={styles.sectionTitle}>Registros Detalhados</Text>
          {monthlyLogs.length > 0 ? (
            monthlyLogs.map(log => (
              <View key={log.date} style={styles.logItem}>
                <Text style={styles.logDate}>
                  {new Date(log.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    weekday: 'short',
                  })}
                </Text>
                <View style={styles.logEntries}>
                  {log.glucoseEntries.map(entry => (
                    <View key={entry.id} style={styles.entryChip}>
                      <Text style={styles.entryText}>
                        Glicose: {formatGlucoseValue(entry.value)}
                      </Text>
                    </View>
                  ))}
                  {log.bolusEntries.map(entry => {
                    const mealLabel =
                      MEAL_LABELS_SHORT[entry.mealType] || 'Correção';
                    return (
                      <View key={entry.id} style={styles.entryChip}>
                        <Text style={styles.entryText}>
                          Bolus ({mealLabel}): {formatInsulinUnits(entry.units)}
                        </Text>
                      </View>
                    );
                  })}
                  {log.basalEntry && (
                    <View style={styles.entryChip}>
                      <Text style={styles.entryText}>
                        Basal: {formatInsulinUnits(log.basalEntry.units)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Notas do dia */}
                {log.notes && (
                  <View style={styles.notesContainer}>
                    <Icon
                      name="note"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                    <Text
                      style={styles.notesText}
                      numberOfLines={3}
                      ellipsizeMode="tail"
                    >
                      {log.notes}
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              Nenhum registro encontrado para este mês.
            </Text>
          )}
        </View>
      </ScrollView>

      <ExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportPDF}
        isExporting={exportLoading}
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

export default MonthlyReportScreen;
