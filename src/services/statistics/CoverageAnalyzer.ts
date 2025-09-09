import { DailyLog } from '../../types';
import { CoverageAnalysis } from '../../types/statistics';

/**
 * Analisador de Cobertura para Registros Mensais
 *
 * Analisa padrões de cobertura mensal, identificando dias com/sem registros,
 * calculando percentuais e detectando gaps na documentação.
 */
export class CoverageAnalyzer {

  /**
   * Analisa a cobertura de registros para um mês específico
   */
  static analyzeCoverage(logs: DailyLog[], month: number, year: number): CoverageAnalysis {
    console.log(`📋 [CoverageAnalyzer] Analyzing coverage for ${year}-${String(month).padStart(2, '0')}`);

    try {
      // Validar parâmetros
      if (!this.isValidDateParams(month, year)) {
        console.error(`❌ [CoverageAnalyzer] Invalid date parameters: month=${month}, year=${year}`);
        return this.getEmptyCoverageAnalysis();
      }

      // Calcular total de dias no mês
      const totalDaysInMonth = new Date(year, month, 0).getDate();
      console.log(`📅 [CoverageAnalyzer] Month has ${totalDaysInMonth} days total`);

      // Filtrar e validar logs
      const validLogs = this.validateAndFilterLogs(logs);
      const daysWithRecords = validLogs.length;

      // Obter dias que têm registros
      const recordedDays = this.extractRecordedDays(validLogs, month, year);

      // Identificar dias sem registros
      const missingDays = this.calculateMissingDays(recordedDays, totalDaysInMonth);

      // Calcular percentual de cobertura
      const coveragePercentage = this.calculateCoveragePercentage(daysWithRecords, totalDaysInMonth);

      // Calcular maior sequência consecutiva
      const consecutiveDays = this.calculateLongestConsecutiveSequence(recordedDays, totalDaysInMonth);

      const result: CoverageAnalysis = {
        daysWithRecords,
        totalDaysInMonth,
        coveragePercentage,
        missingDays: missingDays.sort((a, b) => a - b), // Ordenar crescente
        consecutiveDays,
      };

      console.log(`✅ [CoverageAnalyzer] Coverage analysis complete:`);
      console.log(`📊 [CoverageAnalyzer] ${daysWithRecords}/${totalDaysInMonth} days (${coveragePercentage}%)`);
      console.log(`📊 [CoverageAnalyzer] Missing days: ${missingDays.length}, Longest sequence: ${consecutiveDays}`);

      return result;

    } catch (error: any) {
      console.error(`❌ [CoverageAnalyzer] Error analyzing coverage:`, error?.message || 'Unknown error');
      return this.getEmptyCoverageAnalysis();
    }
  }

  /**
   * Avalia a qualidade da cobertura mensal
   */
  static evaluateCoverageQuality(coverage: CoverageAnalysis): {
    level: 'excellent' | 'good' | 'fair' | 'poor';
    message: string;
    recommendations: string[];
  } {
    const percentage = coverage.coveragePercentage;
    let level: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;
    const recommendations: string[] = [];

    if (percentage >= 90) {
      level = 'excellent';
      message = 'Excelente cobertura de registros! Parabéns pela consistência.';
    } else if (percentage >= 70) {
      level = 'good';
      message = 'Boa cobertura de registros, mas há espaço para melhoria.';
      recommendations.push('Tente registrar dados nos dias que faltaram');
    } else if (percentage >= 50) {
      level = 'fair';
      message = 'Cobertura moderada. Registros mais frequentes ajudariam no controle.';
      recommendations.push('Configure lembretes para registros diários');
      recommendations.push('Identifique padrões nos dias sem registros');
    } else {
      level = 'poor';
      message = 'Baixa cobertura de registros. Mais dados são importantes para o controle.';
      recommendations.push('Estabeleça uma rotina de registros diários');
      recommendations.push('Use os lembretes do aplicativo');
      recommendations.push('Registre pelo menos glicose ou insulina diariamente');
    }

    // Recomendações específicas baseadas em padrões
    if (coverage.missingDays.length > 0) {
      const missingWeekends = this.countWeekendDays(coverage.missingDays, new Date().getFullYear(), new Date().getMonth() + 1);
      if (missingWeekends > coverage.missingDays.length * 0.6) {
        recommendations.push('Observe que muitos dias perdidos são fins de semana');
      }
    }

    if (coverage.consecutiveDays < 3 && coverage.daysWithRecords > 5) {
      recommendations.push('Tente manter registros consecutivos para melhor acompanhamento');
    }

    return { level, message, recommendations };
  }

