/**
 * EmailTemplateService
 * Serviço de templates HTML profissionais para relatórios médicos
 * Templates responsivos com gráficos integrados e design médico
 */

import { ReportData } from './CompanionReportGenerator';

export class EmailTemplateService {
  
  private static readonly BRAND_COLORS = {
    primary: '#1976D2',
    secondary: '#2E7D32', 
    success: '#00C851',
    warning: '#ffbb33',
    danger: '#ff4444',
    light: '#F8F9FA',
    dark: '#212529'
  };

  /**
   * Template base com estilos responsivos
   */
  private static getBaseTemplate(): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório GlicoTrack</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .header {
            background: linear-gradient(135deg, ${this.BRAND_COLORS.primary} 0%, ${this.BRAND_COLORS.secondary} 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          
          .header .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 300;
          }
          
          .content {
            padding: 30px;
          }
          
          .summary-cards {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 40px;
          }
          
          .card {
            flex: 1;
            min-width: 200px;
            background: #f8f9fa;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            border: 2px solid #e9ecef;
          }
          
          .card.good { border-color: ${this.BRAND_COLORS.success}; }
          .card.warning { border-color: ${this.BRAND_COLORS.warning}; }
          .card.danger { border-color: ${this.BRAND_COLORS.danger}; }
          
          .card-value {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          
          .card.good .card-value { color: ${this.BRAND_COLORS.success}; }
          .card.warning .card-value { color: ${this.BRAND_COLORS.warning}; }
          .card.danger .card-value { color: ${this.BRAND_COLORS.danger}; }
          
          .card-label {
            font-size: 14px;
            font-weight: 600;
            color: #6c757d;
            margin-bottom: 4px;
          }
          
          .card-target {
            font-size: 12px;
            color: #6c757d;
            font-style: italic;
          }
          
          .section {
            margin-bottom: 40px;
          }
          
          .section-title {
            font-size: 24px;
            font-weight: 700;
            color: ${this.BRAND_COLORS.primary};
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
          }
          
          .insights-list {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
          }
          
          .insight-item {
            margin-bottom: 12px;
            padding: 8px 0;
            font-size: 15px;
          }
          
          .insight-item:last-child {
            margin-bottom: 0;
          }
          
          .chart-placeholder {
            background: #f8f9fa;
            border: 2px dashed #dee2e6;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            color: #6c757d;
            margin: 20px 0;
          }
          
          .recommendations {
            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
            border-radius: 8px;
            padding: 20px;
          }
          
          .alert {
            padding: 15px 20px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-weight: 600;
          }
          
          .alert-danger {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
          }
          
          .alert-warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
          }
          
          .footer {
            background-color: #343a40;
            color: white;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
          }
          
          .footer-links {
            margin-top: 15px;
          }
          
          .footer-links a {
            color: #adb5bd;
            text-decoration: none;
            margin: 0 10px;
          }
          
          .footer-links a:hover {
            color: white;
          }
          
          @media (max-width: 600px) {
            .container { margin: 0; }
            .summary-cards { flex-direction: column; }
            .card { min-width: auto; }
            .header h1 { font-size: 24px; }
            .content { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
    `;
  }

  /**
   * Template para relatório diário
   */
  static generateDailyReportTemplate(reportData: ReportData): string {
    const date = reportData.period.start.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      ${this.getBaseTemplate()}
      
      <div class="header">
        <h1>📊 Relatório Glicêmico Diário</h1>
        <div class="subtitle">${date}</div>
        <div class="subtitle">Usuário: ${reportData.patientInfo.userKey}</div>
      </div>
      
      <div class="content">
        <!-- Cards de Resumo -->
        <div class="summary-cards">
          <div class="card ${reportData.summary.averageGlucose >= 70 && reportData.summary.averageGlucose <= 180 ? 'good' : 'warning'}">
            <div class="card-value">${reportData.summary.averageGlucose}</div>
            <div class="card-label">Glicose Média</div>
            <div class="card-target">Meta: 70-180 mg/dL</div>
          </div>
          
          <div class="card ${reportData.summary.timeInRange >= 70 ? 'good' : 'warning'}">
            <div class="card-value">${reportData.summary.timeInRange}%</div>
            <div class="card-label">Tempo na Faixa</div>
            <div class="card-target">Meta: >70%</div>
          </div>
          
          <div class="card">
            <div class="card-value">${reportData.summary.totalInsulin}</div>
            <div class="card-label">Insulina Total</div>
            <div class="card-target">Unidades</div>
          </div>
          
          <div class="card">
            <div class="card-value">${reportData.summary.totalReadings}</div>
            <div class="card-label">Medições</div>
            <div class="card-target">Registros</div>
          </div>
        </div>

        <!-- Alertas -->
        ${reportData.alerts.map(alert => `
          <div class="alert ${alert.includes('🚨') ? 'alert-danger' : 'alert-warning'}">
            ${alert}
          </div>
        `).join('')}

        <!-- Gráfico Time in Range -->
        <div class="section">
          <h2 class="section-title">📈 Distribuição do Tempo nas Faixas</h2>
          <div class="chart-placeholder">
            <strong>Gráfico Time in Range</strong><br>
            <small>Tempo na Faixa Alvo (70-180 mg/dL): ${reportData.summary.timeInRange}%</small>
          </div>
        </div>

        <!-- Timeline de Glicose -->
        <div class="section">
          <h2 class="section-title">⏰ Timeline de Glicose (24h)</h2>
          <div class="chart-placeholder">
            <strong>Gráfico Timeline</strong><br>
            <small>Evolução da glicose ao longo do dia</small>
          </div>
        </div>

        <!-- Insights do Dia -->
        <div class="section">
          <h2 class="section-title">💡 Insights do Dia</h2>
          <div class="insights-list">
            ${reportData.insights.map(insight => `
              <div class="insight-item">${insight}</div>
            `).join('')}
          </div>
        </div>

        <!-- Recomendações -->
        <div class="section">
          <h2 class="section-title">📋 Recomendações</h2>
          <div class="recommendations">
            ${reportData.recommendations.map((rec, index) => `
              <div class="insight-item"><strong>${index + 1}.</strong> ${rec}</div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="footer">
        <div>
          <strong>GlicoTrack</strong> - Monitoramento de Glicose Inteligente<br>
          Relatório gerado em ${reportData.patientInfo.generatedAt.toLocaleString('pt-BR')}
        </div>
        <div class="footer-links">
          <a href="mailto:help@glicotrack.top">Suporte</a>
          <a href="#">Política de Privacidade</a>
        </div>
      </div>

      </div>
      </body>
      </html>
    `;
  }

  /**
   * Template para relatório semanal
   */
  static generateWeeklyReportTemplate(reportData: ReportData): string {
    const startDate = reportData.period.start.toLocaleDateString('pt-BR');
    const endDate = reportData.period.end.toLocaleDateString('pt-BR');

    return `
      ${this.getBaseTemplate()}
      
      <div class="header">
        <h1>📊 Relatório Glicêmico Semanal</h1>
        <div class="subtitle">${startDate} - ${endDate}</div>
        <div class="subtitle">Usuário: ${reportData.patientInfo.userKey}</div>
      </div>
      
      <div class="content">
        <!-- Cards de Resumo Semanal -->
        <div class="summary-cards">
          <div class="card ${reportData.summary.averageGlucose >= 70 && reportData.summary.averageGlucose <= 180 ? 'good' : 'warning'}">
            <div class="card-value">${reportData.summary.averageGlucose}</div>
            <div class="card-label">Glicose Média</div>
            <div class="card-target">Meta: 70-180 mg/dL</div>
          </div>
          
          <div class="card ${reportData.summary.timeInRange >= 70 ? 'good' : 'warning'}">
            <div class="card-value">${reportData.summary.timeInRange}%</div>
            <div class="card-label">Tempo na Faixa</div>
            <div class="card-target">Meta: >70%</div>
          </div>
          
          <div class="card ${reportData.summary.glucoseManagementIndicator <= 7.0 ? 'good' : 'warning'}">
            <div class="card-value">${reportData.summary.glucoseManagementIndicator}%</div>
            <div class="card-label">GMI Estimada</div>
            <div class="card-target">Meta: <7.0%</div>
          </div>
          
          <div class="card">
            <div class="card-value">${Math.round(reportData.summary.totalInsulin)}</div>
            <div class="card-label">Insulina Semanal</div>
            <div class="card-target">Unidades</div>
          </div>
        </div>

        <!-- Alertas -->
        ${reportData.alerts.map(alert => `
          <div class="alert ${alert.includes('🚨') ? 'alert-danger' : 'alert-warning'}">
            ${alert}
          </div>
        `).join('')}

        <!-- AGP (Ambulatory Glucose Profile) -->
        <div class="section">
          <h2 class="section-title">📈 AGP - Perfil Ambulatorial de Glicose</h2>
          <div class="chart-placeholder">
            <strong>Ambulatory Glucose Profile</strong><br>
            <small>Padrão de glicose por hora do dia com percentis</small>
          </div>
        </div>

        <!-- Padrões Diários -->
        <div class="section">
          <h2 class="section-title">🕐 Padrões por Período do Dia</h2>
          <div class="chart-placeholder">
            <strong>Gráfico de Tendências Diárias</strong><br>
            <small>Média de glicose por período: madrugada, manhã, tarde, noite</small>
          </div>
        </div>

        <!-- Variabilidade Glicêmica -->
        <div class="section">
          <h2 class="section-title">📊 Variabilidade Glicêmica</h2>
          <div class="chart-placeholder">
            <strong>Coeficiente de Variação por Dia</strong><br>
            <small>CV% Semanal: ${Math.round(reportData.analysis.glucose.variability.coefficientOfVariation)}% (Meta: <36%)</small>
          </div>
        </div>

        <!-- Padrões de Insulina -->
        <div class="section">
          <h2 class="section-title">💉 Padrões de Insulina</h2>
          <div class="chart-placeholder">
            <strong>Insulina Diária - Bolus vs Basal</strong><br>
            <small>Proporção Basal: ${Math.round(reportData.analysis.insulin.basalToBolusRatio)}%</small>
          </div>
        </div>

        <!-- Insights da Semana -->
        <div class="section">
          <h2 class="section-title">💡 Insights da Semana</h2>
          <div class="insights-list">
            ${reportData.insights.map(insight => `
              <div class="insight-item">${insight}</div>
            `).join('')}
          </div>
        </div>

        <!-- Recomendações -->
        <div class="section">
          <h2 class="section-title">📋 Plano de Ação</h2>
          <div class="recommendations">
            ${reportData.recommendations.map((rec, index) => `
              <div class="insight-item"><strong>${index + 1}.</strong> ${rec}</div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="footer">
        <div>
          <strong>GlicoTrack</strong> - Monitoramento de Glicose Inteligente<br>
          Relatório gerado em ${reportData.patientInfo.generatedAt.toLocaleString('pt-BR')}
        </div>
        <div class="footer-links">
          <a href="mailto:help@glicotrack.top">Suporte</a>
          <a href="#">Política de Privacidade</a>
        </div>
      </div>

      </div>
      </body>
      </html>
    `;
  }

  /**
   * Template para relatório mensal
   */
  static generateMonthlyReportTemplate(reportData: ReportData): string {
    const monthName = reportData.period.start.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long'
    });

    const daysInMonth = new Date(
      reportData.period.start.getFullYear(),
      reportData.period.start.getMonth() + 1,
      0
    ).getDate();

    return `
      ${this.getBaseTemplate()}
      
      <div class="header">
        <h1>📊 Relatório Glicêmico Mensal</h1>
        <div class="subtitle">${monthName}</div>
        <div class="subtitle">Usuário: ${reportData.patientInfo.userKey}</div>
      </div>
      
      <div class="content">
        <!-- Dashboard Executivo -->
        <div class="summary-cards">
          <div class="card ${reportData.summary.averageGlucose >= 70 && reportData.summary.averageGlucose <= 180 ? 'good' : 'warning'}">
            <div class="card-value">${reportData.summary.averageGlucose}</div>
            <div class="card-label">Glicose Média</div>
            <div class="card-target">Meta: 70-180 mg/dL</div>
          </div>
          
          <div class="card ${reportData.summary.timeInRange >= 70 ? 'good' : 'warning'}">
            <div class="card-value">${reportData.summary.timeInRange}%</div>
            <div class="card-label">Tempo na Faixa</div>
            <div class="card-target">Meta: >70%</div>
          </div>
          
          <div class="card ${reportData.summary.glucoseManagementIndicator <= 7.0 ? 'good' : 'warning'}">
            <div class="card-value">${reportData.summary.glucoseManagementIndicator}%</div>
            <div class="card-label">GMI (HbA1c estimada)</div>
            <div class="card-target">Meta: <7.0%</div>
          </div>
          
          <div class="card">
            <div class="card-value">${Math.round(reportData.analysis.glucose.variability.coefficientOfVariation)}%</div>
            <div class="card-label">Variabilidade (CV%)</div>
            <div class="card-target">Meta: <36%</div>
          </div>
        </div>

        <!-- Estatísticas do Mês -->
        <div class="section">
          <h2 class="section-title">📈 Resumo do Mês</h2>
          <div class="insights-list">
            <div class="insight-item"><strong>Total de Medições:</strong> ${reportData.summary.totalReadings} registros</div>
            <div class="insight-item"><strong>Insulina Total do Mês:</strong> ${Math.round(reportData.summary.totalInsulin)} unidades</div>
            <div class="insight-item"><strong>Média Diária de Insulina:</strong> ${Math.round(reportData.summary.totalInsulin / daysInMonth)} unidades</div>
            <div class="insight-item"><strong>Eventos Hipoglicêmicos:</strong> ${reportData.analysis.glucose.hypoglycemia.level1Events + reportData.analysis.glucose.hypoglycemia.level2Events}</div>
            <div class="insight-item"><strong>Eventos Hiperglicêmicos:</strong> ${reportData.analysis.glucose.hyperglycemia.level1Events + reportData.analysis.glucose.hyperglycemia.level2Events}</div>
          </div>
        </div>

        <!-- Alertas Mensais -->
        ${reportData.alerts.map(alert => `
          <div class="alert ${alert.includes('🚨') ? 'alert-danger' : 'alert-warning'}">
            ${alert}
          </div>
        `).join('')}

        <!-- AGP Mensal -->
        <div class="section">
          <h2 class="section-title">📈 AGP - Perfil Ambulatorial de Glicose (Mensal)</h2>
          <div class="chart-placeholder">
            <strong>Ambulatory Glucose Profile - ${monthName}</strong><br>
            <small>Padrão médio de glicose por hora do dia com bandas percentuais</small>
          </div>
        </div>

        <!-- Evolução Time in Range -->
        <div class="section">
          <h2 class="section-title">⏰ Distribuição Tempo nas Faixas</h2>
          <div class="chart-placeholder">
            <strong>Time in Range - Distribuição Mensal</strong><br>
            <div style="text-align: left; margin-top: 15px;">
              <div>🟢 Tempo na Faixa (70-180 mg/dL): ${Math.round(reportData.analysis.glucose.timeInRange.timeInRange)}%</div>
              <div>🟡 Acima da Faixa (181-250 mg/dL): ${Math.round(reportData.analysis.glucose.timeInRange.timeAboveRange)}%</div>
              <div>🔴 Abaixo da Faixa (54-69 mg/dL): ${Math.round(reportData.analysis.glucose.timeInRange.timeBelowRange)}%</div>
              <div>🔴 Muito Alto (>250 mg/dL): ${Math.round(reportData.analysis.glucose.timeInRange.timeCriticalHigh)}%</div>
              <div>⚫ Muito Baixo (<54 mg/dL): ${Math.round(reportData.analysis.glucose.timeInRange.timeCriticalLow)}%</div>
            </div>
          </div>
        </div>

        <!-- Padrões por Período -->
        <div class="section">
          <h2 class="section-title">🕐 Análise por Período do Dia</h2>
          <div class="insights-list">
            <div class="insight-item"><strong>Madrugada (04-08h):</strong> ${Math.round(reportData.analysis.glucose.dailyPatterns.dawn.avg)} mg/dL (${reportData.analysis.glucose.dailyPatterns.dawn.count} medições)</div>
            <div class="insight-item"><strong>Manhã (08-12h):</strong> ${Math.round(reportData.analysis.glucose.dailyPatterns.morning.avg)} mg/dL (${reportData.analysis.glucose.dailyPatterns.morning.count} medições)</div>
            <div class="insight-item"><strong>Tarde (12-18h):</strong> ${Math.round(reportData.analysis.glucose.dailyPatterns.afternoon.avg)} mg/dL (${reportData.analysis.glucose.dailyPatterns.afternoon.count} medições)</div>
            <div class="insight-item"><strong>Noite (18-22h):</strong> ${Math.round(reportData.analysis.glucose.dailyPatterns.evening.avg)} mg/dL (${reportData.analysis.glucose.dailyPatterns.evening.count} medições)</div>
            <div class="insight-item"><strong>Sono (22-04h):</strong> ${Math.round(reportData.analysis.glucose.dailyPatterns.night.avg)} mg/dL (${reportData.analysis.glucose.dailyPatterns.night.count} medições)</div>
          </div>
        </div>

        <!-- Gestão de Insulina -->
        <div class="section">
          <h2 class="section-title">💉 Gestão de Insulina - ${monthName}</h2>
          <div class="chart-placeholder">
            <strong>Padrões de Insulina Mensal</strong><br>
            <div style="text-align: left; margin-top: 15px;">
              <div><strong>Insulina Total:</strong> ${Math.round(reportData.summary.totalInsulin)} unidades</div>
              <div><strong>Insulina Bolus:</strong> ${Math.round(reportData.analysis.insulin.totalBolus * daysInMonth)} unidades</div>
              <div><strong>Insulina Basal:</strong> ${Math.round(reportData.analysis.insulin.totalBasal * daysInMonth)} unidades</div>
              <div><strong>Proporção Basal:</strong> ${Math.round(reportData.analysis.insulin.basalToBolusRatio)}%</div>
            </div>
          </div>
        </div>

        <!-- Insights do Mês -->
        <div class="section">
          <h2 class="section-title">💡 Insights do Mês</h2>
          <div class="insights-list">
            ${reportData.insights.map(insight => `
              <div class="insight-item">${insight}</div>
            `).join('')}
          </div>
        </div>

        <!-- Plano para Próximo Mês -->
        <div class="section">
          <h2 class="section-title">🎯 Plano para o Próximo Mês</h2>
          <div class="recommendations">
            ${reportData.recommendations.map((rec, index) => `
              <div class="insight-item"><strong>${index + 1}.</strong> ${rec}</div>
            `).join('')}
          </div>
        </div>

        <!-- Metas Atingidas -->
        <div class="section">
          <h2 class="section-title">🏆 Status das Metas</h2>
          <div class="insights-list">
            <div class="insight-item">
              ${reportData.summary.timeInRange >= 70 ? '✅' : '❌'} 
              <strong>Time in Range >70%:</strong> ${reportData.summary.timeInRange}%
            </div>
            <div class="insight-item">
              ${reportData.summary.glucoseManagementIndicator <= 7.0 ? '✅' : '❌'} 
              <strong>GMI <7.0%:</strong> ${reportData.summary.glucoseManagementIndicator}%
            </div>
            <div class="insight-item">
              ${reportData.analysis.glucose.variability.coefficientOfVariation <= 36 ? '✅' : '❌'} 
              <strong>Variabilidade <36%:</strong> ${Math.round(reportData.analysis.glucose.variability.coefficientOfVariation)}%
            </div>
            <div class="insight-item">
              ${reportData.analysis.glucose.hypoglycemia.level2Events === 0 ? '✅' : '❌'} 
              <strong>Zero hipoglicemias severas:</strong> ${reportData.analysis.glucose.hypoglycemia.level2Events} eventos
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div>
          <strong>GlicoTrack</strong> - Monitoramento de Glicose Inteligente<br>
          Relatório mensal gerado em ${reportData.patientInfo.generatedAt.toLocaleString('pt-BR')}
        </div>
        <div class="footer-links">
          <a href="mailto:help@glicotrack.top">Suporte</a>
          <a href="#">Política de Privacidade</a>
          <a href="#">Agendar Consulta</a>
        </div>
      </div>

      </div>
      </body>
      </html>
    `;
  }

  /**
   * Template para email de teste
   */
  static generateTestEmailTemplate(userKey: string, emailAddress: string): string {
    return `
      ${this.getBaseTemplate()}
      
      <div class="header">
        <h1>✅ Email de Teste - GlicoTrack</h1>
        <div class="subtitle">Configuração de Companion Emails</div>
      </div>
      
      <div class="content">
        <div class="section">
          <h2 class="section-title">🎉 Parabéns!</h2>
          <div class="insights-list">
            <div class="insight-item">✅ Seu email foi configurado com sucesso no sistema GlicoTrack</div>
            <div class="insight-item">📧 <strong>Email:</strong> ${emailAddress}</div>
            <div class="insight-item">🔑 <strong>Usuário:</strong> ${userKey}</div>
            <div class="insight-item">⏰ <strong>Configurado em:</strong> ${new Date().toLocaleString('pt-BR')}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">📋 O que esperar</h2>
          <div class="recommendations">
            <div class="insight-item"><strong>Relatórios Diários:</strong> Resumo diário com métricas essenciais</div>
            <div class="insight-item"><strong>Relatórios Semanais:</strong> Análise semanal com AGP e tendências</div>
            <div class="insight-item"><strong>Relatórios Mensais:</strong> Relatório completo com insights médicos</div>
            <div class="insight-item"><strong>Horário de Envio:</strong> 08:00 AM (conforme configuração)</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">📞 Suporte</h2>
          <div class="insights-list">
            <div class="insight-item">Se você não solicitou este email, por favor ignore esta mensagem.</div>
            <div class="insight-item">Para dúvidas ou suporte: <strong>help@glicotrack.top</strong></div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div>
          <strong>GlicoTrack</strong> - Monitoramento de Glicose Inteligente<br>
          Sistema de Companion Emails configurado
        </div>
        <div class="footer-links">
          <a href="mailto:help@glicotrack.top">Suporte</a>
          <a href="#">Política de Privacidade</a>
        </div>
      </div>

      </div>
      </body>
      </html>
    `;
  }

  /**
   * Gera template baseado no tipo de relatório
   */
  static generateTemplate(reportData: ReportData): string {
    switch (reportData.period.type) {
      case 'daily':
        return this.generateDailyReportTemplate(reportData);
      case 'weekly':
        return this.generateWeeklyReportTemplate(reportData);
      case 'monthly':
        return this.generateMonthlyReportTemplate(reportData);
      default:
        throw new Error(`Tipo de relatório não suportado: ${reportData.period.type}`);
    }
  }

  /**
   * Valida se um template está bem formado
   */
  static validateTemplate(template: string): boolean {
    // Validações básicas
    const hasDoctype = template.includes('<!DOCTYPE html>');
    const hasHtml = template.includes('<html') && template.includes('</html>');
    const hasHead = template.includes('<head>') && template.includes('</head>');
    const hasBody = template.includes('<body>') && template.includes('</body>');
    const hasTitle = template.includes('<title>');

    return hasDoctype && hasHtml && hasHead && hasBody && hasTitle;
  }
}