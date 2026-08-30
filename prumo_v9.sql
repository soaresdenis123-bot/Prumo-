-- =====================================================================
--  PRUMO · Add-on v9 — Personalização por AMBIENTE + portfólio do cliente
--   • Portfólio em PDF pode ser marcado "mostrar ao cliente" (com categoria).
--     Esses PDFs ficam no bucket público 'catalogo' (sem identificar o
--     fornecedor); os PDFs internos continuam no bucket privado 'portfolios'.
--   • RPC catálogo de PDFs do cliente por token.
--   • RPC dos ambientes da obra (vindos do orçamento por ambientes aprovado).
--  Rode no Supabase → SQL Editor (depois dos anteriores). Idempotente.
-- =====================================================================

-- 1. Arquivo do fornecedor pode virar portfólio do CLIENTE (categoria + flag)
alter table public.fornecedor_arquivos add column if not exists categoria   text;
alter table public.fornecedor_arquivos add column if not exists no_catalogo boolean not null default false;
alter table public.fornecedor_arquivos add column if not exists bucket      text not null default 'portfolios';

-- 2. RPC: portfólios (PDF) liberados pro cliente, por token, SEM o fornecedor
create or replace function public.portfolios_publicos(p_token text)
returns json language sql stable security definer set search_path = public
as $$
  select case when not exists (select 1 from public.obras where share_token = p_token) then null
  else coalesce((
    select json_agg(json_build_object(
      'id', a.id, 'nome', a.nome,
      'categoria', coalesce(nullif(a.categoria,''),'Outros'),
      'path', a.path
    ) order by a.categoria)
    from public.fornecedor_arquivos a
    where a.no_catalogo = true
  ), '[]'::json) end
$$;

-- 3. RPC: ambientes da obra (categorias do orçamento aprovado) — para pré-carregar
create or replace function public.ambientes_obra(p_token text)
returns json language sql stable security definer set search_path = public
as $$
  select coalesce((
    select json_agg(distinct oi.categoria)
    from public.orcamento_itens oi
    join public.orcamentos o on o.id = oi.orcamento_id
    join public.obras ob on ob.id = o.obra_id
    where ob.share_token = p_token and o.status = 'aprovado'
      and oi.categoria is not null and oi.categoria <> ''
  ), '[]'::json)
$$;

grant execute on function public.portfolios_publicos(text) to anon, authenticated;
grant execute on function public.ambientes_obra(text) to anon, authenticated;

-- =====================================================================
--  PRONTO. PDFs marcados "no catálogo" precisam ser enviados ao bucket
--  público 'catalogo' (o app faz isso); os internos seguem privados.
-- =====================================================================
