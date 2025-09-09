import { BarChartConfig } from '../../../types/statistics';

/**
 * Configurações para Gráficos de Barras (Victory Native)
 *
 * Configurações específicas para gráficos de barras para análise por refeição,
 * dias da semana e outras categorias discretas que serão convertidas para SVG no PDF.
 */
export class BarChartConfigFactory {

  /**
   * Configuração para gráfico de bolus por tipo de refeição
   */
  static getBolusPerMealConfig(): BarChartConfig {
    return {
      width: 400,
      height: 280,
      padding: {
        top: 20,
        right: 30,
        bottom: 80,
        left: 70,
      },
      colors: {
        primary: '#3b82f6',    // Azul para bolus
        secondary: '#64748b',  // Cinza para eixos
        accent: '#f1f5f9',     // Cinza claro para grid
      },
      chartProps: {
        theme: {
          axis: {
            style: {
              axis: { stroke: '#64748b', strokeWidth: 1 },
              grid: { stroke: '#f1f5f9', strokeWidth: 0.5, strokeDasharray: '2,2' },
              tickLabels: {
                fontSize: 10,
                fill: '#374151',
                fontFamily: 'Arial, sans-serif'
              },
            },
          },
          bar: {
            style: {
              data: { fill: '#3b82f6', stroke: '#1d4ed8', strokeWidth: 1 },
              labels: { fontSize: 9, fill: '#374151' },
            },
          },
        },
        domainPadding: { x: 40, y: 10 },
        animate: false, // Desabilitar animação para PDF
      },
      xAxisProps: {
        dependentAxis: false,
        orientation: 'bottom',
        style: {
          tickLabels: {
            fontSize: 9,
            fill: '#6b7280',
            angle: -45,
            textAnchor: 'end',
          },
          axis: { stroke: '#9ca3af', strokeWidth: 1 },
        },
        fixLabelOverlap: true,
        tickLabelComponent: {
          angle: -45,
          textAnchor: 'end',
          verticalAnchor: 'middle',
        },
      },
      yAxisProps: {
        dependentAxis: true,
        orientation: 'left',
        style: {
          tickLabels: { fontSize: 9, fill: '#6b7280' },
          axis: { stroke: '#9ca3af', strokeWidth: 1 },
          grid: { stroke: '#f3f4f6', strokeWidth: 0.5, strokeDasharray: '1,1' },
        },
        tickFormat: (units: number) => `${units.toFixed(1)}U`,
        tickCount: 6,
      },
      barProps: {
        style: {
          data: {
            fill: '#3b82f6',
            stroke: '#1d4ed8',
            strokeWidth: 0.5,
            fillOpacity: 0.8,
          },
        },
        animate: false,
        barRatio: 0.6, // Largura das barras
        cornerRadius: 2,
      },
    };
  }

  /**
   * Configuração para gráfico de registros por dia da semana
   */
  static getWeekdayActivityConfig(): BarChartConfig {
    return {
      width: 400,
      height: 260,
      padding: {
        top: 20,
        right: 30,
        bottom: 60,
        left: 60,
      },
      colors: {
        primary: '#10b981',    // Verde para atividade
        secondary: '#64748b',
        accent: '#f1f5f9',
      },
      chartProps: {
        theme: {
          axis: {
            style: {
              axis: { stroke: '#64748b', strokeWidth: 1 },
              grid: { stroke: '#f1f5f9', strokeWidth: 0.5, strokeDasharray: '2,2' },
              tickLabels: {
                fontSize: 10,
                fill: '#374151',
                fontFamily: 'Arial, sans-serif'
              },
            },
          },
          bar: {
            style: {
              data: { fill: '#10b981', stroke: '#059669', strokeWidth: 1 },
              labels: { fontSize: 9, fill: '#374151' },
            },
          },
        },
        domainPadding: { x: 30, y: 10 },
        animate: false,
        colorScale: [
          '#ef4444', // Dom - Vermelho
          '#3b82f6', // Seg - Azul
          '#10b981', // Ter - Verde
          '#f59e0b', // Qua - Amarelo
          '#8b5cf6', // Qui - Roxo
          '#06b6d4', // Sex - Ciano
          '#f97316', // Sáb - Laranja
        ],
      },
      xAxisProps: {
        dependentAxis: false,
        orientation: 'bottom',
        style: {
          tickLabels: { fontSize: 9, fill: '#6b7280' },
          axis: { stroke: '#9ca3af', strokeWidth: 1 },
        },
        fixLabelOverlap: false,
      },
      yAxisProps: {
        dependentAxis: true,
        orientation: 'left',
        style: {
          tickLabels: { fontSize: 9, fill: '#6b7280' },
          axis: { stroke: '#9ca3af', strokeWidth: 1 },
          grid: { stroke: '#f3f4f6', strokeWidth: 0.5, strokeDasharray: '1,1' },
        },
        tickFormat: (count: number) => `${Math.round(count)}`,
        tickCount: 5,
      },
      barProps: {
        style: {
          data: {
            fill: ({ datum }: any) => datum.fill || '#10b981',
            stroke: ({ datum }: any) => datum.fill ?
              this.getDarkerColor(datum.fill) : '#059669',
            strokeWidth: 0.5,
            fillOpacity: 0.9,
          },
        },
        animate: false,
        barRatio: 0.7,
        cornerRadius: 3,
      },
    };
  }

