import { ChartData } from '../../types/statistics';
import { ChartSVGExporter } from '../charts/ChartSVGExporter';

/**
 * Gerador de Seção de Gráficos para PDF
 *
 * Responsável por gerar HTML formatado com dashboard de gráficos
 * para o relatório PDF, incluindo layout responsivo e tratamento de erros.
 */
export class ChartsSectionGenerator {
  private static readonly DEFAULT_COLUMNS = 2;
  private static readonly CHART_SPACING = 15;

  /**
   * Gera HTML completo da seção de gráficos (dashboard)
   */
  static generate(
    charts: ChartData[],
    options?: {
      title?: string;
      columns?: number;
      showDescriptions?: boolean;
      containerWidth?: number;
    },
  ): string {
    const {
      title = '📈 Dashboard Mensal',
      columns = 1, // Forçar 1 coluna para PDF
      showDescriptions = true,
      containerWidth = 550,
    } = options || {};

    console.log(
      `📊 [ChartsSectionGenerator] Generating charts section with ${charts.length} charts`,
    );

    try {
      if (charts.length === 0) {
        return this.generateEmptyChartsSection(title);
      }

      // Para PDF, usar sempre 1 coluna com largura completa
      const chartWidth = Math.min(containerWidth - 40, 500);
      const chartHeight = 280;

      let html = `
        <div class="charts-section">
          <div class="section-title">${this.escapeHtml(title)}</div>

          ${this.generateChartsGrid(charts, {
            columns: 1,
            chartWidth: chartWidth,
            chartHeight: chartHeight,
            showDescriptions,
          })}
        </div>
      `;

      console.log(
        `✅ [ChartsSectionGenerator] Charts section generated successfully`,
      );
      return html;
    } catch (error: any) {
      console.error(
        `❌ [ChartsSectionGenerator] Error generating charts section:`,
        error?.message || 'Unknown error',
      );
      return this.generateErrorChartsSection(title);
    }
  }

  /**
   * Gera grid de gráficos com layout responsivo
   */
  private static generateChartsGrid(
    charts: ChartData[],
    options: {
      columns: number;
      chartWidth: number;
      chartHeight: number;
      showDescriptions: boolean;
    },
  ): string {
    const { columns, chartWidth, chartHeight, showDescriptions } = options;

    let html = `
      <div class="charts-grid" style="
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        gap: ${this.CHART_SPACING}px;
        margin-top: 20px;
      ">`;

    charts.forEach((chart, index) => {
      html += this.generateSingleChartHTML(chart, {
        width: chartWidth,
        height: chartHeight,
        showDescription: showDescriptions,
        index: index + 1,
      });

      // Quebra de linha a cada 'columns' gráficos (para flexbox)
      if ((index + 1) % columns === 0 && index < charts.length - 1) {
        html += `<div class="chart-break"></div>`;
      }
    });

    html += '</div>';
    return html;
  }

  /**
   * Gera HTML para um único gráfico
   */
  private static generateSingleChartHTML(
    chart: ChartData,
    options: {
      width: number;
      height: number;
      showDescription: boolean;
      index: number;
    },
  ): string {
    const { width, height, showDescription } = options;

    try {
      // Validar se o SVG é válido
      if (!ChartSVGExporter.isValidSVG(chart.svgString)) {
        console.warn(
          `⚠️ [ChartsSectionGenerator] Invalid SVG for chart: ${chart.title}`,
        );
        return this.generateChartError(chart.title, width, height);
      }

      // Otimizar SVG para PDF
      const optimizedSVG = ChartSVGExporter.optimizeSVGForPDF(
        chart.svgString,
      );

      return `
        <div class="chart-container chart-${chart.type}" style="
          width: ${width}px;
          margin-bottom: 25px;
          page-break-inside: avoid;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        ">
          <!-- Chart Header -->
          <div class="chart-header" style="
            margin-bottom: 12px;
            text-align: center;
          ">
            <div class="chart-title" style="
              font-size: 12px;
              font-weight: 600;
              color: #374151;
              font-family: 'Figtree', sans-serif;
            ">
              ${this.escapeHtml(chart.title)}
            </div>
          </div>

          <!-- Chart SVG Container -->
          <div class="chart-svg-container" style="
            width: 100%;
            height: ${height}px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            margin-bottom: 10px;
            background: #fafafa;
            border-radius: 4px;
            border: 1px solid #f0f0f0;
          ">
            ${optimizedSVG}
          </div>

          <!-- Chart Description -->
          ${
            showDescription && chart.description
              ? `
            <div class="chart-description" style="
              font-size: 9px;
              color: #6b7280;
              text-align: center;
              font-style: italic;
              line-height: 1.3;
              font-family: 'Figtree', sans-serif;
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px solid #f3f4f6;
            ">
              ${this.escapeHtml(chart.description)}
            </div>`
              : ''
          }
        </div>
      `;
    } catch (error: any) {
      console.error(
        `❌ [ChartsSectionGenerator] Error generating single chart HTML:`,
        error?.message || 'Unknown error',
      );
      return this.generateChartError(chart.title, width, height);
    }
  }

