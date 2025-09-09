import { PieChartConfig } from '../../../types/statistics';

/**
 * Configurações para Gráficos de Pizza (Victory Native)
 *
 * Configurações específicas para gráficos de pizza para distribuição de dados,
 * como dias da semana, tipos de refeição e outras análises proporcionais
 * que serão convertidas para SVG no PDF.
 */
export class PieChartConfigFactory {

  /**
   * Configuração para gráfico de distribuição por dia da semana
   */
  static getWeekdayDistributionConfig(): PieChartConfig {
    return {
      width: 350,
      height: 350,
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#f1f5f9',
      },
      chartProps: {
        theme: {
          pie: {
            style: {
              data: {
                fillOpacity: 0.9,
                stroke: '#ffffff',
                strokeWidth: 2,
              },
              labels: {
                fontSize: 11,
                fill: '#374151',
                fontFamily: 'Arial, sans-serif',
                fontWeight: '500',
              },
            },
          },
        },
        animate: false, // Desabilitar animação para PDF
        colorScale: [
          '#ef4444', // Dom - Vermelho
          '#3b82f6', // Seg - Azul
          '#10b981', // Ter - Verde
          '#f59e0b', // Qua - Amarelo
          '#8b5cf6', // Qui - Roxo
          '#06b6d4', // Sex - Ciano
          '#f97316', // Sáb - Laranja
        ],
        innerRadius: 0,
        padAngle: 2,
      },
      pieProps: {
        style: {
          data: {
            fill: ({ datum }: any) => datum.fill || '#3b82f6',
            fillOpacity: 0.85,
            stroke: '#ffffff',
            strokeWidth: 2,
          },
          labels: {
            fontSize: 10,
            fill: '#374151',
            fontWeight: 'bold',
          },
        },
        animate: false,
        innerRadius: 0,
        padAngle: 3,
        labelRadius: ({ innerRadius }: any) => innerRadius + 40,
        labelComponent: {
          style: {
            fontSize: 10,
            fill: '#374151',
            fontWeight: 'bold',
            textAnchor: 'middle',
          },
        },
      },
    };
  }

  /**
   * Configuração para distribuição de bolus por tipo de refeição
   */
  static getMealDistributionConfig(): PieChartConfig {
    return {
      width: 320,
      height: 320,
      padding: {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15,
      },
      colors: {
        primary: '#10b981',
        secondary: '#64748b',
        accent: '#f1f5f9',
      },
      chartProps: {
        theme: {
          pie: {
            style: {
              data: {
                fillOpacity: 0.85,
                stroke: '#ffffff',
                strokeWidth: 2,
              },
              labels: {
                fontSize: 10,
                fill: '#1f2937',
                fontFamily: 'Arial, sans-serif',
              },
            },
          },
        },
        animate: false,
        colorScale: [
          '#f59e0b', // Café da Manhã - Amarelo
          '#ef4444', // Almoço - Vermelho
          '#8b5cf6', // Café da Tarde - Roxo
          '#06b6d4', // Lanche - Ciano
          '#10b981', // Janta - Verde
          '#f97316', // Correção - Laranja
        ],
        innerRadius: 30, // Donut chart
        padAngle: 1.5,
      },
      pieProps: {
        style: {
          data: {
            fill: ({ datum }: any) => datum.fill || '#10b981',
            fillOpacity: 0.9,
            stroke: '#ffffff',
            strokeWidth: 1.5,
          },
          labels: {
            fontSize: 9,
            fill: '#1f2937',
            fontWeight: '600',
          },
        },
        animate: false,
        innerRadius: 35,
        padAngle: 2,
        labelRadius: ({ innerRadius }: any) => innerRadius + 50,
        labelComponent: {
          style: {
            fontSize: 9,
            fill: '#1f2937',
            fontWeight: '600',
            textAnchor: 'middle',
          },
        },
      },
    };
  }

  /**
   * Configuração para gráfico de cobertura (dias com/sem registros)
   */
  static getCoverageDistributionConfig(): PieChartConfig {
    return {
      width: 280,
      height: 280,
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10,
      },
      colors: {
        primary: '#22c55e',    // Verde para dias com registro
        secondary: '#ef4444',  // Vermelho para dias sem registro
        accent: '#f1f5f9',
      },
      chartProps: {
        theme: {
          pie: {
            style: {
              data: {
                fillOpacity: 0.9,
                stroke: '#ffffff',
                strokeWidth: 3,
              },
              labels: {
                fontSize: 12,
                fill: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
              },
            },
          },
        },
        animate: false,
        colorScale: ['#22c55e', '#ef4444'], // Verde e Vermelho
        innerRadius: 0,
        padAngle: 3,
      },
      pieProps: {
        style: {
          data: {
            fill: ({ datum }: any) => datum.fill ||
              (datum.x === 'Com Registros' ? '#22c55e' : '#ef4444'),
            fillOpacity: 0.95,
            stroke: '#ffffff',
            strokeWidth: 2,
          },
          labels: {
            fontSize: 11,
            fill: '#ffffff',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          },
        },
        animate: false,
        innerRadius: 0,
        padAngle: 4,
        labelRadius: ({ innerRadius }: any) => innerRadius + 60,
        labelComponent: {
          style: {
            fontSize: 11,
            fill: '#ffffff',
            fontWeight: 'bold',
            textAnchor: 'middle',
            textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
          },
        },
      },
    };
  }

  /**
   * Configuração para distribuição de leituras por período do dia
   */
  static getTimeOfDayDistributionConfig(): PieChartConfig {
    return {
      width: 300,
      height: 300,
      padding: {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15,
      },
      colors: {
        primary: '#6366f1',
        secondary: '#64748b',
        accent: '#f1f5f9',
      },
      chartProps: {
        theme: {
          pie: {
            style: {
              data: {
                fillOpacity: 0.8,
                stroke: '#ffffff',
                strokeWidth: 1.5,
              },
              labels: {
                fontSize: 10,
                fill: '#374151',
                fontFamily: 'Arial, sans-serif',
              },
            },
          },
        },
        animate: false,
        colorScale: [
          '#f59e0b', // Manhã - Amarelo
          '#ef4444', // Tarde - Vermelho
          '#8b5cf6', // Noite - Roxo
          '#1e293b', // Madrugada - Cinza escuro
        ],
        innerRadius: 25,
        padAngle: 2,
      },
      pieProps: {
        style: {
          data: {
            fill: ({ datum }: any) => datum.fill || '#6366f1',
            fillOpacity: 0.85,
            stroke: '#ffffff',
            strokeWidth: 1.5,
          },
          labels: {
            fontSize: 9,
            fill: '#374151',
            fontWeight: '500',
          },
        },
        animate: false,
        innerRadius: 30,
        padAngle: 2.5,
        labelRadius: ({ innerRadius }: any) => innerRadius + 45,
        labelComponent: {
          style: {
            fontSize: 9,
            fill: '#374151',
            fontWeight: '500',
            textAnchor: 'middle',
          },
        },
      },
    };
  }

  /**
   * Configuração para donut chart (com centro vazio)
   */
  static getDonutConfig(): PieChartConfig {
    return {
      width: 320,
      height: 320,
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
      colors: {
        primary: '#8b5cf6',
        secondary: '#64748b',
        accent: '#f1f5f9',
      },
      chartProps: {
        theme: {
          pie: {
            style: {
              data: {
                fillOpacity: 0.9,
                stroke: '#ffffff',
                strokeWidth: 2,
              },
              labels: {
                fontSize: 11,
                fill: '#374151',
                fontFamily: 'Arial, sans-serif',
                fontWeight: '500',
              },
            },
          },
        },
        animate: false,
        colorScale: [
          '#8b5cf6', '#06b6d4', '#10b981',
          '#f59e0b', '#ef4444', '#f97316'
        ],
        innerRadius: 60, // Centro vazio maior
        padAngle: 2,
      },
      pieProps: {
        style: {
          data: {
            fill: ({ datum }: any) => datum.fill || '#8b5cf6',
            fillOpacity: 0.9,
            stroke: '#ffffff',
            strokeWidth: 2,
          },
          labels: {
            fontSize: 10,
            fill: '#374151',
            fontWeight: '600',
          },
        },
        animate: false,
        innerRadius: 65,
        padAngle: 3,
        labelRadius: ({ innerRadius }: any) => innerRadius + 50,
        labelComponent: {
          style: {
            fontSize: 10,
            fill: '#374151',
            fontWeight: '600',
            textAnchor: 'middle',
          },
        },
      },
    };
  }

  /**
   * Configuração compacta para gráficos pequenos
   */
  static getCompactConfig(): PieChartConfig {
    return {
      width: 200,
      height: 200,
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10,
      },
      colors: {
        primary: '#06b6d4',
        secondary: '#9ca3af',
        accent: '#f9fafb',
      },
      chartProps: {
        theme: {
          pie: {
            style: {
              data: {
                fillOpacity: 0.8,
                stroke: '#ffffff',
                strokeWidth: 1,
              },
              labels: {
                fontSize: 8,
                fill: '#6b7280',
                fontFamily: 'Arial, sans-serif',
              },
            },
          },
        },
        animate: false,
        colorScale: ['#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
        innerRadius: 0,
        padAngle: 1,
      },
      pieProps: {
        style: {
          data: {
            fill: ({ datum }: any) => datum.fill || '#06b6d4',
            fillOpacity: 0.85,
            stroke: '#ffffff',
            strokeWidth: 1,
          },
          labels: {
            fontSize: 7,
            fill: '#6b7280',
          },
        },
        animate: false,
        innerRadius: 0,
        padAngle: 1.5,
        labelRadius: 30,
        labelComponent: {
          style: {
            fontSize: 7,
            fill: '#6b7280',
            textAnchor: 'middle',
          },
        },
      },
    };
  }

  /**
   * Configuração para gráfico com percentuais explícitos
   */
  static getPercentageConfig(): PieChartConfig {
    return {
      width: 350,
      height: 350,
      padding: {
        top: 25,
        right: 25,
        bottom: 25,
        left: 25,
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#f1f5f9',
      },
      chartProps: {
        theme: {
          pie: {
            style: {
              data: {
                fillOpacity: 0.9,
                stroke: '#ffffff',
                strokeWidth: 2,
              },
              labels: {
                fontSize: 11,
                fill: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
              },
            },
          },
        },
        animate: false,
        colorScale: [
          '#3b82f6', '#10b981', '#f59e0b',
          '#ef4444', '#8b5cf6', '#06b6d4'
        ],
        innerRadius: 0,
        padAngle: 2,
      },
      pieProps: {
        style: {
          data: {
            fill: ({ datum }: any) => datum.fill || '#3b82f6',
            fillOpacity: 0.9,
            stroke: '#ffffff',
            strokeWidth: 2,
          },
          labels: {
            fontSize: 10,
            fill: '#ffffff',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          },
        },
        animate: false,
        innerRadius: 0,
        padAngle: 3,
        labelRadius: ({ innerRadius }: any) => innerRadius + 80,
        labelComponent: {
          style: {
            fontSize: 10,
            fill: '#ffffff',
            fontWeight: 'bold',
            textAnchor: 'middle',
            textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
          },
        },
      },
    };
  }

  /**
   * Gera palette de cores balanceadas para segmentos
   */
  static generateBalancedColorPalette(count: number): string[] {
    const baseColors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
      '#ec4899', '#6366f1', '#14b8a6', '#f97171',
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    // Gerar cores adicionais com variações de matiz
    const colors = [...baseColors];
    const hueStep = 360 / count;

    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * hueStep) % 360;
      const saturation = 65 + (i % 3) * 10; // Variar saturação
      const lightness = 45 + (i % 2) * 15;  // Variar luminosidade
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }

    return colors;
  }

  /**
   * Processa dados para incluir percentuais nos labels
   */
  static addPercentageLabels(data: Array<{ x: string; y: number }>): Array<{
    x: string;
    y: number;
    label: string;
  }> {
    const total = data.reduce((sum, item) => sum + item.y, 0);

    return data.map(item => {
      const percentage = total > 0 ? ((item.y / total) * 100).toFixed(1) : '0.0';
      return {
        ...item,
        label: `${item.x}\n${percentage}%`,
      };
    });
  }

  /**
   * Filtra dados pequenos e agrupa em "Outros"
   */
  static consolidateSmallSegments(
    data: Array<{ x: string; y: number }>,
    threshold = 0.05 // 5% do total
  ): Array<{ x: string; y: number }> {
    const total = data.reduce((sum, item) => sum + item.y, 0);
    const minValue = total * threshold;

    const significantData: Array<{ x: string; y: number }> = [];
    let othersValue = 0;

    data.forEach(item => {
      if (item.y >= minValue) {
        significantData.push(item);
      } else {
        othersValue += item.y;
      }
    });

    if (othersValue > 0) {
      significantData.push({ x: 'Outros', y: othersValue });
    }

    return significantData.sort((a, b) => b.y - a.y);
  }

  /**
   * Utilitário para customizar configuração existente
   */
  static customize(baseConfig: PieChartConfig, overrides: Partial<PieChartConfig>): PieChartConfig {
    return {
      ...baseConfig,
      ...overrides,
      colors: { ...baseConfig.colors, ...overrides.colors },
      padding: { ...baseConfig.padding, ...overrides.padding },
      chartProps: { ...baseConfig.chartProps, ...overrides.chartProps },
      pieProps: { ...baseConfig.pieProps, ...overrides.pieProps },
    };
  }

  /**
   * Cria configuração responsiva baseada no tamanho
   */
  static createResponsiveConfig(size: 'small' | 'medium' | 'large'): PieChartConfig {
    switch (size) {
      case 'small':
        return this.getCompactConfig();
      case 'medium':
        return this.getMealDistributionConfig();
      case 'large':
        return this.getWeekdayDistributionConfig();
      default:
        return this.getMealDistributionConfig();
    }
  }
}
