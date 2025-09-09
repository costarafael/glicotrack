import {
  AdvancedStatistics,
  MealStats,
  CoverageAnalysis,
  WeekdayAnalysis,
} from '../../types/statistics';
import { formatGlucoseValue, formatInsulinUnits } from '../../utils/formatters';
import { MEAL_LABELS } from '../../constants/mealTypes';

/**
 * Gerador de Seção de Estatísticas Avançadas para PDF
 *
 * Responsável por gerar HTML formatado com todas as estatísticas avançadas,
 * incluindo métricas básicas, análises por refeição, cobertura e padrões semanais.
 */
export class StatsSectionGenerator {
  private static readonly QUALITY_COLORS = {
    excellent: '#22c55e',
    good: '#3b82f6',
    fair: '#f59e0b',
    poor: '#ef4444',
  };

  private static readonly WEEKDAY_ICONS = {
    0: '☀️', // Domingo
    1: '📅', // Segunda
    2: '📋', // Terça
    3: '📊', // Quarta
    4: '⚡', // Quinta
    5: '🎯', // Sexta
    6: '🎉', // Sábado
  };

  /**
   * Gera HTML completo da seção de estatísticas avançadas
   */
  static generate(statistics: AdvancedStatistics): string {
    console.log(
      `📊 [StatsSectionGenerator] Generating advanced statistics section`,
    );

    try {
      let html = `
        <div class="advanced-stats-section">
          <div class="stats-title">📊 Estatísticas Avançadas do Mês</div>

          ${this.generateBasicStatsSubsection(statistics)}
          ${this.generateDailyAveragesSubsection(statistics)}
          ${this.generateMealAnalysisSubsection(statistics.bolusPerMealType)}
          ${this.generateCoverageSubsection(statistics.coverage)}
          ${this.generateWeekdaySubsection(statistics.weekdayAnalysis)}
          ${this.generateTemporalSubsection(statistics)}
        </div>
      `;

      console.log(
        `✅ [StatsSectionGenerator] Advanced statistics section generated successfully`,
      );
      return html;
    } catch (error: any) {
      console.error(
        `❌ [StatsSectionGenerator] Error generating section:`,
        error?.message || 'Unknown error',
      );
      return this.generateErrorSection();
    }
  }

