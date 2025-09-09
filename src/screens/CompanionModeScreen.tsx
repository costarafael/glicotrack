/**
 * CompanionModeScreen - Tela de configuração do Modo de Acompanhamento
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useCompanionMode } from '../context/CompanionContext';

export default function CompanionModeScreen() {
  const { theme } = useTheme();
  const companionMode = useCompanionMode();
  const [keyInput, setKeyInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const handleAddKey = async () => {
    if (!keyInput.trim() || !nameInput.trim()) {
      Alert.alert('Erro', 'Por favor, preencha a chave e o nome');
      return;
    }

    try {
      const result = await companionMode.addKey(keyInput.trim(), nameInput.trim());
      if (result.success) {
        Alert.alert('Sucesso', 'Chave adicionada com sucesso!');
        setKeyInput('');
        setNameInput('');
      } else {
        Alert.alert('Erro', result.error?.message || 'Erro ao adicionar chave');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro interno ao adicionar chave');
    }
  };

  const handleRemoveKey = async (keyId: string) => {
    Alert.alert(
      'Confirmar',
      'Deseja remover esta chave de acompanhamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const result = await companionMode.removeKey(keyId);
            if (!result.success) {
              Alert.alert('Erro', result.error?.message || 'Erro ao remover chave');
            }
          }
        }
      ]
    );
  };

  const handleEnableMode = async (keyId: string) => {
    const result = await companionMode.enableMode(keyId);
    if (!result.success) {
      Alert.alert('Erro', result.error?.message || 'Erro ao ativar modo');
    } else {
      Alert.alert('Sucesso', 'Modo de acompanhamento ativado!');
    }
  };

  const handleDisableMode = async () => {
    const result = await companionMode.disableMode();
    if (!result.success) {
      Alert.alert('Erro', result.error?.message || 'Erro ao desativar modo');
    } else {
      Alert.alert('Sucesso', 'Modo de acompanhamento desativado!');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Modo de Acompanhamento
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Visualize dados de outros usuários GlicoTrack
          </Text>
        </View>

        {/* Status */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Status
          </Text>
          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            {companionMode.isCompanionMode ? 'Ativo' : 'Inativo'}
          </Text>
          
          {companionMode.activeKey && (
            <View style={styles.activeKeyContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Chave Ativa:
              </Text>
              <Text style={[styles.keyText, { color: theme.colors.primary }]}>
                {companionMode.activeKey.name} ({companionMode.activeKey.key})
              </Text>
              <TouchableOpacity 
                style={[styles.disableButton, { backgroundColor: theme.colors.error || 'red' }]}
                onPress={handleDisableMode}
              >
                <Text style={styles.buttonText}>Desativar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Add New Key */}
        {!companionMode.isCompanionMode && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Adicionar Nova Chave
            </Text>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Digite a chave (ex: A1B2C3D4)"
              placeholderTextColor={theme.colors.textSecondary}
              value={keyInput}
              onChangeText={setKeyInput}
              maxLength={8}
              autoCapitalize="characters"
            />
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Nome para identificar (ex: João Silva)"
              placeholderTextColor={theme.colors.textSecondary}
              value={nameInput}
              onChangeText={setNameInput}
              maxLength={20}
            />
            
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddKey}
              disabled={companionMode.isLoading}
            >
              <Text style={styles.buttonText}>
                {companionMode.isLoading ? 'Validando...' : 'Adicionar Chave'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Saved Keys */}
        {companionMode.companionKeys.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Chaves Salvas
            </Text>
            
            {companionMode.companionKeys.map((key) => (
              <View key={key.id} style={styles.keyItem}>
                <View style={styles.keyInfo}>
                  <Text style={[styles.keyName, { color: theme.colors.text }]}>
                    {key.name}
                  </Text>
                  <Text style={[styles.keyCode, { color: theme.colors.textSecondary }]}>
                    {key.key}
                  </Text>
                </View>
                
                <View style={styles.keyActions}>
                  {!companionMode.isCompanionMode && (
                    <TouchableOpacity
                      style={[styles.activateButton, { backgroundColor: theme.colors.primary }]}
                      onPress={() => handleEnableMode(key.id)}
                    >
                      <Text style={styles.buttonText}>Ativar</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: theme.colors.error || 'red' }]}
                    onPress={() => handleRemoveKey(key.id)}
                  >
                    <Text style={styles.buttonText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Como usar
          </Text>
          <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
            1. Obtenha a chave única de outro usuário GlicoTrack
          </Text>
          <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
            2. Digite a chave e um nome para identificar
          </Text>
          <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
            3. Clique em "Ativar" para visualizar os dados
          </Text>
          <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
            4. Os dados serão exibidos em modo somente leitura
          </Text>
        </View>

        {/* Footer Space */}
        <View style={styles.footer} />
        
      </ScrollView>
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
    paddingTop: 40,
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
  section: {
    borderRadius: 12,
    marginVertical: 8,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 8,
  },
  activeKeyContainer: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  keyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  keyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  keyInfo: {
    flex: 1,
  },
  keyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  keyCode: {
    fontSize: 14,
    marginTop: 2,
  },
  keyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  activateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  disableButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    height: 40,
  },
});