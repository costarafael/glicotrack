# Relatório de Emojis no GlicoTrack

Este relatório documenta todos os emojis encontrados na base de código do GlicoTrack, seu contexto de uso e a localização do arquivo correspondente.

[ importante: o relatorio foi feito antes da implementacao dos relatorios em PDF mais avançados com gráficos, entao eles nao foram listados aqui, mas tambem devem ser levados em consideracao na substituição de emojis por ícones]
---

## 📁 `src/components/EmailRecoveryModal.tsx`

- **Emoji:** ✅
  - **Contexto:** `showSuccess('Código enviado! Verifique seu email.')`
  - **Local:** Modal de recuperação de email, mensagem de sucesso.

- **Emoji:** ✅
  - **Contexto:** `showSuccess('Chave enviada para seu email!')`
  - **Local:** Modal de recuperação de email, mensagem de sucesso.

---

## 📁 `src/components/EntryList.tsx`

- **Emoji:** 💧
  - **Contexto:** `title: 'Glicose', value: formatGlucoseValue(entry.value), icon: 'bloodtype'`
  - **Local:** Timeline de registros diários, item de glicose.

- **Emoji:** 💉
  - **Contexto:** `title: 'Insulina Bolus - ...', value: formatInsulinUnits(entry.units), icon: 'medication'`
  - **Local:** Timeline de registros diários, item de insulina bolus.

- **Emoji:** ⏰
  - **Contexto:** `title: 'Insulina Basal', value: formatInsulinUnits(entry.units), icon: 'schedule'`
  - **Local:** Timeline de registros diários, item de insulina basal.

---

## 📁 `src/config/featureFlags.ts`

- **Emoji:** ⚠️
  - **Contexto:** `* ⚠️  IMPORTANTE:`
  - **Local:** Comentário de aviso sobre a desativação do `COMPANION_MODE`.

- **Emoji:** ❌
  - **Contexto:** `// ❌ DESABILITADO - Modo de acompanhamento (código preservado)`
  - **Local:** Comentário indicando que a feature `COMPANION_MODE` está desabilitada.

- **Emoji:** ✅
  - **Contexto:** `// ✅ HABILITADO - Features ativas`
  - **Local:** Comentário indicando features ativas.

- **Emoji:** 🚧
  - **Contexto:** `// 🚧 EM DESENVOLVIMENTO - Features futuras`
  - **Local:** Comentário indicando features em desenvolvimento.

- **Emoji:** 🏗️
  - **Contexto:** `console.log('🏗️ [FeatureFlags] Features ativas:', getEnabledFeatures());`
  - **Local:** Log de debug para exibir features ativas.

- **Emoji:** ✅, ❌
  - **Contexto:** `console.log('🏗️ [FeatureFlags] COMPANION_MODE:', FEATURE_FLAGS.COMPANION_MODE ? '✅ ATIVO' : '❌ INATIVO');`
  - **Local:** Log de debug para exibir o status do `COMPANION_MODE`.

---

## 📁 `src/context/CompanionContext.tsx`

- **Emoji:** 🚨
  - **Contexto:** `alerts.push('🚨 ALERTA: Eventos de hipoglicemia severa (<54 mg/dL) detectados. Procure orientação médica.');`
  - **Local:** Geração de alertas em relatórios de acompanhante.

---

## 📁 `src/context/DataContext.tsx`

- **Emoji:** 🔄
  - **Contexto:** `console.log('🔄 Log ${date} marcado para sincronização Firebase');`
  - **Local:** Log de sincronização de dados.

- **Emoji:** ⚠️
  - **Contexto:** `console.warn('⚠️ Erro ao sincronizar com Firebase:', error);`
  _ **Local:** Log de erro de sincronização.

- **Emoji:** 🔄, 🚀, ✅, ❌, 🔍, 🎯, 🔧, 📋, 🏠
  - **Contexto:** Logs de console para o ciclo de vida da recuperação de conta e modo acompanhante.
  - **Local:** Funções `recoverAccount` e `refreshCurrentLog`.

---

## 📁 `src/context/FirebaseContext.tsx`

