import { ChartData } from '../../types/statistics';

/**
 * Exportador de SVG para HTML/PDF
 *
 * Responsável por converter strings SVG dos gráficos em HTML embedado
 * que pode ser incluído nos relatórios PDF do GlicoTrack.
 */
export class ChartSVGExporter {
  private static readonly DEFAULT_CONTAINER_WIDTH = 400;
  private static readonly DEFAULT_CONTAINER_HEIGHT = 300;
  private static readonly CHART_SPACING = 20;

  constructor() {
    console.log(`📊 [ChartSVGExporter] Exporter initialized`);
  }

  /**
   * Embeda um gráfico SVG em HTML com container responsivo
   */
  static embedSingleChart(
    chart: ChartData,
    options?: {
      containerWidth?: number;
      containerHeight?: number;
      showTitle?: boolean;
      showDescription?: boolean;
      className?: string;
    },
  ): string {
    const {
      containerWidth = this.DEFAULT_CONTAINER_WIDTH,
      containerHeight = this.DEFAULT_CONTAINER_HEIGHT,
      showTitle = true,
      showDescription = true,
      className = 'chart-container',
    } = options || {};

    try {
      console.log(`📊 [ChartSVGExporter] Embedding chart: ${chart.title}`);

      // Limpar e validar SVG
      const cleanSvg = this.sanitizeSVG(chart.svgString);

      // Gerar HTML do container
      let html = `
        <div class="${className}" style="
          width: ${containerWidth}px;
          height: ${containerHeight + (showTitle ? 40 : 0) + (showDescription ? 25 : 0)}px;
          margin: ${this.CHART_SPACING / 2}px auto;
          text-align: center;
          page-break-inside: avoid;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          background: #ffffff;
        ">`;

      // Título do gráfico
      if (showTitle) {
        html += `
          <div class="chart-title" style="
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 10px;
            font-family: 'Figtree', sans-serif;
          ">
            ${this.escapeHtml(chart.title)}
          </div>`;
      }

      // Container do SVG
      html += `
        <div class="chart-svg-container" style="
          width: 100%;
          height: ${containerHeight}px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        ">
          ${cleanSvg}
        </div>`;

      // Descrição do gráfico
      if (showDescription && chart.description) {
        html += `
          <div class="chart-description" style="
            font-size: 10px;
            color: #6b7280;
            margin-top: 8px;
            font-style: italic;
            font-family: 'Figtree', sans-serif;
          ">
            ${this.escapeHtml(chart.description)}
          </div>`;
      }

      html += '</div>';

      console.log(`✅ [ChartSVGExporter] Chart embedded successfully`);
      return html;
    } catch (error: any) {
      console.error(
        `❌ [ChartSVGExporter] Error embedding chart:`,
        error?.message || 'Unknown error',
      );
      return this.generateErrorHTML(chart.title, containerWidth, containerHeight);
    }
  }

  /**
   * Embeda múltiplos gráficos em um grid responsivo
   */
  static embedMultipleCharts(
    charts: ChartData[],
    options?: {
      columns?: number;
      containerWidth?: number;
      containerHeight?: number;
      showTitles?: boolean;
      showDescriptions?: boolean;
      gridSpacing?: number;
    },
  ): string {
    const {
      columns = 2,
      containerWidth = this.DEFAULT_CONTAINER_WIDTH,
      containerHeight = this.DEFAULT_CONTAINER_HEIGHT,
      showTitles = true,
      showDescriptions = false,
      gridSpacing = this.CHART_SPACING,
    } = options || {};

    try {
      console.log(
        `📊 [ChartSVGExporter] Embedding ${charts.length} charts in ${columns} columns`,
      );

      if (charts.length === 0) {
        return '<div class="no-charts">Nenhum gráfico disponível</div>';
      }

      // Calcular dimensões do grid
      const chartWidth = (containerWidth - gridSpacing * (columns - 1)) / columns;
      const totalTitleHeight = showTitles ? 40 : 0;
      const totalDescHeight = showDescriptions ? 25 : 0;
      const chartContainerHeight = containerHeight + totalTitleHeight + totalDescHeight;

      let html = `
        <div class="charts-grid" style="
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: ${gridSpacing}px;
          margin: ${gridSpacing}px 0;
          page-break-inside: avoid;
        ">`;

      // Processar cada gráfico
      charts.forEach((chart, index) => {
        html += this.embedSingleChart(chart, {
          containerWidth: chartWidth,
          containerHeight: containerHeight,
          showTitle: showTitles,
          showDescription: showDescriptions,
          className: 'chart-grid-item',
        });

        // Quebra de linha a cada 'columns' gráficos
        if ((index + 1) % columns === 0 && index < charts.length - 1) {
          html += `
            <div style="width: 100%; height: 0; flex-basis: 100%;"></div>
          `;
        }
      });

      html += '</div>';

      console.log(`✅ [ChartSVGExporter] ${charts.length} charts embedded in grid`);
      return html;
    } catch (error: any) {
      console.error(
        `❌ [ChartSVGExporter] Error embedding multiple charts:`,
        error?.message || 'Unknown error',
      );
      return this.generateErrorHTML('Dashboard de Gráficos');
    }
  }

