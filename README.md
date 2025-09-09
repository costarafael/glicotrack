# 📱 GlicoTrack - Aplicativo de Monitoramento de Glicose

**Versão:** 2.2 - Feature Flags System & Dead Code Cleanup ✅  
**Stack:** React Native 0.80.2 + Nova Arquitetura + Firebase + MMKV + Feature Flags

## 🎯 **Sobre o Projeto**

GlicoTrack é um aplicativo moderno de monitoramento de glicose construído com React Native e Nova Arquitetura (TurboModules/Fabric). O app oferece registro de glicose, insulina, lembretes, relatórios PDF e sincronização Firebase - tudo offline-first sem necessidade de autenticação.

## ✅ **Status Atual (Agosto 2025)**

### **🚩 Novidades v2.2:**
- ✅ **Feature Flags System:** Controle granular de funcionalidades sem remover código
- ✅ **Dead Code Cleanup:** Codebase otimizado com ~15% menos código desnecessário  
- ✅ **Companion Mode OCULTO:** Funcionalidade preservada mas invisível na interface
- ✅ **Rebuild Limpo:** APK v2.2 instalada e testada no AVD Android 34

### **✅ Funcionalidades Principais:**
- ✅ **Registro Diário Completo:** Glicose, Insulina (Bolus/Basal) e Notas.
- ✅ **Timeline Cronológica:** Ordenação inteligente dos registros.
- ✅ **Relatórios Mensais em PDF:** Estatísticas detalhadas e exportação profissional.
- ✅ **Sincronização Firebase:** Offline-first com chave de usuário única de 8 caracteres.
- ✅ **Sistema de Lembretes:** 4 tipos de lembretes configuráveis.
- ✅ **Temas Dark/Light:** Alternância de tema com paleta de cores Tailwind.
- ✅ **Nova Arquitetura Ativa:** Melhor performance com TurboModules e Fabric.
- ✅ **Feature Flags:** Controle de funcionalidades como o "Companion Mode".

## 🚀 **Quick Start**

### **Pré-requisitos**
```bash
# Java OpenJDK 17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"

# Android SDK
export ANDROID_HOME=~/Library/Android/sdk
export ANDROID_SDK_ROOT=~/Library/Android/sdk

# Node.js v18+
node --version
```

### **Instalação**
```bash
# 1. Clone o repositório
git clone <repository-url>
cd GlicoTrack

# 2. Instalar dependências
npm install

# 🚨 Se encontrar erros de "ERESOLVE", tente usar a flag --legacy-peer-deps:
# npm install --legacy-peer-deps

# 3. iOS - Instalar pods com Nova Arquitetura
cd ios
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
cd ..

# 4. Android - Verificar google-services.json
# Arquivo já configurado em: android/app/google-services.json
```

### **Executar no Desenvolvimento**
```bash
# Terminal 1 - Metro Bundler
npx react-native start

# Terminal 2 - Android
npx react-native run-android

# Terminal 2 - iOS (alternativa)
npx react-native run-ios
```

### **Build de Produção (Android)**

**✅ SOLUÇÃO: Script de Build Unificado**

Para simplificar o processo de build e garantir a consistência, foi criado um script unificado `build.sh` na raiz do projeto.

#### **🚀 Método Recomendado (Totalmente Automatizado):**
```bash
# Para build de RELEASE (padrão)
./build.sh

# Para build de DEBUG
./build.sh debug
```

**O que o script `build.sh` faz automaticamente:**
- ✅ **Build Unificado:** Gera versões de `release` e `debug` com um único comando.
- ✅ **Verificação de Dependências:** Verifica se a pasta `node_modules` existe e executa `npm install --legacy-peer-deps` se necessário.
- ✅ **Geração de Artefatos:** Executa a tarefa `generateCodegenArtifactsFromSchema` do Gradle para garantir que os artefatos da Nova Arquitetura sejam sempre gerados antes do build, mesmo após um `gradle clean`.
- ✅ **Cópia do APK:** Para builds de `release`, copia o APK gerado para o Desktop com um timestamp.

