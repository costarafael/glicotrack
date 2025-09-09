import { DailyLog } from '../../types';

// Import types first
import type {
  AdvancedStatistics,
  MonthlyStatistics,
} from '../../types/statistics';
// Import services
import { MealAnalyzer } from './MealAnalyzer';
import { CoverageAnalyzer } from './CoverageAnalyzer';
import { CohortAnalyzer } from './CohortAnalyzer';

/**
 * Calculador de Estatísticas Avançadas para Relatórios PDF
 *
 * Este serviço estende as estatísticas básicas do PDFGenerator com análises mais
 * detalhadas incluindo médias diárias, análise por refeição, cobertura e cohorts.
 */
export class AdvancedStatisticsCalculator {
  /**
   * Calcula todas as estatísticas avançadas para um conjunto de logs mensais
   */
  static calculate(
    monthlyLogs: DailyLog[],
    month: number,
    year: number,
  ): AdvancedStatistics {
    console.log(
      `📊 [AdvancedStats] Calculating advanced statistics for ${year}-${month}`,
    );
    console.log(
      `📊 [AdvancedStats] Processing ${monthlyLogs.length} daily logs`,
    );

    // 1. Calcular estatísticas básicas primeiro
    const basicStats = this.calculateBasicStatistics(monthlyLogs);

    // 2. Calcular médias diárias
    const averageDailyBolus = this.calculateAverageDailyBolus(monthlyLogs);
    const averageDailyBasal = this.calculateAverageDailyBasal(monthlyLogs);

    // 3. Análise por tipo de refeição
    const bolusPerMealType = MealAnalyzer.analyzeBolusPerMeal(monthlyLogs);

    // 4. Análise de cobertura mensal
    const coverage = CoverageAnalyzer.analyzeCoverage(monthlyLogs, month, year);

    // 5. Análise de padrões por dia da semana
    const weekdayAnalysis = CohortAnalyzer.analyzeWeekdays(monthlyLogs);

    // 6. Análises temporais avançadas
    const averageGlucoseByTimeOfDay =
      this.calculateGlucoseByTimeOfDay(monthlyLogs);
    const glucoseVariability = this.calculateGlucoseVariability(monthlyLogs);

    const advancedStats: AdvancedStatistics = {
      ...basicStats,
      averageDailyBolus,
      averageDailyBasal,
      bolusPerMealType,
      coverage,
      weekdayAnalysis,
      averageGlucoseByTimeOfDay,
      glucoseVariability,
    };

    console.log(
      `✅ [AdvancedStats] Advanced statistics calculated successfully`,
    );
    console.log(`📊 [AdvancedStats] Coverage: ${coverage.coveragePercentage}%`);
    console.log(
      `📊 [AdvancedStats] Daily avg bolus: ${averageDailyBolus.toFixed(1)}U`,
    );

    return advancedStats;
  }

  /**
   * Calcula estatísticas básicas (compatível com PDFGenerator)
   */
  private static calculateBasicStatistics(
    monthlyLogs: DailyLog[],
  ): MonthlyStatistics {
    if (monthlyLogs.length === 0) {
      return {
        totalDays: 0,
        glucoseReadings: 0,
        averageGlucose: 0,
        totalBolus: 0,
        totalBasal: 0,
      };
    }

    let glucoseReadings = 0;
    let totalGlucose = 0;
    let totalBolus = 0;
    let totalBasal = 0;

    monthlyLogs.forEach(log => {
      // Contabilizar leituras de glicose
      glucoseReadings += log.glucoseEntries?.length || 0;
      totalGlucose += (log.glucoseEntries || []).reduce((sum, entry) => {
        return sum + (entry?.value || 0);
      }, 0);

      // Contabilizar bolus
      totalBolus += (log.bolusEntries || []).reduce((sum, entry) => {
        return sum + (entry?.units || 0);
      }, 0);

      // Contabilizar basal (se existe)
      if (log.basalEntry?.units) {
        totalBasal += log.basalEntry.units;
      }
    });

    return {
      totalDays: monthlyLogs.length,
      glucoseReadings,
      averageGlucose: glucoseReadings > 0 ? totalGlucose / glucoseReadings : 0,
      totalBolus,
      totalBasal,
    };
  }

  /**
   * Calcula a média diária de bolus
   */
  private static calculateAverageDailyBolus(monthlyLogs: DailyLog[]): number {
    if (monthlyLogs.length === 0) return 0;

    const daysWithBolus = monthlyLogs.filter(log => {
      return log.bolusEntries && log.bolusEntries.length > 0;
    });

    if (daysWithBolus.length === 0) return 0;

    const totalBolus = daysWithBolus.reduce((sum, log) => {
      return (
        sum +
        (log.bolusEntries || []).reduce((daySum, entry) => {
          return daySum + (entry?.units || 0);
        }, 0)
      );
    }, 0);

    return totalBolus / daysWithBolus.length;
  }

