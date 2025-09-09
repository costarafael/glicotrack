# Contexto do Projeto GlicoTrack para o Assistente AI (Versão 2.2 - Agosto 2025)

## 🚨 **REGRAS CRÍTICAS**

### **Firebase Error Handling**
- **SEMPRE usar** `error?.code || 'unknown'` e `error?.message || 'Unknown error'`
- **SEMPRE usar** `safeToISOString(timestamp)` ao invés de `.toISOString()` direto
- **SEMPRE** fazer rebuild APK após mudanças em FirebaseService

### **Firebase Performance (v2.2)**
- **Range Queries Otimizadas:** `orderBy(documentId()) + startAt/endAt` 
- **Account Recovery:** 1 chamada Firebase (ao invés de 1000+)
- **Implementação:** `queryCollectionByDocumentId()` em FirebaseServiceAndroid

### **Companion Mode**  
- **NUNCA** usar dados fake/demo - sempre mostrar dados reais ou vazios
- **SEMPRE** verificar `docSnapshot.exists()` como função
- **Feature está OCULTA** via feature flags (`COMPANION_MODE: false`)

### **Feature Flags System (v2.2)**
- **Localização:** `/src/config/featureFlags.ts`
- **Companion Mode:** ❌ DESABILITADO (`COMPANION_MODE: false`)
- **Para Reativar:** Alterar para `true` - Ver `COMPANION_MODE_REACTIVATION.md`

## Objetivo do Projeto
Aplicativo de monitoramento de glicose **GlicoTrack v2.2** com React Native **Nova Arquitetura obrigatória** (TurboModules/Fabric). Sistema **offline-first** com sincronização Firebase, lembretes e exportação PDF.

## Stack Técnica
- **Core:** React Native v0.80.2 + Nova Arquitetura
- **Armazenamento:** MMKV v3.3.0 + Firebase Firestore
- **Navegação:** React Navigation v7+
- **UI:** React Native Elements v4+ + Componentes Customizados
- **PDF:** react-native-html-to-pdf + MediaStore API
- **Notificações:** @notifee/react-native

## Status v2.2 (Agosto 2025)

### ✅ **Funcionalidades Implementadas**
- **Sistema de Registro Diário:** Glicose, Insulina Bolus/Basal, Timeline cronológica
- **Relatórios Mensais:** Estatísticas + exportação PDF profissional  
- **Sistema de Lembretes:** 4 tipos configuráveis
- **Sincronização Firebase:** Offline-first com chave única (8 chars)
- **Recuperação de Conta:** Merge inteligente com resolução de conflitos
- **Otimização Firebase:** Range queries (1 chamada vs 1000+)
- **Feature Flags System:** Controle de funcionalidades (`COMPANION_MODE` oculto)
- **Dead Code Cleanup:** ~15% redução de código desnecessário
- **Tema Dark/Light:** Paleta Tailwind completa
- **Nova Arquitetura:** TurboModules/Fabric ativo

### 🔧 **Ambiente Configurado**
- **Java:** OpenJDK 17
- **Android SDK:** ~/Library/Android/sdk  
- **AVD:** Android Studio (API 34)
- **iOS:** Xcode + Nova Arquitetura

### 🏗️ **Comandos Essenciais**
```bash
# Desenvolvimento
npx react-native start
npx react-native run-android

# iOS (Nova Arquitetura)
cd ios && RCT_NEW_ARCH_ENABLED=1 bundle exec pod install

# Build (Release e Debug)
./build.sh # Release (padrão)
./build.sh debug # Debug
```

## Arquivos Críticos v2.2

### **Serviços Core**
- `/src/services/PDFGenerator.ts` - Geração PDF com MediaStore API
- `/src/services/FirebaseDataRepository.ts` - Repositório Firebase com chave única
- `/src/services/SimpleReminderService.ts` - Sistema de lembretes
- `/src/services/UserKeyService.ts` - Geração chave única (8 chars)

### **Contextos**
- `/src/context/DataContext.tsx` - Estado global da aplicação
- `/src/context/FirebaseContext.tsx` - Gerenciamento sincronização
- `/src/context/ThemeContext.tsx` - Temas dark/light

### **Feature Flags (NOVO v2.2)**
- `/src/config/featureFlags.ts` - Sistema de controle de features
- `/src/screens/OptionsScreen.tsx` - Renderização condicional

### **Componentes**
- `/src/components/SyncSettings.tsx` - Interface Firebase sync
- `/src/components/CustomAlert.tsx` - Modais customizados
- `/src/hooks/useMonthlyReport.ts` - Hook dados mensais

## Dependências Críticas
- `react-native-mmkv@3.3.0` (Nova Arquitetura)
- `@react-native-firebase/app@22.4.0` (Android)
- `@react-navigation/native@7.1.16`
- `@rneui/themed@4.0.0-rc.8`
- `@notifee/react-native@9.1.8`
- `react-native-html-to-pdf@0.12.0`