  /**
   * Configuração para gráfico de comparação (ex: bolus vs basal)
   */
  static getComparisonConfig(): BarChartConfig {
    return {
      width: 400,
      height: 240,
      padding: {
        top: 20,
        right: 40,
        bottom: 70,
        left: 60,
      },
      colors: {
        primary: '#6366f1',    // Índigo para comparação
        secondary: '#64748b',
        accent: '#f1f5f9',
      },
      chartProps: {
        theme: {
          axis: {
            style: {
              axis: { stroke: '#64748b', strokeWidth: 1 },
              grid: { stroke: '#f1f5f9', strokeWidth: 0.5, strokeDasharray: '2,2' },
              tickLabels: {
                fontSize: 10,
                fill: '#374151',
                fontFamily: 'Arial, sans-serif'
              },
            },
          },
          bar: {
            style: {
              data: { fill: '#6366f1', stroke: '#4f46e5', strokeWidth: 1 },
              labels: { fontSize: 9, fill: '#374151' },
            },
          },
        },
        domainPadding: { x: 50, y: 10 },
        animate: false,
        colorScale: ['#3b82f6', '#10b981'], // Azul e Verde para comparação
      },
      xAxisProps: {
        dependentAxis: false,
        orientation: 'bottom',
        style: {
          tickLabels: { fontSize: 9, fill: '#6b7280' },
          axis: { stroke: '#9ca3af', strokeWidth: 1 },
        },
        fixLabelOverlap: true,
      },
      yAxisProps: {
        dependentAxis: true,
        orientation: 'left',
        style: {
          tickLabels: { fontSize: 9, fill: '#6b7280' },
          axis: { stroke: '#9ca3af', strokeWidth: 1 },
          grid: { stroke: '#f3f4f6', strokeWidth: 0.5, strokeDasharray: '1,1' },
        },
        tickFormat: (value: number) => `${value.toFixed(1)}U`,
        tickCount: 6,
      },
      barProps: {
        style: {
          data: {
            fill: ({ datum }: any) => datum.fill || '#6366f1',
            stroke: ({ datum }: any) => datum.stroke || '#4f46e5',
            strokeWidth: 0.5,
            fillOpacity: 0.85,
          },
        },
        animate: false,
        barRatio: 0.5,
        cornerRadius: 2,
      },
    };
  }

  /**
   * Configuração para gráfico horizontal (quando labels são longos)
   */
  static getHorizontalConfig(): BarChartConfig {
    return {
      width: 400,
      height: 300,
      padding: {
        top: 20,
        right: 60,
        bottom: 40,
        left: 120, // Mais espaço para labels longos
      },
      colors: {
        primary: '#8b5cf6',    // Roxo para horizontal
        secondary: '#64748b',
        accent: '#f1f5f9',
      },
      chartProps: {
        theme: {
          axis: {
            style: {
              axis: { stroke: '#64748b', strokeWidth: 1 },
              grid: { stroke: '#f1f5f9', strokeWidth: 0.5, strokeDasharray: '2,2' },
              tickLabels: {
                fontSize: 9,
                fill: '#374151',
                fontFamily: 'Arial, sans-serif'
              },
            },
          },
          bar: {
            style: {
              data: { fill: '#8b5cf6', stroke: '#7c3aed', strokeWidth: 1 },
              labels: { fontSize: 9, fill: '#374151' },
            },
          },
        },
        domainPadding: { x: 10, y: 30 },
        animate: false,
        horizontal: true, // Gráfico horizontal
      },
      xAxisProps: {
        dependentAxis: true, // X é dependente quando horizontal
        orientation: 'bottom',
        style: {
          tickLabels: { fontSize: 9, fill: '#6b7280' },
          axis: { stroke: '#9ca3af', strokeWidth: 1 },
          grid: { stroke: '#f3f4f6', strokeWidth: 0.5, strokeDasharray: '1,1' },
        },
        tickFormat: (value: number) => `${value.toFixed(1)}`,
        tickCount: 5,
      },
      yAxisProps: {
        dependentAxis: false, // Y é independente quando horizontal
        orientation: 'left',
        style: {
          tickLabels: { fontSize: 9, fill: '#6b7280' },
          axis: { stroke: '#9ca3af', strokeWidth: 1 },
        },
        fixLabelOverlap: true,
      },
      barProps: {
        style: {
          data: {
            fill: '#8b5cf6',
            stroke: '#7c3aed',
            strokeWidth: 0.5,
            fillOpacity: 0.8,
          },
        },
        animate: false,
        barRatio: 0.6,
        cornerRadius: 2,
        horizontal: true,
      },
    };
  }

