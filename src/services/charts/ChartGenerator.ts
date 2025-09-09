import { DailyLog } from '../../types';
import {
  AdvancedStatistics,
  ChartData,
  LineDataPoint,
  BarDataPoint,
  PieDataPoint,
} from '../../types/statistics';
import { FallbackChartGenerator } from './FallbackChartGenerator';
import { ChartSVGExporter } from './ChartSVGExporter';
import { LineChartConfigFactory } from './chartTypes/LineChartConfig';
import { BarChartConfigFactory } from './chartTypes/BarChartConfig';
import { PieChartConfigFactory } from './chartTypes/PieChartConfig';
import { MEAL_LABELS } from '../../constants/mealTypes';
import { formatGlucoseValue, formatInsulinUnits } from '../../utils/formatters';

/**
 * Gerador Principal de Gráficos para Relatórios PDF
 *
 * Responsável por coordenar a geração de todos os gráficos do dashboard,
 * processando dados das estatísticas avançadas e convertendo para SVG.
 */
export class ChartGenerator {
  private exporter: ChartSVGExporter;

  constructor() {
    this.exporter = new ChartSVGExporter();
  }

  /**
   * Gera todos os gráficos para o dashboard PDF
   */
  async generateAllCharts(
    statistics: AdvancedStatistics,
    logs: DailyLog[],
  ): Promise<ChartData[]> {
    console.log(`📈 [ChartGenerator] Generating all charts for dashboard`);
    console.log(`📈 [ChartGenerator] Processing ${logs.length} logs`);

    const charts: ChartData[] = [];

    try {
      // 1. Gráfico de evolução da glicose (linha)
      console.log(`📈 [ChartGenerator] Generating glucose evolution chart...`);
      const glucoseChart = await this.generateGlucoseEvolutionChart(logs);
      if (glucoseChart) charts.push(glucoseChart);

      // 2. Gráfico de bolus por refeição (barras)
      console.log(`📈 [ChartGenerator] Generating bolus per meal chart...`);
      const bolusChart = await this.generateBolusPerMealChart(
        statistics.bolusPerMealType,
      );
      if (bolusChart) charts.push(bolusChart);

      // 3. Gráfico de cobertura mensal (barras)
      console.log(`📈 [ChartGenerator] Generating coverage chart...`);
      const coverageChart = await this.generateCoverageChart(
        statistics.coverage,
      );
      if (coverageChart) charts.push(coverageChart);

      // 4. Gráfico de atividade por dia da semana (pizza)
      console.log(`📈 [ChartGenerator] Generating weekday activity chart...`);
      const weekdayChart = await this.generateWeekdayChart(
        statistics.weekdayAnalysis,
      );
      if (weekdayChart) charts.push(weekdayChart);

      console.log(
        `✅ [ChartGenerator] Successfully generated ${charts.length} charts`,
      );
      return charts;
    } catch (error: any) {
      console.error(
        `❌ [ChartGenerator] Error generating charts:`,
        error?.message || 'Unknown error',
      );
      // Retornar charts parciais se alguns falharam
      return charts;
    }
  }

  /**
   * Gera gráfico de evolução da glicose média por dia
   */
  private async generateGlucoseEvolutionChart(
    logs: DailyLog[],
  ): Promise<ChartData | null> {
    try {
      if (logs.length === 0) {
        console.warn(`⚠️ [ChartGenerator] No logs for glucose evolution chart`);
        return null;
      }

      // Preparar dados: glicose média por dia do mês
      const data: LineDataPoint[] = [];
      const sortedLogs = logs.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      sortedLogs.forEach(log => {
        if (log.glucoseEntries && log.glucoseEntries.length > 0) {
          const dayOfMonth = new Date(log.date).getDate();
          const averageGlucose =
            log.glucoseEntries.reduce((sum, entry) => sum + entry.value, 0) /
            log.glucoseEntries.length;

          data.push({
            x: dayOfMonth,
            y: Math.round(averageGlucose),
            label: `Dia ${dayOfMonth}: ${formatGlucoseValue(
              Math.round(averageGlucose),
            )}`,
          });
        }
      });

      if (data.length === 0) {
        console.warn(`⚠️ [ChartGenerator] No glucose data found`);
        return null;
      }

      // Renderizar usando fallback SVG generator
      const svgString = FallbackChartGenerator.generateLineChart(
        data,
        'Evolução da Glicose Média',
        {
          width: 400,
          height: 250,
          color: '#ef4444',
        },
      );

      return {
        type: 'line',
        title: 'Evolução da Glicose Média',
        data,
        config: {},
        svgString,
        description: `Evolução da glicose média diária ao longo do mês (${data.length} dias com dados)`,
      };
    } catch (error: any) {
      console.error(
        `❌ [ChartGenerator] Error generating glucose evolution chart:`,
        error?.message || 'Unknown error',
      );
      return null;
    }
  }

