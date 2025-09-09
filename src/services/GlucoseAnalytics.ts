/**
 * GlucoseAnalytics Service
 * Análise específica de dados de glicose conforme padrões médicos internacionais
 * Baseado em ADA Guidelines e Time in Range consensus
 */

export interface GlucoseEntry {
  timestamp: Date;
  value: number;
  mealType?: string;
}

export interface InsulinEntry {
  timestamp: Date;
  value: number;
  type: 'bolus' | 'basal';
}

export interface GlucoseRangeMetrics {
  timeInRange: number;      // 70-180 mg/dL (>70% ideal)
  timeAboveRange: number;   // >180 mg/dL (<25% ideal) 
  timeBelowRange: number;   // <70 mg/dL (<4% ideal)
  timeCriticalHigh: number; // >250 mg/dL (<5% ideal)
  timeCriticalLow: number;  // <54 mg/dL (<1% ideal)
}

export interface GlucoseVariabilityMetrics {
  coefficientOfVariation: number;  // <36% ideal
  standardDeviation: number;
  meanAmplitudeGlycemicExcursion: number; // MAGE
  continuousOverallNetGlycemicAction: number; // CONGA
}

export interface DailyPatternAnalysis {
  dawn: { avg: number; count: number };           // 04:00-08:00
  morning: { avg: number; count: number };        // 08:00-12:00  
  afternoon: { avg: number; count: number };      // 12:00-18:00
  evening: { avg: number; count: number };        // 18:00-22:00
  night: { avg: number; count: number };          // 22:00-04:00
}

export interface HypoglycemiaAnalysis {
  level1Events: number;    // 54-69 mg/dL
  level2Events: number;    // <54 mg/dL  
  avgDuration: number;     // Minutos
  nocturnal: number;       // 22:00-06:00
  postMeal: number;        // 1-3h após refeição
}

export interface HyperglycemiaAnalysis {
  level1Events: number;    // 181-250 mg/dL
  level2Events: number;    // >250 mg/dL
  avgDuration: number;     // Minutos
  preBreakfast: number;    // Fenômeno do amanhecer
  postMeal: number;        // 1-3h após refeição
}

export class GlucoseAnalytics {
  
  /**
   * Calcula métricas de Time in Range conforme consensus internacional
   */
  static calculateTimeInRange(entries: GlucoseEntry[]): GlucoseRangeMetrics {
    if (entries.length === 0) {
      return {
        timeInRange: 0,
        timeAboveRange: 0,
        timeBelowRange: 0,
        timeCriticalHigh: 0,
        timeCriticalLow: 0
      };
    }

    const total = entries.length;
    const inRange = entries.filter(e => e.value >= 70 && e.value <= 180).length;
    const aboveRange = entries.filter(e => e.value > 180 && e.value <= 250).length;
    const belowRange = entries.filter(e => e.value >= 54 && e.value < 70).length;
    const criticalHigh = entries.filter(e => e.value > 250).length;
    const criticalLow = entries.filter(e => e.value < 54).length;

    return {
      timeInRange: (inRange / total) * 100,
      timeAboveRange: (aboveRange / total) * 100,
      timeBelowRange: (belowRange / total) * 100,
      timeCriticalHigh: (criticalHigh / total) * 100,
      timeCriticalLow: (criticalLow / total) * 100
    };
  }

