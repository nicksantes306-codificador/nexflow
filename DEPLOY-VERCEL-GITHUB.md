# Deploy do NEXFLOW (monorepo) → GitHub + Vercel

Guia para colocar o app `apps/web` no ar, ligado ao Supabase **novo**
(`nexflow-monorepo`). Rode os comandos no **seu Windows** (PowerShell), na pasta
`C:\Users\Pichau\Desktop\nexflow`.

---

## 0) Limpar o `.git` quebrado (importante)

Uma tentativa de `git init` foi feita por uma ferramenta remota e deixou uma
pasta `.git` corrompida que só dá pra apagar daqui. No PowerShell:

```powershell
cd "C:\Users\Pichau\Desktop\nexflow"
Remove-Item -Recurse -Force .git
```

---

## 1) Criar o repositório Git e o commit inicial

```powershell
cd "C:\Users\Pichau\Desktop\nexflow"
git init
git add -A
git commit -m "NEXFLOW monorepo — Sprint 0 (auth + CRM Kanban)"
```

> O `.gitignore` já protege `node_modules/`, `.next/` e `.env.local`
> (segredos NÃO vão pro Git). Confirme que o commit não trouxe `.env.local`:
> `git ls-files | findstr .env.local` → não deve retornar nada.

## 2) Subir pro GitHub

Crie um repositório vazio em https://github.com/new (ex.: `nexflow`), **sem**
README/gitignore. Depois:

```powershell
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/nexflow.git
git push -u origin main
```

(O push vai pedir login do GitHub — é uma ação sua; não consigo autenticar por você.)

---

## 3) Importar na Vercel

Em https://vercel.com/new → **Import Git Repository** → escolha o repo.
Configure assim:

| Campo | Valor |
| --- | --- |
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/web`  ← essencial (é um monorepo pnpm) |
| **Build Command** | (deixe padrão: `next build`) |
| **Install Command** | (padrão; a Vercel detecta o pnpm workspace pelo `pnpm-workspace.yaml` da raiz) |
| **Node.js Version** | 20.x (o repo tem `.nvmrc` = 20) |

> Ao definir Root Directory = `apps/web`, a Vercel inclui automaticamente os
> pacotes do workspace (`@nexflow/core`, `@nexflow/db`, `@nexflow/ui`).

## 4) Variáveis de ambiente (na tela de import, seção *Environment Variables*)

Cole exatamente (projeto Supabase novo — região São Paulo):

```
NEXT_PUBLIC_SUPABASE_URL=https://tgmpaxcebiqonlcdnzbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_C4SWrwpn_bfG3sXQU-C2mA_HgWmLNyE
NEXT_PUBLIC_SITE_URL=https://SEU-APP.vercel.app
```

- `NEXT_PUBLIC_SITE_URL`: depois do 1º deploy, a Vercel te dá o domínio real
  (algo como `nexflow.vercel.app`). Volte aqui e ajuste para esse valor, e
  **redeploy**.
- `SUPABASE_SERVICE_ROLE_KEY` (server-only): **só** se/quando precisar de jobs
  server-side. Pegue em Supabase → Project Settings → API Keys → *service_role*
  e adicione como env **sem** o prefixo `NEXT_PUBLIC_`. Nunca commite essa chave.

Clique **Deploy**.

---

## 5) Configurar o Auth do Supabase (senão o login redireciona errado)

No painel do projeto novo:
https://app.supabase.com/project/tgmpaxcebiqonlcdnzbz/auth/url-configuration

- **Site URL**: `https://SEU-APP.vercel.app`
- **Redirect URLs** (adicione): `https://SEU-APP.vercel.app/auth/callback`
  e, para dev, `http://localhost:3000/auth/callback`.

(O app usa a rota `apps/web/app/auth/callback/route.ts` no fluxo de login.)

---

## 6) Validar

1. Abra `https://SEU-APP.vercel.app` → **Cadastre-se** (cria conta + tenant + membership).
2. Para ver os 10 leads de demonstração, no SQL Editor do Supabase rode:
   ```sql
   select public.attach_me_to_demo();
   ```
3. Recarregue `/crm` — o Kanban deve listar os leads e permitir arrastar entre colunas.

---

## Estado atual (já feito)

- ✅ Projeto Supabase novo `nexflow-monorepo` (`tgmpaxcebiqonlcdnzbz`, sa-east-1).
- ✅ Schema aplicado: migrations `0001_init` + `0002_rls`, RLS em 17 tabelas, 21 policies.
- ✅ Seed: tenant DEMO + 10 leads. (Bug do UUID `d3m0a`→`d300a` corrigido no `seed.sql`.)
- ✅ `apps/web/.env.local` apontando pro projeto novo (backup em `.env.local.bak`).
- ⬜ Push GitHub + import Vercel + envs + redirect Auth → **passos 1–5 acima (você)**.

## Observações importantes

- O `docs/DEPLOY.md` original mira Vercel — este guia segue isso.
- O site `nexflowsaas.netlify.app` é a versão **antiga single-file** (`index.html`),
  ligada ao Supabase **antigo** (`basoxlfoasqpngyqvigr`). É um app diferente deste
  monorepo; não confunda os dois. Se quiser, dá pra desativar/repurpor depois.
