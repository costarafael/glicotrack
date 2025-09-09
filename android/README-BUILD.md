# GlicoTrack - Scripts de Build

Scripts automatizados para compilar e instalar o GlicoTrack no Android.

## 📋 Scripts Disponíveis

### 🚀 `build-quick.sh` (Build Completo Automatizado)
**Verifica e gera tudo automaticamente: dependências, artefatos codegen e APK**
```bash
./build-quick.sh
```

**O que faz automaticamente:**
- ✅ Verifica se `node_modules` existe, se não executa `npm install --legacy-peer-deps`
- ✅ Verifica se artefatos do codegen existem, se não executa `generateCodegenArtifactsFromSchema`
- ✅ Compila APK release sem usar `clean`
- ✅ Copia APK para Desktop com timestamp

**Vantagens:**
- 🤖 Totalmente automatizado
- ⚡ Inteligente: só faz o que é necessário
- 🎯 Funciona em qualquer estado do backup
- 💾 Preserva artefatos quando possível

**⚠️ Importante:** Nunca use `./gradlew clean` manualmente pois remove os artefatos do codegen necessários!

---

### 📱 `install-apk.sh`
**Instala APK no AVD conectado**
```bash
./install-apk.sh
```

**Pré-requisitos:**
- AVD Android rodando
- APK compilado (execute build primeiro)

---

## 🔄 Fluxo de Trabalho Simplificado

```bash
# 1. Build completo automatizado (faz tudo que é necessário)
./build-quick.sh

# 2. Instalar no AVD
./install-apk.sh
```

**Para backup limpo sem node_modules:**
O script já detecta e executa automaticamente:
- `npm install --legacy-peer-deps`
- `./gradlew generateCodegenArtifactsFromSchema`
- `./gradlew assembleRelease`

## ⚙️ Configuração Automática

Os scripts configuram automaticamente:
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17`
- `ANDROID_HOME=~/Library/Android/sdk`
- `ANDROID_SDK_ROOT=~/Library/Android/sdk`

## 📁 Localização do APK

Após o build, o APK está disponível em:
- **Local:** `./app/build/outputs/apk/release/app-release.apk`
- **Desktop:** `~/Desktop/GlicoTrack-YYYYMMDD-HHMM.apk`

## 🐛 Solução de Problemas

### Build falha com "codegen/jni not found"
**Agora resolvido automaticamente!** O script `build-quick.sh` detecta artefatos ausentes e os regenera automaticamente.

### "No devices attached"
```bash
# Verificar dispositivos conectados
adb devices

# Conectar ao AVD se necessário
adb connect 127.0.0.1:5554
```

### Java/Android SDK não encontrado
```bash
# Verificar configuração
echo $JAVA_HOME
echo $ANDROID_HOME
java -version
```

## 📚 Arquitetura

**Nova Arquitetura React Native:**
- TurboModules habilitado
- Fabric Renderer ativo
- Artefatos Codegen necessários

**Dependências críticas:**
- `react-native-mmkv@3.3.0`
- `@react-native-firebase/app@22.4.0`
- `@notifee/react-native@9.1.8`