  /**
   * Gera subseção de estatísticas básicas (compatível com versão anterior)
   */
  private static generateBasicStatsSubsection(
    statistics: AdvancedStatistics,
  ): string {
    return `
      <div class="stats-subsection basic-stats">
        <div class="subsection-title">📋 Resumo Geral</div>
        <div class="stats-grid">
          <div class="stat-item highlight">
            <span class="stat-value primary">${statistics.totalDays}</span>
            <span class="stat-label">Dias com registros</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-value primary">${
              statistics.glucoseReadings
            }</span>
            <span class="stat-label">Medições de glicose</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-value primary">${
              statistics.averageGlucose > 0
                ? formatGlucoseValue(Math.round(statistics.averageGlucose))
                : '-'
            }</span>
            <span class="stat-label">Glicose média</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-value primary">${
              statistics.totalBolus > 0
                ? formatInsulinUnits(statistics.totalBolus)
                : '-'
            }</span>
            <span class="stat-label">Total bolus</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-value primary">${
              statistics.totalBasal > 0
                ? formatInsulinUnits(statistics.totalBasal)
                : '-'
            }</span>
            <span class="stat-label">Total basal</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera subseção de médias diárias
   */
  private static generateDailyAveragesSubsection(
    statistics: AdvancedStatistics,
  ): string {
    const dailyBolus = statistics.averageDailyBolus;
    const dailyBasal = statistics.averageDailyBasal;

    return `
      <div class="stats-subsection daily-averages">
        <div class="subsection-title">📊 Médias Diárias</div>
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-value accent">${
              dailyBolus > 0 ? formatInsulinUnits(dailyBolus, 1) : '-'
            }</span>
            <span class="stat-label">Bolus médio diário</span>
            ${
              dailyBolus > 0
                ? `<span class="stat-detail">(${(dailyBolus * 30).toFixed(
                    1,
                  )}U/mês estimado)</span>`
                : ''
            }
          </div>
          <div class="stat-item">
            <span class="stat-value accent">${
              dailyBasal > 0 ? formatInsulinUnits(dailyBasal, 1) : '-'
            }</span>
            <span class="stat-label">Basal médio diário</span>
            ${
              dailyBasal > 0
                ? `<span class="stat-detail">(${(dailyBasal * 30).toFixed(
                    1,
                  )}U/mês estimado)</span>`
                : ''
            }
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera subseção de análise por refeição
   */
  private static generateMealAnalysisSubsection(
    bolusPerMealType: Record<string, MealStats>,
  ): string {
    const activeMeals = Object.entries(bolusPerMealType).filter(
      ([_, stats]) => stats.total > 0,
    );

    if (activeMeals.length === 0) {
      return `
        <div class="stats-subsection meal-analysis">
          <div class="subsection-title">🍽️ Análise por Refeição</div>
          <div class="no-data">Nenhum dado de bolus por refeição disponível</div>
        </div>
      `;
    }

    // Ordenar por total (maior para menor)
    const sortedMeals = activeMeals.sort((a, b) => b[1].total - a[1].total);

    let mealRows = '';
    sortedMeals.forEach(([mealType, stats]) => {
      const mealLabel =
        MEAL_LABELS[mealType as keyof typeof MEAL_LABELS] || mealType;
      const percentage =
        sortedMeals.length > 0
          ? (
              (stats.total /
                sortedMeals.reduce((sum, [, s]) => sum + s.total, 0)) *
              100
            ).toFixed(1)
          : '0';

      mealRows += `
        <div class="meal-item">
          <div class="meal-header">
            <span class="meal-name">${mealLabel}</span>
            <span class="meal-percentage">${percentage}%</span>
          </div>
          <div class="meal-stats">
            <span class="meal-total">${formatInsulinUnits(stats.total)}</span>
            <span class="meal-separator">•</span>
            <span class="meal-average">Média: ${formatInsulinUnits(
              stats.average,
            )}</span>
            <span class="meal-separator">•</span>
            <span class="meal-count">${stats.count} aplicações</span>
          </div>
          <div class="meal-progress-bar">
            <div class="meal-progress-fill" style="width: ${percentage}%;"></div>
          </div>
        </div>
      `;
    });

    return `
      <div class="stats-subsection meal-analysis">
        <div class="subsection-title">🍽️ Análise por Refeição</div>
        <div class="meal-summary">
          <span class="summary-text">
            ${activeMeals.length} tipos de refeição registrados •
            ${
              sortedMeals[0]
                ? MEAL_LABELS[sortedMeals[0][0] as keyof typeof MEAL_LABELS]
                : ''
            } é a principal
          </span>
        </div>
        <div class="meals-list">
          ${mealRows}
        </div>
      </div>
    `;
  }

