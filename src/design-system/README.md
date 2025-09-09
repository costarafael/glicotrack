# Design System - GlicoTrack v2.2

Sistema de design equilibrado para resolver inconsistências identificadas no código, focando em eliminar duplicação e padronizar interações.

## 🎯 Objetivo

- ✅ **Eliminar duplicação** - UniversalNavigation substitui 2 componentes
- ✅ **Padronizar inconsistências** - BorderRadius, ícones, estados de interação  
- ✅ **Aproveitar infraestrutura** - ThemeContext e Typography existentes
- ✅ **Migração gradual** - Sem breaking changes

## 📦 Componentes Implementados

### UniversalNavigation

Substitui `DateNavigation.tsx` e `MonthNavigation.tsx` eliminando 50% código duplicado.

```typescript
import { UniversalNavigation } from '../design-system';

// Para navegação de datas
<UniversalNavigation
  type="date"
  onPrevious={handlePreviousDay}
  onNext={handleNextDay}
  canGoNext={!isFuture(addDays(currentDate, 1))}
  displayText={formatDateDisplay(currentDate)}
/>

// Para navegação de meses  
<UniversalNavigation
  type="month"
  onPrevious={handlePreviousMonth}
  onNext={handleNextMonth}
  canGoNext={canGoNext()}
  displayText={`${getMonthName(currentMonth)} ${currentYear}`}
/>
```

**Benefícios:**
- Manutenção centralizada
- Acessibilidade básica incluída
- Padronização com design tokens

### BaseModal

Estrutura reutilizável para padronizar os 8 modais existentes.

```typescript
import { BaseModal } from '../design-system';

<BaseModal visible={visible} onClose={onClose} title="Meu Modal">
  <Text>Conteúdo customizado aqui</Text>
  <View>
    {/* Seus componentes específicos */}
  </View>
</BaseModal>
```

**Características:**
- BorderRadius padronizado (16px)
- Keyboard avoiding automático
- Header com botão fechar
- Acessibilidade básica

### TouchableButton

Padroniza estados de interação para resolver inconsistências de feedback tátil.

```typescript
import { TouchableButton } from '../design-system';

// Uso básico
<TouchableButton onPress={handlePress} accessibilityLabel="Salvar dados">
  <Text>Salvar</Text>
</TouchableButton>

// Com estado loading
<TouchableButton
  onPress={handlePress}
  loading={isLoading}
  style={{ backgroundColor: theme.colors.primary }}
>
  <Text style={{ color: 'white' }}>Processar</Text>
</TouchableButton>

// Disabled
<TouchableButton
  onPress={handlePress}
  disabled={true}
  accessibilityLabel="Botão desabilitado"
>
  <Text>Indisponível</Text>
</TouchableButton>
```

**Padronizações:**
- `activeOpacity: 0.7` consistente
- `hitSlop: 8px` mínimo
- `minHeight: 44px` (guideline iOS)
- Estados loading/disabled visuais

## 🎨 Design Tokens

Sistema complementar aos existentes (ThemeContext, Typography).

```typescript
import { DESIGN_TOKENS } from '../design-system';

// Border Radius - 4 valores hierárquicos
borderRadius: DESIGN_TOKENS.radius.sm,  // 8px - botões, inputs
borderRadius: DESIGN_TOKENS.radius.md,  // 12px - cards
borderRadius: DESIGN_TOKENS.radius.lg,  // 16px - modais
borderRadius: DESIGN_TOKENS.radius.xl,  // 24px - navegação

// Icon Sizes - hierarquia visual
size: DESIGN_TOKENS.iconSize.sm,        // 16px - auxiliares
size: DESIGN_TOKENS.iconSize.md,        // 20px - médios
size: DESIGN_TOKENS.iconSize.lg,        // 24px - principais

// Interaction States
activeOpacity: DESIGN_TOKENS.interaction.activeOpacity,  // 0.7
hitSlop: DESIGN_TOKENS.interaction.hitSlop,             // 8px all sides

// Spacing
margin: DESIGN_TOKENS.spacing.sm,       // 8px
padding: DESIGN_TOKENS.spacing.base,   // 16px
marginTop: DESIGN_TOKENS.spacing.xl,   // 24px
```

