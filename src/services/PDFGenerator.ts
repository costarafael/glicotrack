import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { DailyLog } from '../types';
import { AdvancedStatistics } from '../types/statistics';
import { getMonthName } from '../utils/dateHelpers';
import { formatGlucoseValue, formatInsulinUnits } from '../utils/formatters';
import { MEAL_LABELS } from '../constants/mealTypes';
import { MediaStoreService } from './MediaStoreService';
import { ToastService } from './ToastService';
import { AdvancedStatisticsCalculator } from './statistics/AdvancedStatisticsCalculator';
import { ChartGenerator } from './charts/ChartGenerator';
import { StatsSectionGenerator } from './pdf/StatsSectionGenerator';
import { ChartsSectionGenerator } from './pdf/ChartsSectionGenerator';

export interface MonthlyStatistics {
  totalDays: number;
  glucoseReadings: number;
  averageGlucose: number;
  totalBolus: number;
  totalBasal: number;
}

export interface PDFExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface PDFGenerationOptions {
  includeCharts?: boolean;
  includeAdvancedStats?: boolean;
  reportType?: 'basic' | 'advanced';
}

export class PDFGenerator {
  private static calculateTimeDifference(
    current: Date,
    previous: Date,
  ): string {
    const diffInMinutes = Math.abs(
      (current.getTime() - previous.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return `+${Math.round(diffInMinutes)}min`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = Math.round(diffInMinutes % 60);
      return minutes > 0 ? `+${hours}h${minutes}min` : `+${hours}h`;
    }
  }

  private static organizeEntriesChronologically(log: DailyLog) {
    const allEntries: Array<{
      timestamp: Date;
      type: 'glucose' | 'bolus' | 'basal';
      data: any;
    }> = [];

    // Adicionar entradas de glicose
    log.glucoseEntries.forEach(entry => {
      allEntries.push({
        timestamp: entry.timestamp,
        type: 'glucose',
        data: entry,
      });
    });

    // Adicionar entradas de bolus
    log.bolusEntries.forEach(entry => {
      allEntries.push({
        timestamp: entry.timestamp,
        type: 'bolus',
        data: entry,
      });
    });

    // Adicionar entrada basal
    if (log.basalEntry) {
      allEntries.push({
        timestamp: log.basalEntry.timestamp,
        type: 'basal',
        data: log.basalEntry,
      });
    }

    // Ordenar por timestamp (mais antigos primeiro)
    return allEntries.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }

  static calculateStatistics(monthlyLogs: DailyLog[]): MonthlyStatistics {
    if (monthlyLogs.length === 0) {
      return {
        totalDays: 0,
        glucoseReadings: 0,
        averageGlucose: 0,
        totalBolus: 0,
        totalBasal: 0,
      };
    }

    let glucoseReadings = 0;
    let totalGlucose = 0;
    let totalBolus = 0;
    let totalBasal = 0;

    monthlyLogs.forEach(log => {
      glucoseReadings += log.glucoseEntries.length;
      totalGlucose += log.glucoseEntries.reduce(
        (sum, entry) => sum + entry.value,
        0,
      );
      totalBolus += log.bolusEntries.reduce(
        (sum, entry) => sum + entry.units,
        0,
      );
      if (log.basalEntry) {
        totalBasal += log.basalEntry.units;
      }
    });

    return {
      totalDays: monthlyLogs.length,
      glucoseReadings,
      averageGlucose: glucoseReadings > 0 ? totalGlucose / glucoseReadings : 0,
      totalBolus,
      totalBasal,
    };
  }

  /**
   * Calcula estatísticas avançadas usando o novo sistema
   */
  static calculateAdvancedStatistics(
    monthlyLogs: DailyLog[],
    month: number,
    year: number,
  ): AdvancedStatistics {
    console.log(
      `📊 [PDFGenerator] Calculating advanced statistics for ${monthlyLogs.length} logs`,
    );
    return AdvancedStatisticsCalculator.calculate(monthlyLogs, month, year);
  }

  /**
   * Gera conteúdo HTML avançado com gráficos
   */
  private static async generateAdvancedHTMLContent(
    monthlyLogs: DailyLog[],
    month: number,
    year: number,
    statistics: AdvancedStatistics,
    options: PDFGenerationOptions = {},
  ): Promise<string> {
    const monthName = getMonthName(month);
    const { includeCharts = true, includeAdvancedStats = true } = options;

    console.log(
      `📊 [PDFGenerator] Generating advanced HTML content for ${monthName} ${year}`,
    );

    try {
      // Gerar gráficos se solicitado
      let chartsHTML = '';
      if (includeCharts) {
        console.log(`📈 [PDFGenerator] Generating charts...`);
        const chartGenerator = new ChartGenerator();
        const charts = await chartGenerator.generateAllCharts(
          statistics,
          monthlyLogs,
        );
        chartsHTML = ChartsSectionGenerator.generate(charts);
      }

      // Gerar seção de estatísticas avançadas
      let statsHTML = '';
      if (includeAdvancedStats) {
        console.log(
          `📊 [PDFGenerator] Generating advanced statistics section...`,
        );
        statsHTML = StatsSectionGenerator.generate(statistics);
      } else {
        // Fallback para estatísticas básicas
        statsHTML = this.generateBasicStatsSection(statistics);
      }

      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Relatório GlicoTrack Avançado - ${monthName} ${year}</title>
            <style>
              ${this.generateAdvancedStyles()}
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Relatório GlicoTrack Avançado</div>
              <div class="subtitle">${monthName} ${year}</div>
            </div>

            ${statsHTML}
            ${chartsHTML}

            <div class="logs-section">
              <div class="logs-title">📋 Registros Detalhados</div>
              ${this.generateDetailedLogs(monthlyLogs)}
            </div>
          </body>
        </html>
      `;

      console.log(
        `✅ [PDFGenerator] Advanced HTML content generated successfully`,
      );
      return htmlContent;
    } catch (error: any) {
      console.error(
        `❌ [PDFGenerator] Error generating advanced HTML:`,
        error?.message || 'Unknown error',
      );
      // Fallback para conteúdo básico
      return this.generateHTMLContent(monthlyLogs, month, year, statistics);
    }
  }

  /**
   * Gera seção básica de estatísticas (compatibilidade)
   */
  private static generateBasicStatsSection(
    statistics: AdvancedStatistics | MonthlyStatistics,
  ): string {
    return `
      <div class="stats-section">
        <div class="stats-title">Estatísticas do Mês</div>
        <div class="stat-item">
          <span class="stat-value">${
            statistics.totalDays
          }</span> Dias com registros
        </div>
        <div class="stat-item">
          <span class="stat-value">${
            statistics.glucoseReadings
          }</span> Medições de glicose
        </div>
        <div class="stat-item">
          <span class="stat-value">${
            statistics.averageGlucose > 0
              ? formatGlucoseValue(Math.round(statistics.averageGlucose))
              : '-'
          }</span> Glicose média
        </div>
        <div class="stat-item">
          <span class="stat-value">${
            statistics.totalBolus > 0
              ? formatInsulinUnits(statistics.totalBolus)
              : '-'
          }</span> Total bolus
        </div>
        <div class="stat-item">
          <span class="stat-value">${
            statistics.totalBasal > 0
              ? formatInsulinUnits(statistics.totalBasal)
              : '-'
          }</span> Total basal
        </div>
        ${
          'averageDailyBolus' in statistics
            ? `
        <div class="stat-item">
          <span class="stat-value">${
            statistics.averageDailyBolus > 0
              ? formatInsulinUnits(statistics.averageDailyBolus)
              : '-'
          }</span> Bolus médio diário
        </div>
        <div class="stat-item">
          <span class="stat-value">${
            statistics.averageDailyBasal > 0
              ? formatInsulinUnits(statistics.averageDailyBasal)
              : '-'
          }</span> Basal médio diário
        </div>`
            : ''
        }
      </div>
    `;
  }

  /**
   * Gera logs detalhados (extraído para reutilização)
   */
  private static generateDetailedLogs(monthlyLogs: DailyLog[]): string {
    if (monthlyLogs.length === 0) {
      return `
        <div class="no-data">
          Nenhum registro encontrado para este mês.
        </div>
      `;
    }

    let logsHTML = '';
    monthlyLogs.forEach(log => {
      const logDate = new Date(log.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        weekday: 'long',
      });

      logsHTML += `
        <div class="day-entry">
          <div class="day-date">${logDate}</div>
          <table class="entries-table">
            <thead class="table-header">
              <tr>
                <th>Hora</th>
                <th>Evento</th>
                <th>Refeição</th>
                <th>Valor</th>
                <th>Espaço de tempo</th>
              </tr>
            </thead>
            <tbody>
      `;

      const chronologicalEntries = this.organizeEntriesChronologically(log);
      chronologicalEntries.forEach((entry, index) => {
        const time = entry.timestamp.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        let timeDiff = '';
        if (index > 0) {
          timeDiff = this.calculateTimeDifference(
            entry.timestamp,
            chronologicalEntries[index - 1].timestamp,
          );
        }

        if (entry.type === 'glucose') {
          logsHTML += `
            <tr class="table-row">
              <td>${time}</td>
              <td><span class="glucose-icon">💧</span>Glicose</td>
              <td>-</td>
              <td>${formatGlucoseValue(entry.data.value)}</td>
              <td>${timeDiff}</td>
            </tr>
          `;
        } else if (entry.type === 'bolus') {
          const mealLabel =
            MEAL_LABELS[entry.data.mealType as keyof typeof MEAL_LABELS] ||
            'Correção';
          logsHTML += `
            <tr class="table-row">
              <td>${time}</td>
              <td>Bolus</td>
              <td>${mealLabel}</td>
              <td>${formatInsulinUnits(entry.data.units)}</td>
              <td>${timeDiff}</td>
            </tr>
          `;
        } else if (entry.type === 'basal') {
          logsHTML += `
            <tr class="table-row">
              <td>${time}</td>
              <td>Basal</td>
              <td>-</td>
              <td>${formatInsulinUnits(entry.data.units)}</td>
              <td>${timeDiff}</td>
            </tr>
          `;
        }
      });

      logsHTML += `
            </tbody>
          </table>
      `;

      if (log.notes) {
        logsHTML += `
          <div class="notes">
            <span class="notes-icon">📝</span>${log.notes}
          </div>
        `;
      }

      logsHTML += '</div>';
    });

    return logsHTML;
  }

  /**
   * Gera estilos avançados incluindo CSS para gráficos
   */
  private static generateAdvancedStyles(): string {
    return `
      ${this.generateStyles()}
      ${StatsSectionGenerator.generateAdvancedStatsCSS()}
      ${ChartsSectionGenerator.generateChartsCSS()}
    `;
  }

  private static generateStyles(): string {
    return `
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Figtree:wght@400;500;600;700&display=swap');

      body {
        font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
        margin: 40px 30px;
        color: #000;
        font-size: 10px;
        line-height: 1.4;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 1px solid #000;
        padding-bottom: 20px;
        page-break-after: avoid;
      }
      .title {
        font-size: 16px;
        font-weight: 700;
        color: #000;
        margin-bottom: 10px;
        font-family: 'Figtree', sans-serif;
      }
      .subtitle {
        display: inline-block;
        font-size: 14px;
        font-weight: 700;
        color: #ffffff;
        background-color: #374151;
        padding: 8px 16px;
        border-radius: 6px;
        font-family: 'Figtree', sans-serif;
      }
      .stats-section {
        border: 1px solid #000;
        padding: 15px;
        margin-bottom: 25px;
        page-break-inside: avoid;
      }
      .stats-title {
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #000;
        font-family: 'Figtree', sans-serif;
      }
      .stat-item {
        margin-bottom: 3px;
        padding: 1px 0;
        line-height: 1.5;
        font-family: 'Figtree', sans-serif;
      }
      .stat-value {
        font-weight: 600;
        color: #000;
        font-size: 10px;
        margin-right: 8px;
      }
      .stat-label {
        font-weight: 400;
        font-size: 10px;
      }
      .logs-section {
        margin-top: 25px;
      }
      .logs-title {
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 15px;
        color: #000;
        font-family: 'Figtree', sans-serif;
      }
      .day-entry {
        border-left: 3px solid #000;
        margin-bottom: 15px;
        padding: 10px 15px;
        page-break-inside: avoid;
      }
      .day-date {
        font-size: 11px;
        font-weight: 600;
        color: #000;
        margin-bottom: 8px;
        font-family: 'Figtree', sans-serif;
      }
      .entries-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
      }
      .table-header {
        background-color: #f5f5f5;
      }
      .table-header th {
        padding: 4px 6px;
        text-align: left;
        font-size: 8px;
        font-weight: 500;
        font-family: 'Figtree', sans-serif;
        border-bottom: 1px solid #000;
      }
      .table-row td {
        padding: 3px 6px;
        font-size: 9px;
        font-family: 'IBM Plex Mono', monospace;
        border-bottom: 1px dotted #ccc;
      }
      .glucose-icon {
        font-size: 7px;
        color: #000;
        margin-right: 3px;
      }
      .notes {
        margin-top: 8px;
        padding: 6px;
        border-left: 2px solid #000;
        font-style: normal;
        font-size: 9px;
        font-family: 'Figtree', sans-serif;
      }
      .notes-icon {
        font-size: 8px;
        margin-right: 4px;
        color: #000;
      }
      .no-data {
        text-align: center;
        color: #000;
        font-style: italic;
        margin: 15px 0;
        font-size: 10px;
        font-family: 'Figtree', sans-serif;
      }
    `;
  }

  private static generateHTMLContent(
    monthlyLogs: DailyLog[],
    month: number,
    year: number,
    statistics: MonthlyStatistics,
  ): string {
    const monthName = getMonthName(month);

    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório GlicoTrack - ${monthName} ${year}</title>
          <style>${this.generateStyles()}</style>
        </head>
        <body>
          <div class="header">
            <div class="title">Relatório GlicoTrack</div>
            <div class="subtitle">${monthName} ${year}</div>
          </div>

          <div class="stats-section">
            <div class="stats-title">Estatísticas do Mês</div>
            <div class="stat-item">
              <span class="stat-value">${
                statistics.totalDays
              }</span> Dias com registros
            </div>
            <div class="stat-item">
              <span class="stat-value">${
                statistics.glucoseReadings
              }</span> Medições de glicose
            </div>
            <div class="stat-item">
              <span class="stat-value">${
                statistics.averageGlucose > 0
                  ? formatGlucoseValue(Math.round(statistics.averageGlucose))
                  : '-'
              }</span> Glicose média
            </div>
            <div class="stat-item">
              <span class="stat-value">${
                statistics.totalBolus > 0
                  ? formatInsulinUnits(statistics.totalBolus)
                  : '-'
              }</span> Total bolus
            </div>
            <div class="stat-item">
              <span class="stat-value">${
                statistics.totalBasal > 0
                  ? formatInsulinUnits(statistics.totalBasal)
                  : '-'
              }</span> Total basal
            </div>
          </div>

          <div class="logs-section">
            <div class="logs-title">Registros Detalhados</div>`;

    if (monthlyLogs.length > 0) {
      monthlyLogs.forEach(log => {
        const logDate = new Date(log.date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          weekday: 'long',
        });

        htmlContent += `
          <div class="day-entry">
            <div class="day-date">${logDate}</div>
            <table class="entries-table">
              <thead class="table-header">
                <tr>
                  <th>Hora</th>
                  <th>Evento</th>
                  <th>Refeição</th>
                  <th>Valor</th>
                  <th>Espaço de tempo</th>
                </tr>
              </thead>
              <tbody>`;

        // Organizar entradas cronologicamente
        const chronologicalEntries = this.organizeEntriesChronologically(log);

        chronologicalEntries.forEach((entry, index) => {
          const time = entry.timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          // Calcular diferença de tempo se não for o primeiro registro
          let timeDiff = '';
          if (index > 0) {
            timeDiff = this.calculateTimeDifference(
              entry.timestamp,
              chronologicalEntries[index - 1].timestamp,
            );
          }

          if (entry.type === 'glucose') {
            htmlContent += `
              <tr class="table-row">
                <td>${time}</td>
                <td><span class="glucose-icon">💧</span>Glicose</td>
                <td>-</td>
                <td>${formatGlucoseValue(entry.data.value)}</td>
                <td>${timeDiff}</td>
              </tr>`;
          } else if (entry.type === 'bolus') {
            const mealLabel =
              MEAL_LABELS[entry.data.mealType as keyof typeof MEAL_LABELS] ||
              'Correção';
            htmlContent += `
              <tr class="table-row">
                <td>${time}</td>
                <td>Bolus</td>
                <td>${mealLabel}</td>
                <td>${formatInsulinUnits(entry.data.units)}</td>
                <td>${timeDiff}</td>
              </tr>`;
          } else if (entry.type === 'basal') {
            htmlContent += `
              <tr class="table-row">
                <td>${time}</td>
                <td>Basal</td>
                <td>-</td>
                <td>${formatInsulinUnits(entry.data.units)}</td>
                <td>${timeDiff}</td>
              </tr>`;
          }
        });

        htmlContent += `
              </tbody>
            </table>`;

        // Adicionar notas se existirem
        if (log.notes) {
          htmlContent += `
            <div class="notes">
              <span class="notes-icon">📝</span>${log.notes}
            </div>`;
        }

        htmlContent += `
            </div>
          </div>`;
      });
    } else {
      htmlContent += `
        <div class="no-data">
          Nenhum registro encontrado para este mês.
        </div>`;
    }

    htmlContent += `
          </div>
        </body>
      </html>`;

    return htmlContent;
  }

