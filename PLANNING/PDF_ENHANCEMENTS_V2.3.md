# 📊 **Planejamento: Melhorias Avançadas do Relatório PDF v2.3**

## **🎯 Objetivos Principais**

### **Novas Métricas Estatísticas**
- ✅ **Média Diária Bolus:** Total Bolus ÷ Dias com registros
- ✅ **Média Diária Basal:** Total Basal ÷ Dias com registros  
- ✅ **Média Bolus por Refeição:** Agrupamento por tipo de refeição
- ✅ **Cobertura de Medições:** % dias com registros vs total do mês
- ✅ **Análise Cohort:** Dias da semana com mais/menos atividade

### **Dashboard com Gráficos**
- 📈 **Gráfico de Linha:** Evolução glicose média por dia
- 📊 **Gráfico de Barras:** Bolus por tipo de refeição
- 🥧 **Gráfico Pizza:** Distribuição de registros por dia da semana
- 📈 **Gráfico de Área:** Cobertura de medições ao longo do mês

---

## **📁 Nova Estrutura Desacoplada**

### **1. Serviços de Estatísticas**
```
/src/services/statistics/
├── AdvancedStatisticsCalculator.ts    # Cálculos avançados
├── CohortAnalyzer.ts                   # Análise de dias da semana
├── CoverageAnalyzer.ts                 # Análise de cobertura
└── MealAnalyzer.ts                     # Análise por refeição
```

### **2. Geração de Gráficos**
```
/src/services/charts/
├── ChartGenerator.ts                   # Interface principal
├── VictoryChartRenderer.ts            # Renderização Victory Native
├── ChartSVGExporter.ts                # Exportação SVG para PDF
└── chartTypes/
    ├── LineChartConfig.ts             # Config gráfico linha
    ├── BarChartConfig.ts              # Config gráfico barras
    ├── PieChartConfig.ts              # Config gráfico pizza
    └── AreaChartConfig.ts             # Config gráfico área
```

### **3. Templates HTML**
```
/src/services/pdf/
├── PDFTemplateGenerator.ts            # Templates HTML
├── StatsSectionGenerator.ts           # Seção estatísticas
├── ChartsSectionGenerator.ts          # Seção gráficos
└── templates/
    ├── statsSection.html              # Template estatísticas
    └── chartsSection.html             # Template gráficos
```

---

## **🔧 Implementação Técnica**

### **Fase 1: Dependências e Setup**

#### **1.1 Instalar Victory Native**
```bash
npm install victory-native
npm install react-native-svg
npx pod-install # iOS only
```

#### **1.2 Novos Tipos e Interfaces**
```typescript
// /src/types/statistics.ts
interface AdvancedStatistics extends MonthlyStatistics {
  // Médias diárias
  averageDailyBolus: number;
  averageDailyBasal: number;
  
  // Análise por refeição
  bolusPerMealType: Record<MealType, {
    total: number;
    average: number;
    count: number;
  }>;
  
  // Cobertura e cohort
  coverage: CoverageAnalysis;
  weekdayAnalysis: WeekdayAnalysis;
}

interface CoverageAnalysis {
  daysWithRecords: number;
  totalDaysInMonth: number;
  coveragePercentage: number;
  missingDays: number[];
}

interface WeekdayAnalysis {
  recordsPerWeekday: Record<number, number>; // 0-6 (Sun-Sat)
  mostActiveWeekday: number;
  leastActiveWeekday: number;
}

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  config: ChartConfig;
  svgString: string;
}
```

### **Fase 2: Serviços de Cálculo**

#### **2.1 AdvancedStatisticsCalculator.ts**
```typescript
export class AdvancedStatisticsCalculator {
  static calculate(monthlyLogs: DailyLog[], month: number, year: number): AdvancedStatistics {
    const basic = PDFGenerator.calculateStatistics(monthlyLogs);
    
    return {
      ...basic,
      averageDailyBolus: this.calculateAverageDailyBolus(monthlyLogs),
      averageDailyBasal: this.calculateAverageDailyBasal(monthlyLogs),
      bolusPerMealType: MealAnalyzer.analyzeBolusPerMeal(monthlyLogs),
      coverage: CoverageAnalyzer.analyzeCoverage(monthlyLogs, month, year),
      weekdayAnalysis: CohortAnalyzer.analyzeWeekdays(monthlyLogs),
    };
  }
}
```

