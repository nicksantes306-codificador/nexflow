-- ============================================================================
-- NEXFLOW · Seed de demonstração
-- ----------------------------------------------------------------------------
-- Roda como postgres (supabase db reset / SQL Editor) → ignora RLS.
-- Cria o tenant DEMO e popula os leads do Kanban com os mesmos dados
-- sintéticos do index.html (Gerdau, WEG, Tupy... — empresas FICTÍCIAS p/ demo).
--
-- Para ver os dados logado: depois de criar sua conta, rode
--   select public.attach_me_to_demo();
-- (vincula seu usuário ao tenant DEMO como Admin)
-- ============================================================================

insert into public.tenants (id, name, cnpj, plan)
values ('00000000-0000-0000-0000-0000000d300a', 'NEXFLOW Demo — Elétrica Industrial', '00.000.000/0001-00', 'PRO')
on conflict (id) do nothing;

insert into public.leads (tenant_id, cliente, empresa, valor, status, responsavel, ultimo, obs, score, origem, telefone, email)
values
  ('00000000-0000-0000-0000-0000000d300a','GERDAU S.A.','Gerdau S.A. — Aços Longos',24584,'Orçamento enviado','Carlos M.','2026-04-21','SUB 13 — aguardando aprovação',72,'Indicação','(11) 3094-6600','comercial@gerdau.com.br'),
  ('00000000-0000-0000-0000-0000000d300a','WEG SA','WEG S.A. — Motores e Automação',49019,'Negociação','Ana P.','2026-04-08','Montagem painel elétrico CCM',85,'Site','(47) 3276-4000','vendas@weg.net'),
  ('00000000-0000-0000-0000-0000000d300a','MUNDIAL S.A.','Mundial S.A. — Produtos de Consumo',36651,'Em contato','Carlos M.','2026-05-15','Instalação RAI2400 16HAC',60,'Ligação','(51) 3358-5000','comercial@grupomundial.com.br'),
  ('00000000-0000-0000-0000-0000000d300a','MARCOPOLO SA','Marcopolo S.A. — Carrocerias',90944,'Novo Lead','Ana P.','2026-05-18','Subestação 11kV',45,'LinkedIn','(54) 2101-4000','compras@marcopolo.com.br'),
  ('00000000-0000-0000-0000-0000000d300a','EMBRAER S.A.','Embraer S.A. — Aeronáutica',116265,'Proposta','Carlos M.','2026-05-10','Automação industrial',78,'Evento','(12) 3927-1000','suprimentos@embraer.com.br'),
  ('00000000-0000-0000-0000-0000000d300a','TUPY S/A','Tupy S.A. — Fundição',31143,'Aprovado','Ana P.','2026-05-05','Retrofit painéis elétricos',95,'Cliente recorrente','(47) 4009-8389','compras@tupy.com.br'),
  ('00000000-0000-0000-0000-0000000d300a','ROMI S.A.','Romi S.A. — Máquinas-Ferramenta',18750,'Em contato','Carlos M.','2026-05-28','Adequação NR-12 — prensas linha 2',55,'Indicação','(19) 3455-9220','manutencao@romi.com'),
  ('00000000-0000-0000-0000-0000000d300a','SCHULZ S/A','Schulz S.A. — Compressores',67200,'Orçamento enviado','Ana P.','2026-05-26','QGBT 800A + barramento blindado',68,'Site','(47) 3451-6000','eng@schulz.com.br'),
  ('00000000-0000-0000-0000-0000000d300a','IOCHPE-MAXION S.A.','Iochpe-Maxion S.A. — Autopeças',42380,'Negociação','Carlos M.','2026-06-02','SPDA + aterramento galpão 3',74,'LinkedIn','(11) 2122-1014','obras@iochpe.com.br'),
  ('00000000-0000-0000-0000-0000000d300a','MAHLE METAL LEVE S.A.','Mahle Metal Leve S.A.',9840,'Novo Lead','Ana P.','2026-06-08','Laudo termográfico anual — 4 painéis',38,'Ligação','(19) 3861-9169','facilities@br.mahle.com')
on conflict do nothing;

-- Helper de conveniência p/ dev: vincula o usuário logado ao tenant DEMO.
create or replace function public.attach_me_to_demo()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.memberships (tenant_id, user_id, role)
  values ('00000000-0000-0000-0000-0000000d300a', auth.uid(), 'Admin')
  on conflict (tenant_id, user_id) do nothing;
  return 'OK — recarregue o app para ver o tenant Demo.';
end;
$$;

-- ============================================================================
-- Demo de Obras + Financeiro + Clientes (alimenta o Console Executivo).
-- Datas relativas ao ano corrente para o gráfico de receita sempre ter dados.
-- ============================================================================
insert into public.clients (id, tenant_id, nome, cnpj, segmento) values
 ('00000000-0000-0000-0000-0000000c1001','00000000-0000-0000-0000-0000000d300a','Gerdau S.A.','07.358.761/0001-30','Siderurgia'),
 ('00000000-0000-0000-0000-0000000c1002','00000000-0000-0000-0000-0000000d300a','Tupy S.A.','84.683.374/0001-49','Fundição'),
 ('00000000-0000-0000-0000-0000000c1003','00000000-0000-0000-0000-0000000d300a','Iochpe-Maxion S.A.','61.156.113/0001-75','Autopeças'),
 ('00000000-0000-0000-0000-0000000c1004','00000000-0000-0000-0000-0000000d300a','Romi S.A.','56.720.428/0001-63','Máquinas'),
 ('00000000-0000-0000-0000-0000000c1005','00000000-0000-0000-0000-0000000d300a','Schulz S.A.','84.693.183/0001-68','Compressores')