## Firebase Configuration
- **Projeto:** `glicotrack-41d22`
- **Console:** https://console.firebase.google.com/project/glicotrack-41d22/firestore
- **Estrutura:** `users/{userKey}/daily_logs/{YYYY-MM-DD}`
- **Chave Exemplo:** V60PFBX1 (formato: V60P-FBX1)

## Estrutura MMKV
- **Registros:** `log-YYYY-MM-DD`
- **Configurações:** `app-settings`, `theme-preference`
- **Firebase:** `user_key`, `firebase_sync_enabled`
- **Lembretes:** `simple_reminders`

## APK Atual
- **Nome:** `GlicoTrack-v2.2-August.apk`
- **Tamanho:** ~70MB
- **Status:** ✅ Instalado no AVD Android 34
- **Funcionalidades:** Firebase sync + Feature flags + Dead code cleanup

## Troubleshooting

### Firebase Sync
```bash
# Verificar logs
adb logcat -s "ReactNativeJS" | grep Firebase

# Logs de sucesso esperados:
# 🔥 Firebase inicializado com sucesso!
# ✅ Synced X logs to Firebase
```

### Build Issues
```bash
# Limpar caches
cd android && ./gradlew clean
rm -rf node_modules
npm install
npx react-native start --reset-cache

# Após limpar, use o script de build para reconstruir o projeto
./build.sh
```

### Scripts de Build (v2.3)

**PROBLEMA CRÍTICO RESOLVIDO:** A Nova Arquitetura do React Native pode não gerar os artefatos de `codegen` automaticamente, especialmente após um comando `gradle clean`, causando falhas de build. O processo de build também estava dividido em múltiplos scripts e não era unificado.

**SOLUÇÃO IMPLEMENTADA:** Foi criado um script de build unificado e robusto, o `build.sh`, localizado na raiz do projeto.

#### 🚀 **`build.sh` - Build Unificado e Automatizado**
```bash
# Build de Release (padrão)
./build.sh

# Build de Debug
./build.sh debug
```
**O que o script `build.sh` faz automaticamente:**
- ✅ **Build Unificado:** Gera tanto a versão de `release` quanto a de `debug` a partir de um único comando.
- ✅ **Verificação de Dependências:** Garante que a pasta `node_modules` exista, executando `npm install --legacy-peer-deps` se necessário.
- ✅ **Geração de Artefatos:** Sempre executa a tarefa `generateCodegenArtifactsFromSchema` do Gradle antes de qualquer build. Isso resolve o problema de artefatos ausentes após um `gradle clean` e torna o processo de build mais confiável.
- ✅ **Cópia do APK:** No caso de um build de `release`, o APK gerado é copiado para o Desktop do usuário com um timestamp, para fácil acesso.

#### 📱 **`install-apk.sh` - Instalação Automatizada**
```bash
cd android && ./install-apk.sh
```
**Funcionalidades:**
- ✅ Verifica dispositivos Android conectados
- ✅ Remove versão anterior automaticamente
- ✅ Instala nova versão do APK
- ✅ Feedback completo do processo

#### 📋 **Fluxo Simplificado (RECOMENDADO)**
```bash
# Build completo (resolve TODOS os problemas automaticamente)
./build.sh

# Instalar no AVD
cd android && ./install-apk.sh
```

-------
🎯 Estado Real do Projeto v2.2:

  ✅ FUNCIONALIDADES REALMENTE IMPLEMENTADAS:
  - Core System: Registro diário (glicose, insulina), timeline cronológica
  - Relatórios: Estatísticas mensais + exportação PDF
  - Firebase: Sincronização com chave única (V60PFBX1)
  - Lembretes: 4 tipos via @notifee/react-native
  - Feature Flags: Sistema para ocultar Companion Mode
  - Dead Code Cleanup: ~15% redução de código desnecessário
  - Tema: Dark/Light com paleta Tailwind
  - Nova Arquitetura: TurboModules/Fabric ativo

  ❌ FUNCIONALIDADES PRESENTES NO CÓDIGO MAS NÃO ATIVAS:
  - Companion Mode: Oculto via feature flags (COMPANION_MODE: false)
  - Telas Account/CompanionEmails: Existem mas não integradas funcionalmente
  - Resend Email Service: Código existe mas não está sendo usado

  🎯 Resultado: Ambos os arquivos agora refletem exatamente o estado atual do aplicativo v2.2, sem
  informações incorretas ou exageradas sobre funcionalidades não implementadas.

-----





### Dead Code Cleanup (v2.2)
- ✅ **Arquivos Removidos:** `FirebaseSyncSection.tsx`, `useSyncSettings.ts`
- ✅ **Exports Limpos:** 8 exports desnecessários removidos
- ✅ **Falsos Positivos:** ~70% do relatório ts-prune eram tipos utilizados

## Regras de Desenvolvimento
1. **SEMPRE** usar Nova Arquitetura como base obrigatória
2. **NUNCA** usar `.toISOString()` sem validação em timestamps Firebase
3. **SEMPRE** rebuild APK após mudanças em serviços Firebase
4. **COMPANION MODE** está oculto mas código preservado
5. **Feature flags** controlam visibilidade sem remover funcionalidades
