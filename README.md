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
   Isso cria as tabelas `companies`, `interactions`, `tasks`, os índices, o gatilho que
   atualiza automaticamente "último contato" e as regras de segurança (RLS) — cada
   usuária só vê os próprios dados.
4. Vá em **Authentication → Providers** e confirme que **Email** está habilitado (já vem por padrão).
   - Se quiser pular a confirmação por e-mail (mais rápido para uso pessoal): em
     **Authentication → Settings**, desative "Confirm email".
5. Vá em **Project Settings → API** e copie:
   - `Project URL`
   - `anon public` key

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