  /**
   * Gera gráfico de bolus por tipo de refeição
   */
  private async generateBolusPerMealChart(
    bolusPerMealType: AdvancedStatistics['bolusPerMealType'],
  ): Promise<ChartData | null> {
    try {
      // Preparar dados: apenas refeições com dados
      const data: BarDataPoint[] = [];

      Object.entries(bolusPerMealType).forEach(([mealType, stats]) => {
        if (stats.total > 0) {
          const label = MEAL_LABELS[mealType as keyof typeof MEAL_LABELS];
          data.push({
            x: label,
            y: stats.total,
            label: `${formatInsulinUnits(stats.total)} (${stats.count}x)`,
          });
        }
      });

      if (data.length === 0) {
        console.warn(`⚠️ [ChartGenerator] No bolus data for meal chart`);
        return null;
      }

      // Ordenar por total (maior para menor)
      data.sort((a, b) => b.y - a.y);

      // Renderizar usando fallback SVG generator
      const svgString = FallbackChartGenerator.generateBarChart(
        data,
        'Distribuição de Bolus por Refeição',
        {
          width: 400,
          height: 280,
          colors: [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
            '#06b6d4',
          ],
        },
      );

      return {
        type: 'bar',
        title: 'Distribuição de Bolus por Refeição',
        data,
        config: {},
        svgString,
        description: `Total de bolus aplicado por tipo de refeição (${data.length} categorias)`,
      };
    } catch (error: any) {
      console.error(
        `❌ [ChartGenerator] Error generating bolus per meal chart:`,
        error?.message || 'Unknown error',
      );
      return null;
    }
  }

  /**
   * Gera gráfico de cobertura mensal (dias com/sem registros)
   */
  private async generateCoverageChart(
    coverage: AdvancedStatistics['coverage'],
  ): Promise<ChartData | null> {
    try {
      if (coverage.totalDaysInMonth === 0) {
        console.warn(`⚠️ [ChartGenerator] No coverage data available`);
        return null;
      }

      // Preparar dados para gráfico de cobertura
      const coverageData: Array<{ day: number; hasRecord: boolean }> = [];

      // Criar dados para cada dia do mês
      for (let day = 1; day <= coverage.totalDaysInMonth; day++) {
        const hasRecord = !coverage.missingDays.includes(day);
        coverageData.push({
          day,
          hasRecord,
        });
      }

      // Renderizar usando fallback SVG generator
      const svgString = FallbackChartGenerator.generateCoverageChart(
        coverageData,
        'Cobertura de Registros do Mês',
        {
          width: 400,
          height: 180,
        },
      );

      const data: BarDataPoint[] = coverageData.map(item => ({
        x: item.day.toString(),
        y: item.hasRecord ? 1 : 0,
        fill: item.hasRecord ? '#22c55e' : '#ef4444',
        label: item.hasRecord ? 'Com registro' : 'Sem registro',
      }));

      return {
        type: 'bar',
        title: 'Cobertura de Registros do Mês',
        data,
        config: {},
        svgString,
        description: `Cobertura diária: ${coverage.coveragePercentage}% (${coverage.daysWithRecords}/${coverage.totalDaysInMonth} dias)`,
      };
    } catch (error: any) {
      console.error(
        `❌ [ChartGenerator] Error generating coverage chart:`,
        error?.message || 'Unknown error',
      );
      return null;
    }
  }

