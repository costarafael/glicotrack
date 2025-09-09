/**
 * Hook customizado para gerenciar funcionalidade de recuperação por email
 * Encapsula toda a lógica relacionada ao modal de email e operações
 */
import { useState } from 'react';
import EmailRecoveryService from '../services/EmailRecoveryService';

interface EmailRecoveryState {
  showEmailModal: boolean;
  emailModalMode: 'associate' | 'recover';
  isProcessing: boolean;
}

interface EmailRecoveryActions {
  openAssociateModal: () => void;
  openRecoverModal: () => void;
  closeModal: () => void;
  associateEmail: (userKey: string, email: string) => Promise<{ success: boolean; message: string }>;
  recoverUserKey: (email: string) => Promise<{ success: boolean; message: string }>;
}

export const useEmailRecovery = () => {
  const [state, setState] = useState<EmailRecoveryState>({
    showEmailModal: false,
    emailModalMode: 'associate',
    isProcessing: false,
  });

  const actions: EmailRecoveryActions = {
    openAssociateModal: () => {
      setState(prev => ({
        ...prev,
        showEmailModal: true,
        emailModalMode: 'associate',
      }));
    },

    openRecoverModal: () => {
      setState(prev => ({
        ...prev,
        showEmailModal: true,
        emailModalMode: 'recover',
      }));
    },

    closeModal: () => {
      setState(prev => ({
        ...prev,
        showEmailModal: false,
        isProcessing: false,
      }));
    },

    associateEmail: async (userKey: string, email: string) => {
      setState(prev => ({ ...prev, isProcessing: true }));

      try {
        console.log(`📧 Associating email ${email} with user key ${userKey}`);
        
        const result = await EmailRecoveryService.associateEmailWithKey(email, userKey);
        
        if (result.success) {
          console.log('✅ Email associated successfully');
          actions.closeModal();
          return {
            success: true,
            message: 'Email associado com sucesso! Um código de confirmação foi enviado.',
          };
        } else {
          console.error('❌ Failed to associate email:', result.error);
          return {
            success: false,
            message: result.error || 'Erro ao associar email. Tente novamente.',
          };
        }
      } catch (error: any) {
        console.error('❌ Error associating email:', error);
        return {
          success: false,
          message: 'Erro inesperado. Verifique sua conexão e tente novamente.',
        };
      } finally {
        setState(prev => ({ ...prev, isProcessing: false }));
      }
    },

    recoverUserKey: async (email: string) => {
      setState(prev => ({ ...prev, isProcessing: true }));

      try {
        console.log(`🔐 Recovering user key for email ${email}`);
        
        const result = await EmailRecoveryService.recoverKeyByEmail(email);
        
        if (result.success) {
          console.log('✅ Recovery email sent successfully');
          actions.closeModal();
          return {
            success: true,
            message: 'Instruções de recuperação enviadas para seu email!',
          };
        } else {
          console.error('❌ Failed to send recovery email:', result.error);
          return {
            success: false,
            message: result.error || 'Email não encontrado ou erro no envio.',
          };
        }
      } catch (error: any) {
        console.error('❌ Error recovering user key:', error);
        return {
          success: false,
          message: 'Erro inesperado. Verifique sua conexão e tente novamente.',
        };
      } finally {
        setState(prev => ({ ...prev, isProcessing: false }));
      }
    },
  };

  return {
    // Estado
    ...state,
    
    // Ações
    ...actions,
  };
};