  /**
   * Gera subseção de cobertura de registros
   */
  private static generateCoverageSubsection(
    coverage: CoverageAnalysis,
  ): string {
    const qualityLevel = this.getCoverageQualityLevel(
      coverage.coveragePercentage,
    );
    const qualityColor = this.QUALITY_COLORS[qualityLevel];
    const qualityEmoji = this.getCoverageEmoji(coverage.coveragePercentage);

    return `
      <div class="stats-subsection coverage-analysis">
        <div class="subsection-title">📋 Cobertura de Registros</div>
        <div class="coverage-main">
          <div class="coverage-circle" style="border-color: ${qualityColor};">
            <div class="coverage-percentage" style="color: ${qualityColor};">
              ${coverage.coveragePercentage}%
            </div>
            <div class="coverage-label">Cobertura</div>
          </div>
          <div class="coverage-details">
            <div class="coverage-quality">
              <span class="quality-indicator" style="color: ${qualityColor};">
                ${qualityEmoji} ${this.getQualityLabel(qualityLevel)}
              </span>
            </div>
            <div class="coverage-stats">
              <div class="coverage-stat">
                <span class="stat-value small">${
                  coverage.daysWithRecords
                }</span>
                <span class="stat-label small">dias com registros</span>
              </div>
              <div class="coverage-stat">
                <span class="stat-value small">${
                  coverage.missingDays.length
                }</span>
                <span class="stat-label small">dias sem registros</span>
              </div>
              <div class="coverage-stat">
                <span class="stat-value small">${
                  coverage.consecutiveDays
                }</span>
                <span class="stat-label small">sequência máxima</span>
              </div>
            </div>
            ${
              coverage.missingDays.length > 0 &&
              coverage.missingDays.length <= 10
                ? `<div class="missing-days">
                <span class="missing-label">Dias sem registro:</span>
                <span class="missing-list">${coverage.missingDays.join(
                  ', ',
                )}</span>
              </div>`
                : ''
            }
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera subseção de análise semanal
   */
  private static generateWeekdaySubsection(
    weekdayAnalysis: WeekdayAnalysis,
  ): string {
    const mostActive =
      weekdayAnalysis.weekdayNames[weekdayAnalysis.mostActiveWeekday];
    const leastActive =
      weekdayAnalysis.weekdayNames[weekdayAnalysis.leastActiveWeekday];
    const mostActiveIcon =
      this.WEEKDAY_ICONS[weekdayAnalysis.mostActiveWeekday];
    const leastActiveIcon =
      this.WEEKDAY_ICONS[weekdayAnalysis.leastActiveWeekday];

    // Calcular total e média
    const totalRecords = Object.values(
      weekdayAnalysis.recordsPerWeekday,
    ).reduce((sum, count) => sum + count, 0);
    const averagePerDay = Math.round((totalRecords / 7) * 10) / 10; // Arredondar para 1 decimal

    // Gerar barras para cada dia
    let weekdayBars = '';
    Object.entries(weekdayAnalysis.recordsPerWeekday).forEach(
      ([dayNum, count]) => {
        const dayName = weekdayAnalysis.weekdayNames[parseInt(dayNum)];
        const percentage = totalRecords > 0 ? (count / totalRecords) * 100 : 0;
        const relativeHeight =
          totalRecords > 0
            ? Math.max(
                (count /
                  Math.max(
                    ...Object.values(weekdayAnalysis.recordsPerWeekday),
                  )) *
                  100,
                5,
              )
            : 5;

        weekdayBars += `
        <div class="weekday-bar-container">
          <div class="weekday-bar" style="height: ${relativeHeight}%;" title="${dayName}: ${Math.round(count)} registros">
            <div class="weekday-fill"></div>
          </div>
          <div class="weekday-label">${dayName.substring(0, 3)}</div>
          <div class="weekday-count">${Math.round(count)}</div>
        </div>
      `;
      },
    );

    return `
      <div class="stats-subsection weekday-analysis">
        <div class="subsection-title">📅 Padrões Semanais</div>
        <div class="weekday-summary">
          <div class="weekday-highlights">
            <div class="weekday-highlight positive">
              <span class="highlight-icon">${mostActiveIcon}</span>
              <span class="highlight-text">
                <strong>${mostActive}</strong> é o dia mais ativo
              </span>
              <span class="highlight-value">${Math.round(
                weekdayAnalysis.recordsPerWeekday[
                  weekdayAnalysis.mostActiveWeekday
                ]
              )} registros</span>
            </div>
            <div class="weekday-highlight negative">
              <span class="highlight-icon">${leastActiveIcon}</span>
              <span class="highlight-text">
                <strong>${leastActive}</strong> é o menos ativo
              </span>
              <span class="highlight-value">${Math.round(
                weekdayAnalysis.recordsPerWeekday[
                  weekdayAnalysis.leastActiveWeekday
                ]
              )} registros</span>
            </div>
          </div>
        </div>
        <div class="weekday-chart">
          <div class="weekday-bars">
            ${weekdayBars}
          </div>
          <div class="weekday-average-line" title="Média semanal: ${averagePerDay} registros/dia">
            <span class="average-label">Média: ${averagePerDay}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera subseção de análise temporal
   */
  private static generateTemporalSubsection(
    statistics: AdvancedStatistics,
  ): string {
    const timeAnalysis = statistics.averageGlucoseByTimeOfDay;
    const variability = statistics.glucoseVariability;

    // Encontrar período com maior/menor glicose
    const periods = Object.entries(timeAnalysis).filter(([_, avg]) => avg > 0);
    if (periods.length === 0) {
      return `
        <div class="stats-subsection temporal-analysis">
          <div class="subsection-title">⏰ Análise Temporal</div>
          <div class="no-data">Dados insuficientes para análise temporal</div>
        </div>
      `;
    }

    const sortedPeriods = periods.sort((a, b) => b[1] - a[1]);
    const highestPeriod = sortedPeriods[0];
    const lowestPeriod = sortedPeriods[sortedPeriods.length - 1];

    const periodLabels: Record<string, string> = {
      morning: 'Manhã (6h-12h)',
      afternoon: 'Tarde (12h-18h)',
      evening: 'Noite (18h-22h)',
      night: 'Madrugada (22h-6h)',
    };

    const variabilityLevel = this.getVariabilityLevel(variability);

    return `
      <div class="stats-subsection temporal-analysis">
        <div class="subsection-title">⏰ Análise Temporal</div>
        <div class="temporal-content">
          <div class="time-periods">
            ${periods
              .map(
                ([period, avg]) => `
              <div class="time-period-item ${period}">
                <div class="period-name">${periodLabels[period] || period}</div>
                <div class="period-avg">${formatGlucoseValue(
                  Math.round(avg),
                )}</div>
              </div>
            `,
              )
              .join('')}
          </div>
          <div class="temporal-insights">
            <div class="insight-item">
              <span class="insight-label">🔺 Maior média:</span>
              <span class="insight-value">
                ${periodLabels[highestPeriod[0]]} (${formatGlucoseValue(
      Math.round(highestPeriod[1]),
    )})
              </span>
            </div>
            <div class="insight-item">
              <span class="insight-label">🔻 Menor média:</span>
              <span class="insight-value">
                ${periodLabels[lowestPeriod[0]]} (${formatGlucoseValue(
      Math.round(lowestPeriod[1]),
    )})
              </span>
            </div>
            <div class="insight-item variability-${variabilityLevel}">
              <span class="insight-label">📊 Variabilidade:</span>
              <span class="insight-value">
                ${variability.toFixed(1)}% (${this.getVariabilityLabel(
      variabilityLevel,
    )})
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera CSS específico para estatísticas avançadas
   */
  static generateAdvancedStatsCSS(): string {
    return `
      /* Advanced Stats Section */
      .advanced-stats-section {
        margin: 20px 0;
        font-family: 'Figtree', sans-serif;
      }

      .stats-title {
        font-size: 16px;
        font-weight: 700;
        color: #374151;
        margin-bottom: 20px;
        text-align: center;
        border-bottom: 2px solid #3b82f6;
        padding-bottom: 8px;
      }

      .stats-subsection {
        margin-bottom: 25px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 15px;
        background: #ffffff;
      }

      .subsection-title {
        font-size: 12px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 12px;
        border-left: 3px solid #3b82f6;
        padding-left: 8px;
      }

      /* Basic Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
        margin-bottom: 10px;
      }

      .stats-row {
        display: flex;
        justify-content: space-around;
        flex-wrap: wrap;
        gap: 15px;
      }

      .stat-item {
        text-align: center;
        padding: 8px;
        border-radius: 6px;
      }

      .stat-item.highlight {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid #cbd5e1;
      }

      .stat-value {
        display: block;
        font-weight: 700;
        font-size: 14px;
        margin-bottom: 3px;
      }

      .stat-value.primary { color: #3b82f6; }
      .stat-value.accent { color: #059669; }
      .stat-value.small { font-size: 12px; }

      .stat-label {
        display: block;
        font-size: 9px;
        color: #6b7280;
        font-weight: 400;
      }

      .stat-label.small { font-size: 8px; }

      .stat-detail {
        display: block;
        font-size: 8px;
        color: #9ca3af;
        font-style: italic;
        margin-top: 2px;
      }

      /* Meal Analysis */
      .meal-summary {
        text-align: center;
        margin-bottom: 12px;
        padding: 8px;
        background: #f8fafc;
        border-radius: 4px;
        font-size: 10px;
        color: #6b7280;
      }

      .meals-list {
        space-y: 8px;
      }

      .meal-item {
        margin-bottom: 12px;
        padding: 10px;
        background: #fafafa;
        border-radius: 6px;
        border-left: 3px solid #3b82f6;
      }

      .meal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }

      .meal-name {
        font-weight: 600;
        font-size: 11px;
        color: #374151;
      }

      .meal-percentage {
        font-size: 10px;
        color: #6b7280;
        font-weight: 500;
      }

      .meal-stats {
        font-size: 9px;
        color: #6b7280;
        margin-bottom: 6px;
      }

      .meal-separator {
        margin: 0 6px;
        opacity: 0.5;
      }

      .meal-progress-bar {
        height: 3px;
        background: #e5e7eb;
        border-radius: 1.5px;
        overflow: hidden;
      }

      .meal-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        transition: width 0.3s ease;
      }