  /**
   * Gera dados para gráfico de cobertura mensal
   */
  static generateCoverageChartData(coverage: CoverageAnalysis, month: number, year: number): Array<{
    x: number;
    y: number;
    hasRecord: boolean;
    label: string;
  }> {
    const data: Array<{
      x: number;
      y: number;
      hasRecord: boolean;
      label: string;
    }> = [];

    for (let day = 1; day <= coverage.totalDaysInMonth; day++) {
      const hasRecord = !coverage.missingDays.includes(day);
      const date = new Date(year, month - 1, day);
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });

      data.push({
        x: day,
        y: hasRecord ? 1 : 0,
        hasRecord,
        label: `${day} (${dayName})`,
      });
    }

    return data;
  }

  /**
   * Identifica gaps (períodos sem registros) no mês
   */
  static identifyGaps(coverage: CoverageAnalysis): Array<{
    startDay: number;
    endDay: number;
    duration: number;
    type: 'short' | 'medium' | 'long';
  }> {
    if (coverage.missingDays.length === 0) return [];

    const gaps: Array<{
      startDay: number;
      endDay: number;
      duration: number;
      type: 'short' | 'medium' | 'long';
    }> = [];

    const sortedMissingDays = [...coverage.missingDays].sort((a, b) => a - b);
    let gapStart = sortedMissingDays[0];
    let gapEnd = sortedMissingDays[0];

    for (let i = 1; i < sortedMissingDays.length; i++) {
      const currentDay = sortedMissingDays[i];
      const previousDay = sortedMissingDays[i - 1];

      if (currentDay === previousDay + 1) {
        // Dia consecutivo, expandir gap atual
        gapEnd = currentDay;
      } else {
        // Gap quebrado, finalizar gap atual
        const duration = gapEnd - gapStart + 1;
        gaps.push({
          startDay: gapStart,
          endDay: gapEnd,
          duration,
          type: duration <= 2 ? 'short' : duration <= 5 ? 'medium' : 'long',
        });

        // Iniciar novo gap
        gapStart = currentDay;
        gapEnd = currentDay;
      }
    }

    // Adicionar último gap
    const duration = gapEnd - gapStart + 1;
    gaps.push({
      startDay: gapStart,
      endDay: gapEnd,
      duration,
      type: duration <= 2 ? 'short' : duration <= 5 ? 'medium' : 'long',
    });

    return gaps;
  }

  /**
   * Valida parâmetros de data
   */
  private static isValidDateParams(month: number, year: number): boolean {
    return (
      typeof month === 'number' &&
      typeof year === 'number' &&
      month >= 1 &&
      month <= 12 &&
      year >= 2000 &&
      year <= 2100
    );
  }

  /**
   * Valida e filtra logs válidos
   */
  private static validateAndFilterLogs(logs: DailyLog[]): DailyLog[] {
    if (!Array.isArray(logs)) {
      console.warn(`⚠️ [CoverageAnalyzer] Logs is not an array, treating as empty`);
      return [];
    }

    return logs.filter(log => {
      if (!log || !log.date) return false;

      // Log deve ter pelo menos uma entrada válida
      const hasGlucose = log.glucoseEntries && log.glucoseEntries.length > 0;
      const hasBolus = log.bolusEntries && log.bolusEntries.length > 0;
      const hasBasal = log.basalEntry && log.basalEntry.units > 0;

      return hasGlucose || hasBolus || hasBasal;
    });
  }

  /**
   * Extrai dias que têm registros válidos
   */
  private static extractRecordedDays(logs: DailyLog[], month: number, year: number): Set<number> {
    const recordedDays = new Set<number>();

    logs.forEach(log => {
      try {
        const logDate = new Date(log.date);

        // Verificar se o log pertence ao mês/ano correto
        if (logDate.getFullYear() === year && (logDate.getMonth() + 1) === month) {
          recordedDays.add(logDate.getDate());
        }
      } catch (error: any) {
        console.warn(`⚠️ [CoverageAnalyzer] Invalid log date: ${log.date}`, error?.message || 'Unknown error');
      }
    });

    return recordedDays;
  }

  /**
   * Calcula dias sem registros
   */
  private static calculateMissingDays(recordedDays: Set<number>, totalDaysInMonth: number): number[] {
    const missingDays: number[] = [];

    for (let day = 1; day <= totalDaysInMonth; day++) {
      if (!recordedDays.has(day)) {
        missingDays.push(day);
      }
    }

    return missingDays;
  }

  /**
   * Calcula percentual de cobertura
   */
  private static calculateCoveragePercentage(daysWithRecords: number, totalDaysInMonth: number): number {
    if (totalDaysInMonth === 0) return 0;
    return Math.round((daysWithRecords / totalDaysInMonth) * 100);
  }

  /**
   * Calcula maior sequência consecutiva de dias com registros
   */
  private static calculateLongestConsecutiveSequence(recordedDays: Set<number>, totalDaysInMonth: number): number {
    if (recordedDays.size === 0) return 0;

    let maxSequence = 0;
    let currentSequence = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      if (recordedDays.has(day)) {
        currentSequence++;
        maxSequence = Math.max(maxSequence, currentSequence);
      } else {
        currentSequence = 0;
      }
    }

    return maxSequence;
  }

  /**
   * Conta quantos dias são fins de semana
   */
  private static countWeekendDays(days: number[], year: number, month: number): number {
    return days.filter(day => {
      try {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Domingo ou Sábado
      } catch {
        return false;
      }
    }).length;
  }

  /**
   * Retorna análise vazia para casos de erro
   */
  private static getEmptyCoverageAnalysis(): CoverageAnalysis {
    return {
      daysWithRecords: 0,
      totalDaysInMonth: 0,
      coveragePercentage: 0,
      missingDays: [],
      consecutiveDays: 0,
    };
  }

  /**
   * Gera relatório textual da cobertura
   */
  static generateTextReport(coverage: CoverageAnalysis): string {
    const quality = this.evaluateCoverageQuality(coverage);
    const gaps = this.identifyGaps(coverage);

    let report = `📋 Análise de Cobertura Mensal:\n`;
    report += `• Cobertura: ${coverage.daysWithRecords}/${coverage.totalDaysInMonth} dias (${coverage.coveragePercentage}%)\n`;
    report += `• Qualidade: ${quality.level.toUpperCase()}\n`;
    report += `• Sequência máxima: ${coverage.consecutiveDays} dias consecutivos\n`;

    if (coverage.missingDays.length > 0) {
      report += `• Dias sem registro: ${coverage.missingDays.join(', ')}\n`;
    }

    if (gaps.length > 0) {
      report += `• Gaps identificados: ${gaps.length}\n`;
      gaps.forEach((gap, index) => {
        if (gap.duration > 1) {
          report += `  - Gap ${index + 1}: ${gap.startDay} a ${gap.endDay} (${gap.duration} dias)\n`;
        }
      });
    }

    if (quality.recommendations.length > 0) {
      report += `\nRecomendações:\n`;
      quality.recommendations.forEach(rec => {
        report += `• ${rec}\n`;
      });
    }

    return report;
  }
}