  /**
   * Calcula variabilidade glicêmica (CV% e outros indicadores)
   */
  static calculateGlucoseVariability(entries: GlucoseEntry[]): GlucoseVariabilityMetrics {
    if (entries.length < 2) {
      return {
        coefficientOfVariation: 0,
        standardDeviation: 0,
        meanAmplitudeGlycemicExcursion: 0,
        continuousOverallNetGlycemicAction: 0
      };
    }

    const values = entries.map(e => e.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Desvio padrão
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Coeficiente de variação (%)
    const coefficientOfVariation = (standardDeviation / mean) * 100;
    
    // MAGE (Mean Amplitude of Glycemic Excursions)
    const mage = this.calculateMAGE(values);
    
    // CONGA (Continuous Overall Net Glycemic Action)
    const conga = this.calculateCONGA(entries);

    return {
      coefficientOfVariation,
      standardDeviation,
      meanAmplitudeGlycemicExcursion: mage,
      continuousOverallNetGlycemicAction: conga
    };
  }

  /**
   * Analisa padrões por período do dia
   */
  static analyzeDailyPatterns(entries: GlucoseEntry[]): DailyPatternAnalysis {
    const periods = {
      dawn: { values: [] as number[], period: [4, 8] },
      morning: { values: [] as number[], period: [8, 12] },
      afternoon: { values: [] as number[], period: [12, 18] },
      evening: { values: [] as number[], period: [18, 22] },
      night: { values: [] as number[], period: [22, 4] }
    };

    entries.forEach(entry => {
      const hour = entry.timestamp.getHours();
      
      if ((hour >= 4 && hour < 8)) {
        periods.dawn.values.push(entry.value);
      } else if (hour >= 8 && hour < 12) {
        periods.morning.values.push(entry.value);
      } else if (hour >= 12 && hour < 18) {
        periods.afternoon.values.push(entry.value);
      } else if (hour >= 18 && hour < 22) {
        periods.evening.values.push(entry.value);
      } else {
        periods.night.values.push(entry.value);
      }
    });

    return {
      dawn: {
        avg: periods.dawn.values.length > 0 
          ? periods.dawn.values.reduce((sum, val) => sum + val, 0) / periods.dawn.values.length 
          : 0,
        count: periods.dawn.values.length
      },
      morning: {
        avg: periods.morning.values.length > 0 
          ? periods.morning.values.reduce((sum, val) => sum + val, 0) / periods.morning.values.length 
          : 0,
        count: periods.morning.values.length
      },
      afternoon: {
        avg: periods.afternoon.values.length > 0 
          ? periods.afternoon.values.reduce((sum, val) => sum + val, 0) / periods.afternoon.values.length 
          : 0,
        count: periods.afternoon.values.length
      },
      evening: {
        avg: periods.evening.values.length > 0 
          ? periods.evening.values.reduce((sum, val) => sum + val, 0) / periods.evening.values.length 
          : 0,
        count: periods.evening.values.length
      },
      night: {
        avg: periods.night.values.length > 0 
          ? periods.night.values.reduce((sum, val) => sum + val, 0) / periods.night.values.length 
          : 0,
        count: periods.night.values.length
      }
    };
  }

  /**
   * Analisa eventos hipoglicêmicos
   */
  static analyzeHypoglycemia(entries: GlucoseEntry[]): HypoglycemiaAnalysis {
    const level1Events = entries.filter(e => e.value >= 54 && e.value < 70).length;
    const level2Events = entries.filter(e => e.value < 54).length;
    
    // Eventos noturnos (22:00-06:00)
    const nocturnal = entries.filter(e => {
      const hour = e.timestamp.getHours();
      return (hour >= 22 || hour < 6) && e.value < 70;
    }).length;

    // Aproximação para eventos pós-refeição
    const postMeal = entries.filter(e => {
      const hour = e.timestamp.getHours();
      return (hour >= 9 && hour <= 11) || 
             (hour >= 14 && hour <= 16) || 
             (hour >= 20 && hour <= 22) && e.value < 70;
    }).length;

    return {
      level1Events,
      level2Events,
      avgDuration: 0, // Requer dados temporais mais detalhados
      nocturnal,
      postMeal
    };
  }

  /**
   * Analisa eventos hiperglicêmicos
   */
  static analyzeHyperglycemia(entries: GlucoseEntry[]): HyperglycemiaAnalysis {
    const level1Events = entries.filter(e => e.value > 180 && e.value <= 250).length;
    const level2Events = entries.filter(e => e.value > 250).length;
    
    // Fenômeno do amanhecer (06:00-08:00)
    const preBreakfast = entries.filter(e => {
      const hour = e.timestamp.getHours();
      return hour >= 6 && hour <= 8 && e.value > 180;
    }).length;

    // Aproximação para eventos pós-refeição
    const postMeal = entries.filter(e => {
      const hour = e.timestamp.getHours();
      return (hour >= 9 && hour <= 11) || 
             (hour >= 14 && hour <= 16) || 
             (hour >= 20 && hour <= 22) && e.value > 180;
    }).length;

    return {
      level1Events,
      level2Events,
      avgDuration: 0, // Requer dados temporais mais detalhados
      preBreakfast,
      postMeal
    };
  }

  /**
   * Calcula MAGE (Mean Amplitude of Glycemic Excursions)
   */
  private static calculateMAGE(values: number[]): number {
    if (values.length < 3) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const sd = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );

    // Simplificação do cálculo MAGE
    const excursions = [];
    for (let i = 1; i < values.length - 1; i++) {
      const current = values[i];
      const prev = values[i - 1];
      const next = values[i + 1];
      
      if ((current > prev && current > next) || (current < prev && current < next)) {
        const amplitude = Math.abs(current - prev);
        if (amplitude > sd) {
          excursions.push(amplitude);
        }
      }
    }

    return excursions.length > 0 
      ? excursions.reduce((sum, val) => sum + val, 0) / excursions.length 
      : 0;
  }

