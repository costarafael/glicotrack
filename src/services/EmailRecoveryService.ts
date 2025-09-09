import { MMKV } from 'react-native-mmkv';
import { Alert } from 'react-native';
import FirebaseEmailService from './FirebaseEmailService';
import ResendEmailService from './ResendEmailService';

interface EmailRecoveryData {
  email: string;
  userKey: string;
  emailHash: string;
  verificationCode?: string;
  codeExpiry?: Date;
  isVerified: boolean;
  attempts: number;
  lastAttempt?: Date;
}

interface VerificationResult {
  success: boolean;
  userKey?: string;
  error?: string;
}

class EmailRecoveryService {
  private storage: MMKV;
  private resendService: ResendEmailService | null = null;
  private readonly STORAGE_KEY = 'email_recovery_data';
  private readonly PENDING_CODES_KEY = 'pending_verification_codes';
  private readonly MAX_ATTEMPTS = 10;
  private readonly CODE_EXPIRY_MINUTES = 15;
  private readonly RATE_LIMIT_MINUTES = 60;
  private readonly RESEND_API_KEY = 're_eDxc47fH_9ibDQr5KZZfgUp9t35dvnwzz'; // API Key fornecida

  constructor() {
    this.storage = new MMKV();
    this.initializeResendService();
  }

  /**
   * Inicializar serviço Resend
   */
  private initializeResendService(): void {
    try {
      // ResendEmailService já é uma instância singleton configurada
      this.resendService = ResendEmailService;
      console.log('✅ Resend email service initialized successfully');
    } catch (error: any) {
      console.error('❌ Failed to initialize Resend service:', error?.message || error);
      this.resendService = null;
    }
  }

  /**
   * Generate a 6-digit verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Simple hash function for email (replacement for CryptoJS)
   */
  private hashEmail(email: string): string {
    // Simple hash function that works in React Native
    const str = email.toLowerCase().trim();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'email_' + Math.abs(hash).toString(36);
  }

  /**
   * Simple encode for storage (replacement for encryption)
   */
  private encryptEmail(email: string): string {
    // Simple base64 encoding for storage
    // In production, use a proper encryption library compatible with React Native
    try {
      return btoa(email);
    } catch {
      // Fallback for React Native environment
      return Buffer.from(email).toString('base64');
    }
  }

