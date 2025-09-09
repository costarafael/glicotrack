import { DailyLog } from '../../types';
import { WeekdayAnalysis } from '../../types/statistics';

/**
 * Analisador de Cohort para Padrões de Dias da Semana
 *
 * Analisa padrões de registros agrupados por dia da semana, identificando
 * tendências de comportamento e dias mais/menos ativos.
 */
export class CohortAnalyzer {

  // Nomes dos dias da semana em português (0 = Domingo)
  private static readonly WEEKDAY_NAMES: Record<number, string> = {
    0: 'Domingo',
    1: 'Segunda-feira',
    2: 'Terça-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'Sábado',
  };

  // Versões curtas dos nomes
  private static readonly WEEKDAY_NAMES_SHORT: Record<number, string> = {
    0: 'Dom',
    1: 'Seg',
    2: 'Ter',
    3: 'Qua',
    4: 'Qui',
    5: 'Sex',
    6: 'Sáb',
  };

  /**
   * Analisa padrões de registros por dia da semana
   */
  static analyzeWeekdays(logs: DailyLog[]): WeekdayAnalysis {
    console.log(`📅 [CohortAnalyzer] Analyzing weekday patterns for ${logs.length} daily logs`);

    try {
      // Inicializar contadores para todos os dias da semana
      const recordsPerWeekday: Record<number, number> = {
        0: 0, // Domingo
        1: 0, // Segunda
        2: 0, // Terça
        3: 0, // Quarta
        4: 0, // Quinta
        5: 0, // Sexta
        6: 0, // Sábado
      };

      // Validar e processar logs
      const validLogs = this.validateLogs(logs);

      if (validLogs.length === 0) {
        console.warn(`⚠️ [CohortAnalyzer] No valid logs found`);
        return this.getEmptyWeekdayAnalysis();
      }

      // Contar registros por dia da semana
      validLogs.forEach(log => {
        try {
          const logDate = new Date(log.date);

          // Verificar se a data é válida
          if (isNaN(logDate.getTime())) {
            console.warn(`⚠️ [CohortAnalyzer] Invalid date found: ${log.date}`);
            return;
          }

          const weekday = logDate.getDay(); // 0 = Domingo, 6 = Sábado

          // Contar baseado no peso do registro (quantos tipos de dados tem)
          const recordWeight = this.calculateRecordWeight(log);
          recordsPerWeekday[weekday] += recordWeight;

        } catch (error: any) {
          console.error(`❌ [CohortAnalyzer] Error processing log date:`, error?.message || 'Unknown error');
        }
      });

      // Encontrar dias mais e menos ativos
      const mostActiveWeekday = this.findMostActiveWeekday(recordsPerWeekday);
      const leastActiveWeekday = this.findLeastActiveWeekday(recordsPerWeekday);

      const result: WeekdayAnalysis = {
        recordsPerWeekday,
        mostActiveWeekday,
        leastActiveWeekday,
        weekdayNames: this.WEEKDAY_NAMES,
      };

      // Log dos resultados
      const totalRecords = Object.values(recordsPerWeekday).reduce((sum, count) => sum + count, 0);
      console.log(`✅ [CohortAnalyzer] Weekday analysis complete:`);
      console.log(`📊 [CohortAnalyzer] Total weighted records: ${totalRecords}`);
      console.log(`📊 [CohortAnalyzer] Most active: ${this.WEEKDAY_NAMES[mostActiveWeekday]} (${recordsPerWeekday[mostActiveWeekday]})`);
      console.log(`📊 [CohortAnalyzer] Least active: ${this.WEEKDAY_NAMES[leastActiveWeekday]} (${recordsPerWeekday[leastActiveWeekday]})`);

      return result;

    } catch (error: any) {
      console.error(`❌ [CohortAnalyzer] Error analyzing weekday patterns:`, error?.message || 'Unknown error');
      return this.getEmptyWeekdayAnalysis();
    }
  }

