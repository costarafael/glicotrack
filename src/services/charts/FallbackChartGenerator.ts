import { ChartData, LineDataPoint, BarDataPoint, PieDataPoint } from '../../types/statistics';

/**
 * Fallback SVG Chart Generator
 *
 * Gera gráficos SVG programaticamente sem depender do Victory Native,
 * garantindo que os relatórios PDF sempre tenham visualizações gráficas.
 */
export class FallbackChartGenerator {
  private static readonly DEFAULT_WIDTH = 400;
  private static readonly DEFAULT_HEIGHT = 300;
  private static readonly COLORS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    orange: '#f97316',
    gray: '#6b7280',
  };

  private static readonly FONT_FAMILY = 'Arial, sans-serif';

  /**
   * Gera gráfico de linha para evolução da glicose
   */
  static generateLineChart(
    data: LineDataPoint[],
    title: string,
    options: {
      width?: number;
      height?: number;
      color?: string;
    } = {}
  ): string {
    const { width = this.DEFAULT_WIDTH, height = this.DEFAULT_HEIGHT, color = this.COLORS.primary } = options;

    if (!data || data.length === 0) {
      return this.generateEmptyChart(width, height, 'Sem dados para exibir');
    }

    const padding = { top: 30, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calcular domínios
    const xValues = data.map(d => Number(d.x));
    const yValues = data.map(d => d.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues) * 0.9; // 10% de margem
    const yMax = Math.max(...yValues) * 1.1;

    // Função de escala
    const scaleX = (value: number) => padding.left + ((value - xMin) / (xMax - xMin)) * chartWidth;
    const scaleY = (value: number) => padding.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;

    // Gerar pontos da linha
    const pathData = data
      .map((point, index) => {
        const x = scaleX(Number(point.x));
        const y = scaleY(point.y);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    // Gerar eixos
    const xTicks = this.generateTicks(xMin, xMax, 6);
    const yTicks = this.generateTicks(yMin, yMax, 6);

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="100%" height="100%" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>

        <!-- Title -->
        <text x="${width / 2}" y="20" text-anchor="middle" font-family="${this.FONT_FAMILY}"
              font-size="14" font-weight="600" fill="#374151">${title}</text>

        <!-- Grid lines -->
        ${yTicks.map(tick => `
          <line x1="${padding.left}" y1="${scaleY(tick)}" x2="${width - padding.right}" y2="${scaleY(tick)}"
                stroke="#f3f4f6" stroke-width="1" stroke-dasharray="2,2"/>
          <text x="${padding.left - 5}" y="${scaleY(tick) + 4}" text-anchor="end" font-family="${this.FONT_FAMILY}"
                font-size="10" fill="#6b7280">${Math.round(tick)}</text>
        `).join('')}

        ${xTicks.map(tick => `
          <line x1="${scaleX(tick)}" y1="${padding.top}" x2="${scaleX(tick)}" y2="${height - padding.bottom}"
                stroke="#f3f4f6" stroke-width="0.5" stroke-dasharray="2,2"/>
          <text x="${scaleX(tick)}" y="${height - padding.bottom + 15}" text-anchor="middle" font-family="${this.FONT_FAMILY}"
                font-size="10" fill="#6b7280">${Math.round(tick)}</text>
        `).join('')}

        <!-- Axes -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"
              stroke="#374151" stroke-width="2"/>
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"
              stroke="#374151" stroke-width="2"/>

        <!-- Line -->
        <path d="${pathData}" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round"/>

        <!-- Data points -->
        ${data.map(point => `
          <circle cx="${scaleX(Number(point.x))}" cy="${scaleY(point.y)}" r="4"
                  fill="${color}" stroke="#ffffff" stroke-width="2"/>
        `).join('')}

        <!-- Y-axis label -->
        <text x="15" y="${height / 2}" text-anchor="middle" font-family="${this.FONT_FAMILY}"
              font-size="11" fill="#6b7280" transform="rotate(-90 15 ${height / 2})">Glicose (mg/dL)</text>

        <!-- X-axis label -->
        <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-family="${this.FONT_FAMILY}"
              font-size="11" fill="#6b7280">Dia do Mês</text>
      </svg>
    `.trim();
  }

  /**
   * Gera gráfico de barras para distribuição de dados
   */
  static generateBarChart(
    data: BarDataPoint[],
    title: string,
    options: {
      width?: number;
      height?: number;
      colors?: string[];
      isInsulinData?: boolean; // Para determinar se são unidades de insulina ou contadores
    } = {}
  ): string {
    const { width = this.DEFAULT_WIDTH, height = this.DEFAULT_HEIGHT, isInsulinData = false } = options;
    const colors = options.colors || [this.COLORS.primary, this.COLORS.secondary, this.COLORS.accent, this.COLORS.danger, this.COLORS.purple, this.COLORS.cyan];

    if (!data || data.length === 0) {
      return this.generateEmptyChart(width, height, 'Sem dados para exibir');
    }

    const padding = { top: 40, right: 40, bottom: 80, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(...data.map(d => d.y)) * 1.1;
    const barWidth = chartWidth / data.length * 0.7;
    const barSpacing = chartWidth / data.length;

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="100%" height="100%" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>

        <!-- Title -->
        <text x="${width / 2}" y="25" text-anchor="middle" font-family="${this.FONT_FAMILY}"
              font-size="14" font-weight="600" fill="#374151">${title}</text>

        <!-- Grid lines -->
        ${[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = padding.top + chartHeight * (1 - ratio);
          const value = maxValue * ratio;
          const displayValue = isInsulinData ? value.toFixed(1) : Math.round(value);
          return `
            <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"
                  stroke="#f3f4f6" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="${padding.left - 5}" y="${y + 4}" text-anchor="end" font-family="${this.FONT_FAMILY}"
                  font-size="10" fill="#6b7280">${displayValue}</text>
          `;
        }).join('')}

        <!-- Axes -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"
              stroke="#374151" stroke-width="2"/>
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"
              stroke="#374151" stroke-width="2"/>

        <!-- Bars -->
        ${data.map((item, index) => {
          const barHeight = (item.y / maxValue) * chartHeight;
          const x = padding.left + barSpacing * index + (barSpacing - barWidth) / 2;
          const y = height - padding.bottom - barHeight;
          const color = item.fill || colors[index % colors.length];
          const displayValue = isInsulinData ? item.y.toFixed(1) : Math.round(item.y);

          return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}"
                  fill="${color}" stroke="${this.darkenColor(color)}" stroke-width="1" rx="2"/>
            <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-family="${this.FONT_FAMILY}"
                  font-size="9" font-weight="500" fill="#374151">${displayValue}</text>
          `;
        }).join('')}

        <!-- X-axis labels -->
        ${data.map((item, index) => {
          const x = padding.left + barSpacing * index + barSpacing / 2;
          return `
            <text x="${x}" y="${height - padding.bottom + 15}" text-anchor="middle" font-family="${this.FONT_FAMILY}"
                  font-size="9" fill="#6b7280" transform="rotate(-45 ${x} ${height - padding.bottom + 15})">${item.x}</text>
          `;
        }).join('')}

        <!-- Y-axis label -->
        <text x="20" y="${height / 2}" text-anchor="middle" font-family="${this.FONT_FAMILY}"
              font-size="11" fill="#6b7280" transform="rotate(-90 20 ${height / 2})">${isInsulinData ? 'Unidades (U)' : 'Registros'}</text>
      </svg>
    `.trim();
  }

  /**
   * Gera gráfico de pizza para distribuição percentual
   */
  static generatePieChart(
    data: PieDataPoint[],
    title: string,
    options: {
      width?: number;
      height?: number;
      colors?: string[];
    } = {}
  ): string {
    const { width = this.DEFAULT_WIDTH, height = this.DEFAULT_HEIGHT } = options;
    const colors = options.colors || [this.COLORS.primary, this.COLORS.secondary, this.COLORS.accent, this.COLORS.danger, this.COLORS.purple, this.COLORS.cyan, this.COLORS.orange];

    if (!data || data.length === 0) {
      return this.generateEmptyChart(width, height, 'Sem dados para exibir');
    }

    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const radius = Math.min(width, height) * 0.35;

    const total = data.reduce((sum, item) => sum + item.y, 0);
    let currentAngle = -90; // Start from top

    const slices = data.map((item, index) => {
      const percentage = (item.y / total) * 100;
      const sliceAngle = (item.y / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;

      const x1 = centerX + radius * Math.cos(startAngle * Math.PI / 180);
      const y1 = centerY + radius * Math.sin(startAngle * Math.PI / 180);
      const x2 = centerX + radius * Math.cos(endAngle * Math.PI / 180);
      const y2 = centerY + radius * Math.sin(endAngle * Math.PI / 180);

      const largeArc = sliceAngle > 180 ? 1 : 0;
      const color = colors[index % colors.length];

      // Label position
      const labelAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + labelRadius * Math.cos(labelAngle * Math.PI / 180);
      const labelY = centerY + labelRadius * Math.sin(labelAngle * Math.PI / 180);

      currentAngle = endAngle;

      return {
        path: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color,
        labelX,
        labelY,
        percentage: percentage.toFixed(1),
        label: item.x,
        showLabel: percentage > 5 // Only show label if slice is > 5%
      };
    });

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="100%" height="100%" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>

        <!-- Title -->
        <text x="${width / 2}" y="25" text-anchor="middle" font-family="${this.FONT_FAMILY}"
              font-size="14" font-weight="600" fill="#374151">${title}</text>

        <!-- Pie slices -->
        ${slices.map(slice => `
          <path d="${slice.path}" fill="${slice.color}" stroke="#ffffff" stroke-width="2"/>
        `).join('')}

        <!-- Labels -->
        ${slices.map(slice => slice.showLabel ? `
          <text x="${slice.labelX}" y="${slice.labelY}" text-anchor="middle" font-family="${this.FONT_FAMILY}"
                font-size="9" font-weight="600" fill="#ffffff" stroke="#000000" stroke-width="0.5">${slice.percentage}%</text>
        ` : '').join('')}

        <!-- Legend -->
        ${data.map((item, index) => {
          const legendY = 60 + index * 20;
          const color = colors[index % colors.length];
          const percentage = ((item.y / total) * 100).toFixed(1);
          return `
            <rect x="20" y="${legendY - 8}" width="12" height="12" fill="${color}" rx="2"/>
            <text x="40" y="${legendY + 2}" font-family="${this.FONT_FAMILY}" font-size="10" fill="#374151">
              ${item.x}: ${percentage}%
            </text>
          `;
        }).join('')}
      </svg>
    `.trim();
  }

  /**
   * Gera gráfico de cobertura (barras de status)
   */
  static generateCoverageChart(
    data: Array<{ day: number; hasRecord: boolean }>,
    title: string,
    options: {
      width?: number;
      height?: number;
    } = {}
  ): string {
    const { width = this.DEFAULT_WIDTH, height = 200 } = options;

    if (!data || data.length === 0) {
      return this.generateEmptyChart(width, height, 'Sem dados para exibir');
    }

    const padding = { top: 40, right: 20, bottom: 40, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length;

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="100%" height="100%" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>

        <!-- Title -->
        <text x="${width / 2}" y="25" text-anchor="middle" font-family="${this.FONT_FAMILY}"
              font-size="14" font-weight="600" fill="#374151">${title}</text>

        <!-- Coverage bars -->
        ${data.map((item, index) => {
          const x = padding.left + barSpacing * index + (barSpacing - barWidth) / 2;
          const barHeight = 60;
          const y = padding.top + 20;
          const color = item.hasRecord ? this.COLORS.secondary : this.COLORS.danger;

          return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}"
                  fill="${color}" stroke="none" rx="2"/>
          `;
        }).join('')}

        <!-- Day numbers -->
        ${data.filter((_, index) => index % 5 === 0).map((item, filteredIndex) => {
          const originalIndex = filteredIndex * 5;
          const x = padding.left + barSpacing * originalIndex + barSpacing / 2;
          return `
            <text x="${x}" y="${height - 10}" text-anchor="middle" font-family="${this.FONT_FAMILY}"
                  font-size="9" fill="#6b7280">${item.day}</text>
          `;
        }).join('')}

        <!-- Legend -->
        <rect x="20" y="${height - 35}" width="12" height="12" fill="${this.COLORS.secondary}" rx="2"/>
        <text x="40" y="${height - 27}" font-family="${this.FONT_FAMILY}" font-size="10" fill="#374151">Com registro</text>

        <rect x="150" y="${height - 35}" width="12" height="12" fill="${this.COLORS.danger}" rx="2"/>
        <text x="170" y="${height - 27}" font-family="${this.FONT_FAMILY}" font-size="10" fill="#374151">Sem registro</text>
      </svg>
    `.trim();
  }

  /**
   * Gera gráfico vazio com mensagem
   */
  private static generateEmptyChart(width: number, height: number, message: string): string {
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
        <text x="${width / 2}" y="${height / 2 - 10}" text-anchor="middle" font-family="${this.FONT_FAMILY}"
              font-size="14" fill="#6b7280">📊</text>
        <text x="${width / 2}" y="${height / 2 + 10}" text-anchor="middle" font-family="${this.FONT_FAMILY}"
              font-size="12" fill="#6b7280">${message}</text>
      </svg>
    `.trim();
  }

  /**
   * Gera ticks para eixos
   */
  private static generateTicks(min: number, max: number, count: number): number[] {
    const range = max - min;
    const step = range / (count - 1);
    const ticks = [];

    for (let i = 0; i < count; i++) {
      ticks.push(min + step * i);
    }

    return ticks;
  }

  /**
   * Escurece uma cor para bordas
   */
  private static darkenColor(color: string): string {
    const colorMap: { [key: string]: string } = {
      '#3b82f6': '#2563eb',
      '#10b981': '#059669',
      '#f59e0b': '#d97706',
      '#ef4444': '#dc2626',
      '#8b5cf6': '#7c3aed',
      '#06b6d4': '#0891b2',
      '#f97316': '#ea580c',
    };

    return colorMap[color] || color;
  }
}