  /**
   * Gera PDF do relatório mensal (versão avançada)
   */
  static async generateAdvancedMonthlyReport(
    monthlyLogs: DailyLog[],
    month: number,
    year: number,
    options: PDFGenerationOptions = {},
    exportType: 'save' | 'share' = 'save',
  ): Promise<PDFExportResult> {
    try {
      const {
        includeCharts = true,
        includeAdvancedStats = true,
        reportType = 'advanced',
      } = options;

      console.log(
        `📊 [PDFGenerator] Generating ${reportType} report: ${getMonthName(
          month,
        )} ${year}`,
      );
      console.log(
        `📊 [PDFGenerator] Charts: ${
          includeCharts ? 'YES' : 'NO'
        }, Advanced Stats: ${includeAdvancedStats ? 'YES' : 'NO'}`,
      );

      // 1. Calcular estatísticas avançadas
      const statistics = this.calculateAdvancedStatistics(
        monthlyLogs,
        month,
        year,
      );

      // 2. Gerar HTML avançado
      const htmlContent = await this.generateAdvancedHTMLContent(
        monthlyLogs,
        month,
        year,
        statistics,
        options,
      );

      // 3. Configurar nome do arquivo
      const filePrefix =
        reportType === 'advanced' ? 'GlicoTrack_Avancado' : 'GlicoTrack';
      const fileName = `${filePrefix}_${getMonthName(month)}_${year}.pdf`;

      // 4. Gerar PDF
      const tempPdfOptions = {
        html: htmlContent,
        fileName: fileName,
        directory: 'Documents',
        width: 595, // A4
        height: 842, // A4
        base64: false,
      };

      console.log(`📄 [PDFGenerator] Generating advanced PDF...`);
      const tempPdf = await RNHTMLtoPDF.convert(tempPdfOptions);
      console.log(
        `📄 [PDFGenerator] Advanced PDF generated: ${tempPdf.filePath}`,
      );

      // 5. Salvar usando MediaStore
      if (exportType === 'save') {
        const saveResult = await MediaStoreService.savePdf(
          tempPdf.filePath,
          fileName,
        );

        if (saveResult.success) {
          ToastService.showPdfSaveSuccess();
          console.log(`✅ [PDFGenerator] Advanced report saved successfully!`);
        } else {
          ToastService.showPdfSaveError(
            saveResult.error || 'Erro desconhecido',
          );
          console.error(`❌ [PDFGenerator] Save error: ${saveResult.error}`);
        }

        await MediaStoreService.cleanupTempFile(tempPdf.filePath);

        return {
          success: saveResult.success,
          filePath: saveResult.filePath,
          error: saveResult.error,
        };
      } else {
        const saveResult = await MediaStoreService.savePdf(
          tempPdf.filePath,
          fileName,
        );

        if (saveResult.success) {
          ToastService.showSuccess(
            'PDF Compartilhado',
            'Relatório avançado pronto',
          );
        }

        await MediaStoreService.cleanupTempFile(tempPdf.filePath);

        return {
          success: saveResult.success,
          filePath: saveResult.filePath,
          error: saveResult.error,
        };
      }
    } catch (error: any) {
      console.error('❌ [PDFGenerator] Error generating advanced PDF:', error);
      ToastService.showPdfSaveError(error?.message || 'Erro desconhecido');

      return {
        success: false,
        error: error?.message || 'Erro ao gerar relatório avançado',
      };
    }
  }