  /**
   * Gera gráfico de distribuição por dia da semana
   */
  private async generateWeekdayChart(
    weekdayAnalysis: AdvancedStatistics['weekdayAnalysis'],
  ): Promise<ChartData | null> {
    try {
      // Preparar dados para gráfico de barras horizontais
      const data: BarDataPoint[] = [];

      Object.entries(weekdayAnalysis.recordsPerWeekday).forEach(
        ([weekdayNum, count]) => {
          if (count > 0) {
            const weekdayName =
              weekdayAnalysis.weekdayNames[parseInt(weekdayNum)];
            data.push({
              x: weekdayName,
              y: count,
              label: `${weekdayName}: ${count}`,
            });
          }
        },
      );

      if (data.length === 0) {
        console.warn(`⚠️ [ChartGenerator] No weekday data available`);
        return null;
      }

      // Ordenar por quantidade (maior para menor)
      data.sort((a, b) => b.y - a.y);

      // Renderizar usando fallback SVG generator com proporção horizontal
      const svgString = FallbackChartGenerator.generateBarChart(
        data,
        'Distribuição de Registros por Dia da Semana',
        {
          width: 480, // Mais largo
          height: 280, // Menos alto
          isInsulinData: false, // São contadores, não insulina
          colors: [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
            '#06b6d4',
            '#f97316',
          ],
        },
      );

      const totalRecords = data.reduce((sum, item) => sum + item.y, 0);

      return {
        type: 'bar',
        title: 'Distribuição de Registros por Dia da Semana',
        data,
        config: {},
        svgString,
        description: `Distribuição de ${totalRecords} registros ao longo da semana`,
      };
    } catch (error: any) {
      console.error(
        `❌ [ChartGenerator] Error generating weekday chart:`,
        error?.message || 'Unknown error',
      );
      return null;
    }
  }

  /**
   * Gera gráfico customizado baseado em tipo e dados
   */
  async generateCustomChart(
    type: 'line' | 'bar' | 'pie',
    data: any[],
    title: string,
    description?: string,
  ): Promise<ChartData | null> {
    try {
      console.log(
        `📈 [ChartGenerator] Generating custom ${type} chart: ${title}`,
      );

      let config: any;
      let svgString: string;

      switch (type) {
        case 'line':
          config = {};
          svgString = FallbackChartGenerator.generateLineChart(
            data as LineDataPoint[],
            title,
            { width: 300, height: 200 },
          );
          break;

        case 'bar':
          config = {};
          svgString = FallbackChartGenerator.generateBarChart(
            data as BarDataPoint[],
            title,
            { width: 300, height: 200 },
          );
          break;

        case 'pie':
          config = {};
          svgString = FallbackChartGenerator.generatePieChart(
            data as PieDataPoint[],
            title,
            { width: 300, height: 200 },
          );
          break;

        default:
          throw new Error(`Unsupported chart type: ${type}`);
      }

      return {
        type,
        title,
        data,
        config,
        svgString,
        description,
      };
    } catch (error: any) {
      console.error(
        `❌ [ChartGenerator] Error generating custom chart:`,
        error?.message || 'Unknown error',
      );
      return null;
    }
  }

  /**
   * Valida dados de entrada antes da geração
   */
  static validateChartData(data: any[], type: 'line' | 'bar' | 'pie'): boolean {
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }

    // Validação específica por tipo
    switch (type) {
      case 'line':
        return data.every(
          item => typeof item.x !== 'undefined' && typeof item.y === 'number',
        );

      case 'bar':
        return data.every(
          item => typeof item.x === 'string' && typeof item.y === 'number',
        );

      case 'pie':
        return data.every(
          item =>
            typeof item.x === 'string' &&
            typeof item.y === 'number' &&
            item.y > 0,
        );

      default:
        return false;
    }
  }

  /**
   * Processa dados para otimizar visualização
   */
  static optimizeDataForVisualization(
    data: any[],
    type: 'line' | 'bar' | 'pie',
    maxPoints = 30,
  ): any[] {
    if (data.length <= maxPoints) {
      return data;
    }

    console.log(
      `📈 [ChartGenerator] Optimizing ${data.length} data points to ${maxPoints} for ${type} chart`,
    );

    switch (type) {
      case 'line':
        // Para gráficos de linha, fazer sampling uniforme
        const step = Math.ceil(data.length / maxPoints);
        return data.filter((_, index) => index % step === 0);

      case 'bar':
      case 'pie':
        // Para barras/pizza, manter os maiores valores
        return data.sort((a, b) => b.y - a.y).slice(0, maxPoints);

      default:
        return data.slice(0, maxPoints);
    }
  }

  /**
   * Gera resumo de todos os gráficos gerados
   */
  static generateChartsSummary(charts: ChartData[]): string {
    let summary = `📈 Dashboard de Gráficos:\n`;
    summary += `• ${charts.length} gráficos gerados\n\n`;

    charts.forEach((chart, index) => {
      summary += `${index + 1}. ${chart.title}\n`;
      summary += `   Tipo: ${chart.type.toUpperCase()}\n`;
      summary += `   Dados: ${chart.data.length} pontos\n`;
      if (chart.description) {
        summary += `   ${chart.description}\n`;
      }
      summary += '\n';
    });

    return summary;
  }
}
