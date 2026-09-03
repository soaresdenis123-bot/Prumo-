-- =====================================================================
--  PRUMO · v16 — Apresentação por cliente (link público)
--  Cada lead ganha um token e um bloco "apres" (jsonb) com overrides:
--  render personalizado, flags de exibição, etc. Uma RPC pública devolve
--  os dados da apresentação a partir do token, sem login.
--  Idempotente.
-- =====================================================================

-- token único por lead (cada linha existente recebe um uuid próprio)
alter table public.leads_projeto
  add column if not exists share_token uuid not null default gen_random_uuid();
create unique index if not exists idx_leads_projeto_token on public.leads_projeto(share_token);

-- overrides da apresentação (render custom, casa personalizada, etc.)
--   { "render_url": "...", "personalizada": true, "familia": "..." }
alter table public.leads_projeto
  add column if not exists apres jsonb;

-- RPC pública: devolve os dados da apresentação de um cliente pelo token.
-- SECURITY DEFINER passa pela RLS; só expõe o necessário (nada de contato).
create or replace function public.apresentacao_publica(p_token uuid)
returns json language sql stable security definer set search_path = public
as $$
  select case when l.id is null then null else json_build_object(
    'nome',    l.nome,
    'cidade',  l.cidade,
    'tipo',    l.tipo,
    'padrao',  l.padrao,
    'telhado', l.telhado,
    'modelo',  l.modelo,
    'obs',     l.obs,
    'apres',   l.apres
  ) end
  from (select * from public.leads_projeto where share_token = p_token limit 1) l
$$;
grant execute on function public.apresentacao_publica(uuid) to anon, authenticated;

-- garante que a equipe consegue gravar o bloco apres (update já coberto pela
-- policy "leads: equipe gerencia" do v13; nada mais a fazer aqui).
