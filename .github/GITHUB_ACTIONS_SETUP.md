# GitHub Actions iOS Build Setup

## 📋 Configuração Inicial

### 1. **Secrets do Repository** (Para builds assinados)
No GitHub, vá em: `Settings` → `Secrets and variables` → `Actions`

Adicione estes secrets (opcional, apenas se quiser builds para device):

```
APPLE_TEAM_ID: Y4BQNQS75T  # Seu Team ID Apple Developer
```

### 2. **Como Executar o Build**

#### **Execução Automática:**
- Push para `main` ou `develop` → Build automático
- Pull Request → Build de validação

#### **Execução Manual:**
1. Vá em `Actions` → `iOS Build`
2. Clique em `Run workflow`
3. Selecione a branch
4. Clique em `Run workflow`

### 3. **Tipos de Build**

#### **Debug Build (Simulator)** ✅ Sempre executado
- Não requer assinatura
- Funciona em qualquer branch
- Gera `.app` para simulador
- **Duração:** ~8-12 minutos

#### **Release Build (Device)** 🔐 Apenas branch `main`
- Requer assinatura Apple Developer
- Gera arquivo `.ipa` instalável
- **Duração:** ~12-18 minutos

### 4. **Outputs Disponíveis**

#### **Artifacts (Downloads):**
- `ios-build-artifacts.zip`: Contém .app/.ipa gerados
- `build-logs.zip`: Logs de erro (apenas se falhar)

#### **Relatório de Build:**
- Summary automático no final do workflow
- Informações sobre Xcode, RN version, status

### 5. **Troubleshooting**

#### **Build Failing?**
1. Verifique os logs na aba `Actions`
2. Baixe `build-logs.zip` para análise detalhada
3. Compare com build local funcionando

#### **Problemas de Assinatura?**
- Debug builds não precisam de assinatura
- Release builds podem ser pulados removendo secrets

### 6. **Customizações Possíveis**

#### **Mudar versão do Xcode:**
```yaml
- name: Select Xcode Version
  run: sudo xcode-select -s /Applications/Xcode_15.4.app/Contents/Developer
```

#### **Adicionar testes:**
```yaml
- name: Run Tests
  run: |
    cd ios
    xcodebuild test -workspace GlicoTrack.xcworkspace -scheme GlicoTrack -destination 'platform=iOS Simulator,name=iPhone 15'
```

#### **Branches diferentes:**
```yaml
on:
  push:
    branches: [ main, develop, feature/* ]
```

## 🚀 **Primeiro Uso**

1. **Commit e Push** este workflow
2. **Vá em Actions** no GitHub
3. **Execute manualmente** para testar
4. **Aguarde ~10 minutos** para o primeiro build
5. **Baixe o artifact** com o .app/.ipa gerado

## ⚡ **Vantagens**

- ✅ **Xcode 16.2**: Compatível com RN 0.80.2
- ✅ **Cache inteligente**: Builds mais rápidos após o primeiro
- ✅ **Logs detalhados**: Fácil debug de problemas
- ✅ **Artifacts**: Download automático dos builds
- ✅ **Gratuito**: 2000 minutos/mês para repos privados

## 📱 **Para Instalar no Device**

Se o build Release funcionar:
1. Baixe o `.ipa` dos artifacts
2. Use Xcode → `Window` → `Devices and Simulators`
3. Arraste o `.ipa` para o device conectado
4. Ou use ferramentas como TestFlight/Altstore

---

**Pronto para usar!** 🎉