  /**
   * Simple decode from storage (replacement for decryption)
   */
  private decryptEmail(encryptedEmail: string): string {
    // Simple base64 decoding
    try {
      return atob(encryptedEmail);
    } catch {
      // Fallback for React Native environment
      return Buffer.from(encryptedEmail, 'base64').toString('utf-8');
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if rate limited
   */
  private isRateLimited(email: string): boolean {
    const dataStr = this.storage.getString(this.PENDING_CODES_KEY);
    if (!dataStr) return false;

    const pendingCodes = JSON.parse(dataStr);
    const emailHash = this.hashEmail(email);
    const emailData = pendingCodes[emailHash];
    
    if (!emailData || !emailData.lastAttempt) return false;

    const lastAttempt = new Date(emailData.lastAttempt);
    const now = new Date();
    const minutesSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / (1000 * 60);

    return emailData.attempts >= 20 && minutesSinceLastAttempt < this.RATE_LIMIT_MINUTES;
  }

  /**
   * Send email usando Resend API
   */
  private async sendEmailWithCode(
    to: string, 
    code: string, 
    userKey: string, 
    isRecovery: boolean = false
  ): Promise<boolean> {
    try {
      console.log(`📧 Sending ${isRecovery ? 'recovery' : 'verification'} email to ${to} using Resend`);
      
      // Verificar se Resend está disponível
      if (!this.resendService) {
        console.warn('⚠️ Resend service not available, attempting to reinitialize...');
        this.initializeResendService();
        
        if (!this.resendService) {
          throw new Error('Resend service initialization failed');
        }
      }

      // Enviar email usando Resend
      let result;
      if (isRecovery) {
        result = await this.resendService.sendRecoveryEmail(to, userKey);
      } else {
        result = await this.resendService.sendVerificationEmail(to, code, userKey);
      }

      if (result.success) {
        console.log('✅ Email sent successfully via Resend');
        return true;
      } else {
        console.error('❌ Resend email failed:', result.error);
        
        // Fallback: in DEV, continue without email actually sent
        if (__DEV__) {
          console.log('⚠️ Dev fallback: proceeding without sending email');
          return true;
        }
        
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error sending email via Resend:', error?.message || error);
      
      // Fallback para desenvolvimento
      if (__DEV__) {
        console.log('⚠️ Email sending failed in development mode, but verification code is stored locally');
        return true;
      }
      
      return false;
    }
  }

  /**
   * Associate email with user key and send verification code
   */
  async associateEmailWithKey(email: string, userKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate email
      if (!this.isValidEmail(email)) {
        return { success: false, error: 'E-mail inválido' };
      }

      // Check rate limiting
      if (this.isRateLimited(email)) {
        return { 
          success: false, 
          error: 'Muitas tentativas. Tente novamente em 1 hora.' 
        };
      }

      // Check if email is already registered to another user in Firebase
      const existingUserKey = await FirebaseEmailService.getUserKeyByEmail(email);
      if (existingUserKey && existingUserKey !== userKey) {
        return {
          success: false,
          error: 'Este e-mail já está cadastrado para outra conta.'
        };
      }

      // Check if user already has an email registered (for update vs new registration)
      console.log('🔍 [associateEmailWithKey] Checking for existing email for user:', userKey);
      const currentEmail = await FirebaseEmailService.getEmailByUserKey(userKey);
      console.log('🔍 [associateEmailWithKey] Current email:', currentEmail);
      console.log('🔍 [associateEmailWithKey] New email:', email);
      
      // If user already has an email and it's different, this is an update
      const isEmailUpdate = currentEmail && currentEmail !== email;
      console.log('🔍 [associateEmailWithKey] Is email update?', isEmailUpdate);

      // Generate verification code
      const code = this.generateVerificationCode();
      const emailHash = this.hashEmail(email);
      const codeExpiry = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

      // Store pending verification
      const pendingCodesStr = this.storage.getString(this.PENDING_CODES_KEY) || '{}';
      const pendingCodes = JSON.parse(pendingCodesStr);
      
      const existingData = pendingCodes[emailHash] || { attempts: 0 };
      
      pendingCodes[emailHash] = {
        email: this.encryptEmail(email),
        userKey,
        verificationCode: code,
        codeExpiry: codeExpiry.toISOString(),
        attempts: existingData.attempts + 1,
        lastAttempt: new Date().toISOString(),
        isVerified: false
      };

      this.storage.set(this.PENDING_CODES_KEY, JSON.stringify(pendingCodes));

      // Send email via Resend
      const emailSent = await this.sendEmailWithCode(email, code, userKey, false);
      
      if (!emailSent) {
        // If email fails, still return success in dev mode
        if (__DEV__) {
          console.log('⚠️ Email failed but continuing in dev mode');
          return { success: true };
        }
        return { success: false, error: 'Erro ao enviar email. Tente novamente.' };
      }

      console.log('✅ Email recovery code sent successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error associating email:', error);
      return { 
        success: false, 
        error: 'Erro ao processar solicitação. Tente novamente.' 
      };
    }
  }

  /**
   * Verify code and complete email association
   */
  async verifyCode(email: string, code: string): Promise<VerificationResult> {
    try {
      const emailHash = this.hashEmail(email);
      const pendingCodesStr = this.storage.getString(this.PENDING_CODES_KEY);
      
      if (!pendingCodesStr) {
        return { success: false, error: 'Nenhum código pendente encontrado' };
      }

      const pendingCodes = JSON.parse(pendingCodesStr);
      const emailData = pendingCodes[emailHash];

      if (!emailData) {
        return { success: false, error: 'E-mail não encontrado' };
      }

      // Check expiry
      const codeExpiry = new Date(emailData.codeExpiry);
      if (codeExpiry < new Date()) {
        return { success: false, error: 'Código expirado' };
      }

      // Check attempts
      if (emailData.attempts >= this.MAX_ATTEMPTS) {
        return { success: false, error: 'Muitas tentativas de verificação. Solicite um novo código.' };
      }

      // Verify code
      if (emailData.verificationCode !== code) {
        emailData.attempts++;
        this.storage.set(this.PENDING_CODES_KEY, JSON.stringify(pendingCodes));
        return { success: false, error: 'Código incorreto' };
      }

      // Success! Check if this is an email update or new registration
      console.log('🔍 [verifyCode] Checking current email for user:', emailData.userKey);
      const currentEmail = await FirebaseEmailService.getEmailByUserKey(emailData.userKey);
      const newEmail = this.decryptEmail(emailData.email);
      console.log('🔍 [verifyCode] Current:', currentEmail, '-> New:', newEmail);
      
      let firebaseSuccess = false;
      
      if (currentEmail && currentEmail !== newEmail) {
        // This is an email update - use atomic operation to prevent duplicates
        console.log('🔄 [verifyCode] Updating email atomically:', currentEmail, '->', newEmail);
        firebaseSuccess = await FirebaseEmailService.updateEmail(currentEmail, newEmail, emailData.userKey);
      } else {
        // This is a new registration - use regular store
        console.log('➕ [verifyCode] Storing new email registration');
        firebaseSuccess = await FirebaseEmailService.storeEmailRecovery(newEmail, emailData.userKey);
      }

      if (!firebaseSuccess) {
        return { 
          success: false, 
          error: 'Erro ao salvar dados. Tente novamente.' 
        };
      }

      // Clear any existing email data for this user first
      const existingDataStr = this.storage.getString(this.STORAGE_KEY) || '{}';
      const existingData = JSON.parse(existingDataStr);
      
      // Remove any previous email for this user
      for (const key in existingData) {
        if (existingData[key].userKey === emailData.userKey) {
          delete existingData[key];
        }
      }

      // Save verified email locally
      const recoveryData: EmailRecoveryData = {
        email: this.decryptEmail(emailData.email),
        userKey: emailData.userKey,
        emailHash,
        isVerified: true,
        attempts: 0
      };

      existingData[emailHash] = recoveryData;
      this.storage.set(this.STORAGE_KEY, JSON.stringify(existingData));

      // Clean up pending code
      delete pendingCodes[emailHash];
      this.storage.set(this.PENDING_CODES_KEY, JSON.stringify(pendingCodes));

      console.log('✅ Email verified successfully');
      return { success: true, userKey: emailData.userKey };

    } catch (error) {
      console.error('❌ Error verifying code:', error);
      return { success: false, error: 'Erro ao verificar código' };
    }
  }

  /**
   * Recover key by email (send user key directly)
   */
  async recoverKeyByEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate email
      if (!this.isValidEmail(email)) {
        return { success: false, error: 'E-mail inválido' };
      }

      // Check if email is registered in Firebase
      const userKey = await FirebaseEmailService.getUserKeyByEmail(email);
      
      if (!userKey) {
        return { success: false, error: 'E-mail não cadastrado' };
      }

      // Check rate limiting
      if (this.isRateLimited(email)) {
        return { 
          success: false, 
          error: 'Muitas tentativas. Tente novamente em 1 hora.' 
        };
      }

      // Update rate limiting counter (without generating verification code)
      const emailHash = this.hashEmail(email);
      const pendingCodesStr = this.storage.getString(this.PENDING_CODES_KEY) || '{}';
      const pendingCodes = JSON.parse(pendingCodesStr);
      
      const existingAttempts = pendingCodes[emailHash]?.attempts || 0;
      
      pendingCodes[emailHash] = {
        email: this.encryptEmail(email),
        userKey,
        attempts: existingAttempts + 1,
        lastAttempt: new Date().toISOString(),
        isRecovery: true
      };

      this.storage.set(this.PENDING_CODES_KEY, JSON.stringify(pendingCodes));

      // Send recovery email directly with the user key (no verification code)
      const emailSent = await this.sendEmailWithCode(email, '', userKey, true);
      
      if (!emailSent) {
        // If email fails, still return success in dev mode
        if (__DEV__) {
          console.log('⚠️ Email failed but continuing in dev mode');
          return { success: true };
        }
        return { success: false, error: 'Erro ao enviar email. Tente novamente.' };
      }

      console.log('✅ Recovery email with user key sent successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error recovering key:', error);
      return { 
        success: false, 
        error: 'Erro ao processar recuperação. Tente novamente.' 
      };
    }
  }

