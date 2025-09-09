/**
 * AccountScreen - Subpágina de Conta
 * Contém: Recuperação por Email
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { EmailRecoverySection } from '../components/EmailRecoverySection';
import { EmailRecoveryModal } from '../components/EmailRecoveryModal';
import { useEmailRecovery } from '../hooks/useEmailRecovery';
import EmailRecoveryService from '../services/EmailRecoveryService';
import { UserKeyService } from '../services/UserKeyService';
import SyncSettings from '../components/SyncSettings';

export default function AccountScreen() {
  const { theme } = useTheme();
  
  // Get userKey directly from UserKeyService (independent of Firebase sync status)
  const [userKey, setUserKey] = useState<string | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState<string | null>(null);

  // Email Recovery hooks
  const {
    showEmailModal,
    emailModalMode,
    openAssociateModal,
    openRecoverModal,
    closeModal,
  } = useEmailRecovery();

  useEffect(() => {
    const loadUserKey = async () => {
      try {
        const userKeyService = UserKeyService.getInstance();
        const key = await userKeyService.getUserKey();
        console.log('🔑 [AccountScreen] Loaded userKey directly:', key);
        setUserKey(key);
      } catch (error) {
        console.error('❌ [AccountScreen] Error loading userKey:', error);
        setUserKey(null);
      }
    };
    
    loadUserKey();
  }, []);

  // Load recovery email when component mounts
  useEffect(() => {
    loadRecoveryEmail();
  }, [userKey]);

  const loadRecoveryEmail = async () => {
    console.log('🔍 [AccountScreen] loadRecoveryEmail - userKey:', userKey);
    if (userKey) {
      const email = await EmailRecoveryService.getRecoveryEmail(userKey);
      setRecoveryEmail(email);
    }
  };

  const handleEmailSuccess = () => {
    loadRecoveryEmail(); // Reload email after successful association
  };

  const handleRemoveEmail = async () => {
    if (userKey) {
      const success = await EmailRecoveryService.removeEmailAssociation(userKey);
      if (success) {
        setRecoveryEmail(null);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Conta
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Gerencie sincronização, recuperação de conta e configurações
          </Text>
        </View>

        {/* Sincronização Firebase */}
        <SyncSettings />

        {/* Email Recovery Section */}
        <EmailRecoverySection
          recoveryEmail={recoveryEmail}
          currentUserKey={userKey || ''}
          onOpenAssociateModal={openAssociateModal}
          onOpenRecoverModal={openRecoverModal}
          onRemoveEmail={handleRemoveEmail}
        />

        {/* Footer Space */}
        <View style={styles.footer} />
        
      </ScrollView>

      {/* Email Recovery Modal */}
      <EmailRecoveryModal
        visible={showEmailModal}
        onClose={closeModal}
        userKey={userKey || ''}
        onSuccess={handleEmailSuccess}
        mode={emailModalMode}
      />
      
      {/* Debug log for userKey */}
      {showEmailModal && console.log('🔍 [AccountScreen] Modal userKey:', userKey || 'EMPTY')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  footer: {
    height: 40,
  },
});