#### **2.2 MealAnalyzer.ts**
```typescript
export class MealAnalyzer {
  static analyzeBolusPerMeal(logs: DailyLog[]): Record<MealType, MealStats> {
    const mealStats: Record<string, { total: number; count: number }> = {};
    
    logs.forEach(log => {
      log.bolusEntries.forEach(entry => {
        if (!mealStats[entry.mealType]) {
          mealStats[entry.mealType] = { total: 0, count: 0 };
        }
        mealStats[entry.mealType].total += entry.units;
        mealStats[entry.mealType].count += 1;
      });
    });
    
    // Calcular médias por refeição
    const result = {} as Record<MealType, MealStats>;
    Object.keys(mealStats).forEach(mealType => {
      const stats = mealStats[mealType];
      result[mealType as MealType] = {
        total: stats.total,
        average: stats.total / stats.count,
        count: stats.count,
      };
    });
    
    return result;
  }
}
```

#### **2.3 CoverageAnalyzer.ts**
```typescript
export class CoverageAnalyzer {
  static analyzeCoverage(logs: DailyLog[], month: number, year: number): CoverageAnalysis {
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysWithRecords = logs.length;
    const coveragePercentage = (daysWithRecords / daysInMonth) * 100;
    
    // Identificar dias sem registros
    const recordedDays = new Set(logs.map(log => new Date(log.date).getDate()));
    const missingDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      if (!recordedDays.has(day)) {
        missingDays.push(day);
      }
    }
    
    return {
      daysWithRecords,
      totalDaysInMonth: daysInMonth,
      coveragePercentage: Math.round(coveragePercentage),
      missingDays,
    };
  }
}
```

### **Fase 3: Sistema de Gráficos**

#### **3.1 ChartGenerator.ts** (Interface Principal)
```typescript
export class ChartGenerator {
  private renderer: VictoryChartRenderer;
  private exporter: ChartSVGExporter;
  
  constructor() {
    this.renderer = new VictoryChartRenderer();
    this.exporter = new ChartSVGExporter();
  }
  
  async generateAllCharts(statistics: AdvancedStatistics, logs: DailyLog[]): Promise<ChartData[]> {
    const charts: ChartData[] = [];
    
    // Gráfico evolução glicose
    charts.push(await this.generateGlucoseEvolutionChart(logs));
    
    // Gráfico bolus por refeição  
    charts.push(await this.generateBolusPerMealChart(statistics.bolusPerMealType));
    
    // Gráfico cobertura
    charts.push(await this.generateCoverageChart(statistics.coverage));
    
    // Gráfico dias da semana
    charts.push(await this.generateWeekdayChart(statistics.weekdayAnalysis));
    
    return charts;
  }
  
  private async generateGlucoseEvolutionChart(logs: DailyLog[]): Promise<ChartData> {
    // Preparar dados para Victory Line Chart
    const data = logs.map(log => ({
      x: new Date(log.date).getDate(),
      y: log.glucoseEntries.length > 0 
        ? log.glucoseEntries.reduce((sum, entry) => sum + entry.value, 0) / log.glucoseEntries.length
        : 0
    }));
    
    const config = LineChartConfig.getGlucoseEvolutionConfig();
    const svgString = await this.renderer.renderLineChart(data, config);
    
    return {
      type: 'line',
      data,
      config,
      svgString,
    };
  }
}
```

#### **3.2 VictoryChartRenderer.ts**
```typescript
import { VictoryLine, VictoryChart, VictoryAxis } from 'victory-native';

export class VictoryChartRenderer {
  async renderLineChart(data: any[], config: LineChartConfig): Promise<string> {
    // Usar Victory Native para renderizar componente
    // Converter para SVG string usando react-native-svg
    
    const chartComponent = (
      <VictoryChart {...config.chartProps}>
        <VictoryAxis {...config.xAxisProps} />
        <VictoryAxis dependentAxis {...config.yAxisProps} />
        <VictoryLine
          data={data}
          {...config.lineProps}
        />
      </VictoryChart>
    );
    
    // Converter para SVG string (implementar usando react-native-svg)
    return this.componentToSVG(chartComponent);
  }
  
  private async componentToSVG(component: React.ReactElement): Promise<string> {
    // Implementar conversão React Component -> SVG string
    // Usar react-native-svg renderToStaticMarkup equivalente
    return '<svg>...</svg>'; // Placeholder
  }
}
```

