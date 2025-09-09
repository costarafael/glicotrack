/**
 * MedicalChartsGenerator Service
 * Gerador de gráficos médicos padrão para relatórios
 * Gera dados para gráficos compatíveis com Chart.js e padrões médicos
 */

import { GlucoseEntry, InsulinEntry, GlucoseRangeMetrics, DailyPatternAnalysis } from './GlucoseAnalytics';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }[];
}

export interface AGPData {
  percentiles: {
    p10: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p90: number[];
  };
  hours: string[];
  targetRange: {
    low: number;
    high: number;
  };
}

export class MedicalChartsGenerator {
  
  // Cores padrão médico conforme guidelines
  private static readonly MEDICAL_COLORS = {
    timeInRange: '#00C851',      // Verde - 70-180 mg/dL
    aboveRange: '#ffbb33',       // Amarelo - 180-250 mg/dL  
    belowRange: '#ff4444',       // Vermelho - 54-69 mg/dL
    criticalHigh: '#aa2e25',     // Vermelho escuro - >250 mg/dL
    criticalLow: '#8b0000',      // Vermelho muito escuro - <54 mg/dL
    insulin: '#2E7D32',          // Verde escuro
    glucose: '#1976D2',          // Azul
    baseline: '#E0E0E0'          // Cinza claro
  };

  /**
   * Gera dados para gráfico Time in Range (TIR)
   */
  static generateTimeInRangeChart(metrics: GlucoseRangeMetrics): ChartData {
    return {
      labels: [
        'Muito Baixo\n<54 mg/dL', 
        'Baixo\n54-69 mg/dL', 
        'No Alvo\n70-180 mg/dL', 
        'Alto\n181-250 mg/dL', 
        'Muito Alto\n>250 mg/dL'
      ],
      datasets: [{
        label: 'Tempo nas Faixas (%)',
        data: [
          Math.round(metrics.timeCriticalLow * 10) / 10,
          Math.round(metrics.timeBelowRange * 10) / 10,
          Math.round(metrics.timeInRange * 10) / 10,
          Math.round(metrics.timeAboveRange * 10) / 10,
          Math.round(metrics.timeCriticalHigh * 10) / 10
        ],
        backgroundColor: [
          this.MEDICAL_COLORS.criticalLow,
          this.MEDICAL_COLORS.belowRange,
          this.MEDICAL_COLORS.timeInRange,
          this.MEDICAL_COLORS.aboveRange,
          this.MEDICAL_COLORS.criticalHigh
        ]
      }]
    };
  }

  /**
   * Gera Ambulatory Glucose Profile (AGP) - Padrão internacional
   */
  static generateAGPChart(entries: GlucoseEntry[]): AGPData {
    const hours = Array.from({ length: 24 }, (_, i) => 
      `${i.toString().padStart(2, '0')}:00`
    );

    // Agrupa dados por hora do dia
    const hourlyData: { [hour: number]: number[] } = {};
    
    entries.forEach(entry => {
      const hour = entry.timestamp.getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(entry.value);
    });

    // Calcula percentis para cada hora
    const percentiles = {
      p10: [] as number[],
      p25: [] as number[],
      p50: [] as number[],
      p75: [] as number[],
      p90: [] as number[]
    };

    for (let hour = 0; hour < 24; hour++) {
      const hourValues = hourlyData[hour] || [];
      
      if (hourValues.length === 0) {
        // Se não há dados, usa valores neutros
        percentiles.p10.push(100);
        percentiles.p25.push(110);
        percentiles.p50.push(120);
        percentiles.p75.push(130);
        percentiles.p90.push(140);
      } else {
        const sorted = hourValues.sort((a, b) => a - b);
        percentiles.p10.push(this.calculatePercentile(sorted, 10));
        percentiles.p25.push(this.calculatePercentile(sorted, 25));
        percentiles.p50.push(this.calculatePercentile(sorted, 50));
        percentiles.p75.push(this.calculatePercentile(sorted, 75));
        percentiles.p90.push(this.calculatePercentile(sorted, 90));
      }
    }

    return {
      percentiles,
      hours,
      targetRange: {
        low: 70,
        high: 180
      }
    };
  }