  /**
   * Cria seção completa de dashboard com título e gráficos
   */
  static createChartsDashboard(
    charts: ChartData[],
    title: string = '📈 Dashboard Mensal',
    options?: {
      columns?: number;
      showSectionTitle?: boolean;
      sectionTitleStyle?: string;
    },
  ): string {
    const {
      columns = 2,
      showSectionTitle = true,
      sectionTitleStyle = `
        font-size: 16px;
        font-weight: 700;
        color: #374151;
        margin: 25px 0 20px 0;
        text-align: center;
        font-family: 'Figtree', sans-serif;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 10px;
      `,
    } = options || {};

    try {
      console.log(`📊 [ChartSVGExporter] Creating dashboard: ${title}`);

      let html = '<div class="charts-dashboard-section">';

      // Título da seção
      if (showSectionTitle) {
        html += `
          <div class="dashboard-title" style="${sectionTitleStyle}">
            ${this.escapeHtml(title)}
          </div>`;
      }

      // Gráficos em grid
      if (charts.length > 0) {
        html += this.embedMultipleCharts(charts, {
          columns,
          showTitles: true,
          showDescriptions: true,
          containerWidth: columns === 1 ? 500 : 350,
          containerHeight: columns === 1 ? 300 : 250,
        });
      } else {
        html += `
          <div class="no-charts-message" style="
            text-align: center;
            color: #6b7280;
            font-style: italic;
            margin: 40px 0;
            padding: 20px;
            border: 1px dashed #d1d5db;
            border-radius: 8px;
          ">
            📊 Nenhum gráfico disponível para este período
          </div>`;
      }

      html += '</div>';

      console.log(`✅ [ChartSVGExporter] Dashboard created with ${charts.length} charts`);
      return html;
    } catch (error: any) {
      console.error(
        `❌ [ChartSVGExporter] Error creating dashboard:`,
        error?.message || 'Unknown error',
      );
      return this.generateErrorHTML('Dashboard Error');
    }
  }

  /**
   * Gera CSS específico para gráficos no PDF
   */
  static generateChartsCSS(): string {
    return `
      /* Chart Container Styles */
      .chart-container {
        break-inside: avoid;
        margin: 15px auto;
        text-align: center;
      }

      .chart-grid-item {
        flex: 1;
        min-width: 300px;
        break-inside: avoid;
      }

      .charts-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        align-items: flex-start;
      }

      .charts-dashboard-section {
        margin: 20px 0;
        page-break-inside: avoid;
      }

      /* Chart Title Styles */
      .chart-title {
        font-weight: 600;
        margin-bottom: 10px;
        color: #374151;
      }

      .chart-description {
        font-size: 10px;
        color: #6b7280;
        font-style: italic;
        margin-top: 8px;
        line-height: 1.3;
      }

      .dashboard-title {
        text-align: center;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }

      /* SVG Container */
      .chart-svg-container {
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .chart-svg-container svg {
        max-width: 100%;
        max-height: 100%;
        height: auto;
      }

      /* Error States */
      .chart-error {
        background-color: #fef2f2;
        border: 1px solid #fca5a5;
        border-radius: 6px;
        padding: 20px;
        text-align: center;
        color: #dc2626;
      }

      .no-charts {
        text-align: center;
        color: #9ca3af;
        font-style: italic;
        padding: 30px;
      }

      .no-charts-message {
        background-color: #f9fafb;
        border: 1px dashed #d1d5db;
        border-radius: 8px;
        padding: 25px;
        text-align: center;
        color: #6b7280;
      }

      /* Responsive adjustments for PDF */
      @media print {
        .chart-container {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .charts-dashboard-section {
          break-inside: avoid;
        }
      }
    `;
  }