  /**
   * Calcula a média diária de basal
   */
  private static calculateAverageDailyBasal(monthlyLogs: DailyLog[]): number {
    if (monthlyLogs.length === 0) return 0;

    const daysWithBasal = monthlyLogs.filter(log => {
      return log.basalEntry?.units && log.basalEntry.units > 0;
    });

    if (daysWithBasal.length === 0) return 0;

    const totalBasal = daysWithBasal.reduce((sum, log) => {
      return sum + (log.basalEntry?.units || 0);
    }, 0);

    return totalBasal / daysWithBasal.length;
  }

  /**
   * Calcula glicose média por período do dia
   */
  private static calculateGlucoseByTimeOfDay(
    monthlyLogs: DailyLog[],
  ): Record<string, number> {
    const periods = {
      morning: { total: 0, count: 0 }, // 06:00 - 11:59
      afternoon: { total: 0, count: 0 }, // 12:00 - 17:59
      evening: { total: 0, count: 0 }, // 18:00 - 21:59
      night: { total: 0, count: 0 }, // 22:00 - 05:59
    };

    monthlyLogs.forEach(log => {
      (log.glucoseEntries || []).forEach(entry => {
        if (!entry?.timestamp || !entry?.value) return;

        const hour = new Date(entry.timestamp).getHours();
        let period: keyof typeof periods;

        if (hour >= 6 && hour < 12) {
          period = 'morning';
        } else if (hour >= 12 && hour < 18) {
          period = 'afternoon';
        } else if (hour >= 18 && hour < 22) {
          period = 'evening';
        } else {
          period = 'night';
        }

        periods[period].total += entry.value;
        periods[period].count += 1;
      });
    });

    return {
      morning:
        periods.morning.count > 0
          ? periods.morning.total / periods.morning.count
          : 0,
      afternoon:
        periods.afternoon.count > 0
          ? periods.afternoon.total / periods.afternoon.count
          : 0,
      evening:
        periods.evening.count > 0
          ? periods.evening.total / periods.evening.count
          : 0,
      night:
        periods.night.count > 0 ? periods.night.total / periods.night.count : 0,
    };
  }

  /**
   * Calcula a variabilidade da glicose (coeficiente de variação)
   */
  private static calculateGlucoseVariability(monthlyLogs: DailyLog[]): number {
    const allGlucoseValues: number[] = [];

    monthlyLogs.forEach(log => {
      (log.glucoseEntries || []).forEach(entry => {
        if (entry?.value && entry.value > 0) {
          allGlucoseValues.push(entry.value);
        }
      });
    });

    if (allGlucoseValues.length < 2) return 0;

    // Calcular média
    const mean =
      allGlucoseValues.reduce((sum, value) => sum + value, 0) /
      allGlucoseValues.length;

    // Calcular desvio padrão
    const variance =
      allGlucoseValues.reduce((sum, value) => {
        return sum + Math.pow(value - mean, 2);
      }, 0) /
      (allGlucoseValues.length - 1);

    const standardDeviation = Math.sqrt(variance);

    // Coeficiente de variação = (desvio padrão / média) * 100
    return mean > 0 ? (standardDeviation / mean) * 100 : 0;
  }

  /**
   * Utilitário para validar e sanitizar logs
   */
  static validateLogs(logs: DailyLog[]): DailyLog[] {
    return logs.filter(log => {
      // Log deve ter pelo menos uma entrada válida
      const hasGlucose = log.glucoseEntries && log.glucoseEntries.length > 0;
      const hasBolus = log.bolusEntries && log.bolusEntries.length > 0;
      const hasBasal = log.basalEntry && log.basalEntry.units > 0;

      return hasGlucose || hasBolus || hasBasal;
    });
  }

  /**
   * Calcula estatísticas de resumo para debug
   */
  static generateSummary(statistics: AdvancedStatistics): string {
    return `
📊 Resumo Estatístico:
• ${statistics.totalDays} dias com registros
• ${statistics.glucoseReadings} medições de glicose
• ${statistics.coverage.coveragePercentage}% de cobertura mensal
• Bolus médio diário: ${statistics.averageDailyBolus.toFixed(1)}U
• Basal médio diário: ${statistics.averageDailyBasal.toFixed(1)}U
• Variabilidade glicose: ${statistics.glucoseVariability.toFixed(1)}%
• Dia mais ativo: ${
      statistics.weekdayAnalysis.weekdayNames[
        statistics.weekdayAnalysis.mostActiveWeekday
      ]
    }
    `.trim();
  }
}