#### **🔧 Método Manual (SE o script falhar):**
```bash
# 1. Instale as dependências
npm install --legacy-peer-deps

# 2. Gere os artefatos do Codegen (necessário para a Nova Arquitetura)
(cd android && ./gradlew generateCodegenArtifactsFromSchema)

# 3. Gere o APK de release ou debug
(cd android && ./gradlew assembleRelease)
# ou
(cd android && ./gradlew assembleDebug)

# 4. Instalar no emulador/device
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**📍 Localização dos APKs:**
- **Release:** `android/app/build/outputs/apk/release/app-release.apk`
- **Debug:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Cópia (Release):** `~/Desktop/GlicoTrack-YYYYMMDD-HHMM.apk`

### **Solucionando Problemas Comuns de Build**

#### **✅ Problemas Resolvidos pelo Script `build.sh`:**
- **Codegen Artifacts Missing:** O script regenera automaticamente os artefatos.
- **Node Modules Missing:** O script executa `npm install` automaticamente.

#### **🔧 Problemas Manuais (Raramente Necessário):**

- **Conflitos de Dependência (`ERESOLVE`):** Se o comando `npm install` falhar, tente executá-lo com a flag `--legacy-peer-deps` para resolver conflitos de versões de pacotes.

- **Falha na Instalação (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`):** Este erro ocorre ao tentar instalar um APK de `release` sobre uma versão de `debug` (ou vice-versa). A solução é desinstalar a versão existente:
  ```bash
  adb uninstall com.glicotrack
  ```

- **Codegen Artifacts Missing (Manual):** Se o script `build.sh` falhar, você pode tentar gerar os artefatos manualmente:
  ```bash
  (cd android && ./gradlew generateCodegenArtifactsFromSchema)
  ```

#### **📋 Scripts de Build - Documentação Completa:**
Ver `android/README-BUILD.md` para detalhes completos dos scripts automatizados.

## 🔥 **Firebase - Estado Atual**

### **✅ Configuração Validada**
- **Projeto Firebase:** `glicotrack-41d22`  
- **Console:** https://console.firebase.google.com/project/glicotrack-41d22/firestore
- **Chave Usuário:** V60PFBX1 (formatada como V60P-FBX1)
- **Dados Sincronizados:** ✅ `users/V60PFBX1/daily_logs/2025-08-09`

### **🚨 IMPORTANTE: Regras Firebase & Companion Mode**
```bash
# ❌ NUNCA confiar apenas em hot reload para mudanças estruturais
# ✅ SEMPRE rebuild APK após mudanças em:
#    - FirebaseDataRepository
#    - Serviços Core (DataRepository, LocalRepository) 
#    - Context Providers
#    - Companion Mode logic

./build.sh debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 💡 REGRA: Hot reload funciona para UI, rebuild para estrutura
```

### **🔧 Validar Sincronização**
```bash
# 1. Verificar logs Firebase
adb logcat -s "ReactNativeJS" | grep -E "(Firebase|Sync|✅|❌)"

# 2. Logs de sucesso esperados:
# 🔥 [Android] Firebase nativo inicializado com sucesso!
# 🔑 Chave do usuário carregada: V60PFBX1
# ✅ Synced 1 logs to Firebase
```

## 📁 **Estrutura do Projeto**

```
src/
├── components/        # Componentes UI reutilizáveis
│   ├── SyncSettings.tsx
│   ├── CustomAlert.tsx
│   ├── ExportModal.tsx
│   ├── EmailRecoveryModal.tsx (Email recovery)
│   └── Toast.tsx (Toast notifications)
├── context/          # Contextos React (Estado global)
│   ├── DataContext.tsx
│   ├── ThemeContext.tsx
│   └── FirebaseContext.tsx
├── hooks/            # Custom Hooks
│   └── useToast.ts   # Toast management hook
├── screens/          # Telas principais
│   ├── DailyLogScreen.tsx
│   ├── MonthlyReportScreen.tsx
│   ├── OptionsScreen.tsx (REARQUITETADO v2.2)
│   ├── SimpleRemindersScreen.tsx
│   ├── AccompanimentScreen.tsx (NEW v2.2)
│   ├── CompanionEmailsScreen.tsx (NEW v2.2)
│   └── AccountScreen.tsx (NEW v2.2)
├── services/         # Lógica de negócio
│   ├── FirebaseService.ts
│   ├── FirebaseDataRepository.ts
│   ├── MediaStoreService.ts (PDF Android 11+)
│   ├── PDFGenerator.ts
│   ├── UserKeyService.ts
│   ├── ResendEmailService.ts (Email service)
│   └── EmailRecoveryService.ts (Account recovery)
└── utils/           # Utilitários e helpers
    └── permissions.ts
```

## 🛠️ **Tecnologias Principais**

### **Core Stack**
- **React Native:** 0.80.2 (Nova Arquitetura obrigatória)
- **TypeScript:** Tipagem completa
- **MMKV:** 3.3.0 - Storage local síncrono
- **Firebase:** Android nativo (v22.4.0) + iOS Web SDK (v12.0.0)

### **UI & UX**
- **Navigation:** React Navigation v7+
- **UI Framework:** @rneui/themed v4+
- **Icons:** react-native-vector-icons
- **Forms:** react-hook-form v7+
- **Themes:** Dark/Light com Tailwind colors