- **Emoji:** 🔄, 🔑, ✅, ❌, ⏸️, 📋
  - **Contexto:** Logs de console para o ciclo de vida da sincronização com Firebase.
  - **Local:** Funções `enableSync`, `disableSync`, `forceSync`, `copyUserKeyToClipboard`.

---

## 📁 `src/screens/AccountScreen.tsx`

- **Emoji:** 🔑, ❌, 🔍
  - **Contexto:** Logs de console para carregamento da chave do usuário.
  - **Local:** `useEffect` hooks.

---

## 📁 `src/screens/CompanionEmailsScreenEnhanced.tsx`

- **Emoji:** 📧, ✅, 🧪, 📊, ❌, 🔔, ⏳
  - **Contexto:** E-mails, logs de console e interface de status para o sistema de emails de acompanhantes.
  - **Local:** Títulos de tela, logs de envio, status de verificação de email.

---

## 📁 `srcs/screens/DailyLogScreen.tsx`

- **Emoji:** 👁️
  - **Contexto:** `👁️ Visualizando dados de: {activeKey.name} ({activeKey.key})`
  - **Local:** Banner de modo acompanhante.

---

## 📁 `src/screens/MonthlyReportScreen.tsx`

- **Emoji:** 📖
  - **Contexto:** `📖 Visualizando dados de: {activeKey.name} ({activeKey.key})`
  - **Local:** Banner de modo acompanhante.

---

## 📁 `src/services/AccountRecoveryService.ts`

- **Emoji:** 🔍, ❌, ✅, 🚀, 📥, 📊, 📚, 🔄, 🗑️, 💾, 🔑, ➕, ⚠️, 🔧
  - **Contexto:** Logs de console detalhados para cada etapa do processo de recuperação de conta.
  - **Local:** Funções `validateRecoveryKey`, `performRecovery`, `mergeData`, `resolveConflict`.

---

## 📁 `src/services/CompanionReportGenerator.ts`

- **Emoji:** ✅, ⚠️, 🔴, 📝, 📊, 📈, 🕐, 💉, 🎯, 🏆, ❌
  - **Contexto:** Geração de insights, recomendações e alertas para os relatórios de acompanhantes.
  - **Local:** Funções `generateDailyInsights`, `generateWeeklyInsights`, `generateMonthlyInsights`, `generateAlerts`.

---

## 📁 `src/services/DataMigrationService.ts`

- **Emoji:** 🔍, 📊, ✅, 🚀, ❌, 📋, ⚠️, ⚙️, 📱, 🔔, 📝, 🔧
  - **Contexto:** Logs de console para o processo de migração de dados entre versões do app.
  - **Local:** Funções `runMigrationIfNeeded`, `executeMigration`, `migrateDailyLogs`, etc.

---

## 📁 `src/services/FirebaseDataRepository.ts`

- **Emoji:** ✅, ❌, 📊, ⚠️, 🔄, ⏸️, 🚀, 🗑️, 🔍, 🎯, 🔧, 🏠
  - **Contexto:** Logs de console para o repositório de dados do Firebase, incluindo modo companion e sincronização.
  - **Local:** Funções `getLog`, `getLogsForMonth`, `enableSync`, `processSyncQueue`, etc.

---

## 📁 `src/services/FirebaseEmailService.ts`

- **Emoji:** ✅, 📱, ⚠️, ❌, 🔄, 🔍, 📋, 🚀, 🗑️, ➕, ⚡
  - **Contexto:** Logs de console para o serviço de email do Firebase.
  - **Local:** Funções de `checkFirebaseAvailability`, `storeEmailRecovery`, `updateEmail`.

---

## 📁 `src/services/FirebaseLogger.ts`

- **Emoji:** 🔄, ✅, ❌, ⚠️, ℹ️, 🔍, 📝
  - **Contexto:** Definição dos emojis usados para cada nível de log no sistema.
  - **Local:** Função `getEmoji`.

---

## 📁 `src/services/firebase/FirebaseServiceAndroid.ts`

- **Emoji:** ✅, 🔥, 🔐, 💾, ❌, 🎯, 🎉, 🔍, 📋, 📊, 🧹
  - **Contexto:** Logs de console para a implementação nativa do Firebase no Android.
  - **Local:** Funções de inicialização, debug e criação de dados de teste.