  /**
   * Gera gráfico de tendências diárias
   */
  static generateDailyTrendsChart(patterns: DailyPatternAnalysis): ChartData {
    const periods = ['Madrugada\n(04-08h)', 'Manhã\n(08-12h)', 'Tarde\n(12-18h)', 'Noite\n(18-22h)', 'Sono\n(22-04h)'];
    const averages = [
      patterns.dawn.avg,
      patterns.morning.avg,
      patterns.afternoon.avg,
      patterns.evening.avg,
      patterns.night.avg
    ];

    return {
      labels: periods,
      datasets: [
        {
          label: 'Média Glicêmica (mg/dL)',
          data: averages.map(avg => Math.round(avg)),
          backgroundColor: this.MEDICAL_COLORS.glucose,
          borderColor: this.MEDICAL_COLORS.glucose,
          borderWidth: 2
        },
        {
          label: 'Faixa Alvo (70-180 mg/dL)',
          data: [180, 180, 180, 180, 180],
          backgroundColor: 'rgba(0, 200, 81, 0.1)',
          borderColor: this.MEDICAL_COLORS.timeInRange,
          borderWidth: 1,
          fill: false
        }
      ]
    };
  }

  /**
   * Gera gráfico de padrões de insulina
   */
  static generateInsulinPatternChart(
    insulinEntries: InsulinEntry[], 
    periodDays: number = 7
  ): ChartData {
    // Agrupa por dia
    const dailyInsulin: { [date: string]: { bolus: number; basal: number } } = {};
    
    insulinEntries.forEach(entry => {
      const dateKey = entry.timestamp.toISOString().split('T')[0];
      
      if (!dailyInsulin[dateKey]) {
        dailyInsulin[dateKey] = { bolus: 0, basal: 0 };
      }
      
      if (entry.type === 'bolus') {
        dailyInsulin[dateKey].bolus += entry.value;
      } else {
        dailyInsulin[dateKey].basal += entry.value;
      }
    });

    const dates = Object.keys(dailyInsulin).sort().slice(-periodDays);
    const bolusData = dates.map(date => Math.round(dailyInsulin[date]?.bolus || 0));
    const basalData = dates.map(date => Math.round(dailyInsulin[date]?.basal || 0));
    const labels = dates.map(date => {
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Insulina Bolus (U)',
          data: bolusData,
          backgroundColor: '#1976D2',
          borderColor: '#1976D2'
        },
        {
          label: 'Insulina Basal (U)',
          data: basalData,
          backgroundColor: '#388E3C',
          borderColor: '#388E3C'
        }
      ]
    };
  }

  /**
   * Gera gráfico de timeline de glicose (últimas 24h)
   */
  static generateGlucoseTimelineChart(entries: GlucoseEntry[]): ChartData {
    // Últimas 24 horas
    const last24h = entries.filter(entry => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return entry.timestamp >= yesterday;
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const labels = last24h.map(entry => {
      const time = entry.timestamp;
      return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    });

    const values = last24h.map(entry => entry.value);

    // Pontos coloridos por faixa
    const pointColors = values.map(value => {
      if (value < 54) return this.MEDICAL_COLORS.criticalLow;
      if (value < 70) return this.MEDICAL_COLORS.belowRange;
      if (value <= 180) return this.MEDICAL_COLORS.timeInRange;
      if (value <= 250) return this.MEDICAL_COLORS.aboveRange;
      return this.MEDICAL_COLORS.criticalHigh;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Glicose (mg/dL)',
          data: values,
          borderColor: this.MEDICAL_COLORS.glucose,
          backgroundColor: pointColors,
          borderWidth: 2,
          fill: false
        },
        {
          label: 'Faixa Alvo Superior (180)',
          data: Array(values.length).fill(180),
          borderColor: this.MEDICAL_COLORS.timeInRange,
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false
        },
        {
          label: 'Faixa Alvo Inferior (70)',
          data: Array(values.length).fill(70),
          borderColor: this.MEDICAL_COLORS.timeInRange,
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false
        }
      ]
    };
  }

  /**
   * Gera dados para gráfico de variabilidade glicêmica
   */
  static generateVariabilityChart(entries: GlucoseEntry[], days: number = 7): ChartData {
    // Calcula CV% por dia
    const dailyCV: { [date: string]: number } = {};
    
    // Agrupa por dia
    const dailyEntries: { [date: string]: number[] } = {};
    entries.forEach(entry => {
      const dateKey = entry.timestamp.toISOString().split('T')[0];
      if (!dailyEntries[dateKey]) {
        dailyEntries[dateKey] = [];
      }
      dailyEntries[dateKey].push(entry.value);
    });

    // Calcula CV% para cada dia
    Object.keys(dailyEntries).forEach(date => {
      const values = dailyEntries[date];
      if (values.length > 1) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const sd = Math.sqrt(variance);
        dailyCV[date] = (sd / mean) * 100;
      }
    });

    const dates = Object.keys(dailyCV).sort().slice(-days);
    const cvData = dates.map(date => Math.round(dailyCV[date] * 10) / 10);
    const labels = dates.map(date => {
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    });

    return {
      labels,
      datasets: [
        {
          label: 'CV% (Coeficiente de Variação)',
          data: cvData,
          backgroundColor: this.MEDICAL_COLORS.glucose,
          borderColor: this.MEDICAL_COLORS.glucose,
          borderWidth: 2
        },
        {
          label: 'Meta CV% (<36%)',
          data: Array(cvData.length).fill(36),
          backgroundColor: 'rgba(255, 187, 51, 0.2)',
          borderColor: this.MEDICAL_COLORS.aboveRange,
          borderWidth: 1,
          fill: false
        }
      ]
    };
  }

  /**
   * Gera summary card data para dashboard
   */
  static generateSummaryCards(analysis: any) {
    return {
      averageGlucose: {
        value: `${analysis.glucose.average}`,
        unit: 'mg/dL',
        status: analysis.glucose.average >= 70 && analysis.glucose.average <= 180 ? 'good' : 'warning',
        target: '70-180 mg/dL'
      },
      timeInRange: {
        value: `${Math.round(analysis.glucose.timeInRange.timeInRange)}`,
        unit: '%',
        status: analysis.glucose.timeInRange.timeInRange >= 70 ? 'good' : 'warning',
        target: '>70%'
      },
      variability: {
        value: `${Math.round(analysis.glucose.variability.coefficientOfVariation)}`,
        unit: '%',
        status: analysis.glucose.variability.coefficientOfVariation <= 36 ? 'good' : 'warning',
        target: '<36%'
      },
      totalInsulin: {
        value: `${analysis.insulin.totalDaily}`,
        unit: 'U',
        status: 'neutral',
        target: 'Conforme prescrição'
      },
      gmi: {
        value: `${analysis.riskIndicators.glucoseManagementIndicator}`,
        unit: '%',
        status: analysis.riskIndicators.glucoseManagementIndicator <= 7.0 ? 'good' : 'warning',
        target: '<7.0%'
      }
    };
  }

  /**
   * Calcula percentil de uma array ordenada
   */
  private static calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = (percentile / 100) * (sortedArray.length - 1);
    
    if (Math.floor(index) === index) {
      return sortedArray[index];
    } else {
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
    }
  }

  /**
   * Gera configuração completa para Chart.js
   */
  static generateChartConfig(chartData: ChartData, type: string, options: any = {}) {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white'
        }
      }
    };

    return {
      type,
      data: chartData,
      options: { ...baseOptions, ...options }
    };
  }
}