  /**
   * Gera seção vazia quando não há gráficos
   */
  private static generateEmptyChartsSection(title: string): string {
    return `
      <div class="charts-section empty">
        <div class="section-title">${this.escapeHtml(title)}</div>
        <div class="empty-charts-container" style="
          text-align: center;
          padding: 40px 20px;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          background: #f9fafb;
          margin: 20px 0;
        ">
          <div class="empty-icon" style="
            font-size: 48px;
            margin-bottom: 15px;
            opacity: 0.5;
          ">📊</div>
          <div class="empty-title" style="
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            margin-bottom: 8px;
            font-family: 'Figtree', sans-serif;
          ">
            Nenhum Gráfico Disponível
          </div>
          <div class="empty-message" style="
            font-size: 11px;
            color: #9ca3af;
            line-height: 1.4;
            font-family: 'Figtree', sans-serif;
          ">
            Os gráficos serão gerados quando houver<br>
            dados suficientes para análise visual.
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera seção de erro quando há falha na geração
   */
  private static generateErrorChartsSection(title: string): string {
    return `
      <div class="charts-section error">
        <div class="section-title">${this.escapeHtml(title)}</div>
        <div class="error-charts-container" style="
          text-align: center;
          padding: 40px 20px;
          border: 2px solid #fca5a5;
          border-radius: 8px;
          background: #fef2f2;
          margin: 20px 0;
        ">
          <div class="error-icon" style="
            font-size: 48px;
            margin-bottom: 15px;
          ">❌</div>
          <div class="error-title" style="
            font-size: 14px;
            font-weight: 600;
            color: #dc2626;
            margin-bottom: 8px;
            font-family: 'Figtree', sans-serif;
          ">
            Erro na Geração dos Gráficos
          </div>
          <div class="error-message" style="
            font-size: 11px;
            color: #7f1d1d;
            line-height: 1.4;
            font-family: 'Figtree', sans-serif;
          ">
            Houve um problema técnico na geração do dashboard.<br>
            As estatísticas textuais permanecem disponíveis.
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera HTML de erro para um gráfico específico
   */
  private static generateChartError(
    title: string,
    width: number,
    height: number,
  ): string {
    return `
      <div class="chart-container error" style="
        width: ${width}px;
        height: ${height + 80}px;
        margin-bottom: 25px;
        border: 2px solid #fca5a5;
        border-radius: 8px;
        padding: 15px;
        background: #fef2f2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      ">
        <div class="error-icon" style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
        <div class="error-title" style="
          font-size: 12px;
          font-weight: 600;
          color: #dc2626;
          margin-bottom: 5px;
          text-align: center;
          font-family: 'Figtree', sans-serif;
        ">
          Erro no Gráfico
        </div>
        <div class="error-subtitle" style="
          font-size: 10px;
          color: #7f1d1d;
          text-align: center;
          font-family: 'Figtree', sans-serif;
        ">
          ${this.escapeHtml(title)}
        </div>
      </div>
    `;
  }

  /**
   * Gera CSS específico para seção de gráficos
   */
  static generateChartsCSS(): string {
    return `
      /* Charts Section */
      .charts-section {
        margin: 25px 0;
        font-family: 'Figtree', sans-serif;
        page-break-inside: avoid;
      }

      .section-title {
        font-size: 16px;
        font-weight: 700;
        color: #374151;
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 8px;
        border-bottom: 2px solid #10b981;
      }

      /* Charts Grid - Single Column for PDF */
      .charts-grid {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 30px;
        margin: 0 auto;
        max-width: 520px;
      }

      .chart-break {
        display: none; /* Not needed in single column */
      }

      /* Individual Chart Container */
      .chart-container {
        width: 100%;
        max-width: 500px;
        break-inside: avoid;
        page-break-inside: avoid;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 25px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .chart-header {
        text-align: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #f3f4f6;
      }

      .chart-title {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin: 0;
        line-height: 1.3;
        font-family: 'Figtree', sans-serif;
      }

      /* Chart SVG Container - Optimized for single column */
      .chart-svg-container {
        width: 100%;
        min-height: 250px;
        max-height: 280px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fafafa;
        border: 1px solid #f0f0f0;
        border-radius: 6px;
        overflow: visible;
        position: relative;
        padding: 15px;
        margin-bottom: 15px;
      }

      .chart-svg-container svg {
        max-width: 100%;
        max-height: 100%;
        height: auto;
        width: auto;
        display: block;
      }

      .chart-description {
        font-size: 10px;
        color: #6b7280;
        text-align: center;
        font-style: italic;
        line-height: 1.4;
        font-family: 'Figtree', sans-serif;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #f3f4f6;
      }

      /* Chart Type Specific Styles */
      .chart-line .chart-svg-container {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      }

      .chart-bar .chart-svg-container {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      }

      .chart-pie .chart-svg-container {
        background: linear-gradient(135deg, #f7fee7 0%, #ecfccb 100%);
      }

      .chart-area .chart-svg-container {
        background: linear-gradient(135deg, #fef7ff 0%, #fae8ff 100%);
      }

      /* Empty and Error States */
      .charts-section.empty .section-title {
        border-bottom-color: #9ca3af;
      }

      .charts-section.error .section-title {
        border-bottom-color: #ef4444;
      }

      .empty-charts-container,
      .error-charts-container {
        margin: 20px auto;
        max-width: 400px;
      }

      .empty-icon,
      .error-icon {
        display: block;
        margin: 0 auto;
      }

      /* PDF-specific optimizations */
      @media print {
        .charts-section {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .chart-container {
          break-inside: avoid;
          page-break-inside: avoid;
          box-shadow: none;
          border: 1px solid #d1d5db;
          margin-bottom: 30px;
        }

        .charts-grid {
          gap: 25px;
        }

        .chart-svg-container {
          overflow: visible;
          border: none;
          padding: 10px;
          min-height: 260px;
        }

        .chart-svg-container svg {
          max-width: 100%;
          max-height: 100%;
        }
      }
    `;
  }

  // Helper methods
  private static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  private static getChartTypeColor(type: string): string {
    const colors = {
      line: '#3b82f6',
      bar: '#10b981',
      pie: '#f59e0b',
      area: '#8b5cf6',
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  }

  private static getChartTypeLabel(type: string): string {
    const labels = {
      line: 'Linha',
      bar: 'Barras',
      pie: 'Pizza',
      area: 'Área',
    };
    return labels[type as keyof typeof labels] || type;
  }

  private static getChartsTypeSummary(charts: ChartData[]): string {
    const types = charts.reduce((acc, chart) => {
      acc[chart.type] = (acc[chart.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeSummaries = Object.entries(types).map(([type, count]) => {
      const label = this.getChartTypeLabel(type);
      return count === 1 ? `${count} ${label}` : `${count} ${label}s`;
    });

    return typeSummaries.join(', ');
  }

  /**
   * Gera uma versão compacta da seção (para relatórios menores)
   */
  static generateCompact(charts: ChartData[], title?: string): string {
    return this.generate(charts, {
      title: title || '📊 Gráficos',
      columns: 3,
      showDescriptions: false,
      containerWidth: 450,
    });
  }

  /**
   * Gera apenas um gráfico em destaque
   */
  static generateSingle(chart: ChartData, title?: string): string {
    return this.generate([chart], {
      title: title || '📈 Análise Visual',
      columns: 1,
      showDescriptions: true,
      containerWidth: 500,
    });
  }
}
