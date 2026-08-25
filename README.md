# 🐐 GabiGoat Lab

CRM de vendas feito sob medida — controle de empresas contatadas, funil visual (kanban),
histórico de conversas, "há quantos dias sem falar" com cada empresa, e follow-ups.

Stack: **Next.js 14 + TypeScript + Tailwind + Supabase** (auth + banco de dados).
Feito para rodar de graça na **Vercel** com banco no **Supabase**.

---

## 1. Criar o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e crie um novo projeto (grátis).
2. No painel do projeto, vá em **SQL Editor** → **New query**.
3. Cole todo o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql) e clique em **Run**.
   Isso cria as tabelas `profiles`, `companies`, `interactions`, `tasks`, os índices, o gatilho que
   cria um perfil automaticamente pra cada conta nova, o gatilho que atualiza "último contato", e as
   regras de segurança (RLS) — a equipe toda compartilha o mesmo funil, mas cada ação fica registrada
   em nome de quem fez.
   > Se você já tinha rodado uma versão anterior do schema (antes dos perfis existirem), rode também
   > o [`supabase/migration_perfis.sql`](./supabase/migration_perfis.sql) logo depois — ele adapta o
   > banco sem apagar os dados que já existem.
4. Vá em **Authentication → Providers** e confirme que **Email** está habilitado (já vem por padrão).
   - Se quiser pular a confirmação por e-mail (mais rápido para uso pessoal): em
     **Authentication → Settings**, desative "Confirm email".
5. Vá em **Project Settings → API** (ou **Data API**) e copie:
   - `Project URL`
   - a chave `anon public` / **Publishable key**

### Criando as contas da equipe

Esta versão já vem preparada para 3 perfis: Gabi, Vitor e Rafael. Crie as contas do Vitor e do
Rafael direto no painel do Supabase:

1. Vá em **Authentication → Users → Add user**.
2. Crie a conta `vitor1.oliveira@skema.edu` com a senha `thegoats` (marque "Auto Confirm User").
3. Crie a conta `rafael.manhaes@skema.edu` com a senha `thegoats` (marque "Auto Confirm User").
4. Volte no **SQL Editor** e rode este bloco (ele já está comentado no fim do `schema.sql`,
   troque só o e-mail da Gabi pelo e-mail real dela):

```sql
update profiles set display_name = 'Vitor', avatar_url = '/avatars/vitor.png', theme = 'vitor'
  where id = (select id from auth.users where email = 'vitor1.oliveira@skema.edu');

update profiles set display_name = 'Rafael', avatar_url = '/avatars/rafael.png', theme = 'rafael'
  where id = (select id from auth.users where email = 'rafael.manhaes@skema.edu');

update profiles set display_name = 'Gabi', avatar_url = '/logo.png', theme = 'default'
  where id = (select id from auth.users where email = 'EMAIL_DA_GABI_AQUI');
```

Pronto — quando cada um logar, vai ver a própria foto e uma animação de carregamento com cor
diferente (Gabi = verde-limão, Vitor = azul-gelo, Rafael = laranja-fogo), e a Gabi consegue ver
o que cada um andou fazendo na aba **Equipe**.

---

## 2. Rodar localmente (opcional, para testar antes do deploy)

```bash
npm install
cp .env.example .env.local
# edite .env.local e cole a URL e a anon key do Supabase
npm run dev
```

Abra `http://localhost:3000`, clique em **Criar conta** e cadastre o e-mail/senha da Gabi.
Pronto, já pode usar.

---

## 3. Deploy na Vercel

1. Suba esta pasta para um repositório no GitHub (ou faça upload direto pelo painel da Vercel).
2. Em [vercel.com](https://vercel.com) → **Add New Project** → selecione o repositório.
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` → a URL do seu projeto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → a anon key
4. Clique em **Deploy**. Em ~1 minuto o link estará no ar.
5. Acesse o link, clique em **Criar conta**, cadastre o login da Gabi e comece a usar.

> Dica: depois que a Gabi já tiver a conta criada, você pode desativar novos cadastros em
> **Authentication → Settings → Enable email signups** no Supabase, para que só ela tenha acesso.

---

## O que a plataforma faz

- **Equipe** — cada integrante (Gabi, Vitor, Rafael) tem conta própria, com foto de perfil e
  animação de carregamento personalizada ao entrar. A aba **Equipe** mostra quantas empresas,
  contatos e fechamentos cada um fez, com a atividade mais recente.
- **Funil compartilhado** — todo mundo vê o mesmo funil (não é um funil separado por pessoa),
  mas cada empresa e cada contato registrado fica atribuído a quem fez, então dá pra saber quem
  cadastrou cada lead e quem falou com cada empresa.
- **Gerador de mensagens** — botão "✨ Gerar mensagem" em cada empresa (também disponível na
  lista e no kanban). Detecta automaticamente a fase certa (primeiro contato, follow-up,
  proposta, negociação, reconquista de lead esfriado ou cliente perdido) e sugere 3 variações de
  mensagem já com o tom da Skema Consultoria Júnior, prontas pra copiar ou abrir direto no
  WhatsApp.
- **Painel** — visão geral do funil: valor total em negociação, quantas empresas em cada
  estágio, quais estão esfriando (sem contato há muito tempo) e próximos follow-ups.
- **Empresas**
  - Cadastro completo: nome, pessoa de contato, WhatsApp (com link direto para conversar),
    e-mail, segmento, origem do lead, valor estimado, prioridade e notas.
  - **Kanban** arrastável por estágio do funil (Lead → Em contato → Proposta → Negociação →
    Ganho/Perdido).
  - **Lista** em tabela para visão rápida de todas as empresas.
  - Badge de "**streak**" mostrando há quantos dias não fala com cada empresa
    (verde = recente, amarelo = atenção, vermelho = esfriando).
  - Busca por nome, contato ou segmento.
- **Página de cada empresa**
  - Linha do tempo com todo o histórico de contatos (WhatsApp, e-mail, ligação, reunião).
  - Botão **"Registrar contato"** — toda vez que ela falar com a empresa, registra e o
    contador de dias zera automaticamente (via gatilho no banco).
  - Follow-ups específicos daquela empresa.
- **Follow-ups** — lista central de tarefas pendentes/concluídas, com ou sem empresa vinculada.
- **Login** próprio por e-mail/senha (Supabase Auth) — os dados ficam privados, vinculados à conta dela.

---

## Estrutura

```
app/
  page.tsx              → painel
  login/page.tsx         → login/cadastro
  empresas/page.tsx      → kanban + lista de empresas
  empresas/[id]/page.tsx → detalhe da empresa + histórico
  tarefas/page.tsx       → follow-ups
components/              → modais, sidebar, badges, etc.
lib/                     → cliente supabase, tipos e funções utilitárias
supabase/schema.sql       → schema completo do banco (rodar uma vez no Supabase)
```

## Próximas ideias (se quiser evoluir depois)

- Importar contatos via planilha (CSV).
- Métricas de taxa de conversão por estágio.
- Notificação por e-mail quando uma empresa passa X dias sem contato.
- Múltiplos usuários (equipe) compartilhando o mesmo funil.
