import { Alert, ToastAndroid, Platform } from 'react-native';

/**
 * Serviço de toasts simples e cross-platform
 * Para feedback imediato de operações (diferente das push notifications)
 */
export class ToastService {
  
  /**
   * Mostra toast de sucesso
   */
  static showSuccess(title: string, message: string): void {
    if (Platform.OS === 'android') {
      ToastAndroid.show(`✅ ${title}: ${message}`, ToastAndroid.LONG);
    } else {
      Alert.alert(`✅ ${title}`, message, [{ text: 'OK' }]);
    }
  }
  
  /**
   * Mostra toast de erro
   */
  static showError(title: string, message: string): void {
    if (Platform.OS === 'android') {
      ToastAndroid.show(`❌ ${title}: ${message}`, ToastAndroid.LONG);
    } else {
      Alert.alert(`❌ ${title}`, message, [{ text: 'OK' }]);
    }
  }
  
  /**
   * Mostra toast informativo
   */
  static showInfo(title: string, message: string): void {
    if (Platform.OS === 'android') {
      ToastAndroid.show(`ℹ️ ${title}: ${message}`, ToastAndroid.SHORT);
    } else {
      Alert.alert(`ℹ️ ${title}`, message, [{ text: 'OK' }]);
    }
  }
  
  /**
   * Feedback específico para salvamento de PDF bem-sucedido
   */
  static showPdfSaveSuccess(): void {
    const message = Platform.OS === 'android' 
      ? 'Relatório salvo na pasta Downloads/GlicoTrack'
      : 'Relatório salvo na pasta do app em "Arquivos"';
    
    this.showSuccess('PDF Salvo', message);
  }
  
  /**
   * Feedback específico para erro de salvamento de PDF
   */
  static showPdfSaveError(error: string): void {
    this.showError('Erro ao Salvar', `Não foi possível salvar o relatório: ${error}`);
  }
  
  /**
   * Toast simples só com mensagem (Android)
   */
  static showSimple(message: string): void {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Aviso', message, [{ text: 'OK' }]);
    }
  }
}