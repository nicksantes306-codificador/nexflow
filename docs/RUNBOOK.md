# Runbook de operação — NEXFLOW

Procedimentos para incidentes. Mantenha contatos e segredos no Supabase
Secrets / Vercel Env — nunca em código.

## Painel de saúde rápido
- App: status da Vercel (deploys) · Supabase: status.supabase.com
- Erros: Sentry (alertas críticos) · Cobrança: painel Iugu (webhooks/faturas)

---

## 1. Supabase fora do ar
**Sintoma:** login falha, telas carregam mas sem dados (erros 5xx).
1. Confirmar em status.supabase.com se é incidente da plataforma.
2. Comunicar usuários via banner (feature flag) — "instabilidade temporária".
3. Se for o projeto (e não a plataforma): verificar pausa por inatividade /
   limite de conexões; reativar/escalar plano.
4. Pós-incidente: validar que as migrations e RLS continuam aplicadas
   (`select count(*) from pg_policies`).

## 2. Webhook da Iugu falhou (pagamento não ativou o plano)
**Sintoma:** cliente pagou mas a assinatura segue `past_due`/`trialing`.
1. Painel Iugu → Logs de Webhook → reenviar o evento `invoice.status_changed`.
2. Conferir logs da Edge Function `billing-webhook` (`supabase functions logs`).
3. Verificar o secret `IUGU_WEBHOOK_TOKEN` (a URL precisa do `?token=`).
4. Correção manual (último recurso) no SQL:
   ```sql
   update public.subscriptions set status='active', grace_until=null
   where tenant_id = '<tenant>';
   update public.invoices set status='paid', paid_at=now()
   where gateway_invoice_id = '<iugu_invoice_id>';
   ```

## 3. Alerta crítico no Sentry (pico de erros pós-deploy)
1. `vercel rollback` para o deploy anterior estável.
2. Abrir issue com o release marcado pelo Sentry; reproduzir localmente.
3. Corrigir, abrir PR (CI verde) e re-deploy.

## 4. Cliente em suspensão indevida (readonly)
1. Conferir `subscriptions.status` e `grace_until` do tenant.
2. Se foi engano de webhook, aplicar a correção do item 2.

## 5. Backup e restore
- **Backup:** workflow `.github/workflows/backup.yml` roda `pg_dump` diário e
  envia o `.sql.gz` para o bucket S3 (secrets `SUPABASE_DB_URL`, `AWS_*`).
- **Restore (teste mensal):**
  ```bash
  gunzip -c nexflow-YYYYMMDD.sql.gz | psql "$RESTORE_DB_URL"
  ```
  Restaurar sempre em um projeto de staging antes de qualquer ação em produção.

## 6. Integrações em modo de configuração
WhatsApp (Z-API), NF-e (NFe.io), ClickSign e Iugu são **env-gated**: sem as
chaves, retornam "modo de configuração" e o resto do app segue normal. Para
ligar, preencher os secrets correspondentes (ver `.env.example`) e redeployar.
