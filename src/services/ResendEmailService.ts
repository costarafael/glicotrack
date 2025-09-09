/**
 * Resend Email Service
 * Serviço para envio de emails usando a API Resend
 * Substitui o sistema anterior de Firebase Cloud Functions
 */

interface ResendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface EmailTemplate {
  verification: (code: string, userKey: string) => {
    subject: string;
    html: string;
    text: string;
  };
  recovery: (userKey: string) => {
    subject: string;
    html: string;
    text: string;
  };
  companionConfirmation: (confirmationToken: string, ownerUserKey: string) => {
    subject: string;
    html: string;
    text: string;
  };
}

class ResendEmailService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.resend.com';
  private readonly fromEmail = 'GlicoTrack <onboarding@resend.dev>'; // Domínio compartilhado oficial

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    
    if (!this.apiKey || !this.apiKey.startsWith('re_')) {
      throw new Error('❌ Resend API Key inválida. Deve começar com "re_"');
    }
    
    console.log('✅ ResendEmailService initialized');
  }

  // Templates de email profissionais
  private get templates(): EmailTemplate {
    return {
      verification: (code: string, userKey: string) => ({
        subject: '🔒 Código de Verificação - GlicoTrack',
        html: this.createVerificationEmailHTML(code, userKey),
        text: this.createVerificationEmailText(code, userKey)
      }),
      recovery: (userKey: string) => ({
        subject: '🔑 Sua Chave de Recuperação - GlicoTrack',
        html: this.createRecoveryEmailHTML(userKey),
        text: this.createRecoveryEmailText(userKey)
      }),
      companionConfirmation: (confirmationToken: string, ownerUserKey: string) => ({
        subject: '📧 Confirme seu E-mail Acompanhante - GlicoTrack',
        html: this.createCompanionConfirmationEmailHTML(confirmationToken, ownerUserKey),
        text: this.createCompanionConfirmationEmailText(confirmationToken, ownerUserKey)
      })
    };
  }

  /**
   * Enviar email usando Resend API
   */
  public async sendEmail(options: ResendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`📧 Sending email to: ${options.to}`);
      
      const payload = {
        from: options.from || this.fromEmail,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Resend API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Tratar erro 403 (restrição de plano gratuito) de forma mais amigável
        if (response.status === 403) {
          return {
            success: false,
            error: 'Plano gratuito Resend: emails limitados ao seu endereço verificado. Atualize o plano para enviar para outros emails.'
          };
        }
        
        return {
          success: false,
          error: `Resend API error: ${response.status} - ${errorData.message || response.statusText}`
        };
      }

      const data = await response.json();
      console.log('✅ Email sent successfully:', data.id);
      
      return {
        success: true,
        messageId: data.id
      };
    } catch (error: any) {
      console.error('❌ Error sending email via Resend:', error?.message || error);
      return {
        success: false,
        error: error?.message || 'Network error'
      };
    }
  }

  /**
   * Enviar email de verificação de código
   */
  async sendVerificationEmail(email: string, code: string, userKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.templates.verification(code, userKey);
      
      const result = await this.sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
      
      if (result.success) {
        console.log('✅ Verification email sent successfully');
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('❌ Error sending verification email:', error?.message || error);
      return { success: false, error: 'Erro ao enviar email de verificação' };
    }
  }

  /**
   * Enviar email de recuperação de chave
   */
  async sendRecoveryEmail(email: string, userKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.templates.recovery(userKey);
      
      const result = await this.sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
      
      if (result.success) {
        console.log('✅ Recovery email sent successfully');
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('❌ Error sending recovery email:', error?.message || error);
      return { success: false, error: 'Erro ao enviar email de recuperação' };
    }
  }

  /**
   * Envia email de confirmação para e-mail acompanhante
   */
  async sendCompanionConfirmationEmail(
    email: string, 
    confirmationToken: string, 
    ownerUserKey: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 [ResendEmailService] Sending companion confirmation email to: ${email}`);
      
      const template = this.templates.companionConfirmation(confirmationToken, ownerUserKey);
      
      const result = await this.sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      
      if (result.success) {
        console.log('✅ Companion confirmation email sent successfully');
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('❌ Error sending companion confirmation email:', error?.message || error);
      return { success: false, error: 'Erro ao enviar email de confirmação' };
    }
  }

  /**
   * Template HTML para email de verificação
   */
  private createVerificationEmailHTML(code: string, userKey: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Verificação - GlicoTrack</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3B82F6;
            margin-bottom: 10px;
        }
        .code-box {
            background: #F3F4F6;
            border: 2px dashed #3B82F6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #3B82F6;
            letter-spacing: 4px;
            font-family: 'Monaco', 'Consolas', monospace;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            font-size: 14px;
            color: #6B7280;
            text-align: center;
        }
        .warning {
            background: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🩸 GlicoTrack</div>
            <h1>Código de Verificação</h1>
            <p>Use o código abaixo para confirmar seu email de recuperação:</p>
        </div>
        
        <div class="code-box">
            <div class="code">${code}</div>
        </div>
        
        <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Este código expira em <strong>15 minutos</strong></li>
                <li>Use-o apenas no aplicativo GlicoTrack</li>
                <li>Não compartilhe este código com ninguém</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <p><strong>Sua Chave de Usuário:</strong> <code style="background: #F3F4F6; padding: 4px 8px; border-radius: 4px;">${userKey}</code></p>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado automaticamente pelo GlicoTrack.</p>
            <p>Se você não solicitou este código, pode ignorar este email.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Template TEXT para email de verificação
   */
  private createVerificationEmailText(code: string, userKey: string): string {
    return `
🩸 GlicoTrack - Código de Verificação

Olá!

Use o código abaixo para confirmar seu email de recuperação:

CÓDIGO: ${code}

⚠️ IMPORTANTE:
• Este código expira em 15 minutos
• Use-o apenas no aplicativo GlicoTrack  
• Não compartilhe este código com ninguém

Sua Chave de Usuário: ${userKey}

Este email foi enviado automaticamente pelo GlicoTrack.
Se você não solicitou este código, pode ignorar este email.
`;
  }

  /**
   * Template HTML para email de recuperação de chave
   */
  private createRecoveryEmailHTML(userKey: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de Chave - GlicoTrack</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #10B981;
            margin-bottom: 10px;
        }
        .key-box {
            background: #ECFDF5;
            border: 2px solid #10B981;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .key {
            font-size: 24px;
            font-weight: bold;
            color: #10B981;
            letter-spacing: 2px;
            font-family: 'Monaco', 'Consolas', monospace;
        }
        .instructions {
            background: #F0F9FF;
            border-left: 4px solid #3B82F6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            font-size: 14px;
            color: #6B7280;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔑 GlicoTrack</div>
            <h1>Recuperação de Chave</h1>
            <p>Sua chave de acesso aos dados na nuvem:</p>
        </div>
        
        <div class="key-box">
            <div class="key">${userKey}</div>
        </div>
        
        <div class="instructions">
            <h3>📱 Como usar sua chave:</h3>
            <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Abra o aplicativo GlicoTrack</li>
                <li>Vá em "Opções" → "Sincronização Firebase"</li>
                <li>Cole sua chave no campo "Chave do Usuário"</li>
                <li>Toque em "Habilitar Sincronização"</li>
                <li>Seus dados na nuvem serão restaurados</li>
            </ol>
        </div>
        
        <div style="text-align: center; margin: 20px 0; padding: 15px; background: #FEF3C7; border-radius: 8px;">
            <strong>🛡️ Mantenha sua chave segura!</strong><br>
            <small>Esta chave dá acesso aos seus dados de glicose na nuvem.</small>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado porque você solicitou a recuperação da sua chave.</p>
            <p>Se você não fez esta solicitação, pode ignorar este email.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Template TEXT para email de recuperação de chave
   */
  private createRecoveryEmailText(userKey: string): string {
    return `
🔑 GlicoTrack - Recuperação de Chave

Olá!

Sua chave de acesso aos dados na nuvem:

CHAVE: ${userKey}

📱 COMO USAR SUA CHAVE:
1. Abra o aplicativo GlicoTrack
2. Vá em "Opções" → "Sincronização Firebase"  
3. Cole sua chave no campo "Chave do Usuário"
4. Toque em "Habilitar Sincronização"
5. Seus dados na nuvem serão restaurados

🛡️ MANTENHA SUA CHAVE SEGURA!
Esta chave dá acesso aos seus dados de glicose na nuvem.

Este email foi enviado porque você solicitou a recuperação da sua chave.
Se você não fez esta solicitação, pode ignorar este email.
`;
  }

  /**
   * Template HTML para email de confirmação de acompanhante
   */
  private createCompanionConfirmationEmailHTML(confirmationToken: string, ownerUserKey: string): string {
    // Gerar código de 6 dígitos baseado no token
    const confirmationCode = this.generateConfirmationCode(confirmationToken);
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Confirmação - E-mail Acompanhante GlicoTrack</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3B82F6;
            margin-bottom: 10px;
        }
        .code-box {
            background: #F8FAFC;
            border: 3px dashed #3B82F6;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 30px 0;
        }
        .code-label {
            font-size: 16px;
            color: #64748B;
            margin-bottom: 8px;
            font-weight: 500;
        }
        .confirmation-code {
            font-size: 36px;
            font-weight: bold;
            color: #3B82F6;
            letter-spacing: 8px;
            font-family: 'Monaco', 'Consolas', monospace;
            margin: 12px 0;
        }
        .code-instructions {
            font-size: 14px;
            color: #64748B;
            margin-top: 12px;
            font-style: italic;
        }
        .info-box {
            background-color: #EFF6FF;
            border-left: 4px solid #3B82F6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📧 GlicoTrack</div>
            <h1 style="color: #1f2937; margin: 0;">Confirme seu E-mail Acompanhante</h1>
        </div>
        
        <p>Olá!</p>
        
        <p>Você foi adicionado como <strong>e-mail acompanhante</strong> para receber relatórios automáticos de dados de glicose.</p>
        
        <div class="info-box">
            <strong>📊 Como e-mail acompanhante, você receberá:</strong>
            <ul>
                <li>Relatórios diários (se configurado)</li>
                <li>Relatórios semanais (se configurado)</li>
                <li>Relatórios mensais (sempre enviados)</li>
            </ul>
        </div>
        
        <p style="text-align: center;">
            <strong>Para confirmar seu e-mail e começar a receber os relatórios, use o código abaixo:</strong>
        </p>
        
        <div class="code-box">
            <div class="code-label">Código de Confirmação:</div>
            <div class="confirmation-code">${confirmationCode}</div>
            <div class="code-instructions">Digite este código no aplicativo GlicoTrack para confirmar</div>
        </div>
        
        <div class="info-box">
            <strong>🔒 Sua privacidade é importante:</strong><br>
            Você só receberá relatórios relacionados aos dados de glicose. Nenhuma informação pessoal adicional será compartilhada.
        </div>
        
        <p><strong>Chave do proprietário dos dados:</strong> ${ownerUserKey}</p>
        
        <div class="footer">
            <p>Este e-mail foi enviado porque você foi adicionado como e-mail acompanhante no GlicoTrack.</p>
            <p>Se você não solicitou isso, pode ignorar este e-mail.</p>
            <p><strong>GlicoTrack</strong> - Monitoramento de Glicose Inteligente</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Template texto para email de confirmação de acompanhante
   */
  private createCompanionConfirmationEmailText(confirmationToken: string, ownerUserKey: string): string {
    // Gerar código de 6 dígitos baseado no token
    const confirmationCode = this.generateConfirmationCode(confirmationToken);
    
    return `
📧 GLICOTRACK - CÓDIGO DE CONFIRMAÇÃO

Olá!

Você foi adicionado como e-mail acompanhante para receber relatórios automáticos de dados de glicose.

📊 COMO E-MAIL ACOMPANHANTE, VOCÊ RECEBERÁ:
• Relatórios diários (se configurado)
• Relatórios semanais (se configurado) 
• Relatórios mensais (sempre enviados)

🔢 CÓDIGO DE CONFIRMAÇÃO: ${confirmationCode}

Digite este código no aplicativo GlicoTrack para confirmar seu e-mail.

🔒 SUA PRIVACIDADE É IMPORTANTE:
Você só receberá relatórios relacionados aos dados de glicose. Nenhuma informação pessoal adicional será compartilhada.

Chave do proprietário dos dados: ${ownerUserKey}

Este e-mail foi enviado porque você foi adicionado como e-mail acompanhante no GlicoTrack.
Se você não solicitou isso, pode ignorar este e-mail.

GlicoTrack - Monitoramento de Glicose Inteligente
`;
  }

  /**
   * Testar conectividade com Resend API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'test@resend.dev',
          to: ['test@example.com'],
          subject: 'Test',
          html: '<p>Test</p>'
        }),
      });

      // API retornará erro 422 para domínio não verificado, mas isso confirma conectividade
      if (response.status === 422) {
        console.log('✅ Resend API connection test successful (domain verification needed)');
        return { success: true };
      }

      if (response.status === 401) {
        return { success: false, error: 'API Key inválida' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Resend API connection test failed:', error?.message || error);
      return { success: false, error: 'Erro de conectividade' };
    }
  }

  /**
   * Gera código de confirmação de 6 dígitos baseado no token
   */
  private generateConfirmationCode(token: string): string {
    // Usar hash do token para gerar código consistente
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Garantir que seja positivo e tenha 6 dígitos
    const code = Math.abs(hash % 1000000).toString().padStart(6, '0');
    return code;
  }
}

// Instância padrão com a API key configurada
const resendInstance = new ResendEmailService('re_eDxc47fH_9ibDQr5KZZfgUp9t35dvnwzz');

// Exportar a classe também para casos especiais
export { ResendEmailService };

export default resendInstance;