      /* Coverage Analysis */
      .coverage-main {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }

      .coverage-circle {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 4px solid;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .coverage-percentage {
        font-size: 16px;
        font-weight: 700;
      }

      .coverage-label {
        font-size: 8px;
        color: #6b7280;
        margin-top: 2px;
      }

      .coverage-details {
        flex: 1;
        min-width: 200px;
      }

      .coverage-quality {
        margin-bottom: 10px;
      }

      .quality-indicator {
        font-size: 11px;
        font-weight: 600;
      }

      .coverage-stats {
        display: flex;
        gap: 15px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }

      .coverage-stat {
        text-align: center;
      }

      .missing-days {
        font-size: 9px;
        color: #6b7280;
      }

      .missing-label {
        font-weight: 500;
      }

      .missing-list {
        font-family: 'IBM Plex Mono', monospace;
      }

      /* Weekday Analysis */
      .weekday-summary {
        margin-bottom: 15px;
      }

      .weekday-highlights {
        display: flex;
        justify-content: space-around;
        gap: 10px;
        flex-wrap: wrap;
      }

      .weekday-highlight {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 9px;
        flex: 1;
        min-width: 150px;
      }

      .weekday-highlight.positive {
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
      }

      .weekday-highlight.negative {
        background: #fef2f2;
        border: 1px solid #fca5a5;
      }

      .highlight-icon {
        font-size: 14px;
      }

      .highlight-text {
        flex: 1;
      }

      .highlight-value {
        font-weight: 600;
        color: #374151;
      }

      .weekday-chart {
        position: relative;
        height: 100px;
        margin-top: 10px;
      }

      .weekday-bars {
        display: flex;
        justify-content: space-around;
        align-items: flex-end;
        height: 70px;
        padding: 0 10px;
        border-bottom: 1px solid #e5e7eb;
      }

      .weekday-bar-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
      }

