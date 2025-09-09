# Cloud Functions - Email e Companion Tokens

Este diretório contém as Cloud Functions responsáveis por:

1) Envio de e-mails (Resend)
- Função HTTPS (ou callable) que recebe { to, type: 'verification'|'recovery', code, userKey }
- Recupera a chave RESEND_API_KEY de variáveis de ambiente (functions:config:set)
- Envia o e-mail via Resend API
- Aplica rate limiting no backend

2) Emissão de tokens temporários para Companion Mode
- Função HTTPS/callable que recebe { targetUid }
- Valida se o usuário autenticado pode emitir tokens
- Gera token temporário (ex.: JWT curto) e injeta custom claims no Auth do chamador (ou retorna token para troca)
- Atualiza claims: { companion_target_uid, companion_exp }
- Regras do Firestore validam leitura se claims forem válidas

## Setup sugerido

- Node 18+ no ambiente de Functions
- `firebase init functions` (TypeScript)
- Dependências:
  - resend
  - firebase-admin
  - firebase-functions
  - jsonwebtoken (se usar JWT para companion)

## Variáveis de ambiente

- `firebase functions:config:set resend.apikey="re_xxx" resend.sender_email="noreply@glicotrack.com" resend.sender_name="GlicoTrack"`

## Endpoints esperados

- POST /send-email
  - Body: { to, type, code, userKey }
  - Auth: obrigatório (App Check recomendado)

- POST /companion/exchange
  - Body: { token }
  - Auth: obrigatório
  - Retorna: { success: true } e injeta custom claims temporários no Auth do usuário

Consulte `firestore.rules.secure.example` para regras de segurança alinhadas a este fluxo.
