// Export all statistics services for easy importing
export { AdvancedStatisticsCalculator } from './AdvancedStatisticsCalculator';
export { MealAnalyzer } from './MealAnalyzer';
export { CoverageAnalyzer } from './CoverageAnalyzer';
export { CohortAnalyzer } from './CohortAnalyzer';

// Re-export types for convenience
export type {
  AdvancedStatistics,
  MonthlyStatistics,
  MealStats,
  CoverageAnalysis,
  WeekdayAnalysis,
  LineDataPoint,
  BarDataPoint,
  PieDataPoint,
  ChartData,
  TrendAnalysis,
  PDFExportConfig,
} from '../../types/statistics';