### **Features Especiais**  
- **PDF Export:** react-native-html-to-pdf + MediaStore
- **Notifications:** @notifee/react-native v9+
- **File System:** react-native-blob-util v0.22.2
- **Permissions:** react-native-permissions v5+

## 📱 **Funcionalidades Implementadas**

### **🩺 Core Features**
- ✅ **Registro Diário:** Glicose, Insulina Bolus/Basal, Notas
- ✅ **Timeline Cronológica:** Ordenação inteligente com performance otimizada
- ✅ **Relatórios Mensais:** Estatísticas + exportação PDF profissional
- ✅ **Sistema de Lembretes:** 4 tipos configuráveis (basal, registros, refeições)

### **🔄 Sync & Data**
- ✅ **Firebase Sync:** Offline-first com chave única de usuário (8 chars)
- ✅ **Sistema de Migration:** v1 → v2 automático
- ✅ **Chave Única:** Geração automática para identificação do usuário
- ✅ **Cache Inteligente:** MMKV com fallback Firebase

### **⚙️ Sistema de Configurações**
- ✅ **OptionsScreen Reorganizada:** Interface limpa e organizada
- ✅ **Feature Flags:** Sistema para controlar visibilidade de funcionalidades
- ✅ **Configuração Firebase:** Interface para habilitar/desabilitar sincronização
- ✅ **Configuração de Lembretes:** Acesso rápido às configurações de notificação

### **🎨 UI & Extras**
- ✅ **Modo Acompanhamento:** ❌ OCULTO (feature flags) - código preservado para versões futuras
- ✅ **Tema Dark/Light:** Paleta completa com alternância
- ✅ **PDF Export Avançado:** Layout médico, MediaStore API para Android 11+
- ✅ **Validação de Entrada:** Filtros numéricos rigorosos para dados de glicose e insulina

## 🔧 **Troubleshooting**

### **🔧 Problemas Comuns**

### **Firebase Sync Issues**
```typescript
// ❌ Erro comum: "Cannot read property 'code' of undefined"
// ✅ Solução: Sempre usar método seguro
safeToISOString(timestamp) // ✅ Correto
timestamp.toISOString()    // ❌ Perigoso
```

### **Build Issues**
```bash
# Limpar caches
cd android && ./gradlew clean
rm -rf node_modules && npm install
npx react-native start --reset-cache
```

### **Emulador Android**
```bash
# Verificar conectividade
adb devices

# Port forwarding para Metro
adb reverse tcp:8081 tcp:8081

# Logs de debugging
adb logcat -s "ReactNativeJS"
```

## 🎯 **Para Desenvolvedores**

### **Arquitetura**
- **Clean Architecture:** Separação clara entre UI, serviços e dados
- **Repository Pattern:** Abstração de dados local/remoto
- **Context API:** Gerenciamento de estado global
- **Custom Hooks:** Lógica reutilizável entre componentes

### **Regras Críticas**
1. **SEMPRE** rebuild APK após mudanças Firebase/repositories
2. **NUNCA** usar `.toISOString()` sem validação
3. **SEMPRE** testar em emulador após alterações nativas
4. **SEMPRE** usar MediaStoreService para PDFs no Android 11+
5. **COMPANION MODE:** Cada data deve mostrar dados específicos (não duplicados)

### **Contribuindo**
1. Siga as convenções de código TypeScript
2. Teste em Android 11+ e Nova Arquitetura
3. Documente mudanças no CLAUDE.md
4. Valide Firebase sync após mudanças críticas

## ✅ **Status Final v2.2 (Agosto 2025)**

**GlicoTrack v2.2** está completo com:
- ✅ **Sistema Core Funcional:** Registro diário, relatórios mensais, lembretes
- ✅ **Firebase Sync:** Sincronização automática com chave única de usuário
- ✅ **Feature Flags:** Companion Mode oculto mas código preservado
- ✅ **Dead Code Cleanup:** Codebase otimizado com ~15% menos código desnecessário
- ✅ **APK v2.2:** Testada e funcionando no Android Studio AVD
- ✅ **Nova Arquitetura:** TurboModules/Fabric ativo para máxima performance

---

**📋 Documentação Técnica:** `CLAUDE.md` - Instruções essenciais para desenvolvimento

**🔥 Firebase Console:** https://console.firebase.google.com/project/glicotrack-41d22/firestore

**🔑 Chave de Usuário Exemplo:** V60PFBX1 (formato: V60P-FBX1)

**🚀 Próximos Passos:** Reativar Companion Mode, adicionar testes unitários, otimizar performance de relatórios.
