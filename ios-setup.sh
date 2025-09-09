#!/bin/bash

# GlicoTrack iOS Setup Script
# Configura e roda o app iOS com Nova Arquitetura

set -e

echo "🍎 GlicoTrack iOS Setup & Build"
echo "==============================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar Xcode
check_xcode() {
    echo "🔍 Verificando Xcode..."

    if ! command -v xcodebuild &> /dev/null; then
        echo -e "${RED}❌ Xcode não encontrado!${NC}"
        echo -e "${YELLOW}📱 Instale o Xcode via App Store:${NC}"
        echo "   1. Abra a App Store"
        echo "   2. Procure por 'Xcode'"
        echo "   3. Instale (cerca de 15GB)"
        echo "   4. Execute: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer"
        echo "   5. Execute: sudo xcodebuild -license accept"
        exit 1
    fi

    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    echo -e "${GREEN}✅ $XCODE_VERSION encontrado${NC}"
}

# Função para verificar simuladores
check_simulators() {
    echo "📱 Verificando simuladores iOS..."

    if ! xcrun simctl list devices available | grep -q "iPhone"; then
        echo -e "${RED}❌ Nenhum simulador iOS encontrado!${NC}"
        echo -e "${YELLOW}💡 Abra o Xcode e instale simuladores:${NC}"
        echo "   Xcode → Window → Devices and Simulators → Simulators"
        exit 1
    fi

    echo -e "${GREEN}✅ Simuladores iOS disponíveis:${NC}"
    xcrun simctl list devices available | grep "iPhone" | head -3
}

# Função principal
main() {
    echo "🚀 Iniciando setup iOS..."

    # Verificar Xcode
    check_xcode

    # Verificar simuladores
    check_simulators

    # Verificar node_modules
    if [ ! -d "node_modules" ]; then
        echo "📦 Instalando dependências..."
        npm install --legacy-peer-deps
    fi

    # Instalar pods iOS com Nova Arquitetura
    echo "🔧 Instalando dependências iOS (Nova Arquitetura)..."
    cd ios

    # Verificar CocoaPods
    if ! command -v pod &> /dev/null; then
        echo "💎 Instalando CocoaPods..."
        sudo gem install cocoapods
    fi

    # Limpar pods anteriores (se existir)
    if [ -d "Pods" ]; then
        echo "🧹 Limpando pods anteriores..."
        rm -rf Pods
        rm -rf Podfile.lock
    fi

    # Instalar pods com Nova Arquitetura
    echo -e "${BLUE}📱 Instalando pods com RCT_NEW_ARCH_ENABLED=1...${NC}"
    RCT_NEW_ARCH_ENABLED=1 bundle exec pod install || {
        echo -e "${YELLOW}⚠️  bundle exec falhou, tentando pod install direto...${NC}"
        RCT_NEW_ARCH_ENABLED=1 pod install
    }

    cd ..

    echo -e "${GREEN}✅ Setup iOS concluído com sucesso!${NC}"
    echo ""
    echo "🎯 Para rodar o app:"
    echo -e "${BLUE}   npx react-native run-ios${NC}"
    echo ""
    echo "📱 Para escolher simulador específico:"
    echo -e "${BLUE}   npx react-native run-ios --simulator=\"iPhone 15\"${NC}"
    echo ""
    echo "🔧 Para debug:"
    echo -e "${BLUE}   npx react-native start${NC} (em outro terminal)"
    echo -e "${BLUE}   npx react-native run-ios${NC}"
}

# Executar função principal
main "$@"
