-- ============================================================
-- MIGRAÇÃO — rode este script SOMENTE SE você já tinha rodado
-- o schema.sql antes (ou seja, já existem as tabelas companies,
-- interactions e tasks no seu projeto).
--
-- Se está configurando o Supabase pela primeira vez agora, IGNORE
-- este arquivo — o schema.sql já vem pronto com tudo isso.
-- ============================================================

-- 1. cria um perfil pra cada conta que já existe (Gabi, e quem mais já tiver logado)
insert into profiles (id, display_name)
select id, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- 2. troca a referência das tabelas existentes de auth.users para profiles
--    (isso é o que permite a página de Equipe mostrar nome/avatar de quem fez cada coisa)
alter table companies drop constraint if exists companies_user_id_fkey;
alter table companies add constraint companies_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

alter table interactions drop constraint if exists interactions_user_id_fkey;
alter table interactions add constraint interactions_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

alter table tasks drop constraint if exists tasks_user_id_fkey;
alter table tasks add constraint tasks_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;
