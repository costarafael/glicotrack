#!/bin/bash

# GlicoTrack - Instalar APK no AVD
# Instala a versão mais recente do APK no dispositivo Android conectado

set -e

echo "📱 Instalando GlicoTrack APK no AVD..."

# Verificar se ADB está disponível
if ! command -v adb &> /dev/null; then
    echo "❌ ADB não encontrado. Certifique-se de que o Android SDK está configurado."
    exit 1
fi

# Verificar dispositivos conectados
echo "🔍 Verificando dispositivos Android conectados..."
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo "❌ Nenhum dispositivo Android conectado."
    echo "💡 Certifique-se de que o AVD está rodando e conectado."
    exit 1
fi

echo "✅ Encontrados $DEVICES dispositivo(s) conectado(s):"
adb devices

# Localizar APK mais recente
APK_PATH="./app/build/outputs/apk/release/app-release.apk"

if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK não encontrado em: $APK_PATH"
    echo "💡 Execute build-quick.sh ou build-full.sh primeiro."
    exit 1
fi

APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
echo "📦 APK encontrado: $APK_SIZE"

# Desinstalar versão anterior se existir
echo "🗑️  Removendo versão anterior..."
adb uninstall com.glicotrack 2>/dev/null || echo "ℹ️  Nenhuma versão anterior encontrada."

# Instalar nova versão
echo "⬇️  Instalando APK..."
adb install "$APK_PATH"

if [ $? -eq 0 ]; then
    echo "✅ GlicoTrack instalado com sucesso!"
    echo "🚀 Você pode abrir o app no AVD agora."
else
    echo "❌ Falha na instalação do APK"
    exit 1
fi