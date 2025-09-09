/**
 * CompanionReportGenerator Service
 * Gerador principal de relatórios médicos para o sistema de Companion Emails
 * Integra análise de dados, gráficos e formatação para envio por email
 */

import { GlucoseAnalytics, GlucoseEntry, InsulinEntry } from './GlucoseAnalytics';
import { MedicalChartsGenerator } from './MedicalChartsGenerator';

export interface ReportPeriod {
  start: Date;
  end: Date;
  type: 'daily' | 'weekly' | 'monthly';
}

export interface ReportData {
  period: ReportPeriod;
  patientInfo: {
    userKey: string;
    generatedAt: Date;
  };
  summary: {
    totalReadings: number;
    averageGlucose: number;
    timeInRange: number;
    totalInsulin: number;
    glucoseManagementIndicator: number;
  };
  analysis: any; // Resultado do GlucoseAnalytics.generateCompleteAnalysis
  charts: {
    timeInRange: any;
    agp?: any;
    dailyTrends: any;
    insulinPattern: any;
    glucoseTimeline?: any;
    variability?: any;
  };
  insights: string[];
  recommendations: string[];
  alerts: string[];
}

export interface DailyLog {
  date: string;
  glucoseEntries: Array<{
    timestamp: Date;
    value: number;
    mealType?: string;
  }>;
  bolusEntries: Array<{
    timestamp: Date;
    value: number;
  }>;
  basalEntry?: {
    value: number;
  };
  notes?: string;
}

export class CompanionReportGenerator {

  /**
   * Gera relatório diário completo
   */
  static async generateDailyReport(
    dailyLog: DailyLog,
    userKey: string
  ): Promise<ReportData> {
    const reportDate = new Date(dailyLog.date);
    const period: ReportPeriod = {
      start: new Date(reportDate.getTime()),
      end: new Date(reportDate.getTime() + 24 * 60 * 60 * 1000 - 1),
      type: 'daily'
    };

    // Converte dados para formato das análises
    const glucoseEntries: GlucoseEntry[] = dailyLog.glucoseEntries.map(entry => ({
      timestamp: new Date(entry.timestamp),
      value: entry.value,
      mealType: entry.mealType
    }));

    const insulinEntries: InsulinEntry[] = [
      ...dailyLog.bolusEntries.map(entry => ({
        timestamp: new Date(entry.timestamp),
        value: entry.value,
        type: 'bolus' as const
      })),
      ...(dailyLog.basalEntry ? [{
        timestamp: reportDate,
        value: dailyLog.basalEntry.value,
        type: 'basal' as const
      }] : [])
    ];

    // Gera análise completa
    const analysis = GlucoseAnalytics.generateCompleteAnalysis(glucoseEntries, insulinEntries);

    // Gera gráficos
    const charts = {
      timeInRange: MedicalChartsGenerator.generateTimeInRangeChart(analysis.glucose.timeInRange),
      dailyTrends: MedicalChartsGenerator.generateDailyTrendsChart(analysis.glucose.dailyPatterns),
      insulinPattern: MedicalChartsGenerator.generateInsulinPatternChart(insulinEntries, 1),
      glucoseTimeline: MedicalChartsGenerator.generateGlucoseTimelineChart(glucoseEntries)
    };

    // Gera insights e recomendações
    const insights = this.generateDailyInsights(analysis, dailyLog);
    const recommendations = this.generateDailyRecommendations(analysis);
    const alerts = this.generateAlerts(analysis);

    return {
      period,
      patientInfo: {
        userKey,
        generatedAt: new Date()
      },
      summary: {
        totalReadings: glucoseEntries.length,
        averageGlucose: analysis.glucose.average,
        timeInRange: Math.round(analysis.glucose.timeInRange.timeInRange),
        totalInsulin: analysis.insulin.totalDaily,
        glucoseManagementIndicator: analysis.riskIndicators.glucoseManagementIndicator
      },
      analysis,
      charts,
      insights,
      recommendations,
      alerts
    };
  }

  /**
   * Gera relatório semanal completo
   */
  static async generateWeeklyReport(
    weeklyLogs: DailyLog[],
    userKey: string,
    weekStart: Date
  ): Promise<ReportData> {
    const period: ReportPeriod = {
      start: new Date(weekStart),
      end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1),
      type: 'weekly'
    };

    // Combina todos os dados da semana
    const allGlucoseEntries: GlucoseEntry[] = [];
    const allInsulinEntries: InsulinEntry[] = [];