  /**
   * Gera dados para gráfico de barras dos dias da semana
   */
  static generateWeekdayChartData(weekdayAnalysis: WeekdayAnalysis, useShortNames = false): Array<{
    x: string;
    y: number;
    fill: string;
    label: string;
  }> {
    const colors = [
      '#ef4444', // Dom - Vermelho
      '#3b82f6', // Seg - Azul
      '#10b981', // Ter - Verde
      '#f59e0b', // Qua - Amarelo
      '#8b5cf6', // Qui - Roxo
      '#06b6d4', // Sex - Ciano
      '#f97316', // Sáb - Laranja
    ];

    const nameMap = useShortNames ? this.WEEKDAY_NAMES_SHORT : this.WEEKDAY_NAMES;

    return Object.entries(weekdayAnalysis.recordsPerWeekday)
      .map(([weekday, count]) => {
        const weekdayNum = parseInt(weekday);
        return {
          x: nameMap[weekdayNum],
          y: count,
          fill: colors[weekdayNum],
          label: `${count} registros`,
        };
      })
      .sort((a, b) => {
        // Ordenar por dia da semana (Dom, Seg, Ter, etc.)
        const aIndex = Object.keys(nameMap).find(key => nameMap[parseInt(key)] === a.x);
        const bIndex = Object.keys(nameMap).find(key => nameMap[parseInt(key)] === b.x);
        return parseInt(aIndex || '0') - parseInt(bIndex || '0');
      });
  }

  /**
   * Analisa padrões de fins de semana vs dias úteis
   */
  static analyzeWeekendVsWeekdays(weekdayAnalysis: WeekdayAnalysis): {
    weekdaysTotal: number;
    weekendTotal: number;
    weekdaysAverage: number;
    weekendAverage: number;
    preference: 'weekdays' | 'weekend' | 'balanced';
    ratio: number;
  } {
    const { recordsPerWeekday } = weekdayAnalysis;

    // Dias úteis (Segunda a Sexta)
    const weekdaysTotal = recordsPerWeekday[1] + recordsPerWeekday[2] +
                         recordsPerWeekday[3] + recordsPerWeekday[4] +
                         recordsPerWeekday[5];

    // Fim de semana (Sábado e Domingo)
    const weekendTotal = recordsPerWeekday[0] + recordsPerWeekday[6];

    const weekdaysAverage = weekdaysTotal / 5; // 5 dias úteis
    const weekendAverage = weekendTotal / 2;   // 2 dias de fim de semana

    // Calcular preferência
    let preference: 'weekdays' | 'weekend' | 'balanced';
    const ratio = weekdaysAverage / (weekendAverage || 1);

    if (ratio > 1.5) {
      preference = 'weekdays';
    } else if (ratio < 0.67) {
      preference = 'weekend';
    } else {
      preference = 'balanced';
    }

    return {
      weekdaysTotal,
      weekendTotal,
      weekdaysAverage: Math.round(weekdaysAverage * 10) / 10,
      weekendAverage: Math.round(weekendAverage * 10) / 10,
      preference,
      ratio: Math.round(ratio * 100) / 100,
    };
  }

  /**
   * Identifica padrões anômalos nos dias da semana
   */
  static detectWeekdayAnomalies(weekdayAnalysis: WeekdayAnalysis): Array<{
    type: 'low_activity' | 'high_variation' | 'weekend_gap';
    weekday?: number;
    message: string;
  }> {
    const anomalies: Array<{
      type: 'low_activity' | 'high_variation' | 'weekend_gap';
      weekday?: number;
      message: string;
    }> = [];

    const records = Object.values(weekdayAnalysis.recordsPerWeekday);
    const totalRecords = records.reduce((sum, count) => sum + count, 0);

    if (totalRecords === 0) return anomalies;

    const averageRecords = totalRecords / 7;
    const weekendAnalysis = this.analyzeWeekendVsWeekdays(weekdayAnalysis);

    // Detectar dias com atividade muito baixa
    Object.entries(weekdayAnalysis.recordsPerWeekday).forEach(([weekday, count]) => {
      const weekdayNum = parseInt(weekday);
      if (count < averageRecords * 0.3 && totalRecords > 10) {
        anomalies.push({
          type: 'low_activity',
          weekday: weekdayNum,
          message: `${this.WEEKDAY_NAMES[weekdayNum]} tem atividade muito baixa (${count} vs ${averageRecords.toFixed(1)} média)`,
        });
      }
    });

    // Detectar alta variação entre dias
    const standardDeviation = this.calculateStandardDeviation(records);
    if (standardDeviation > averageRecords * 0.8 && totalRecords > 20) {
      anomalies.push({
        type: 'high_variation',
        message: `Alta variação entre dias da semana (desvio: ${standardDeviation.toFixed(1)})`,
      });
    }

    // Detectar gap significativo nos fins de semana
    if (weekendAnalysis.preference === 'weekdays' && weekendAnalysis.ratio > 3) {
      anomalies.push({
        type: 'weekend_gap',
        message: `Registros muito baixos nos fins de semana (${weekendAnalysis.weekendAverage.toFixed(1)} vs ${weekendAnalysis.weekdaysAverage.toFixed(1)} dias úteis)`,
      });
    }

    return anomalies;
  }

