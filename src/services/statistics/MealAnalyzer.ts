import { DailyLog, MealType } from '../../types';
import { MealStats } from '../../types/statistics';
import { MEAL_LABELS } from '../../constants/mealTypes';

/**
 * Analisador de Refeições para Estatísticas de Bolus
 *
 * Analisa padrões de bolus agrupados por tipo de refeição, calculando
 * totais, médias e frequências para cada categoria.
 */
export class MealAnalyzer {
  /**
   * Analisa bolus por tipo de refeição
   */
  static analyzeBolusPerMeal(logs: DailyLog[]): Record<MealType, MealStats> {
    console.log(
      `🍽️ [MealAnalyzer] Analyzing bolus patterns for ${logs.length} daily logs`,
    );

    // Inicializar contadores para todos os tipos de refeição
    const mealAccumulators: Record<string, { total: number; count: number }> =
      {};

    // Processar todos os logs
    logs.forEach(log => {
      if (!log?.bolusEntries) return;

      log.bolusEntries.forEach(entry => {
        try {
          // Validar entrada de bolus
          if (!this.isValidBolusEntry(entry)) {
            console.warn(
              `⚠️ [MealAnalyzer] Invalid bolus entry found, skipping`,
            );
            return;
          }

          const mealType = entry.mealType;

          // Inicializar acumulador se não existe
          if (!mealAccumulators[mealType]) {
            mealAccumulators[mealType] = { total: 0, count: 0 };
          }

          // Acumular dados
          mealAccumulators[mealType].total += entry.units;
          mealAccumulators[mealType].count += 1;
        } catch (error: any) {
          console.error(
            `❌ [MealAnalyzer] Error processing bolus entry:`,
            error?.message || 'Unknown error',
          );
        }
      });
    });

    // Converter para formato final com médias calculadas
    const result = {} as Record<MealType, MealStats>;

    // Processar todos os tipos de refeição conhecidos
    Object.keys(MEAL_LABELS).forEach(mealTypeKey => {
      const mealType = mealTypeKey as MealType;
      const accumulator = mealAccumulators[mealType];

      if (accumulator && accumulator.count > 0) {
        result[mealType] = {
          total: this.roundToTwoDecimals(accumulator.total),
          average: this.roundToTwoDecimals(
            accumulator.total / accumulator.count,
          ),
          count: accumulator.count,
        };
      } else {
        // Incluir tipos de refeição sem dados (zeros)
        result[mealType] = {
          total: 0,
          average: 0,
          count: 0,
        };
      }
    });

    // Log do resultado
    const totalEntries = Object.values(result).reduce(
      (sum, stats) => sum + stats.count,
      0,
    );
    const activeMealTypes = Object.entries(result).filter(
      ([_, stats]) => stats.count > 0,
    ).length;

    console.log(
      `✅ [MealAnalyzer] Analysis complete: ${totalEntries} bolus entries across ${activeMealTypes} meal types`,
    );

    return result;
  }

  /**
   * Obtém o tipo de refeição com maior volume de bolus
   */
  static getMostActiveMealType(mealStats: Record<MealType, MealStats>): {
    mealType: MealType;
    total: number;
    label: string;
  } | null {
    let maxMealType: MealType | null = null;
    let maxTotal = 0;

    Object.entries(mealStats).forEach(([mealType, stats]) => {
      if (stats.total > maxTotal) {
        maxTotal = stats.total;
        maxMealType = mealType as MealType;
      }
    });

    if (!maxMealType) return null;

    return {
      mealType: maxMealType,
      total: maxTotal,
      label: MEAL_LABELS[maxMealType],
    };
  }

  /**
   * Obtém o tipo de refeição com maior número de aplicações
   */
  static getMostFrequentMealType(mealStats: Record<MealType, MealStats>): {
    mealType: MealType;
    count: number;
    label: string;
  } | null {
    let maxMealType: MealType | null = null;
    let maxCount = 0;

    Object.entries(mealStats).forEach(([mealType, stats]) => {
      if (stats.count > maxCount) {
        maxCount = stats.count;
        maxMealType = mealType as MealType;
      }
    });

    if (!maxMealType) return null;

    return {
      mealType: maxMealType,
      count: maxCount,
      label: MEAL_LABELS[maxMealType],
    };
  }

