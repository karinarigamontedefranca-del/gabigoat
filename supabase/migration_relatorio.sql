-- ============================================================
-- MIGRAÇÃO — rode este script SOMENTE SE você já tinha rodado
-- o schema.sql antes (ou seja, já existe a tabela stage_events).
--
-- Se está configurando o Supabase pela primeira vez agora, IGNORE
-- este arquivo — o schema.sql já vem pronto com tudo isso.
--
-- Cria a tabela de metas de conversão, usada na aba Relatório pra
-- comparar a taxa real com a taxa ideal que a equipe definir.
-- ============================================================

create table if not exists funnel_targets (
  stage text primary key,
  target_pct numeric(5,2) not null default 0,
  updated_at timestamptz not null default now()
);

alter table funnel_targets enable row level security;

drop policy if exists "funnel_targets_select_team" on funnel_targets;
drop policy if exists "funnel_targets_insert_team" on funnel_targets;
drop policy if exists "funnel_targets_update_team" on funnel_targets;

create policy "funnel_targets_select_team" on funnel_targets for select using (auth.role() = 'authenticated');
create policy "funnel_targets_insert_team" on funnel_targets for insert with check (auth.role() = 'authenticated');
create policy "funnel_targets_update_team" on funnel_targets for update using (auth.role() = 'authenticated');