  /**
   * Sanitiza string SVG para uso seguro em HTML
   */
  private static sanitizeSVG(svgString: string): string {
    if (!svgString || typeof svgString !== 'string') {
      console.warn(`⚠️ [ChartSVGExporter] Invalid SVG string provided`);
      return this.generateFallbackSVG();
    }

    try {
      // Remover scripts maliciosos
      let cleaned = svgString
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '');

      // Garantir que tem namespace SVG
      if (!cleaned.includes('xmlns=')) {
        cleaned = cleaned.replace(
          /<svg/,
          '<svg xmlns="http://www.w3.org/2000/svg"',
        );
      }

      // Garantir dimensões responsivas
      if (!cleaned.includes('viewBox=')) {
        const widthMatch = cleaned.match(/width\s*=\s*["']?(\d+)["']?/);
        const heightMatch = cleaned.match(/height\s*=\s*["']?(\d+)["']?/);

        if (widthMatch && heightMatch) {
          const viewBox = `viewBox="0 0 ${widthMatch[1]} ${heightMatch[1]}"`;
          cleaned = cleaned.replace(/<svg/, `<svg ${viewBox}`);
        }
      }

      return cleaned;
    } catch (error: any) {
      console.error(
        `❌ [ChartSVGExporter] Error sanitizing SVG:`,
        error?.message || 'Unknown error',
      );
      return this.generateFallbackSVG();
    }
  }

  /**
   * Gera SVG de fallback quando há problemas
   */
  private static generateFallbackSVG(
    width: number = 400,
    height: number = 300,
  ): string {
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="50%" y="50%" text-anchor="middle"
              font-family="Arial,sans-serif" font-size="14" fill="#6b7280">
          📊 Gráfico GlicoTrack
        </text>
      </svg>
    `;
  }

  /**
   * Gera HTML de erro quando embedding falha
   */
  private static generateErrorHTML(
    title: string,
    width?: number,
    height?: number,
  ): string {
    const w = width || this.DEFAULT_CONTAINER_WIDTH;
    const h = height || this.DEFAULT_CONTAINER_HEIGHT;

    return `
      <div class="chart-error" style="
        width: ${w}px;
        height: ${h}px;
        background-color: #fef2f2;
        border: 1px solid #fca5a5;
        border-radius: 6px;
        padding: 20px;
        margin: 10px auto;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      ">
        <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
        <div style="font-size: 14px; font-weight: 600; color: #dc2626; margin-bottom: 5px;">
          Erro no Gráfico
        </div>
        <div style="font-size: 12px; color: #7f1d1d;">
          ${this.escapeHtml(title)}
        </div>
      </div>
    `;
  }

  /**
   * Escapa HTML para uso seguro
   */
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

  /**
   * Otimiza SVG para PDF removendo elementos desnecessários
   */
  static optimizeSVGForPDF(svgString: string): string {
    try {
      return svgString
        // Remover animações
        .replace(/<animate[^>]*>.*?<\/animate>/gi, '')
        .replace(/animate\w*\s*=\s*["'][^"']*["']/gi, '')
        // Simplificar gradientes complexos
        .replace(/url\(#[^)]*gradient[^)]*\)/gi, '#3b82f6')
        // Remover preenchimento de área dos gráficos de linha
        .replace(/<path[^>]*fill\s*=\s*["']url\(#lineGradient\)["'][^>]*>/gi, '')
        // Remover interatividade
        .replace(/cursor\s*:\s*pointer/gi, '')
        .replace(/pointer-events\s*:\s*all/gi, 'pointer-events: none');
    } catch (error: any) {
      console.warn(
        `⚠️ [ChartSVGExporter] Could not optimize SVG:`,
        error?.message || 'Unknown error',
      );
      return svgString;
    }
  }

  /**
   * Calcula dimensões ideais baseadas no número de gráficos
   */
  static calculateOptimalDimensions(
    chartsCount: number,
    availableWidth: number = 550,
  ): { columns: number; chartWidth: number; chartHeight: number } {
    let columns: number;
    let chartHeight: number;

    if (chartsCount <= 2) {
      columns = chartsCount;
      chartHeight = 300;
    } else if (chartsCount <= 4) {
      columns = 2;
      chartHeight = 250;
    } else {
      columns = 3;
      chartHeight = 200;
    }

    const chartWidth = Math.floor(
      (availableWidth - this.CHART_SPACING * (columns - 1)) / columns,
    );

    return { columns, chartWidth, chartHeight };
  }

  /**
   * Valida se SVG é válido
   */
  static isValidSVG(svgString: string): boolean {
    try {
      return (
        // Mínimo para um SVG útil
        (typeof svgString === 'string' &&
        svgString.trim().startsWith('<svg') &&
        svgString.trim().endsWith('</svg>') && svgString.length > 50)
      );
    } catch {
      return false;
    }
  }

  /**
   * Gera resumo dos gráficos exportados
   */
  static generateExportSummary(charts: ChartData[]): string {
    const types = charts.reduce((acc, chart) => {
      acc[chart.type] = (acc[chart.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let summary = `📊 Resumo de Gráficos Exportados:\n`;
    summary += `• Total: ${charts.length} gráficos\n`;

    Object.entries(types).forEach(([type, count]) => {
      const typeNames = {
        line: 'Linha',
        bar: 'Barras',
        pie: 'Pizza',
        area: 'Área',
      };
      summary += `• ${typeNames[type as keyof typeof typeNames] || type}: ${count}\n`;
    });

    return summary;
  }
}
