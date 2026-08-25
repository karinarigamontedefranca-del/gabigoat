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
  stage text not null default 'lead',   -- lead | contato | proposta | negociacao | ganho | perdido
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