  /**
   * Calcula CONGA (Continuous Overall Net Glycemic Action)
   */
  private static calculateCONGA(entries: GlucoseEntry[], hours: number = 1): number {
    if (entries.length < 2) return 0;

    const hourInMs = hours * 60 * 60 * 1000;
    const differences = [];

    for (let i = 1; i < entries.length; i++) {
      const timeDiff = entries[i].timestamp.getTime() - entries[i - 1].timestamp.getTime();
      if (Math.abs(timeDiff - hourInMs) < (hourInMs * 0.5)) { // Dentro de 50% da janela
        differences.push(entries[i].value - entries[i - 1].value);
      }
    }

    if (differences.length === 0) return 0;

    const meanDiff = differences.reduce((sum, val) => sum + val, 0) / differences.length;
    const variance = differences.reduce((sum, val) => sum + Math.pow(val - meanDiff, 2), 0) / differences.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Gera relatório completo de análise glicêmica
   */
  static generateCompleteAnalysis(glucoseEntries: GlucoseEntry[], insulinEntries: InsulinEntry[]) {
    const timeInRange = this.calculateTimeInRange(glucoseEntries);
    const variability = this.calculateGlucoseVariability(glucoseEntries);
    const dailyPatterns = this.analyzeDailyPatterns(glucoseEntries);
    const hypoglycemia = this.analyzeHypoglycemia(glucoseEntries);
    const hyperglycemia = this.analyzeHyperglycemia(glucoseEntries);

    // Estatísticas básicas de glicose
    const glucoseValues = glucoseEntries.map(e => e.value);
    const avgGlucose = glucoseValues.length > 0 
      ? glucoseValues.reduce((sum, val) => sum + val, 0) / glucoseValues.length 
      : 0;
    const minGlucose = glucoseValues.length > 0 ? Math.min(...glucoseValues) : 0;
    const maxGlucose = glucoseValues.length > 0 ? Math.max(...glucoseValues) : 0;

    // Estatísticas de insulina
    const totalBolus = insulinEntries
      .filter(e => e.type === 'bolus')
      .reduce((sum, e) => sum + e.value, 0);
    
    const totalBasal = insulinEntries
      .filter(e => e.type === 'basal')
      .reduce((sum, e) => sum + e.value, 0);

    const totalInsulin = totalBolus + totalBasal;
    const basalToBolusRatio = totalInsulin > 0 ? (totalBasal / totalInsulin) * 100 : 0;

    return {
      period: {
        start: glucoseEntries.length > 0 ? glucoseEntries[0].timestamp : new Date(),
        end: glucoseEntries.length > 0 ? glucoseEntries[glucoseEntries.length - 1].timestamp : new Date(),
        totalReadings: glucoseEntries.length
      },
      glucose: {
        average: Math.round(avgGlucose),
        min: minGlucose,
        max: maxGlucose,
        timeInRange,
        variability,
        dailyPatterns,
        hypoglycemia,
        hyperglycemia
      },
      insulin: {
        totalDaily: Math.round(totalInsulin * 10) / 10,
        totalBolus: Math.round(totalBolus * 10) / 10,
        totalBasal: Math.round(totalBasal * 10) / 10,
        basalToBolusRatio: Math.round(basalToBolusRatio),
        averageBolusPerMeal: totalBolus > 0 ? Math.round((totalBolus / 3) * 10) / 10 : 0 // Aproximação 3 refeições/dia
      },
      riskIndicators: {
        glucoseManagementIndicator: this.calculateGMI(avgGlucose),
        hypoglycemiaRisk: hypoglycemia.level1Events + hypoglycemia.level2Events > 5 ? 'Alto' : 'Baixo',
        variabilityRisk: variability.coefficientOfVariation > 36 ? 'Alto' : 'Baixo'
      }
    };
  }

  /**
   * Calcula GMI (Glucose Management Indicator) - equivale HbA1c estimada
   */
  private static calculateGMI(avgGlucose: number): number {
    // Fórmula: GMI (%) = 3.31 + 0.02392 × [média glicose mg/dL]
    return Math.round((3.31 + 0.02392 * avgGlucose) * 10) / 10;
  }
}