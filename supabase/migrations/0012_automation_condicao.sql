-- Condição simples opcional por automação: só executa se {campo} {operador} {valor}.
-- Ex.: valor >= 50000. jsonb: { campo: 'valor', operador: '>=', valor: 50000 }.
alter table public.automations
  add column if not exists condicao jsonb;
