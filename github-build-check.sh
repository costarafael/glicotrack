#!/bin/bash

# GitHub Actions iOS Build Helper Script
# Verifica se tudo está pronto para o build remoto

echo "🔍 GitHub Actions iOS Build - Verificação Prévia"
echo "================================================="

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para checkmark/error
check_ok() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Verificar se estamos em um repositório git
echo "📁 Verificando repositório Git..."
if [ -d ".git" ]; then
    check_ok "Repositório Git encontrado"
    
    # Verificar remote GitHub
    if git remote -v | grep -q "github.com"; then
        check_ok "Remote GitHub configurado"
        GITHUB_REPO=$(git remote get-url origin | sed 's/.*github.com[:/]\([^/]*\/[^.]*\).*/\1/')
        echo "   Repository: $GITHUB_REPO"
    else
        check_error "Remote GitHub não encontrado"
        echo "   Configure com: git remote add origin https://github.com/usuario/repo.git"
        exit 1
    fi
else
    check_error "Não é um repositório Git"
    exit 1
fi

# 2. Verificar arquivos essenciais
echo ""
echo "📋 Verificando arquivos essenciais..."

# Workflow
if [ -f ".github/workflows/ios-build.yml" ]; then
    check_ok "Workflow GitHub Actions criado"
else
    check_error "Workflow GitHub Actions não encontrado"
    echo "   Execute o script de criação do workflow primeiro"
fi

# package.json
if [ -f "package.json" ]; then
    check_ok "package.json encontrado"
    
    # Verificar React Native version
    RN_VERSION=$(node -p "require('./package.json').dependencies['react-native']" 2>/dev/null || echo "não encontrado")
    if [[ "$RN_VERSION" == *"0.80"* ]]; then
        check_ok "React Native 0.80.x detectado: $RN_VERSION"
    else
        check_warning "Versão React Native: $RN_VERSION (testado com 0.80.x)"
    fi
else
    check_error "package.json não encontrado"
fi

# Podfile
if [ -f "ios/Podfile" ]; then
    check_ok "Podfile encontrado"
else
    check_error "ios/Podfile não encontrado"
fi

# Verificar se as dependências estão instaladas
echo ""
echo "📦 Verificando dependências..."

if [ -d "node_modules" ]; then
    check_ok "node_modules presente"
else
    check_warning "node_modules não encontrado - execute 'npm install' antes do commit"
fi

if [ -d "ios/Pods" ]; then
    check_ok "CocoaPods instalados"
else
    check_warning "ios/Pods não encontrado - será instalado automaticamente no GitHub"
fi

# 3. Verificar configuração de assinatura (opcional)
echo ""
echo "🔐 Verificando configuração de assinatura..."

if [ -f "ios/GlicoTrack.xcodeproj/project.pbxproj" ]; then
    TEAM_ID=$(grep -o "DEVELOPMENT_TEAM = [^;]*" ios/GlicoTrack.xcodeproj/project.pbxproj | head -1 | cut -d' ' -f3)
    if [ ! -z "$TEAM_ID" ] && [ "$TEAM_ID" != "\"\"" ]; then
        check_ok "Team ID configurado localmente: $TEAM_ID"
        echo "   💡 Adicione como secret APPLE_TEAM_ID no GitHub para builds Release"
    else
        check_warning "Team ID não configurado - apenas Debug builds funcionarão"
    fi
fi

# 4. Verificar status do Git
echo ""
echo "🌿 Verificando status do Git..."

if [ -z "$(git status --porcelain)" ]; then
    check_ok "Working directory limpo"
else
    check_warning "Existem alterações não commitadas"
    echo "   Arquivos modificados:"
    git status --porcelain | head -5
    if [ $(git status --porcelain | wc -l) -gt 5 ]; then
        echo "   ... e mais $(( $(git status --porcelain | wc -l) - 5 )) arquivos"
    fi
fi

# Verificar branch atual
CURRENT_BRANCH=$(git branch --show-current)
check_ok "Branch atual: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "   💡 Builds em 'main' tentarão gerar Release (.ipa)"
else
    echo "   💡 Builds em outras branches geram apenas Debug (.app)"
fi

# 5. Sumário e próximos passos
echo ""
echo "📋 SUMÁRIO"
echo "=========="
echo "✅ Para executar o build no GitHub Actions:"
echo ""
echo "1. 📤 Commit e push das alterações:"
echo "   git add ."
echo "   git commit -m \"Add GitHub Actions iOS build workflow\""
echo "   git push origin $CURRENT_BRANCH"
echo ""
echo "2. 🌐 Acesse o GitHub:"
echo "   https://github.com/$GITHUB_REPO/actions"
echo ""
echo "3. ▶️ Execute manualmente (opcional):"
echo "   Actions → iOS Build → Run workflow"
echo ""
echo "4. ⏱️ Aguarde ~10-15 minutos para o primeiro build"
echo ""
echo "5. 📥 Baixe os artifacts gerados"
echo ""
echo "🎯 CONFIGURAÇÃO OPCIONAL:"
echo ""
echo "Para builds Release (Device):"
echo "• GitHub → Settings → Secrets → Actions"
echo "• Adicione: APPLE_TEAM_ID = $TEAM_ID"
echo ""
echo "🚀 Tudo pronto! Execute os passos acima para iniciar."