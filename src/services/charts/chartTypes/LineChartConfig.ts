import { LineChartConfig } from '../../../types/statistics';

/**
 * Configurações para Gráficos de Linha (Victory Native)
 *
 * Configurações específicas para gráficos de evolução de glicose
 * e outros dados temporais que serão convertidos para SVG no PDF.
 */
export class LineChartConfigFactory {

  /**
   * Configuração para gráfico de evolução da glicose
   */
  static getGlucoseEvolutionConfig(): LineChartConfig {
    return {
      width: 400,
      height: 250,
      padding: {
        top: 20,
        right: 40,
        bottom: 60,
        left: 60,
      },
      colors: {
        primary: '#ef4444',    // Vermelho para glicose
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
          line: {
            style: {
              data: { stroke: '#ef4444', strokeWidth: 2.5 },
              labels: { fontSize: 9, fill: '#374151' },
            },
          },
        },
        domainPadding: { x: 20, y: 10 },
        animate: false, // Desabilitar animação para PDF
      },
      xAxisProps: {
        dependentAxis: false,
        orientation: 'bottom',
        style: {
          tickLabels: { fontSize: 9, fill: '#6b7280' },
          axis: { stroke: '#9ca3af', strokeWidth: 1 },
          grid: { stroke: '#f3f4f6', strokeWidth: 0.5 },
        },
        fixLabelOverlap: true,
        tickFormat: (day: number) => `${day}`,
        tickLabelComponent: {
          angle: 0,
          textAnchor: 'middle',
          verticalAnchor: 'start',
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
        tickFormat: (glucose: number) => `${Math.round(glucose)}`,
        domain: [60, 300], // Range típico de glicose
        tickCount: 8,
      },
      lineProps: {
        style: {
          data: {
            stroke: '#ef4444',
            strokeWidth: 2.5,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          },
        },
        animate: false,
        interpolation: 'cardinal', // Linha suave
        sortKey: 'x',
      },
    };
  }

  /**
   * Configuração para gráfico de insulina ao longo do tempo
   */
  static getInsulinEvolutionConfig(): LineChartConfig {
    return {
      width: 400,
      height: 250,
      padding: {
        top: 20,
        right: 40,
        bottom: 60,
        left: 60,
      },
      colors: {
        primary: '#3b82f6',    // Azul para insulina
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
          line: {
            style: {
              data: { stroke: '#3b82f6', strokeWidth: 2.5 },
              labels: { fontSize: 9, fill: '#374151' },
            },
          },
        },
        domainPadding: { x: 20, y: 5 },
        animate: false,
      },
      xAxisProps: {
        dependentAxis: false,
        orientation: 'bottom',
        style: {
          tickLabels: { fontSize: 9, fill: '#6b7280' },
          axis: { stroke: '#9ca3af', strokeWidth: 1 },
          grid: { stroke: '#f3f4f6', strokeWidth: 0.5 },
        },
        fixLabelOverlap: true,
        tickFormat: (day: number) => `${day}`,
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
      lineProps: {
        style: {
          data: {
            stroke: '#3b82f6',
            strokeWidth: 2.5,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          },
        },
        animate: false,
        interpolation: 'cardinal',
        sortKey: 'x',
      },
    };
  }

  /**
   * Configuração para gráfico de variabilidade glicêmica
   */
  static getGlucoseVariabilityConfig(): LineChartConfig {
    return {
      width: 400,
      height: 200,
      padding: {
        top: 15,
        right: 40,
        bottom: 50,
        left: 60,
      },
      colors: {
        primary: '#f59e0b',    // Amarelo/laranja para variabilidade
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
          line: {
            style: {
              data: { stroke: '#f59e0b', strokeWidth: 2 },
              labels: { fontSize: 8, fill: '#374151' },
            },
          },
        },
        domainPadding: { x: 15, y: 5 },
        animate: false,
      },
      xAxisProps: {
        dependentAxis: false,
        orientation: 'bottom',
        style: {
          tickLabels: { fontSize: 8, fill: '#6b7280' },
          axis: { stroke: '#9ca3af', strokeWidth: 1 },
        },
        fixLabelOverlap: true,
      },
      yAxisProps: {
        dependentAxis: true,
        orientation: 'left',
        style: {
          tickLabels: { fontSize: 8, fill: '#6b7280' },
          axis: { stroke: '#9ca3af', strokeWidth: 1 },
          grid: { stroke: '#f3f4f6', strokeWidth: 0.5 },
        },
        tickFormat: (value: number) => `${value.toFixed(1)}%`,
        tickCount: 5,
      },
      lineProps: {
        style: {
          data: {
            stroke: '#f59e0b',
            strokeWidth: 2,
            strokeLinecap: 'round',
          },
        },
        animate: false,
        interpolation: 'linear',
        sortKey: 'x',
      },
    };
  }

  /**
   * Configuração minimalista para gráficos pequenos
   */
  static getCompactConfig(): LineChartConfig {
    return {
      width: 300,
      height: 150,
      padding: {
        top: 10,
        right: 30,
        bottom: 35,
        left: 45,
      },
      colors: {
        primary: '#6366f1',
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
          line: {
            style: {
              data: { stroke: '#6366f1', strokeWidth: 2 },
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
        tickCount: 5,
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
      lineProps: {
        style: {
          data: { stroke: '#6366f1', strokeWidth: 2 },
        },
        animate: false,
        interpolation: 'cardinal',
      },
    };
  }

  /**
   * Utilitário para customizar configuração existente
   */
  static customize(baseConfig: LineChartConfig, overrides: Partial<LineChartConfig>): LineChartConfig {
    return {
      ...baseConfig,
      ...overrides,
      colors: { ...baseConfig.colors, ...overrides.colors },
      padding: { ...baseConfig.padding, ...overrides.padding },
      chartProps: { ...baseConfig.chartProps, ...overrides.chartProps },
      xAxisProps: { ...baseConfig.xAxisProps, ...overrides.xAxisProps },
      yAxisProps: { ...baseConfig.yAxisProps, ...overrides.yAxisProps },
      lineProps: { ...baseConfig.lineProps, ...overrides.lineProps },
    };
  }
}
