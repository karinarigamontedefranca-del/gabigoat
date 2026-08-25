-- ============================================================
-- GABIGOAT LAB — schema do banco (rodar no SQL Editor do Supabase)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- PERFIS (um por integrante da equipe: Gabi, Vitor, Rafael...)
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Membro',
  avatar_url text,
  theme text not null default 'default', -- default | vitor | rafael (controla cor/animação de login)
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_select_all" on profiles;
create policy "profiles_select_all" on profiles for select using (auth.role() = 'authenticated');
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- cria o perfil automaticamente sempre que uma conta nova é criada
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
    values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ------------------------------------------------------------
-- EMPRESAS (o coração do funil)
-- ------------------------------------------------------------
create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade default auth.uid(),
  name text not null,
  contact_person text,
  whatsapp text,
  email text,
  segment text,
  source text,                -- de onde veio o lead (indicação, instagram, evento...)
  stage text not null default 'lead',   -- lead | conexao | apres_agendada | apres_realizada | proposta_agendada | proposta_realizada | contrato | perdido
  status text not null default 'aberto', -- aberto | ganho | perdido
  value numeric(12,2) default 0,        -- valor estimado da negociação
  priority text not null default 'media', -- baixa | media | alta
  notes text,
  created_at timestamptz not null default now(),
  last_contact_at timestamptz default now()
);

create index if not exists companies_user_id_idx on companies(user_id);
create index if not exists companies_stage_idx on companies(stage);
create index if not exists companies_last_contact_idx on companies(last_contact_at);

-- ------------------------------------------------------------
-- EVENTOS DE FUNIL — é a "planilha" viva. Toda vez que uma empresa
-- muda de fase (pelo kanban, pela edição, ou lançado manualmente),
-- fica um registro aqui com a data. É a partir dessa tabela que o
-- funil visual e a planilha dentro do site são calculados sozinhos.
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- METAS DE CONVERSÃO — a "taxa ideal" entre uma fase e a próxima,
-- definida pela equipe. O relatório compara a realidade com isso
-- pra apontar onde está o gargalo.
-- ------------------------------------------------------------
create table if not exists funnel_targets (
  stage text primary key, -- a fase de "chegada" da conversão (ex: 'conexao' = meta de lead→conexão)
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

-- gera um evento sozinho toda vez que uma empresa é criada (fase inicial)
-- ou muda de fase — é isso que "mescla" o kanban com a planilha.
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

-- ------------------------------------------------------------
-- INTERAÇÕES (histórico de toda vez que ela falou com a empresa)
-- ------------------------------------------------------------
create table if not exists interactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade default auth.uid(),
  company_id uuid not null references companies(id) on delete cascade,
  type text not null default 'whatsapp', -- whatsapp | email | ligacao | reuniao | outro
  note text,
  created_at timestamptz not null default now()
);

create index if not exists interactions_company_id_idx on interactions(company_id);

-- ------------------------------------------------------------
-- TAREFAS / LEMBRETES (follow-ups agendados)
-- ------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade default auth.uid(),
  company_id uuid references companies(id) on delete cascade,
  title text not null,
  due_date date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on tasks(user_id);
create index if not exists tasks_due_date_idx on tasks(due_date);

-- ------------------------------------------------------------
-- TRIGGER: sempre que uma interação nova é criada,
-- atualiza automaticamente last_contact_at da empresa
-- ------------------------------------------------------------
create or replace function touch_company_last_contact()
returns trigger as $$
begin
  update companies
    set last_contact_at = new.created_at
    where id = new.company_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_touch_company_last_contact on interactions;
create trigger trg_touch_company_last_contact
  after insert on interactions
  for each row execute function touch_company_last_contact();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY — funil compartilhado entre a equipe.
-- Todo mundo autenticado vê tudo (é um time só), mas cada
-- registro fica atribuído a quem criou (user_id), então dá
-- pra saber o que cada pessoa fez na página de Equipe.
-- ------------------------------------------------------------
alter table companies enable row level security;
alter table interactions enable row level security;
alter table tasks enable row level security;
alter table stage_events enable row level security;

drop policy if exists "companies_select_own" on companies;
drop policy if exists "companies_insert_own" on companies;
drop policy if exists "companies_update_own" on companies;
drop policy if exists "companies_delete_own" on companies;

create policy "companies_select_team" on companies for select using (auth.role() = 'authenticated');
create policy "companies_insert_team" on companies for insert with check (auth.uid() = user_id);
create policy "companies_update_team" on companies for update using (auth.role() = 'authenticated');
create policy "companies_delete_team" on companies for delete using (auth.role() = 'authenticated');

drop policy if exists "interactions_select_own" on interactions;
drop policy if exists "interactions_insert_own" on interactions;
drop policy if exists "interactions_update_own" on interactions;
drop policy if exists "interactions_delete_own" on interactions;

create policy "interactions_select_team" on interactions for select using (auth.role() = 'authenticated');
create policy "interactions_insert_team" on interactions for insert with check (auth.uid() = user_id);
create policy "interactions_delete_team" on interactions for delete using (auth.uid() = user_id);

drop policy if exists "tasks_select_own" on tasks;
drop policy if exists "tasks_insert_own" on tasks;
drop policy if exists "tasks_update_own" on tasks;
drop policy if exists "tasks_delete_own" on tasks;

create policy "tasks_select_team" on tasks for select using (auth.role() = 'authenticated');
create policy "tasks_insert_team" on tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_team" on tasks for update using (auth.role() = 'authenticated');
create policy "tasks_delete_team" on tasks for delete using (auth.role() = 'authenticated');

drop policy if exists "stage_events_select_team" on stage_events;
drop policy if exists "stage_events_insert_team" on stage_events;
drop policy if exists "stage_events_delete_team" on stage_events;

create policy "stage_events_select_team" on stage_events for select using (auth.role() = 'authenticated');
create policy "stage_events_insert_team" on stage_events for insert with check (auth.uid() = user_id);
create policy "stage_events_delete_team" on stage_events for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- SEED — rode isso DEPOIS de criar as contas do Vitor e do Rafael
-- (Authentication → Users → Add user, no painel do Supabase).
-- Troque o e-mail da Gabi no último bloco pelo e-mail real dela.
-- ------------------------------------------------------------
-- update profiles set display_name = 'Vitor', avatar_url = '/avatars/vitor.png', theme = 'vitor'
--   where id = (select id from auth.users where email = 'vitor1.oliveira@skema.edu');

-- update profiles set display_name = 'Rafael', avatar_url = '/avatars/rafael.png', theme = 'rafael'
--   where id = (select id from auth.users where email = 'rafael.manhaes@skema.edu');

-- update profiles set display_name = 'Gabi', avatar_url = '/logo.png', theme = 'default'
--   where id = (select id from auth.users where email = 'EMAIL_DA_GABI_AQUI');
