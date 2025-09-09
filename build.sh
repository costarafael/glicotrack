#!/bin/bash

set -e

# Define o tipo de build padrão como 'release'
BUILD_TYPE="release"

# Verifica se um tipo de build foi passado como argumento
if [ "$1" == "debug" ]; then
  BUILD_TYPE="debug"
fi

echo "🚀 Iniciando o build do GlicoTrack para $BUILD_TYPE..."

# --- Instalação de Dependências ---
echo "🔍 Verificando a pasta node_modules..."
if [ ! -d "node_modules" ]; then
    echo "📦 Pasta node_modules não encontrada. Instalando dependências..."
    npm install --legacy-peer-deps
    echo "✅ Dependências instaladas!"
else
    echo "✅ Pasta node_modules encontrada."
fi

# --- Artefatos de Codegen ---
echo "🔍 Verificando e gerando artefatos de codegen..."
# A execução deste comando antes do build garante que os artefatos necessários
# sejam gerados, mesmo após um 'gradle clean'.
(
    cd android
    ./gradlew generateCodegenArtifactsFromSchema
)
echo "✅ Artefatos de codegen verificados/gerados."


# --- Compilando o APK ---
echo "📦 Compilando o APK de $BUILD_TYPE..."
(
    cd android
    if [ "$BUILD_TYPE" == "release" ]; then
        ./gradlew assembleRelease
    else
        ./gradlew assembleDebug
    fi
)

# --- Saída ---
echo "🎉 Build finalizado com sucesso!"
if [ "$BUILD_TYPE" == "release" ]; then
    echo "📍 APK de Release em: android/app/build/outputs/apk/release/app-release.apk"
    # Copia para o Desktop como no script original
    DESKTOP_APK="$HOME/Desktop/GlicoTrack-$(date +%Y%m%d-%H%M).apk"
    cp "android/app/build/outputs/apk/release/app-release.apk" "$DESKTOP_APK"
    echo "📋 Copiado para: $DESKTOP_APK"
else
    echo "📍 APK de Debug em: android/app/build/outputs/apk/debug/app-debug.apk"
fi
