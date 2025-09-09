import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';

export interface SaveResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Serviço para salvamento de arquivos usando MediaStore (Android) e Files (iOS)
 * Implementa as melhores práticas para Android 11-15 e Scoped Storage
 */
export class MediaStoreService {
  
  /**
   * Salva um PDF na pasta Downloads do Android usando MediaStore
   * Não requer permissões para Android 11+
   */
  static async savePdfToDownloads(localPdfPath: string, fileName?: string): Promise<SaveResult> {
    if (Platform.OS !== 'android') {
      console.log('[MediaStoreService] Esta função é apenas para Android');
      return { success: false, error: 'Função apenas para Android' };
    }

    try {
      const finalFileName = fileName || `GlicoTrack_Relatorio_${Date.now()}.pdf`;
      
      console.log(`📱 [MediaStoreService] Iniciando salvamento: ${finalFileName}`);
      console.log(`📁 [MediaStoreService] Arquivo fonte: ${localPdfPath}`);
      
      // Verificar se arquivo temporário existe
      const fileExists = await ReactNativeBlobUtil.fs.exists(localPdfPath);
      if (!fileExists) {
        throw new Error(`Arquivo PDF não encontrado: ${localPdfPath}`);
      }
      
      // Configurar opções para MediaStore conforme documentação
      const mediaStoreOptions = {
        name: finalFileName,
        parentFolder: 'GlicoTrack', // Criar subpasta dentro de Downloads
        mimeType: 'application/pdf',
      };
      
      console.log(`📱 [MediaStoreService] MediaStore options:`, mediaStoreOptions);
      
      // Usar MediaCollection.copyToMediaStore conforme documentação
      // 'Download' especifica a coleção de mídia
      const resultUri = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
        mediaStoreOptions,
        'Download',
        localPdfPath
      );
      
      console.log(`✅ [MediaStoreService] PDF salvo com sucesso!`);
      console.log(`📍 [MediaStoreService] URI do arquivo: ${resultUri}`);
      
      return {
        success: true,
        filePath: resultUri,
      };
      
    } catch (error: any) {
      console.error('❌ [MediaStoreService] Erro ao salvar PDF:', error);
      console.error('❌ [MediaStoreService] Detalhes:', {
        message: error?.message,
        code: error?.code,
        localPath: localPdfPath,
      });
      
      return {
        success: false,
        error: error?.message || 'Erro desconhecido ao salvar PDF',
      };
    }
  }
  
  /**
   * Salva um PDF no diretório de documentos do iOS (visível no app Files)
   */
  static async savePdfToFiles(localPdfPath: string, fileName?: string): Promise<SaveResult> {
    if (Platform.OS !== 'ios') {
      console.log('[MediaStoreService] Esta função é apenas para iOS');
      return { success: false, error: 'Função apenas para iOS' };
    }

    try {
      const finalFileName = fileName || `GlicoTrack_Relatorio_${Date.now()}.pdf`;
      const destPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${finalFileName}`;
      
      console.log(`🍎 [MediaStoreService] Salvando no iOS: ${finalFileName}`);
      
      // Verificar se arquivo fonte existe
      const fileExists = await ReactNativeBlobUtil.fs.exists(localPdfPath);
      if (!fileExists) {
        throw new Error(`Arquivo PDF não encontrado: ${localPdfPath}`);
      }
      
      // Mover arquivo do cache para diretório de documentos
      await ReactNativeBlobUtil.fs.mv(localPdfPath, destPath);
      
      console.log(`✅ [MediaStoreService] PDF salvo com sucesso em: ${destPath}`);
      
      return {
        success: true,
        filePath: destPath,
      };
      
    } catch (error: any) {
      console.error('❌ [MediaStoreService] Erro ao salvar PDF no iOS:', error);
      
      return {
        success: false,
        error: error?.message || 'Erro desconhecido ao salvar PDF no iOS',
      };
    }
  }
  
  /**
   * Função universal que detecta a plataforma e usa o método apropriado
   */
  static async savePdf(localPdfPath: string, fileName?: string): Promise<SaveResult> {
    if (Platform.OS === 'android') {
      return this.savePdfToDownloads(localPdfPath, fileName);
    } else if (Platform.OS === 'ios') {
      return this.savePdfToFiles(localPdfPath, fileName);
    } else {
      return {
        success: false,
        error: 'Plataforma não suportada',
      };
    }
  }
  
  /**
   * Limpa arquivo temporário do cache
   * Deve ser chamado sempre após salvamento bem-sucedido
   */
  static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      const fileExists = await ReactNativeBlobUtil.fs.exists(filePath);
      if (fileExists) {
        await ReactNativeBlobUtil.fs.unlink(filePath);
        console.log(`🧹 [MediaStoreService] Arquivo temporário removido: ${filePath}`);
      }
    } catch (cleanupError) {
      console.error('⚠️ [MediaStoreService] Erro ao remover arquivo temporário:', cleanupError);
      // Não propagar erro - cleanup é best effort
    }
  }
}