  /**
   * Calcula estatísticas agregadas de todas as refeições
   */
  static calculateAggregateStats(mealStats: Record<MealType, MealStats>): {
    totalBolus: number;
    totalApplications: number;
    overallAverage: number;
    activeMealTypes: number;
  } {
    const stats = Object.values(mealStats);

    const totalBolus = stats.reduce((sum, meal) => sum + meal.total, 0);
    const totalApplications = stats.reduce((sum, meal) => sum + meal.count, 0);
    const activeMealTypes = stats.filter(meal => meal.count > 0).length;

    return {
      totalBolus: this.roundToTwoDecimals(totalBolus),
      totalApplications,
      overallAverage:
        totalApplications > 0
          ? this.roundToTwoDecimals(totalBolus / totalApplications)
          : 0,
      activeMealTypes,
    };
  }

  /**
   * Gera dados para gráfico de barras (bolus por refeição)
   */
  static generateChartData(mealStats: Record<MealType, MealStats>): Array<{
    x: string;
    y: number;
    label: string;
  }> {
    return Object.entries(mealStats)
      .filter(([_, stats]) => stats.total > 0) // Apenas refeições com dados
      .map(([mealType, stats]) => ({
        x: MEAL_LABELS[mealType as MealType],
        y: stats.total,
        label: `${stats.total}U (${stats.count}x)`,
      }))
      .sort((a, b) => b.y - a.y); // Ordenar por total decrescente
  }

  /**
   * Valida se uma entrada de bolus é válida
   */
  private static isValidBolusEntry(entry: any): boolean {
    return (
      entry &&
      typeof entry.units === 'number' &&
      entry.units > 0 &&
      entry.mealType &&
      Object.keys(MEAL_LABELS).includes(entry.mealType)
    );
  }

  /**
   * Arredonda número para duas casas decimais
   */
  private static roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * Gera relatório textual das análises
   */
  static generateTextReport(mealStats: Record<MealType, MealStats>): string {
    const mostActive = this.getMostActiveMealType(mealStats);
    const mostFrequent = this.getMostFrequentMealType(mealStats);
    const aggregate = this.calculateAggregateStats(mealStats);

    let report = `📊 Análise de Bolus por Refeição:\n`;
    report += `• Total: ${aggregate.totalBolus}U em ${aggregate.totalApplications} aplicações\n`;
    report += `• Média geral: ${aggregate.overallAverage}U por aplicação\n`;
    report += `• Tipos ativos: ${aggregate.activeMealTypes}/${
      Object.keys(MEAL_LABELS).length
    }\n`;

    if (mostActive) {
      report += `• Maior volume: ${mostActive.label} (${mostActive.total}U)\n`;
    }

    if (mostFrequent) {
      report += `• Mais frequente: ${mostFrequent.label} (${mostFrequent.count} aplicações)\n`;
    }

    // Detalhar cada tipo de refeição
    report += `\nDetalhamento por refeição:\n`;
    Object.entries(mealStats).forEach(([mealType, stats]) => {
      if (stats.count > 0) {
        const label = MEAL_LABELS[mealType as MealType];
        report += `• ${label}: ${stats.total}U (${stats.average}U/aplicação, ${stats.count}x)\n`;
      }
    });

    return report;
  }

  /**
   * Identifica padrões anômalos nas refeições
   */
  static detectAnomalies(mealStats: Record<MealType, MealStats>): Array<{
    type: 'high_dose' | 'low_frequency' | 'irregular_pattern';
    mealType: MealType;
    message: string;
  }> {
    const anomalies: Array<{
      type: 'high_dose' | 'low_frequency' | 'irregular_pattern';
      mealType: MealType;
      message: string;
    }> = [];

    const aggregate = this.calculateAggregateStats(mealStats);

    Object.entries(mealStats).forEach(([mealType, stats]) => {
      if (stats.count === 0) return;

      const mealTypeKey = mealType as MealType;
      const label = MEAL_LABELS[mealTypeKey];

      // Detectar doses altas (acima de 2x a média geral)
      if (stats.average > aggregate.overallAverage * 2) {
        anomalies.push({
          type: 'high_dose',
          mealType: mealTypeKey,
          message: `${label}: Dose média alta (${stats.average}U vs ${aggregate.overallAverage}U geral)`,
        });
      }

      // Detectar baixa frequência em refeições principais
      const mainMeals: MealType[] = ['breakfast', 'lunch', 'dinner'];
      if (mainMeals.includes(mealTypeKey) && stats.count < 5) {
        anomalies.push({
          type: 'low_frequency',
          mealType: mealTypeKey,
          message: `${label}: Baixa frequência de registros (${stats.count} aplicações)`,
        });
      }
    });

    return anomalies;
  }
}
