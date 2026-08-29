# Prumo · app

App de gestão de obra do **Grupo MS** — React + Vite + Supabase.
Login por e-mail (magic link), painel de obras, etapas com fotos, e portal do
cliente (que vê só a obra dele, sem custos). A segurança é garantida no banco (RLS).

## Antes de tudo: o banco

Este app conversa com um projeto **Supabase** já configurado. Se ainda não rodou,
execute o `prumo_schema.sql` (arquivo da entrega anterior) no SQL Editor do Supabase.
Veja o `SETUP.md` daquele pacote.

## Rodar local

```bash
npm install
cp .env.example .env      # e preencha as duas chaves
npm run dev               # http://localhost:5173
```

`.env`:
```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

## Subir no GitHub (repo Prumo-)

```bash
git init
git add .
git commit -m "Prumo MVP - app React + Supabase"
git branch -M main
git remote add origin https://github.com/soaresdenis123-bot/Prumo-.git
git push -u origin main
```

## Deploy no Render (Static Site — grátis)

1. Render → **New → Static Site** → conecte o repo `Prumo-`.
2. Configurações:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Branch:** `main`
3. **Environment** → adicione:
   - `VITE_SUPABASE_URL` = a URL do seu Supabase
   - `VITE_SUPABASE_ANON_KEY` = a anon key
4. **Redirects/Rewrites** (pra rota do app funcionar): adicione uma regra
   - Source `/*` · Destination `/index.html` · Action **Rewrite**
   - (ou use o `render.yaml` incluído, via **New → Blueprint**)
5. **Create Static Site** → aguarde o build → seu Prumo no ar.

6. No Supabase → **Authentication → URL Configuration**: coloque a URL do Render
   em **Site URL** e em **Redirect URLs** (`https://seu-site.onrender.com/**`),
   senão o magic link não volta pro app.

## Primeiro acesso (virar admin)

Todo mundo entra como **cliente**. Depois do seu 1º login, no Supabase → SQL Editor:

```sql
update public.profiles set papel = 'admin' where email = 'voce@seuemail.com';
```

Recarregue o app: você verá o painel de administrador.

## Papéis

- **admin** — vê todas as obras, cria, edita, vê orçado.
- **gestor** — vê e gerencia as obras ligadas a ele.
- **cliente** — vê só a própria obra (etapas + fotos), nunca custos.

## Estrutura

```
src/
  lib/         supabase.js · auth.jsx · data.js
  components/  Layout.jsx · PlumbMark.jsx
  pages/       Login · Painel · Obras · ObraDetail · NovaObra · Portal
```

## Escopo deste MVP

Login, obras, 14 etapas com atualização e fotos, portal do cliente, painel.
Custos, calculadora e orçamento em PDF entram na **Fase 2** (já modelados no banco).

---
*Prumo · by Grupo MS · Construções Inteligentes*