  /**
   * Verify recovery code and return user key
   * @deprecated Recovery no longer uses verification codes - key is sent directly via email
   */
  async verifyRecoveryCode(email: string, code: string): Promise<VerificationResult> {
    console.warn('⚠️ verifyRecoveryCode is deprecated - recovery now sends user key directly');
    return { 
      success: false, 
      error: 'Método obsoleto. Use a nova funcionalidade de recuperação.' 
    };
  }

  /**
   * Get current recovery email for a user key
   */
  async getRecoveryEmail(userKey: string): Promise<string | null> {
    try {
      console.log('🔍 [getRecoveryEmail] Looking for email for user key:', userKey);
      
      // First try to get from Firebase (source of truth)
      const firebaseEmail = await FirebaseEmailService.getEmailByUserKey(userKey);
      console.log('🔍 [getRecoveryEmail] Firebase returned:', firebaseEmail);
      
      if (firebaseEmail) {
        // Update local cache
        const emailHash = this.hashEmail(firebaseEmail);
        const dataStr = this.storage.getString(this.STORAGE_KEY) || '{}';
        const data = JSON.parse(dataStr);
        
        // Clear any old entries for this user
        for (const key in data) {
          if (data[key].userKey === userKey && key !== emailHash) {
            delete data[key];
          }
        }
        
        // Update with Firebase data
        data[emailHash] = {
          email: firebaseEmail,
          userKey,
          emailHash,
          isVerified: true,
          attempts: 0
        };
        
        this.storage.set(this.STORAGE_KEY, JSON.stringify(data));
        return firebaseEmail;
      }

      // Fallback to local storage if Firebase is unavailable
      console.log('🔍 [getRecoveryEmail] Fallback to local storage');
      const dataStr = this.storage.getString(this.STORAGE_KEY);
      console.log('🔍 [getRecoveryEmail] Local data exists:', !!dataStr);
      
      if (!dataStr) return null;

      const data = JSON.parse(dataStr);
      console.log('🔍 [getRecoveryEmail] Local data keys:', Object.keys(data));
      
      for (const emailHash in data) {
        const emailData = data[emailHash];
        console.log(`🔍 [getRecoveryEmail] Checking hash ${emailHash}:`, { 
          storedUserKey: emailData.userKey, 
          searchUserKey: userKey, 
          isVerified: emailData.isVerified 
        });
        
        if (emailData.userKey === userKey && emailData.isVerified) {
          console.log('✅ [getRecoveryEmail] Found email in local storage:', emailData.email);
          return emailData.email;
        }
      }

      console.log('⚠️ [getRecoveryEmail] No email found in local storage');
      return null;
    } catch (error) {
      console.error('Error getting recovery email:', error);
      return null;
    }
  }

