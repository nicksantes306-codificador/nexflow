# Edge Function · `license`

Já existe em produção (validação de chaves + login do proprietário, lendo os
secrets `LICENSE_SECRET` e `OWNER_TOKEN`). Mantida aqui apenas como referência
no monorepo. **No Sprint 3** o `LicenseManager` deixa de depender de chave
manual e passa a ler `subscriptions.status = 'active'` (preenchido pelo
`billing-webhook` da Iugu). Esta função vira fallback/owner-login somente.