  /**
   * Configuração compacta para gráficos pequenos
   */
  static getCompactConfig(): BarChartConfig {
    return {
      width: 300,
      height: 180,
      padding: {
        top: 15,
        right: 25,
        bottom: 45,
        left: 50,
      },
      colors: {
        primary: '#06b6d4',    // Ciano para compacto
        secondary: '#9ca3af',
        accent: '#f9fafb',
      },
      chartProps: {
        theme: {
          axis: {
            style: {
              axis: { stroke: '#9ca3af', strokeWidth: 1 },
              grid: { stroke: '#f3f4f6', strokeWidth: 0.5 },
              tickLabels: { fontSize: 8, fill: '#6b7280' },
            },
          },
          bar: {
            style: {
              data: { fill: '#06b6d4', stroke: '#0891b2', strokeWidth: 1 },
            },
          },
        },
        animate: false,
      },
      xAxisProps: {
        style: {
          tickLabels: { fontSize: 8, fill: '#9ca3af' },
          axis: { stroke: '#d1d5db', strokeWidth: 1 },
        },
      },
      yAxisProps: {
        dependentAxis: true,
        style: {
          tickLabels: { fontSize: 8, fill: '#9ca3af' },
          axis: { stroke: '#d1d5db', strokeWidth: 1 },
          grid: { stroke: '#f3f4f6', strokeWidth: 0.5 },
        },
        tickCount: 4,
      },
      barProps: {
        style: {
          data: { fill: '#06b6d4', strokeWidth: 0.5 },
        },
        animate: false,
        barRatio: 0.7,
        cornerRadius: 1,
      },
    };
  }

  /**
   * Configuração para gráfico de cobertura mensal
   */
  static getCoverageConfig(): BarChartConfig {
    return {
      width: 400,
      height: 180,
      padding: {
        top: 15,
        right: 30,
        bottom: 40,
        left: 50,
      },
      colors: {
        primary: '#22c55e',    // Verde para dias com registro
        secondary: '#ef4444',  // Vermelho para dias sem registro
        accent: '#f1f5f9',
      },
      chartProps: {
        theme: {
          axis: {
            style: {
              axis: { stroke: '#64748b', strokeWidth: 1 },
              grid: { stroke: '#f1f5f9', strokeWidth: 0.5 },
              tickLabels: { fontSize: 8, fill: '#374151' },
            },
          },
          bar: {
            style: {
              data: {
                fill: ({ datum }: any) => datum.hasRecord ? '#22c55e' : '#ef4444',
                stroke: 'none',
              },
            },
          },
        },
        animate: false,
        domainPadding: { x: 5, y: 5 },
      },
      xAxisProps: {
        style: {
          tickLabels: { fontSize: 8, fill: '#9ca3af' },
          axis: { stroke: '#d1d5db', strokeWidth: 1 },
        },
        tickCount: 10,
      },
      yAxisProps: {
        dependentAxis: true,
        style: {
          tickLabels: { fontSize: 8, fill: '#9ca3af' },
          axis: { stroke: '#d1d5db', strokeWidth: 1 },
        },
        domain: [0, 1],
        tickFormat: () => '', // Sem labels no Y para cobertura
      },
      barProps: {
        style: {
          data: {
            fill: ({ datum }: any) => datum.hasRecord ? '#22c55e' : '#ef4444',
            fillOpacity: 0.8,
            stroke: 'none',
          },
        },
        animate: false,
        barRatio: 0.9,
        cornerRadius: 1,
      },
    };
  }

  /**
   * Utilitário para obter cor mais escura
   */
  private static getDarkerColor(color: string): string {
    const colorMap: Record<string, string> = {
      '#ef4444': '#dc2626',
      '#3b82f6': '#2563eb',
      '#10b981': '#059669',
      '#f59e0b': '#d97706',
      '#8b5cf6': '#7c3aed',
      '#06b6d4': '#0891b2',
      '#f97316': '#ea580c',
    };
    return colorMap[color] || color;
  }

  /**
   * Utilitário para customizar configuração existente
   */
  static customize(baseConfig: BarChartConfig, overrides: Partial<BarChartConfig>): BarChartConfig {
    return {
      ...baseConfig,
      ...overrides,
      colors: { ...baseConfig.colors, ...overrides.colors },
      padding: { ...baseConfig.padding, ...overrides.padding },
      chartProps: { ...baseConfig.chartProps, ...overrides.chartProps },
      xAxisProps: { ...baseConfig.xAxisProps, ...overrides.xAxisProps },
      yAxisProps: { ...baseConfig.yAxisProps, ...overrides.yAxisProps },
      barProps: { ...baseConfig.barProps, ...overrides.barProps },
    };
  }

  /**
   * Gera palette de cores para múltiplas barras
   */
  static generateColorPalette(count: number): string[] {
    const baseColors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    // Repetir cores se necessário
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }
}
