import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

admin.initializeApp();

// Load Resend API Key from functions config (set via: firebase functions:config:set resend.apikey="re_xxx" resend.sender_email="..." resend.sender_name="...")
const RESEND_API_KEY = functions.config().resend?.apikey as string | undefined;
const SENDER_EMAIL = functions.config().resend?.sender_email as string | undefined;
const SENDER_NAME = functions.config().resend?.sender_name as string | undefined;

let resend: Resend | null = null;
if (!RESEND_API_KEY) {
  console.warn('[functions] RESEND_API_KEY not set. /send-email will be disabled.');
} else {
  resend = new Resend(RESEND_API_KEY);
}

// Util: 15 minutos
const CODE_EXPIRY_MINUTES = 15;

export const sendEmail = functions.https.onCall(async (data, context) => {
  if (!resend) {
    throw new functions.https.HttpsError('failed-precondition', 'Email service not configured');
  }

  // Optional: require auth + App Check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { to, type, code, userKey } = data || {};

  if (!to || !type || !code) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: to, type, code');
  }

  const subject = type === 'recovery' ? 'GlicoTrack - Recuperação de Conta' : 'GlicoTrack - Código de Verificação';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">GlicoTrack</h1>
        <p style="margin: 10px 0 0 0;">Sistema de Monitoramento de Glicose</p>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 10px 10px;">
        <h2>${type === 'recovery' ? 'Recuperação de Conta' : 'Verificação de E-mail'}</h2>
        <p>Seu código: <strong style="font-size: 24px; color: #667eea; font-family: 'Courier New', monospace;">${code}</strong></p>
        <p><strong>Este código expira em ${CODE_EXPIRY_MINUTES} minutos.</strong></p>
        ${userKey ? `<p>Sua chave de usuário: <strong>${userKey}</strong></p>` : ''}
        <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
          <p>Se você não solicitou este código, ignore este e-mail.</p>
          <p>© 2025 GlicoTrack - Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: `${SENDER_NAME || 'GlicoTrack'} <${SENDER_EMAIL || 'noreply@glicotrack.com'}>`,
      to: [to],
      subject,
      html,
    });
    return { success: true };
  } catch (e: any) {
    console.error('[sendEmail] error', e?.message || e);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});

// Companion token exchange: issue temporary custom claims for reading another user's daily_logs
export const companionExchange = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { targetUid, ttlSeconds } = data || {};
  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing targetUid');
  }

  const expMillis = Date.now() + (Math.min(Number(ttlSeconds) || 900, 3600) * 1000); // default 15m, max 1h

  try {
    await admin.auth().setCustomUserClaims(context.auth.uid, {
      companion_target_uid: targetUid,
      companion_exp: expMillis,
    });
    return { success: true, companion_exp: expMillis };
  } catch (e: any) {
    console.error('[companionExchange] error', e?.message || e);
    throw new functions.https.HttpsError('internal', 'Failed to set custom claims');
  }
});