  /**
   * Gera PDF do relatório mensal básico (compatibilidade)
   */
  static async generateMonthlyReport(
    monthlyLogs: DailyLog[],
    month: number,
    year: number,
    exportType: 'save' | 'share' = 'save',
  ): Promise<PDFExportResult> {
    try {
      console.log(
        `📊 [PDFGenerator] Iniciando geração de relatório básico: ${getMonthName(
          month,
        )} ${year}`,
      );

      // 1. Calcular estatísticas básicas
      const statistics = this.calculateStatistics(monthlyLogs);

      // 2. Gerar HTML do relatório
      const htmlContent = this.generateHTMLContent(
        monthlyLogs,
        month,
        year,
        statistics,
      );

      // 3. Configurar nome do arquivo
      const fileName = `GlicoTrack_${getMonthName(month)}_${year}.pdf`;

      // 4. Gerar PDF em pasta temporária (sempre usar Documents como staging)
      const tempPdfOptions = {
        html: htmlContent,
        fileName: fileName,
        directory: 'Documents', // Staging area conforme documentação
        width: 595, // A4
        height: 842, // A4
        base64: false,
      };

      console.log(`📄 [PDFGenerator] Gerando PDF temporário...`);
      const tempPdf = await RNHTMLtoPDF.convert(tempPdfOptions);
      console.log(`📄 [PDFGenerator] PDF gerado em: ${tempPdf.filePath}`);

      // 5. Salvar usando MediaStore ou compartilhar
      if (exportType === 'save') {
        const saveResult = await MediaStoreService.savePdf(
          tempPdf.filePath,
          fileName,
        );

        if (saveResult.success) {
          ToastService.showPdfSaveSuccess();
          console.log(`✅ [PDFGenerator] Relatório salvo com sucesso!`);
        } else {
          ToastService.showPdfSaveError(
            saveResult.error || 'Erro desconhecido',
          );
          console.error(
            `❌ [PDFGenerator] Erro ao salvar: ${saveResult.error}`,
          );
        }

        // 6. Limpar arquivo temporário (sempre)
        await MediaStoreService.cleanupTempFile(tempPdf.filePath);

        return {
          success: saveResult.success,
          filePath: saveResult.filePath,
          error: saveResult.error,
        };
      } else {
        // Modo share - usar MediaStore mesmo assim para garantir acesso
        const saveResult = await MediaStoreService.savePdf(
          tempPdf.filePath,
          fileName,
        );

        if (saveResult.success) {
          ToastService.showSuccess(
            'PDF Compartilhado',
            'Relatório pronto para compartilhamento',
          );
        }

        // Limpar arquivo temporário
        await MediaStoreService.cleanupTempFile(tempPdf.filePath);

        return {
          success: saveResult.success,
          filePath: saveResult.filePath,
          error: saveResult.error,
        };
      }
    } catch (error: any) {
      console.error('❌ [PDFGenerator] Erro na geração do PDF:', error);
      ToastService.showPdfSaveError(error?.message || 'Erro desconhecido');

      return {
        success: false,
        error: error?.message || 'Erro ao gerar relatório PDF',
      };
    }
  }
}