  /**
   * Calcula o peso de um registro baseado na quantidade de dados
   */
  private static calculateRecordWeight(log: DailyLog): number {
    let weight = 0;

    // Peso por glicose (0.5 por entrada)
    if (log.glucoseEntries && log.glucoseEntries.length > 0) {
      weight += log.glucoseEntries.length * 0.5;
    }

    // Peso por bolus (0.3 por entrada)
    if (log.bolusEntries && log.bolusEntries.length > 0) {
      weight += log.bolusEntries.length * 0.3;
    }

    // Peso por basal (0.2)
    if (log.basalEntry && log.basalEntry.units > 0) {
      weight += 0.2;
    }

    // Peso mínimo de 1 para qualquer log válido
    return Math.max(weight, 1);
  }

  /**
   * Encontra o dia da semana mais ativo
   */
  private static findMostActiveWeekday(recordsPerWeekday: Record<number, number>): number {
    let maxWeekday = 0;
    let maxRecords = recordsPerWeekday[0];

    Object.entries(recordsPerWeekday).forEach(([weekday, count]) => {
      if (count > maxRecords) {
        maxRecords = count;
        maxWeekday = parseInt(weekday);
      }
    });

    return maxWeekday;
  }

  /**
   * Encontra o dia da semana menos ativo
   */
  private static findLeastActiveWeekday(recordsPerWeekday: Record<number, number>): number {
    let minWeekday = 0;
    let minRecords = recordsPerWeekday[0];

    Object.entries(recordsPerWeekday).forEach(([weekday, count]) => {
      if (count < minRecords) {
        minRecords = count;
        minWeekday = parseInt(weekday);
      }
    });

    return minWeekday;
  }

  /**
   * Valida logs de entrada
   */
  private static validateLogs(logs: DailyLog[]): DailyLog[] {
    if (!Array.isArray(logs)) {
      console.warn(`⚠️ [CohortAnalyzer] Logs is not an array, treating as empty`);
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
   * Calcula desvio padrão
   */
  private static calculateStandardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;

    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - average, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / (values.length - 1);

    return Math.sqrt(variance);
  }

  /**
   * Retorna análise vazia para casos de erro
   */
  private static getEmptyWeekdayAnalysis(): WeekdayAnalysis {
    return {
      recordsPerWeekday: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      mostActiveWeekday: 0,
      leastActiveWeekday: 0,
      weekdayNames: this.WEEKDAY_NAMES,
    };
  }

  /**
   * Gera relatório textual dos padrões de dias da semana
   */
  static generateTextReport(weekdayAnalysis: WeekdayAnalysis): string {
    const weekendAnalysis = this.analyzeWeekendVsWeekdays(weekdayAnalysis);
    const anomalies = this.detectWeekdayAnomalies(weekdayAnalysis);

    let report = `📅 Análise de Padrões Semanais:\n`;

    // Dias mais/menos ativos
    report += `• Mais ativo: ${weekdayAnalysis.weekdayNames[weekdayAnalysis.mostActiveWeekday]} `;
    report += `(${weekdayAnalysis.recordsPerWeekday[weekdayAnalysis.mostActiveWeekday]} registros)\n`;

    report += `• Menos ativo: ${weekdayAnalysis.weekdayNames[weekdayAnalysis.leastActiveWeekday]} `;
    report += `(${weekdayAnalysis.recordsPerWeekday[weekdayAnalysis.leastActiveWeekday]} registros)\n`;

    // Análise fim de semana vs dias úteis
    report += `• Padrão: `;
    switch (weekendAnalysis.preference) {
      case 'weekdays':
        report += `Mais ativo em dias úteis (${weekendAnalysis.weekdaysAverage} vs ${weekendAnalysis.weekendAverage})\n`;
        break;
      case 'weekend':
        report += `Mais ativo nos fins de semana (${weekendAnalysis.weekendAverage} vs ${weekendAnalysis.weekdaysAverage})\n`;
        break;
      case 'balanced':
        report += `Equilibrado entre dias úteis e fins de semana\n`;
        break;
    }

    // Detalhamento por dia
    report += `\nRegistros por dia:\n`;
    Object.entries(weekdayAnalysis.recordsPerWeekday).forEach(([weekday, count]) => {
      const weekdayNum = parseInt(weekday);
      const name = weekdayAnalysis.weekdayNames[weekdayNum];
      report += `• ${name}: ${count}\n`;
    });

    // Anomalias detectadas
    if (anomalies.length > 0) {
      report += `\nPadrões identificados:\n`;
      anomalies.forEach(anomaly => {
        report += `• ${anomaly.message}\n`;
      });
    }

    return report;
  }
}