  /**
   * Check if email is already registered
   */
  async isEmailRegistered(email: string): Promise<boolean> {
    try {
      // Check in Firebase
      return await FirebaseEmailService.isEmailRegistered(email);
    } catch (error) {
      console.error('Error checking email registration:', error);
      return false;
    }
  }

  /**
   * Remove email association
   */
  async removeEmailAssociation(userKey: string): Promise<boolean> {
    try {
      // Remove from Firebase
      const firebaseRemoved = await FirebaseEmailService.removeEmailRecovery(userKey);
      
      // Remove from local storage
      const dataStr = this.storage.getString(this.STORAGE_KEY);
      if (!dataStr) return firebaseRemoved;

      const data = JSON.parse(dataStr);
      let removed = false;

      for (const emailHash in data) {
        if (data[emailHash].userKey === userKey) {
          delete data[emailHash];
          removed = true;
        }
      }

      if (removed) {
        this.storage.set(this.STORAGE_KEY, JSON.stringify(data));
        console.log('✅ Email association removed');
      }

      return firebaseRemoved || removed;
    } catch (error) {
      console.error('Error removing email association:', error);
      return false;
    }
  }

  /**
   * Clear all pending codes (maintenance)
   */
  clearPendingCodes(): void {
    this.storage.delete(this.PENDING_CODES_KEY);
    console.log('✅ All pending codes cleared');
  }

  /**
   * Clear rate limiting for a specific email (useful for development/testing)
   */
  clearRateLimitForEmail(email: string): void {
    try {
      const dataStr = this.storage.getString(this.PENDING_CODES_KEY);
      if (!dataStr) return;

      const pendingCodes = JSON.parse(dataStr);
      const emailHash = this.hashEmail(email);
      
      if (pendingCodes[emailHash]) {
        delete pendingCodes[emailHash];
        this.storage.set(this.PENDING_CODES_KEY, JSON.stringify(pendingCodes));
        console.log('✅ Rate limiting cleared for email:', email);
      }
    } catch (error) {
      console.error('Error clearing rate limit:', error);
    }
  }

  /**
   * Get stats for debugging
   */
  getStats(): { totalEmails: number; pendingCodes: number } {
    try {
      const dataStr = this.storage.getString(this.STORAGE_KEY);
      const pendingStr = this.storage.getString(this.PENDING_CODES_KEY);
      
      const totalEmails = dataStr ? Object.keys(JSON.parse(dataStr)).length : 0;
      const pendingCodes = pendingStr ? Object.keys(JSON.parse(pendingStr)).length : 0;

      return { totalEmails, pendingCodes };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { totalEmails: 0, pendingCodes: 0 };
    }
  }
}

export default new EmailRecoveryService();