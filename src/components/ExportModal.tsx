import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { Button } from '@rneui/themed';
import { useTheme } from '../context/ThemeContext';
import Share from 'react-native-share';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: (type: 'save' | 'share') => Promise<void>;
  isExporting: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onClose,
  onExport,
  isExporting,
}) => {
  const { theme } = useTheme();

  const handleExport = async (type: 'save' | 'share') => {
    try {
      await onExport(type);
      onClose();
    } catch (error) {
      console.error('Erro ao exportar:', error);
      // Error is handled by parent component
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.content}>
            <Button
              title="Salvar no Dispositivo"
              onPress={() => handleExport('save')}
              buttonStyle={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              titleStyle={[styles.buttonText, { color: '#ffffff' }]}
              disabled={isExporting}
              loading={isExporting}
            />
            
            <Button
              title="Compartilhar"
              onPress={() => handleExport('share')}
              buttonStyle={[styles.shareButton, { backgroundColor: theme.colors.success }]}
              titleStyle={[styles.buttonText, { color: '#ffffff' }]}
              disabled={isExporting}
              loading={isExporting}
            />
            
            <Button
              title="Cancelar"
              onPress={onClose}
              buttonStyle={[styles.cancelButton, { 
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: theme.colors.border
              }]}
              titleStyle={[styles.cancelText, { color: theme.colors.text }]}
              disabled={isExporting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  content: {
    gap: 16,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
  },
  shareButton: {
    borderRadius: 12,
    paddingVertical: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});