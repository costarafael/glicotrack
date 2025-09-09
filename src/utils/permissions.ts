import { Platform, Alert, Linking } from 'react-native';
import { PermissionsAndroid, Permission } from 'react-native';

export interface PermissionResult {
  granted: boolean;
  error?: string;
}

/**
 * Solicita permissões de armazenamento com suporte aprimorado para Android 11+
 */
export const requestStoragePermission = async (): Promise<PermissionResult> => {
  if (Platform.OS !== 'android') {
    return { granted: true };
  }

  try {
    console.log('🔒 [Permissions] Solicitando permissão de armazenamento...');
    
    // Para Android 11+ (API 30+), as permissões de armazenamento funcionam diferente
    const androidVersion = Platform.constants.Release;
    const apiLevel = parseInt(Platform.Version?.toString() || '0');
    console.log(`📱 [Permissions] Android Version: ${androidVersion}, API Level: ${apiLevel}`);
    
    // Para Android 11+ (API 30+), usar Scoped Storage
    // O app pode escrever em diretórios específicos sem permissões especiais
    if (apiLevel >= 30) {
      console.log('📱 [Permissions] Android 11+ detectado - usando scoped storage');
      console.log('📁 [Permissions] PDFs serão salvos em Documents directory (acessível pelo usuário)');
      
      // Para Android 11+ com scoped storage, não precisamos de permissões especiais
      // para escrever no Documents directory do app
      console.log('✅ [Permissions] Android 11+ - scoped storage habilitado automaticamente');
      return { granted: true };
    } else {
      // Android 6.0-10 (API 23-29) - usar método tradicional
      console.log('📱 [Permissions] Android < 11 detectado - usando permissões tradicionais');
      
      const permissions = [
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];

      console.log(`🔒 [Permissions] Solicitando permissões:`, permissions);

      const results = await PermissionsAndroid.requestMultiple(permissions);
      console.log(`🔒 [Permissions] Resultados:`, results);

      const writeGranted = results[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
      const readGranted = results[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
      
      if (writeGranted && readGranted) {
        console.log('✅ [Permissions] Permissões de armazenamento concedidas (Android < 11)');
        return { granted: true };
      } else {
        console.log('❌ [Permissions] Permissões de armazenamento negadas (Android < 11)');
        return { 
          granted: false, 
          error: 'Permissão de armazenamento negada' 
        };
      }
    }
  } catch (error) {
    console.error('❌ [Permissions] Erro ao solicitar permissão:', error);
    return { 
      granted: false, 
      error: 'Erro ao solicitar permissão de armazenamento' 
    };
  }
};

/**
 * Solicita permissões essenciais no startup do app
 */
export const requestStartupPermissions = async (): Promise<PermissionResult> => {
  console.log('🚀 [Permissions] Solicitando permissões no startup...');
  
  if (Platform.OS !== 'android') {
    return { granted: true };
  }

  try {
    // Verificar primeiro se já temos as permissões
    const hasStorage = await checkStoragePermission();
    if (hasStorage) {
      console.log('✅ [Permissions] Permissões de armazenamento já concedidas');
      return { granted: true };
    }

    // Se não temos, solicitar com explicação clara
    return new Promise((resolve) => {
      Alert.alert(
        'Permissões Necessárias',
        'O GlicoTrack precisa de acesso ao armazenamento para:\n\n• Exportar relatórios em PDF\n• Salvar backups dos seus dados\n\nEssas permissões são solicitadas apenas uma vez.',
        [
          {
            text: 'Agora Não',
            style: 'cancel',
            onPress: () => resolve({ granted: false, error: 'Usuário cancelou' })
          },
          {
            text: 'Conceder Permissões',
            onPress: async () => {
              const result = await requestStoragePermission();
              resolve(result);
            }
          }
        ]
      );
    });
  } catch (error) {
    console.error('❌ [Permissions] Erro no startup:', error);
    return { 
      granted: false, 
      error: `Erro no startup: ${error}` 
    };
  }
};

export const checkStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const apiLevel = parseInt(Platform.Version?.toString() || '0');
    
    // Para Android 11+ (API 30+), usar Scoped Storage
    // O app pode escrever em Documents directory sem permissões especiais
    if (apiLevel >= 30) {
      console.log('📱 [Permissions] Android 11+ - scoped storage sempre disponível');
      return true; // Always true for scoped storage in app directories
    } else {
      // Android < 11 - verificar permissão tradicional
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      return hasPermission;
    }
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false;
  }
};

export const showPermissionDeniedAlert = () => {
  Alert.alert(
    'Permissão Necessária',
    'Para exportar relatórios em PDF, é necessário conceder acesso ao armazenamento. Você pode fazer isso nas configurações do aplicativo.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Configurações', 
        onPress: () => Linking.openSettings() 
      }
    ]
  );
};