import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { DailyLog } from '../types';
import { AdvancedStatistics } from '../types/statistics';
import { StorageService } from '../services/storage';
import { MonthlyStatistics, PDFGenerator } from '../services/PDFGenerator';
import { useFirebase } from '../context/FirebaseContext';
import { useCompanionMode } from '../context/CompanionContext';

interface UseMonthlyReportResult {
  logs: DailyLog[];
  statistics: MonthlyStatistics;
  advancedStatistics: AdvancedStatistics;
  loading: boolean;
  error: string | null;
  refreshData: () => void;
}

export function useMonthlyReport(
  month: number,
  year: number,
): UseMonthlyReportResult {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getRepository } = useFirebase();
  const { isCompanionMode, activeKey } = useCompanionMode();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let monthlyLogs: DailyLog[];

      if (isCompanionMode && activeKey) {
        console.log(
          `📊 [useMonthlyReport] Loading companion data for ${activeKey.key}, ${year}-${month}`,
        );

        // Em companion mode, usar Firebase repository para buscar dados externos
        let repository = getRepository();

        // Se não tiver repository, criar dedicado
        if (!repository) {
          console.log(
            `🔧 [useMonthlyReport] Creating dedicated repository for companion monthly report`,
          );
          const { FirebaseDataRepository } = await import(
            '../services/FirebaseDataRepository'
          );
          repository = new FirebaseDataRepository();
          await repository.initialize();
        }

        // Configurar companion mode
        if (repository && 'setCompanionMode' in repository) {
          (repository as any).setCompanionMode(true, activeKey.key);
        }

        // Buscar dados mensais via repository (que vai buscar do Firebase)
        monthlyLogs = await repository.getLogsForMonth(year, month);
        console.log(
          `📊 [useMonthlyReport] Loaded ${monthlyLogs.length} companion logs for ${year}-${month}`,
        );
      } else {
        // Modo normal, usar dados locais
        console.log(
          `📊 [useMonthlyReport] Loading local data for ${year}-${month}`,
        );
        monthlyLogs = StorageService.getMonthlyLogs(year, month);
      }

      setLogs(monthlyLogs);
    } catch (err) {
      console.error('Error loading monthly data:', err);
      setError('Não foi possível carregar os dados do mês.');
      Alert.alert('Erro', 'Não foi possível carregar os dados do mês.');
    } finally {
      setLoading(false);
    }
  }, [month, year, isCompanionMode, activeKey, getRepository]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statistics = PDFGenerator.calculateStatistics(logs);
  const advancedStatistics = PDFGenerator.calculateAdvancedStatistics(
    logs,
    month,
    year,
  );

  return {
    logs,
    statistics,
    advancedStatistics,
    loading,
    error,
    refreshData: loadData,
  };
}
