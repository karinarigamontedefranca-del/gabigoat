-- ============================================================
-- MIGRAÇÃO — rode este script SOMENTE SE você já tinha rodado
-- o schema.sql antes (ou seja, já existe a tabela companies).
--
-- Se está configurando o Supabase pela primeira vez agora, IGNORE
-- este arquivo — o schema.sql já vem pronto com tudo isso.
--
-- O que esse script faz:
-- 1. Cria a tabela stage_events (o "motor" da planilha/funil automático)
-- 2. Cria o gatilho que registra um evento toda vez que uma empresa
--    muda de fase
-- 3. Migra os nomes antigos de fase pros novos, mais detalhados
--    (iguais aos da planilha: Lead, Conexão, Apresentação Agendada/
--    Realizada, Proposta Agendada/Realizada, Contrato Assinado)
-- 4. Preenche o histórico com um evento inicial pra cada empresa que
--    já existia, na fase em que ela está hoje, pra já aparecer na
--    planilha/funil
-- ============================================================

-- 1. tabela de eventos
create table if not exists stage_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade default auth.uid(),
  company_id uuid not null references companies(id) on delete cascade,
  stage text not null,
  occurred_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists stage_events_company_idx on stage_events(company_id);
create index if not exists stage_events_stage_idx on stage_events(stage);
create index if not exists stage_events_date_idx on stage_events(occurred_at);

alter table stage_events enable row level security;

drop policy if exists "stage_events_select_team" on stage_events;
drop policy if exists "stage_events_insert_team" on stage_events;
drop policy if exists "stage_events_delete_team" on stage_events;

create policy "stage_events_select_team" on stage_events for select using (auth.role() = 'authenticated');
create policy "stage_events_insert_team" on stage_events for insert with check (auth.uid() = user_id);
create policy "stage_events_delete_team" on stage_events for delete using (auth.uid() = user_id);

-- 2. gatilho automático
create or replace function log_stage_event()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into stage_events (user_id, company_id, stage, occurred_at)
      values (new.user_id, new.id, new.stage, current_date);
  elsif (tg_op = 'UPDATE' and old.stage is distinct from new.stage) then
    insert into stage_events (user_id, company_id, stage, occurred_at)
      values (coalesce(auth.uid(), new.user_id), new.id, new.stage, current_date);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_stage_event on companies;
create trigger trg_log_stage_event
  after insert or update on companies
  for each row execute function log_stage_event();

-- 3. migra os nomes antigos de fase pros novos
--    (rode só uma vez — se já tiver rodado, não tem problema rodar de novo,
--    só não vai mudar nada porque os valores antigos já não existem mais)
update companies set stage = 'conexao' where stage = 'contato';
update companies set stage = 'proposta_agendada' where stage = 'negociacao';
update companies set stage = 'proposta_realizada' where stage = 'proposta';
update companies set stage = 'contrato' where stage = 'ganho';
-- 'lead' e 'perdido' continuam com o mesmo nome, não precisa mexer

-- 4. cria um evento inicial pra cada empresa que já existia, na fase atual dela,
--    usando a data de criação (ou do último contato, se tiver) como referência
insert into stage_events (user_id, company_id, stage, occurred_at)
select user_id, id, stage, coalesce(last_contact_at::date, created_at::date)
from companies
where not exists (
  select 1 from stage_events se where se.company_id = companies.id
);