on conflict (id) do nothing;

insert into public.projects (id, tenant_id, client_id, nome, status, progresso, valor, custo_real, responsavel, inicio, fim) values
 ('00000000-0000-0000-0000-0000000b1001','00000000-0000-0000-0000-0000000d300a','00000000-0000-0000-0000-0000000c1004','Automação Linha 2','Pausado',30,421000,198000,'João R.', make_date(extract(year from current_date)::int,3,3), make_date(extract(year from current_date)::int,9,30)),
 ('00000000-0000-0000-0000-0000000b1002','00000000-0000-0000-0000-0000000d300a','00000000-0000-0000-0000-0000000c1002','Retrofit painéis CCM','Aguardando material',45,312000,121000,'Ana P.', make_date(extract(year from current_date)::int,4,10), make_date(extract(year from current_date)::int,8,20)),
 ('00000000-0000-0000-0000-0000000b1003','00000000-0000-0000-0000-0000000d300a','00000000-0000-0000-0000-0000000c1001','Subestação 13,8 kV','Em andamento',78,248000,142000,'Carlos M.', make_date(extract(year from current_date)::int,2,17), make_date(extract(year from current_date)::int,7,15)),
 ('00000000-0000-0000-0000-0000000b1004','00000000-0000-0000-0000-0000000d300a','00000000-0000-0000-0000-0000000c1003','SPDA + aterramento galpão 3','Em andamento',92,189000,151000,'Marina C.', make_date(extract(year from current_date)::int,1,20), make_date(extract(year from current_date)::int,6,28)),
 ('00000000-0000-0000-0000-0000000b1005','00000000-0000-0000-0000-0000000d300a','00000000-0000-0000-0000-0000000c1005','QGBT 800A blindado','Em andamento',60,96000,52000,'Carlos M.', make_date(extract(year from current_date)::int,5,5), make_date(extract(year from current_date)::int,8,5)),
 ('00000000-0000-0000-0000-0000000b1006','00000000-0000-0000-0000-0000000d300a','00000000-0000-0000-0000-0000000c1001','Laudo termográfico anual','Concluído',100,42000,28000,'Ana P.', make_date(extract(year from current_date)::int,1,8), make_date(extract(year from current_date)::int,2,2))
on conflict (id) do nothing;

insert into public.finance_entries (id, tenant_id, tipo, descricao, valor, status, data, categoria, cliente) values
 ('00000000-0000-0000-0000-0000000f1001','00000000-0000-0000-0000-0000000d300a','Entrada','Medição 01 — Subestação Gerdau',285000,'Recebido', make_date(extract(year from current_date)::int,1,18),'Serviços','Gerdau S.A.'),
 ('00000000-0000-0000-0000-0000000f1002','00000000-0000-0000-0000-0000000d300a','Entrada','Medição 02 — SPDA Iochpe',330000,'Recebido', make_date(extract(year from current_date)::int,2,15),'Serviços','Iochpe-Maxion S.A.'),
 ('00000000-0000-0000-0000-0000000f1003','00000000-0000-0000-0000-0000000d300a','Entrada','Medição 03 — Retrofit Tupy',355000,'Recebido', make_date(extract(year from current_date)::int,3,14),'Serviços','Tupy S.A.'),
 ('00000000-0000-0000-0000-0000000f1004','00000000-0000-0000-0000-0000000d300a','Entrada','Medição 04 — Subestação Gerdau',402000,'Recebido', make_date(extract(year from current_date)::int,4,22),'Serviços','Gerdau S.A.'),
 ('00000000-0000-0000-0000-0000000f1005','00000000-0000-0000-0000-0000000d300a','Entrada','Medição 05 — Automação Romi',438000,'Recebido', make_date(extract(year from current_date)::int,5,19),'Serviços','Romi S.A.'),
 ('00000000-0000-0000-0000-0000000f1006','00000000-0000-0000-0000-0000000d300a','Entrada','Medição 06 — QGBT Schulz',496000,'Recebido', make_date(extract(year from current_date)::int,6,10),'Serviços','Schulz S.A.'),
 ('00000000-0000-0000-0000-0000000f1007','00000000-0000-0000-0000-0000000d300a','Entrada','Medição vencida — Romi',84000,'Atrasado', make_date(extract(year from current_date)::int,5,28),'Serviços','Romi S.A.'),
 ('00000000-0000-0000-0000-0000000f1008','00000000-0000-0000-0000-0000000d300a','Entrada','Sinal de obra — Schulz',120000,'Pendente', make_date(extract(year from current_date)::int,6,25),'Serviços','Schulz S.A.'),
 ('00000000-0000-0000-0000-0000000f1009','00000000-0000-0000-0000-0000000d300a','Saída','Compra de cabos e disjuntores',90000,'Pago', make_date(extract(year from current_date)::int,6,5),'Materiais','—')
on conflict (id) do nothing;