---

## 📁 `src/services/firebase/FirebaseServiceIOS.ts`

- **Emoji:** ✅, 🔥, 📱, 🔐, ❌, 🧹
  - **Contexto:** Logs de console para a implementação do Firebase Web SDK no iOS.
  - **Local:** Funções de inicialização e limpeza de cache.

---

## 📁 `src/services/MediaStoreService.ts`

- **Emoji:** 📱, 📁, ✅, 📍, ❌, 🍎, 🧹, ⚠️
  - **Contexto:** Logs de console para o serviço de salvamento de arquivos em mídia.
  - **Local:** Funções `savePdfToDownloads`, `savePdfToFiles`, `cleanupTempFile`.

---

## 📁 `srcs/services/NotificationService.ts`

- **Emoji:** 🔔, ✅, ❌, 🔐, ⚠️, 📱, 📢, ⚙️, 👋, 👆, 🎬, 🔄, ⏰, 🗑️, 🧹, 📋, ⚡, 🤷, 😴, 📊, 🧪
  - **Contexto:** Logs de console e títulos de notificações para o serviço de notificações.
  - **Local:** Funções de inicialização, agendamento, e manipulação de eventos de notificação.

---

## 📁 `src/services/PDFGenerator.ts`

- **Emoji:** 💧, 📝, 📊, 📄, ✅, ❌
  - **Contexto:** Conteúdo de templates HTML para PDF e logs de console.
  - **Local:** Funções `generateHTMLContent` e `generateMonthlyReport`.

---

## 📁 `src/services/ReportEmailScheduler.ts`

- **Emoji:** ⚠️, 🚀, 🛑, 📅, 📧, 🔒, 📭, 📤, ✅, ❌, 📊, 🧹
  - **Contexto:** Logs de console para o agendador de emails de relatório.
  - **Local:** Funções de agendamento e processamento da fila de emails.

---

## 📁 `src/services/ResendEmailService.ts`

- **Emoji:** ❌, ✅, 🔒, 🔑, 📧, 🩸, ⚠️, 📱, 🛡️, 📊, 🔢
  - **Contexto:** Títulos de email, templates HTML e logs de console para o serviço de envio de emails Resend.
  - **Local:** Funções de `sendEmail`, `createVerificationEmailHTML`, `createRecoveryEmailHTML`, etc.

---

## 📁 `src/services/SimpleReminderService.ts`

- **Emoji:** 🔔, ✅, ❌, 💉, 📋, 🩸
  - **Contexto:** Logs de console e títulos de notificações para o serviço de lembretes.
  - **Local:** Funções `initialize`, `updateReminder`, `scheduleBasalReminder`, etc.

---

## 📁 `src/services/ToastService.ts`

- **Emoji:** ✅, ❌, ℹ️
  - **Contexto:** Mensagens de toast e alertas para o usuário.
  - **Local:** Funções `showSuccess`, `showError`, `showInfo`.

---

## 📁 `src/utils/permissions.ts`

- **Emoji:** 🔒, 📱, 📁, ✅, ❌, 🚀
  - **Contexto:** Logs de console para o processo de solicitação de permissões no Android.
  - **Local:** Funções `requestStoragePermission` e `requestStartupPermissions`.
  
  
  
  
  
  Substituir emojis pelos icones (symbol material):


Este guia foi projetado para facilitar a substituição dos emojis no código por ícones vetoriais consistentes e escaláveis, melhorando a interface do usuário e a experiência do desenvolvedor.

---

# Guia de Migração de Emojis para Material Symbols

Este documento serve como referência para substituir os emojis da base de código do GlicoTrack por ícones do `react-material-symbols`. A utilização de uma biblioteca de ícones padronizada garantirá consistência visual e melhor performance.

## Ícones de Status e Feedback

Ícones usados para comunicar sucesso, erro, aviso ou informação ao usuário e em logs.

