# Deploy

## Produção (resumo)

1. **Supabase**: criar projeto → aplicar `supabase/migrations/*` (`supabase db push`
   ou SQL Editor) → configurar **Auth → URL Configuration** (Site URL + Redirect
   `https://app.nexflow.com.br/auth/callback`) → ligar leaked-password protection.
2. **Vercel**: importar `apps/web` (root do projeto = `apps/web`, build = `next build`).
   Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server only).
3. **Domínio**: `app.nexflow.com.br` → apps/web · `nexflow.com.br` → apps/marketing
   (env `NEXT_PUBLIC_APP_URL=https://app.nexflow.com.br`) · `demo.nexflow.com.br`
   → tenant demo somente-leitura.
4. **Edge Functions**: `supabase functions deploy billing-webhook` + secrets
   `IUGU_WEBHOOK_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`. No painel Iugu, cadastre o
   gatilho de webhook apontando para
   `…/functions/v1/billing-webhook?token=IUGU_WEBHOOK_TOKEN`. No app, defina
   `IUGU_API_TOKEN` (Vercel env, server-only) para ligar o checkout PIX.

Headers de segurança aplicados via `vercel.json` (a portar do `_headers` atual) e
`next.config.mjs`.
