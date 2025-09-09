import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { BaseModal, DESIGN_TOKENS } from '../design-system';

interface NotesModalProps {
  visible: boolean;
  onClose: () => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { state, updateNotes } = useData();
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      setNotes(state.currentLog?.notes || '');
    }
  }, [visible, state.currentLog]);

  const handleSave = () => {
    updateNotes(notes.trim());
    onClose();
  };

  const handleCancel = () => {
    if (notes.trim() !== (state.currentLog?.notes || '')) {
      Alert.alert(
        'Descartar alterações?',
        'Você tem alterações não salvas. Deseja descartá-las?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: onClose },
        ],
      );
    } else {
      onClose();
    }
  };

  const styles = StyleSheet.create({
    content: {
      maxHeight: 300,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    textArea: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.base,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      textAlignVertical: 'top',
      height: 120,
    },
    charCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'right',
      marginTop: DESIGN_TOKENS.spacing.sm,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: DESIGN_TOKENS.spacing.xl,
      gap: DESIGN_TOKENS.spacing.md,
    },
    cancelButton: {
      flex: 0.3,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.base,
      borderRadius: DESIGN_TOKENS.radius.sm,
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    saveButton: {
      flex: 0.7,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.xl,
      borderRadius: DESIGN_TOKENS.radius.sm,
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
    },
    cancelButtonText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'white',
    },
  });

  return (
    <BaseModal visible={visible} onClose={handleCancel} title="Notas do Dia">
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Observações importantes do dia</Text>
        <TextInput
          style={styles.textArea}
          value={notes}
          onChangeText={setNotes}
          placeholder="Digite suas observações sobre glicose, insulina ou outros fatores importantes do dia..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          numberOfLines={6}
          maxLength={500}
        />
        <Text style={styles.charCount}>{notes.length}/500 caracteres</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={DESIGN_TOKENS.interaction.activeOpacity}
          hitSlop={DESIGN_TOKENS.interaction.hitSlop}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={DESIGN_TOKENS.interaction.activeOpacity}
          hitSlop={DESIGN_TOKENS.interaction.hitSlop}
        >
          <Text style={styles.saveButtonText}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
};

export default NotesModal;
