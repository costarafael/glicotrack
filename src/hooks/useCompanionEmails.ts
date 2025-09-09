/**
 * Custom hook for managing companion emails logic
 */

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { useToast } from './useToast';
import ResendEmailService from '../services/ResendEmailService';
import { UserKeyService } from '../services/UserKeyService';
import { CompanionEmail, CompanionEmailsState, CompanionEmailsActions } from '../types/companionEmails';

// Firebase import only if available
let firebaseService: any = null;
try {
  const FirebaseDataRepository = require('../services/FirebaseDataRepository').default;
  if (FirebaseDataRepository) {
    firebaseService = new FirebaseDataRepository();
  }
} catch (error) {
  console.log('ℹ️ Firebase not available for companion emails sync');
}

export const useCompanionEmails = (): CompanionEmailsState & CompanionEmailsActions => {
  const { showSuccess, showError } = useToast();
  
  // Configuração MMKV para companion emails
  const storage = new MMKV();
  const COMPANION_EMAILS_KEY = 'companion_emails';
  
  const [emails, setEmails] = useState<CompanionEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [confirmationCodes, setConfirmationCodes] = useState<{[emailId: string]: string}>({});

  // Carregar e-mails salvos do MMKV na inicialização
  useEffect(() => {
    loadCompanionEmails();
  }, []);

  // Salvar emails no MMKV
  const saveCompanionEmails = async (emailsToSave: CompanionEmail[]): Promise<void> => {
    try {
      const serializedEmails = JSON.stringify(emailsToSave);
      storage.set(COMPANION_EMAILS_KEY, serializedEmails);
      console.log('✅ Companion emails saved to MMKV:', emailsToSave.length, 'emails');
    } catch (error) {
      console.error('❌ Error saving companion emails:', error);
    }
  };

  // Carregar emails do MMKV
  const loadCompanionEmails = async () => {
    try {
      const savedEmails = storage.getString(COMPANION_EMAILS_KEY);
      if (savedEmails) {
        const parsedEmails: CompanionEmail[] = JSON.parse(savedEmails);
        // Converter strings de data de volta para Date objects
        const emailsWithDates = parsedEmails.map(email => ({
          ...email,
          confirmationSent: new Date(email.confirmationSent)
        }));
        setEmails(emailsWithDates);
        console.log('✅ Loaded companion emails from MMKV:', emailsWithDates.length, 'emails');
      } else {
        console.log('ℹ️ No companion emails found in MMKV');
        setEmails([]);
      }
    } catch (error) {
      console.error('❌ Error loading companion emails:', error);
      setEmails([]);
    }
  };

  // Sincronizar emails com Firebase
  const syncCompanionEmailsToFirebase = async (emailsToSync: CompanionEmail[]): Promise<void> => {
    if (!firebaseService) {
      console.log('ℹ️ Firebase not available, skipping companion emails sync');
      return;
    }

    try {
      const userKey = await UserKeyService.getInstance().getUserKey();
      if (!userKey) {
        console.warn('⚠️ No user key available for Firebase sync');
        return;
      }

      // Salvar companion emails no Firebase na estrutura: users/{userKey}/companion_emails
      await firebaseService.saveCompanionEmails?.(userKey, emailsToSync);
      console.log('✅ Companion emails synced to Firebase:', emailsToSync.length, 'emails');
    } catch (error) {
      console.error('❌ Error syncing companion emails to Firebase:', error);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addEmail = async () => {
    if (!newEmail.trim()) {
      showError('Digite um e-mail válido');
      return;
    }

    if (!validateEmail(newEmail.trim())) {
      showError('Formato de e-mail inválido');
      return;
    }

    // Verificar se e-mail já existe
    if (emails.find(e => e.email.toLowerCase() === newEmail.toLowerCase().trim())) {
      showError('Este e-mail já foi adicionado');
      return;
    }

    try {
      // Gerar token de confirmação
      const confirmationToken = Math.random().toString(36).substring(2, 15) + 
                               Math.random().toString(36).substring(2, 15);

      // Obter chave do usuário
      const userKey = await UserKeyService.getInstance().getUserKey();

      const newCompanionEmail: CompanionEmail = {
        id: Date.now().toString(),
        email: newEmail.trim().toLowerCase(),
        confirmed: false,
        confirmationSent: new Date(),
        confirmationToken: confirmationToken,
        settings: {
          dailyReport: false,
          weeklyReport: false,
          monthlyReport: true, // sempre habilitado
        },
      };

      // Enviar e-mail de confirmação usando ResendEmailService
      const emailResult = await ResendEmailService.sendCompanionConfirmationEmail(
        newCompanionEmail.email,
        confirmationToken,
        userKey
      );

      if (!emailResult.success) {
        showError(`Erro ao enviar e-mail: ${emailResult.error}`);
        return;
      }

      const updatedEmails = [...emails, newCompanionEmail];
      setEmails(updatedEmails);
      setNewEmail('');
      setIsAddingEmail(false);
      
      // Salvar no MMKV
      await saveCompanionEmails(updatedEmails);
      
      // Sincronizar com Firebase
      await syncCompanionEmailsToFirebase(updatedEmails);
      
      showSuccess('E-mail adicionado! Link de confirmação enviado.');
      
    } catch (error) {
      console.error('Error adding companion email:', error);
      showError('Erro ao adicionar e-mail. Tente novamente.');
    }
  };

  const removeEmail = async (emailId: string) => {
    Alert.alert(
      'Remover E-mail',
      'Tem certeza que deseja remover este e-mail da lista de acompanhantes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const updatedEmails = emails.filter(e => e.id !== emailId);
            setEmails(updatedEmails);
            
            // Salvar no MMKV
            await saveCompanionEmails(updatedEmails);
            
            // Sincronizar com Firebase
            await syncCompanionEmailsToFirebase(updatedEmails);
            
            showSuccess('E-mail removido com sucesso');
          },
        },
      ]
    );
  };

  const updateEmailSettings = async (emailId: string, setting: keyof CompanionEmail['settings'], value: boolean) => {
    const updatedEmails = emails.map(email => {
      if (email.id === emailId) {
        return {
          ...email,
          settings: {
            ...email.settings,
            [setting]: value,
          },
        };
      }
      return email;
    });

    setEmails(updatedEmails);
    
    // Salvar no MMKV
    await saveCompanionEmails(updatedEmails);
    
    // Sincronizar com Firebase
    await syncCompanionEmailsToFirebase(updatedEmails);
  };

  const resendConfirmation = async (email: CompanionEmail) => {
    try {
      // Obter chave do usuário
      const userKey = await UserKeyService.getInstance().getUserKey();

      // Reenviar e-mail de confirmação usando o mesmo token
      const emailResult = await ResendEmailService.sendCompanionConfirmationEmail(
        email.email,
        email.confirmationToken,
        userKey
      );

      if (!emailResult.success) {
        showError(`Erro ao reenviar e-mail: ${emailResult.error}`);
        return;
      }

      showSuccess('E-mail de confirmação reenviado!');
      
      // Atualizar data de envio
      const updatedEmails = emails.map(e => 
        e.id === email.id 
          ? { ...e, confirmationSent: new Date() }
          : e
      );
      setEmails(updatedEmails);
      
      // Salvar no MMKV
      await saveCompanionEmails(updatedEmails);
      
      // Sincronizar com Firebase
      await syncCompanionEmailsToFirebase(updatedEmails);
      
    } catch (error) {
      console.error('Error resending confirmation:', error);
      showError('Erro ao reenviar confirmação');
    }
  };

  // Gerar código de confirmação do token (mesma lógica do ResendEmailService)
  const generateConfirmationCode = (token: string): string => {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const code = Math.abs(hash % 1000000).toString().padStart(6, '0');
    return code;
  };

  const confirmEmail = async (emailId: string) => {
    const enteredCode = confirmationCodes[emailId];
    if (!enteredCode || enteredCode.length !== 6) {
      showError('Digite o código de 6 dígitos recebido por e-mail');
      return;
    }

    try {
      // Encontrar o e-mail
      const email = emails.find(e => e.id === emailId);
      if (!email) {
        showError('E-mail não encontrado');
        return;
      }

      // Gerar código esperado
      const expectedCode = generateConfirmationCode(email.confirmationToken);
      
      // Verificar se o código está correto
      if (enteredCode !== expectedCode) {
        showError('Código de confirmação inválido');
        return;
      }

      // Marcar e-mail como confirmado
      const updatedEmails = emails.map(e => 
        e.id === emailId 
          ? { ...e, confirmed: true }
          : e
      );
      setEmails(updatedEmails);
      
      // Limpar código digitado
      setConfirmationCodes(prev => {
        const { [emailId]: _, ...rest } = prev;
        return rest;
      });

      showSuccess('E-mail confirmado com sucesso!');
      
      // Salvar no MMKV
      await saveCompanionEmails(updatedEmails);
      
      // Sincronizar com Firebase
      await syncCompanionEmailsToFirebase(updatedEmails);
      
    } catch (error) {
      console.error('Error confirming email:', error);
      showError('Erro ao confirmar e-mail. Tente novamente.');
    }
  };

  const updateConfirmationCode = (emailId: string, code: string) => {
    // Limitar a 6 dígitos numéricos
    const cleanCode = code.replace(/[^0-9]/g, '').substring(0, 6);
    setConfirmationCodes(prev => ({
      ...prev,
      [emailId]: cleanCode
    }));
  };

  return {
    // State
    emails,
    newEmail,
    isAddingEmail,
    confirmationCodes,
    // Actions
    setEmails,
    setNewEmail,
    setIsAddingEmail,
    setConfirmationCodes,
    updateConfirmationCode,
    addEmail,
    removeEmail,
    confirmEmail,
    resendConfirmation,
    updateEmailSettings,
  };
};