### **Fase 4: Templates HTML Avançados**

#### **4.1 StatsSectionGenerator.ts**
```typescript
export class StatsSectionGenerator {
  static generate(statistics: AdvancedStatistics): string {
    return `
      <div class="advanced-stats-section">
        <div class="stats-title">Estatísticas Avançadas do Mês</div>
        
        <!-- Estatísticas básicas existentes -->
        ${this.generateBasicStats(statistics)}
        
        <!-- Novas métricas -->
        <div class="stats-subsection">
          <div class="subsection-title">📊 Médias Diárias</div>
          <div class="stat-item">
            <span class="stat-value">${formatInsulinUnits(statistics.averageDailyBolus)}</span> 
            Bolus médio diário
          </div>
          <div class="stat-item">
            <span class="stat-value">${formatInsulinUnits(statistics.averageDailyBasal)}</span> 
            Basal médio diário
          </div>
        </div>
        
        <!-- Análise por refeição -->
        <div class="stats-subsection">
          <div class="subsection-title">🍽️ Análise por Refeição</div>
          ${this.generateMealAnalysis(statistics.bolusPerMealType)}
        </div>
        
        <!-- Cobertura de medições -->
        <div class="stats-subsection">
          <div class="subsection-title">📋 Cobertura de Registros</div>
          <div class="stat-item">
            <span class="stat-value coverage-${this.getCoverageLevel(statistics.coverage.coveragePercentage)}">
              ${statistics.coverage.coveragePercentage}%
            </span> 
            Cobertura mensal (${statistics.coverage.daysWithRecords}/${statistics.coverage.totalDaysInMonth} dias)
          </div>
          ${statistics.coverage.missingDays.length > 0 ? 
            `<div class="missing-days">Dias sem registro: ${statistics.coverage.missingDays.join(', ')}</div>` 
            : ''}
        </div>
        
        <!-- Análise cohort -->
        <div class="stats-subsection">
          <div class="subsection-title">📅 Análise Semanal</div>
          <div class="stat-item">
            <span class="stat-value">${this.getWeekdayName(statistics.weekdayAnalysis.mostActiveWeekday)}</span> 
            Dia mais ativo
          </div>
          <div class="stat-item">
            <span class="stat-value">${this.getWeekdayName(statistics.weekdayAnalysis.leastActiveWeekday)}</span> 
            Dia menos ativo
          </div>
        </div>
      </div>
    `;
  }
}
```

#### **4.2 ChartsSectionGenerator.ts**
```typescript
export class ChartsSectionGenerator {
  static generate(charts: ChartData[]): string {
    return `
      <div class="charts-section">
        <div class="section-title">📈 Dashboard Mensal</div>
        
        <div class="charts-grid">
          ${charts.map(chart => this.generateChartHTML(chart)).join('\n')}
        </div>
      </div>
    `;
  }
  
  private static generateChartHTML(chart: ChartData): string {
    return `
      <div class="chart-container">
        <div class="chart-title">${this.getChartTitle(chart.type)}</div>
        <div class="chart-svg">
          ${chart.svgString}
        </div>
      </div>
    `;
  }
}
```

### **Fase 5: Integração no PDFGenerator**