      .weekday-bar {
        width: 20px;
        background: linear-gradient(to top, #3b82f6, #60a5fa);
        border-radius: 2px 2px 0 0;
        margin-bottom: 5px;
        min-height: 5px;
      }

      .weekday-label {
        font-size: 8px;
        color: #6b7280;
        font-weight: 500;
        margin-bottom: 2px;
      }

      .weekday-count {
        font-size: 8px;
        color: #374151;
        font-weight: 600;
      }

      .weekday-average-line {
        position: absolute;
        bottom: 25px;
        right: 10px;
        font-size: 8px;
        color: #6b7280;
      }

      /* Temporal Analysis */
      .temporal-content {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
      }

      .time-periods {
        display: flex;
        flex: 1;
        gap: 8px;
        min-width: 200px;
        flex-wrap: wrap;
      }

      .time-period-item {
        text-align: center;
        padding: 8px 6px;
        border-radius: 6px;
        flex: 1;
        min-width: 60px;
      }

      .time-period-item.morning { background: #fef3c7; border: 1px solid #f59e0b; }
      .time-period-item.afternoon { background: #fef2f2; border: 1px solid #ef4444; }
      .time-period-item.evening { background: #ede9fe; border: 1px solid #8b5cf6; }
      .time-period-item.night { background: #f0f9ff; border: 1px solid #0ea5e9; }

      .period-name {
        font-size: 8px;
        color: #6b7280;
        margin-bottom: 3px;
      }

      .period-avg {
        font-size: 11px;
        font-weight: 600;
        color: #374151;
      }

      .temporal-insights {
        flex: 1;
        min-width: 150px;
      }

      .insight-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 9px;
      }

      .insight-label {
        color: #6b7280;
      }

      .insight-value {
        color: #374151;
        font-weight: 500;
      }

      .insight-item.variability-low .insight-value { color: #059669; }
      .insight-item.variability-medium .insight-value { color: #d97706; }
      .insight-item.variability-high .insight-value { color: #dc2626; }

      /* Error States */
      .no-data {
        text-align: center;
        color: #9ca3af;
        font-style: italic;
        font-size: 10px;
        padding: 20px;
      }

      /* Responsive */
      @media (max-width: 600px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .coverage-main,
        .temporal-content {
          flex-direction: column;
        }

        .weekday-highlights {
          flex-direction: column;
        }
      }
    `;
  }

  // Helper methods
  private static getCoverageQualityLevel(
    percentage: number,
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'fair';
    return 'poor';
  }

  private static getCoverageEmoji(percentage: number): string {
    if (percentage >= 90) return '🌟';
    if (percentage >= 70) return '✅';
    if (percentage >= 50) return '⚠️';
    return '❌';
  }

  private static getQualityLabel(level: string): string {
    const labels = {
      excellent: 'Excelente',
      good: 'Boa',
      fair: 'Regular',
      poor: 'Baixa',
    };
    return labels[level as keyof typeof labels] || 'Desconhecida';
  }

  private static getVariabilityLevel(
    variability: number,
  ): 'low' | 'medium' | 'high' {
    if (variability <= 20) return 'low';
    if (variability <= 35) return 'medium';
    return 'high';
  }

  private static getVariabilityLabel(level: string): string {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
    };
    return labels[level as keyof typeof labels] || 'Desconhecida';
  }

  private static generateErrorSection(): string {
    return `
      <div class="advanced-stats-section error">
        <div class="stats-title">❌ Erro nas Estatísticas</div>
        <div class="error-message">
          <p>Ocorreu um erro ao processar as estatísticas avançadas.</p>
          <p>As estatísticas básicas ainda estão disponíveis no relatório.</p>
        </div>
      </div>
    `;
  }
}
