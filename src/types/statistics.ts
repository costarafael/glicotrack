import { MealType } from './index';

/**
 * Estatísticas básicas existentes (referência do PDFGenerator)
 */
export interface MonthlyStatistics {
  totalDays: number;
  glucoseReadings: number;
  averageGlucose: number;
  totalBolus: number;
  totalBasal: number;
}

/**
 * Estatísticas de refeição individual
 */
export interface MealStats {
  total: number;      // Total de unidades de bolus para esta refeição
  average: number;    // Média de unidades por aplicação
  count: number;      // Número de aplicações desta refeição
}

/**
 * Análise de cobertura mensal
 */
export interface CoverageAnalysis {
  daysWithRecords: number;      // Número de dias que têm registros
  totalDaysInMonth: number;     // Total de dias no mês
  coveragePercentage: number;   // Percentual de cobertura (0-100)
  missingDays: number[];        // Array com os dias que não têm registros
  consecutiveDays: number;      // Maior sequência consecutiva de dias com registro
}

/**
 * Análise de padrões por dia da semana
 */
export interface WeekdayAnalysis {
  recordsPerWeekday: Record<number, number>;  // 0=Domingo, 1=Segunda, etc.
  mostActiveWeekday: number;                  // Dia da semana com mais registros
  leastActiveWeekday: number;                 // Dia da semana com menos registros
  weekdayNames: Record<number, string>;       // Nomes dos dias por extenso
}

/**
 * Estatísticas avançadas que estendem as básicas
 */
export interface AdvancedStatistics extends MonthlyStatistics {
  // Médias diárias
  averageDailyBolus: number;    // Bolus médio por dia com registros
  averageDailyBasal: number;    // Basal médio por dia com registros

  // Análise por tipo de refeição
  bolusPerMealType: Record<MealType, MealStats>;

  // Análises avançadas
  coverage: CoverageAnalysis;
  weekdayAnalysis: WeekdayAnalysis;

  // Análise temporal
  averageGlucoseByTimeOfDay: Record<string, number>; // 'morning', 'afternoon', 'evening', 'night'
  glucoseVariability: number;   // Coeficiente de variação da glicose
}

/**
 * Configuração de gráfico base
 */
export interface BaseChartConfig {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

/**
 * Configuração específica para gráfico de linha
 */
export interface LineChartConfig extends BaseChartConfig {
  chartProps: any;
  xAxisProps: any;
  yAxisProps: any;
  lineProps: any;
}

/**
 * Configuração específica para gráfico de barras
 */
export interface BarChartConfig extends BaseChartConfig {
  chartProps: any;
  xAxisProps: any;
  yAxisProps: any;
  barProps: any;
}

/**
 * Configuração específica para gráfico de pizza
 */
export interface PieChartConfig extends BaseChartConfig {
  chartProps: any;
  pieProps: any;
  labelComponent?: any;
}

/**
 * Configuração específica para gráfico de área
 */
export interface AreaChartConfig extends BaseChartConfig {
  chartProps: any;
  xAxisProps: any;
  yAxisProps: any;
  areaProps: any;
}

/**
 * Dados de um gráfico individual
 */
export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  config: LineChartConfig | BarChartConfig | PieChartConfig | AreaChartConfig;
  svgString: string;
  description?: string;
}

/**
 * Ponto de dados para gráfico de linha/área
 */
export interface LineDataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
}

/**
 * Dados para gráfico de barras
 */
export interface BarDataPoint {
  x: string;
  y: number;
  fill?: string;
  label?: string;
}

/**
 * Dados para gráfico de pizza
 */
export interface PieDataPoint {
  x: string;
  y: number;
  fill?: string;
  label?: string;
}

/**
 * Resultado da análise de tendências
 */
export interface TrendAnalysis {
  slope: number;           // Inclinação da linha de tendência
  direction: 'up' | 'down' | 'stable';  // Direção da tendência
  correlation: number;     // Correlação (-1 a 1)
  significance: 'high' | 'medium' | 'low';  // Significância estatística
}

/**
 * Configurações de exportação do PDF
 */
export interface PDFExportConfig {
  includeCharts: boolean;
  includeAdvancedStats: boolean;
  chartQuality: 'low' | 'medium' | 'high';
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
}