    weeklyLogs.forEach(log => {
      // Glucose entries
      log.glucoseEntries.forEach(entry => {
        allGlucoseEntries.push({
          timestamp: new Date(entry.timestamp),
          value: entry.value,
          mealType: entry.mealType
        });
      });

      // Bolus entries
      log.bolusEntries.forEach(entry => {
        allInsulinEntries.push({
          timestamp: new Date(entry.timestamp),
          value: entry.value,
          type: 'bolus'
        });
      });

      // Basal entry
      if (log.basalEntry) {
        allInsulinEntries.push({
          timestamp: new Date(log.date),
          value: log.basalEntry.value,
          type: 'basal'
        });
      }
    });

    // Gera análise completa
    const analysis = GlucoseAnalytics.generateCompleteAnalysis(allGlucoseEntries, allInsulinEntries);

    // Gera gráficos específicos da semana
    const charts = {
      timeInRange: MedicalChartsGenerator.generateTimeInRangeChart(analysis.glucose.timeInRange),
      agp: MedicalChartsGenerator.generateAGPChart(allGlucoseEntries),
      dailyTrends: MedicalChartsGenerator.generateDailyTrendsChart(analysis.glucose.dailyPatterns),
      insulinPattern: MedicalChartsGenerator.generateInsulinPatternChart(allInsulinEntries, 7),
      variability: MedicalChartsGenerator.generateVariabilityChart(allGlucoseEntries, 7)
    };

    const insights = this.generateWeeklyInsights(analysis, weeklyLogs);
    const recommendations = this.generateWeeklyRecommendations(analysis);
    const alerts = this.generateAlerts(analysis);