#### **5.1 PDFGenerator.ts (Refatorado)**
```typescript
// Adicionar ao método calculateStatistics
static calculateAdvancedStatistics(monthlyLogs: DailyLog[], month: number, year: number): AdvancedStatistics {
  return AdvancedStatisticsCalculator.calculate(monthlyLogs, month, year);
}

// Novo método para geração completa
private static async generateAdvancedHTMLContent(
  monthlyLogs: DailyLog[],
  month: number,
  year: number,
  statistics: AdvancedStatistics
): Promise<string> {
  const monthName = getMonthName(month);
  
  // Gerar gráficos
  const chartGenerator = new ChartGenerator();
  const charts = await chartGenerator.generateAllCharts(statistics, monthlyLogs);
  
  // Gerar seções HTML
  const statsSection = StatsSectionGenerator.generate(statistics);
  const chartsSection = ChartsSectionGenerator.generate(charts);
  
  return `
    <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório GlicoTrack Avançado - ${monthName} ${year}</title>
        <style>${this.generateAdvancedStyles()}</style>
      </head>
      <body>
        <div class="header">
          <div class="title">Relatório GlicoTrack Avançado</div>
          <div class="subtitle">${monthName} ${year}</div>
        </div>
        
        ${statsSection}
        ${chartsSection}
        
        <div class="logs-section">
          <!-- Registros detalhados existentes -->
          ${this.generateDetailedLogs(monthlyLogs)}
        </div>
      </body>
    </html>
  `;
}
```

---

## **⚡ Cronograma de Implementação**

### **Sprint 1: Fundação (3-4 dias)**
- ✅ Instalar Victory Native e dependências
- ✅ Criar estrutura de pastas desacoplada  
- ✅ Definir novas interfaces e tipos
- ✅ Implementar AdvancedStatisticsCalculator

### **Sprint 2: Análises Avançadas (3-4 dias)**
- ✅ Implementar MealAnalyzer
- ✅ Implementar CoverageAnalyzer  
- ✅ Implementar CohortAnalyzer
- ✅ Testes unitários para cálculos

### **Sprint 3: Sistema de Gráficos (5-6 dias)**
- ✅ Implementar ChartGenerator
- ✅ Implementar VictoryChartRenderer
- ✅ Configurar exportação SVG
- ✅ Criar configurações de cada tipo de gráfico

### **Sprint 4: Templates HTML (2-3 dias)**
- ✅ Implementar StatsSectionGenerator
- ✅ Implementar ChartsSectionGenerator
- ✅ Criar CSS avançado para dashboard
- ✅ Responsive design para PDF

### **Sprint 5: Integração e Testes (3-4 dias)**
- ✅ Integrar tudo no PDFGenerator
- ✅ Atualizar useMonthlyReport hook
- ✅ Testes end-to-end
- ✅ Otimização de performance

### **Sprint 6: Polimento (2-3 dias)**
- ✅ Refinamento visual
- ✅ Tratamento de edge cases
- ✅ Documentação
- ✅ Build e deploy

---

## **🚀 Comandos de Desenvolvimento**

### **Instalação de Dependências**
```bash
# Victory Native + SVG
npm install victory-native react-native-svg
cd ios && pod install

# Rebuild após instalação
./build.sh
```

### **Estrutura de Testes**
```bash
# Executar testes específicos
npm test -- --testPathPattern=statistics
npm test -- --testPathPattern=charts
npm test -- --testPathPattern=pdf
```

### **Debug e Logs**
```bash
# Logs específicos para PDF
adb logcat -s "ReactNativeJS" | grep PDF

# Logs para gráficos
adb logcat -s "ReactNativeJS" | grep Chart
```

---

## **🎯 Resultado Esperado v2.3**

### **Dashboard PDF Completo**
- ✅ **20+ Métricas** avançadas calculadas automaticamente
- ✅ **4 Gráficos** interativos integrados via SVG
- ✅ **Análise Cohort** inteligente de padrões semanais
- ✅ **Cobertura Visual** intuitiva com indicadores
- ✅ **Performance** mantida com arquitetura desacoplada

### **Benefícios Técnicos**
- ✅ **PDFGenerator.ts** permanece limpo (< 500 linhas)
- ✅ **Modularidade** total com responsabilidades separadas
- ✅ **Extensibilidade** fácil para novos tipos de análise
- ✅ **Testabilidade** alta com units tests isolados
- ✅ **Reutilização** dos components de gráfico em outras telas

---

**🚨 Observação:** Este planejamento mantém compatibilidade total com Nova Arquitetura React Native e Firebase, seguindo as regras críticas do projeto GlicoTrack v2.2.