| Emoji | Significado Comum | Ícone Material Symbols | Contexto de Uso |
| :---: | :--- | :--- | :--- |
| ✅ | Sucesso, Habilitado, Ativo | `task_alt` | Mensagens de sucesso, status ativo, features habilitadas. |
| ❌ | Erro, Desabilitado, Inativo | `highlight_off` | Mensagens de erro, status inativo, features desabilitadas. |
| ⚠️ | Aviso, Importante | `warning` | Alertas, avisos importantes em comentários ou logs. |
| 🚨 | Alerta Crítico | `crisis_alert` | Alertas de eventos severos (ex: hipoglicemia). |
| ℹ️ | Informação | `info` | Mensagens informativas (ex: Toasts). |
| 🛑 | Parada, Interrupção | `stop_circle` | Indicar a parada de um processo ou serviço. |
| 🔔 | Notificação, Lembrete | `notifications` | Notificações push, lembretes agendados. |
| ⏳ | Aguardando, Pendente | `hourglass_empty` | Indicar um estado de espera ou processamento. |

## Ícones de Interface e Ações

Ícones que representam objetos, ações do usuário e elementos de navegação.

| Emoji | Significado Comum | Ícone Material Symbols | Contexto de Uso |
| :---: | :--- | :--- | :--- |
| 💧 | Glicose, Sangue | `bloodtype` | Itens de registro de glicose. |
| 💉 | Insulina, Injeção | `syringe` | Itens de registro de insulina (Bolus). |
| ⏰ | Tempo, Agendamento | `schedule` | Itens de registro de insulina (Basal), agendamentos. |
| 👁️ | Visualizando | `visibility` | Indicar modo de visualização de dados de outro usuário. |
| 📖 | Relatório, Diário | `menu_book` | Título de relatórios ou logs detalhados. |
| 📧 | Email | `mail` | Funcionalidades relacionadas a envio de email. |
| 🔑 | Chave, Acesso | `key` | Chave de recuperação, acesso a conta. |
| 📋 | Copiar, Área de Transf. | `content_paste` | Ações de copiar para a área de transferência. |
| 🗑️ | Excluir, Limpar | `delete` | Ações de exclusão ou limpeza de dados. |
| ➕ | Adicionar | `add_circle_outline` | Adicionar novos registros ou itens. |
| 🔧 | Ferramenta, Reparo | `build` | Funções de reparo, resolução de conflitos. |
| 💾 | Salvar | `save` | Ações de salvamento de dados ou arquivos. |
| 📄 | Documento, PDF | `article` | Geração de documentos como PDFs. |
| 📤 | Enviar | `send` | Ações de envio de dados ou emails. |
| 🏆 | Conquista, Meta | `emoji_events` | Metas atingidas, conquistas no tratamento. |
| 🛡️ | Segurança | `shield` | Tópicos relacionados a segurança e verificação. |

## Ícones para Logs de Desenvolvimento

Ícones utilizados primariamente em logs de console para facilitar a depuração e o acompanhamento de processos internos.

| Emoji | Significado no Log | Ícone Material Symbols | Exemplo de Uso |
| :---: | :--- | :--- | :--- |
| 🔄 | Sincronização, Ciclo | `sync` | Início/Fim de processos de sincronização de dados. |
| 🚀 | Início, Execução | `rocket_launch` | Início de um processo importante (migração, recuperação). |
| 🔍 | Busca, Verificação | `manage_search` | Validação de chaves, busca por dados. |
| 🎯 | Processamento, Alvo | `track_changes` | Processamento de uma fila, atingindo uma etapa específica. |
| 🚧 | Em Desenvolvimento | `construction` | Marcar features que não estão em produção. |
| 🏗️ | Construindo, Ativando | `construction` | Logs de inicialização ou construção de features. |
| 📊 | Dados, Relatório | `bar_chart` | Processamento de dados para relatórios, logs de dados. |
| ⚙️ | Migração, Sistema | `settings` | Processos de migração de dados, configurações do sistema. |
| 🔥 | Firebase | `local_fire_department` | Logs específicos dos serviços Firebase. |
| 📱 | Específico da Plataforma | `smartphone` | Logs de serviços nativos (Android/iOS). |
| 🧹 | Limpeza | `cleaning_services` | Processos de limpeza de cache, dados temporários. |
| ⚡ | Ação Rápida | `bolt` | Logs de funções rápidas ou de alta prioridade. |