## 🔄 Migração

### Componentes Substituídos

```typescript
// ❌ ANTES
import DateNavigation from '../components/DateNavigation';
import MonthNavigation from '../components/MonthNavigation';

// ✅ AGORA  
import { UniversalNavigation } from '../design-system';
```

### Modais - Migração Gradual

```typescript
// ❌ ANTES - Estrutura repetitiva
<Modal visible={visible} transparent animationType="slide">
  <View style={styles.overlay}>
    <View style={styles.modal}>
      <View style={styles.header}>
        <Text style={styles.title}>Título</Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" />
        </TouchableOpacity>
      </View>
      {/* conteúdo */}
    </View>
  </View>
</Modal>

// ✅ AGORA - BaseModal
<BaseModal visible={visible} onClose={onClose} title="Título">
  {/* mesmo conteúdo, menos boilerplate */}
</BaseModal>
```

## 📋 Guidelines de Uso

### 1. Quando Usar UniversalNavigation
- ✅ Qualquer navegação temporal (data/mês)
- ✅ Botões anterior/próximo com texto central
- ❌ Navegações complexas com múltiplos controles

### 2. Quando Usar BaseModal  
- ✅ Modais simples com título e conteúdo
- ✅ Formulários de entrada de dados
- ❌ Modais com layouts muito específicos

### 3. Quando Usar TouchableButton
- ✅ Botões com problemas de hit area
- ✅ Elementos que precisam feedback consistente
- ✅ Botões com estados loading/disabled
- ❌ TouchableOpacity funcionais existentes

## 🚧 Integração com Sistema Existente

### ThemeContext (Mantido)
```typescript
// Continue usando normalmente
const { theme } = useTheme();
backgroundColor: theme.colors.primary,
color: theme.colors.text,
```

### Typography (Forçar Uso)
```typescript
// Use sistema existente
import { Typography } from '../styles/typography';
...theme.typography.h1,
...theme.typography.body,
```

## 📈 Benefícios Alcançados

### Redução de Duplicação
- ✅ **50% menos código** navegação (UniversalNavigation)
- ✅ **Estrutura padronizada** para novos modais
- ✅ **Manutenção centralizada** em 1 arquivo vs 2

### Consistência Visual  
- ✅ **4 valores borderRadius** vs 6+ anteriores
- ✅ **Hierarquia de ícones** clara (16/20/24px)
- ✅ **Feedback tátil padronizado** (activeOpacity 0.7)

### Melhor UX
- ✅ **Hit areas adequadas** (mínimo 44px)
- ✅ **Estados visuais** loading/disabled
- ✅ **Acessibilidade básica** em elementos críticos

## 🔧 Desenvolvimento

### Estrutura de Arquivos
```
src/design-system/
├── tokens/
│   └── DesignTokens.ts     # Tokens complementares
├── components/
│   ├── UniversalNavigation.tsx
│   ├── BaseModal.tsx
│   ├── TouchableButton.tsx
│   └── index.ts
└── index.ts                # Export principal
```

### Adicionando Novo Componente

1. Criar em `/design-system/components/`
2. Usar `DESIGN_TOKENS` para consistência
3. Incluir acessibilidade básica
4. Exportar em `index.ts`
5. Documentar uso aqui

## 🎯 Próximos Passos

### Fase 2 - Aplicação Seletiva
- [ ] Migrar 2-3 modais simples para BaseModal
- [ ] Aplicar TouchableButton em botões com hit area pequena  
- [ ] Typography audit em componentes modificados

### Futuro - Expansão Gradual
- [ ] Componentes de formulário se necessário
- [ ] Card component se surgir duplicação
- [ ] Outros componentes baseados em necessidade real

---

**Status:** Implementado ✅  
**Última atualização:** Janeiro 2025  
**Mantido por:** Equipe GlicoTrack