    return {
      period,
      patientInfo: {
        userKey,
        generatedAt: new Date()
      },
      summary: {
        totalReadings: allGlucoseEntries.length,
        averageGlucose: analysis.glucose.average,
        timeInRange: Math.round(analysis.glucose.timeInRange.timeInRange),
        totalInsulin: analysis.insulin.totalDaily * 7, // Total da semana
        glucoseManagementIndicator: analysis.riskIndicators.glucoseManagementIndicator
      },
      analysis,
      charts,
      insights,
      recommendations,
      alerts
    };
  }

  /**
   * Gera relatório mensal completo
   */
  static async generateMonthlyReport(
    monthlyLogs: DailyLog[],
    userKey: string,
    monthStart: Date
  ): Promise<ReportData> {
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);
    
    const period: ReportPeriod = {
      start: new Date(monthStart),
      end: monthEnd,
      type: 'monthly'
    };

    // Combina todos os dados do mês
    const allGlucoseEntries: GlucoseEntry[] = [];
    const allInsulinEntries: InsulinEntry[] = [];

    monthlyLogs.forEach(log => {
      // Glucose entries
      log.glucoseEntries.forEach(entry => {
        allGlucoseEntries.push({
          timestamp: new Date(entry.timestamp),
          value: entry.value,
          mealType: entry.mealType
        });
      });

      // Bolus entries
      log.bolusEntries.forEach(entry => {
        allInsulinEntries.push({
          timestamp: new Date(entry.timestamp),
          value: entry.value,
          type: 'bolus'
        });
      });

      // Basal entry
      if (log.basalEntry) {
        allInsulinEntries.push({
          timestamp: new Date(log.date),
          value: log.basalEntry.value,
          type: 'basal'
        });
      }
    });

    // Gera análise completa
    const analysis = GlucoseAnalytics.generateCompleteAnalysis(allGlucoseEntries, allInsulinEntries);

    // Gera gráficos específicos do mês
    const charts = {
      timeInRange: MedicalChartsGenerator.generateTimeInRangeChart(analysis.glucose.timeInRange),
      agp: MedicalChartsGenerator.generateAGPChart(allGlucoseEntries),
      dailyTrends: MedicalChartsGenerator.generateDailyTrendsChart(analysis.glucose.dailyPatterns),
      insulinPattern: MedicalChartsGenerator.generateInsulinPatternChart(allInsulinEntries, 30),
      variability: MedicalChartsGenerator.generateVariabilityChart(allGlucoseEntries, 30)
    };

    const insights = this.generateMonthlyInsights(analysis, monthlyLogs);
    const recommendations = this.generateMonthlyRecommendations(analysis);
    const alerts = this.generateAlerts(analysis);

    const daysWithData = monthlyLogs.filter(log => 
      log.glucoseEntries.length > 0 || log.bolusEntries.length > 0 || log.basalEntry
    ).length;

    return {
      period,
      patientInfo: {
        userKey,
        generatedAt: new Date()
      },
      summary: {
        totalReadings: allGlucoseEntries.length,
        averageGlucose: analysis.glucose.average,
        timeInRange: Math.round(analysis.glucose.timeInRange.timeInRange),
        totalInsulin: analysis.insulin.totalDaily * daysWithData,
        glucoseManagementIndicator: analysis.riskIndicators.glucoseManagementIndicator
      },
      analysis,
      charts,
      insights,
      recommendations,
      alerts
    };
  }

  /**
   * Gera insights diários baseados na análise
   */
  private static generateDailyInsights(analysis: any, dailyLog: DailyLog): string[] {
    const insights: string[] = [];
    const { glucose, insulin } = analysis;

    // Insights sobre Time in Range
    if (glucose.timeInRange.timeInRange >= 70) {
      insights.push(`✅ Excelente controle glicêmico com ${Math.round(glucose.timeInRange.timeInRange)}% do tempo na faixa alvo.`);
    } else if (glucose.timeInRange.timeInRange >= 50) {
      insights.push(`⚠️ Controle moderado com ${Math.round(glucose.timeInRange.timeInRange)}% do tempo na faixa alvo. Meta: >70%.`);
    } else {
      insights.push(`🔴 Atenção: apenas ${Math.round(glucose.timeInRange.timeInRange)}% do tempo na faixa alvo. Requer ajustes.`);
    }

    // Insights sobre variabilidade
    if (glucose.variability.coefficientOfVariation <= 36) {
      insights.push(`✅ Variabilidade glicêmica controlada (CV: ${Math.round(glucose.variability.coefficientOfVariation)}%).`);
    } else {
      insights.push(`⚠️ Alta variabilidade glicêmica (CV: ${Math.round(glucose.variability.coefficientOfVariation)}%). Meta: <36%.`);
    }

    // Insights sobre insulina
    const basalPercent = Math.round(insulin.basalToBolusRatio);
    if (basalPercent >= 40 && basalPercent <= 60) {
      insights.push(`✅ Proporção basal/bolus equilibrada (${basalPercent}% basal).`);
    } else {
      insights.push(`⚠️ Proporção basal/bolus pode precisar ajuste (${basalPercent}% basal). Ideal: 50%.`);
    }

    // Insights sobre eventos
    const hypoEvents = glucose.hypoglycemia.level1Events + glucose.hypoglycemia.level2Events;
    if (hypoEvents === 0) {
      insights.push(`✅ Nenhum evento hipoglicêmico detectado hoje.`);
    } else {
      insights.push(`🔴 ${hypoEvents} evento(s) hipoglicêmico(s) detectado(s). Monitorar padrões.`);
    }

    // Notas do dia
    if (dailyLog.notes && dailyLog.notes.trim().length > 0) {
      insights.push(`📝 Nota do dia: "${dailyLog.notes}"`);
    }

    return insights;
  }

  /**
   * Gera insights semanais
   */
  private static generateWeeklyInsights(analysis: any, weeklyLogs: DailyLog[]): string[] {
    const insights: string[] = [];
    const { glucose, insulin } = analysis;

    insights.push(`📊 Resumo da semana: ${weeklyLogs.length} dias com registros.`);
    
    // Padrões por período do dia
    const patterns = glucose.dailyPatterns;
    const bestPeriod = Object.entries(patterns).reduce((best, [period, data]: [string, any]) => {
      if (data.avg >= 70 && data.avg <= 180 && data.avg > 0) {
        return data.avg < best.avg ? { period, avg: data.avg } : best;
      }
      return best;
    }, { period: '', avg: 999 });

    if (bestPeriod.period) {
      const periodNames: { [key: string]: string } = {
        dawn: 'madrugada',
        morning: 'manhã',
        afternoon: 'tarde', 
        evening: 'noite',
        night: 'sono'
      };
      insights.push(`✅ Melhor controle no período da ${periodNames[bestPeriod.period]} (${Math.round(bestPeriod.avg)} mg/dL).`);
    }

    // GMI trend
    if (analysis.riskIndicators.glucoseManagementIndicator <= 7.0) {
      insights.push(`✅ GMI estimada de ${analysis.riskIndicators.glucoseManagementIndicator}% indica bom controle geral.`);
    } else {
      insights.push(`⚠️ GMI estimada de ${analysis.riskIndicators.glucoseManagementIndicator}% sugere necessidade de otimização.`);
    }

    return insights;
  }

  /**
   * Gera insights mensais
   */
  private static generateMonthlyInsights(analysis: any, monthlyLogs: DailyLog[]): string[] {
    const insights: string[] = [];
    const daysWithData = monthlyLogs.filter(log => 
      log.glucoseEntries.length > 0 || log.bolusEntries.length > 0
    ).length;

    insights.push(`📈 Análise mensal: ${daysWithData} dias com dados registrados.`);

    // Evolução do controle
    const avgGlucose = analysis.glucose.average;
    if (avgGlucose >= 70 && avgGlucose <= 154) { // HbA1c ~7%
      insights.push(`✅ Média glicêmica de ${avgGlucose} mg/dL indica controle adequado.`);
    } else {
      insights.push(`⚠️ Média glicêmica de ${avgGlucose} mg/dL sugere ajustes na terapia.`);
    }

    // Consistência dos dados
    const dataConsistency = (daysWithData / 30) * 100;
    if (dataConsistency >= 80) {
      insights.push(`✅ Excelente aderência ao monitoramento (${Math.round(dataConsistency)}% dos dias).`);
    } else {
      insights.push(`📝 Aderência ao monitoramento pode melhorar (${Math.round(dataConsistency)}% dos dias).`);
    }

    return insights;
  }

  /**
   * Gera recomendações diárias
   */
  private static generateDailyRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    const { glucose, insulin } = analysis;

    if (glucose.timeInRange.timeInRange < 70) {
      recommendations.push('Considere revisar horários das refeições e doses de insulina com sua equipe médica.');
    }

    if (glucose.variability.coefficientOfVariation > 36) {
      recommendations.push('Para reduzir variabilidade: mantenha horários regulares de refeição e atividade física.');
    }

    if (glucose.hypoglycemia.level1Events + glucose.hypoglycemia.level2Events > 0) {
      recommendations.push('Monitore padrões de hipoglicemia. Considere ajustar insulina ou timing das refeições.');
    }

    if (insulin.basalToBolusRatio < 40 || insulin.basalToBolusRatio > 60) {
      recommendations.push('Discuta com seu médico sobre ajuste na proporção basal/bolus de insulina.');
    }

    return recommendations;
  }

  /**
   * Gera recomendações semanais
   */
  private static generateWeeklyRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    
    recommendations.push('Continue monitorando regularmente e registrando padrões.');
    recommendations.push('Mantenha comunicação regular com sua equipe de cuidados.');
    
    if (analysis.glucose.timeInRange.timeInRange >= 70) {
      recommendations.push('Parabéns pelo excelente controle! Mantenha a rotina atual.');
    } else {
      recommendations.push('Foque em atingir >70% do tempo na faixa alvo (70-180 mg/dL).');
    }

    return recommendations;
  }

  /**
   * Gera recomendações mensais
   */
  private static generateMonthlyRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    
    recommendations.push('Agende consulta de acompanhamento com sua equipe médica.');
    recommendations.push('Revise metas de controle glicêmico para o próximo mês.');
    
    if (analysis.riskIndicators.glucoseManagementIndicator > 7.0) {
      recommendations.push('Discuta estratégias para otimizar controle glicêmico e reduzir GMI.');
    }

    recommendations.push('Continue o excelente trabalho de monitoramento e autocuidado!');

    return recommendations;
  }

  /**
   * Gera alertas baseados na análise
   */
  private static generateAlerts(analysis: any): string[] {
    const alerts: string[] = [];
    const { glucose } = analysis;

    // Alertas críticos
    if (glucose.hypoglycemia.level2Events > 0) {
      alerts.push('🚨 ALERTA: Eventos de hipoglicemia severa (<54 mg/dL) detectados. Procure orientação médica.');
    }

    if (glucose.hyperglycemia.level2Events > 0) {
      alerts.push('🚨 ALERTA: Eventos de hiperglicemia severa (>250 mg/dL) detectados. Monitore cetones.');
    }

    if (glucose.timeInRange.timeInRange < 50) {
      alerts.push('⚠️ ATENÇÃO: Controle glicêmico abaixo do adequado. Consulte sua equipe médica.');
    }

    return alerts;
  }
}