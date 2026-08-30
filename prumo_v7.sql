-- =====================================================================
--  PRUMO · Add-on v7 — Portfólio dos fornecedores + Personalização do cliente
--   • Cada produto do fornecedor pode virar item de PORTFÓLIO: imagem,
--     categoria (Elétrica, Revestimentos, Acabamentos, Jardinagem…),
--     preço de CLIENTE (com margem) e flag "mostrar no catálogo".
--   • O cliente navega o catálogo por CATEGORIA, sem NUNCA ver o
--     fornecedor (RPC SECURITY DEFINER esconde a origem).
--   • As escolhas do cliente viram uma lista de desejos na obra.
--  Rode no Supabase → SQL Editor (depois dos anteriores). Idempotente.
-- =====================================================================

-- 1. Produto do fornecedor ganha os campos de portfólio
alter table public.fornecedor_produtos add column if not exists categoria     text;
alter table public.fornecedor_produtos add column if not exists descricao     text;
alter table public.fornecedor_produtos add column if not exists imagem_path   text;
alter table public.fornecedor_produtos add column if not exists preco_cliente numeric;   -- preço de venda (com margem)
alter table public.fornecedor_produtos add column if not exists no_catalogo   boolean not null default false; -- aparece pro cliente?

-- 2. Bucket PÚBLICO só de imagens do catálogo (a foto não identifica o fornecedor)
insert into storage.buckets (id, name, public) values ('catalogo','catalogo', true)
  on conflict (id) do nothing;
drop policy if exists "catalogo: público lê"  on storage.objects;
drop policy if exists "catalogo: equipe grava" on storage.objects;
drop policy if exists "catalogo: equipe mexe"  on storage.objects;
drop policy if exists "catalogo: equipe apaga" on storage.objects;
create policy "catalogo: público lê"  on storage.objects for select using ( bucket_id='catalogo' );
create policy "catalogo: equipe grava" on storage.objects for insert with check ( bucket_id='catalogo' and public.eh_equipe() );
create policy "catalogo: equipe mexe"  on storage.objects for update using ( bucket_id='catalogo' and public.eh_equipe() );
create policy "catalogo: equipe apaga" on storage.objects for delete using ( bucket_id='catalogo' and public.eh_equipe() );

-- 3. Seleções do cliente (personalização) — lista de desejos por obra
create table if not exists public.obra_selecoes (
  id            uuid primary key default gen_random_uuid(),
  obra_id       uuid not null references public.obras(id) on delete cascade,
  produto_id    uuid references public.fornecedor_produtos(id) on delete set null,
  item          text not null,
  categoria     text,
  preco_cliente numeric not null default 0,
  quantidade    numeric not null default 1,
  ambiente      text,
  status        text not null default 'desejo' check (status in ('desejo','aprovado','recusado')),
  criado_em     timestamptz not null default now()
);
create index if not exists idx_selecoes_obra on public.obra_selecoes(obra_id);
-- marca que a escolha já foi somada ao orçado (evita contar duas vezes)
alter table public.obra_selecoes add column if not exists no_orcado boolean not null default false;

alter table public.obra_selecoes enable row level security;
drop policy if exists "selecoes: equipe da obra vê"    on public.obra_selecoes;
drop policy if exists "selecoes: equipe da obra grava" on public.obra_selecoes;
create policy "selecoes: equipe da obra vê"
  on public.obra_selecoes for select using ( public.pode_gerenciar_obra(obra_id) );
create policy "selecoes: equipe da obra grava"
  on public.obra_selecoes for all
  using ( public.pode_gerenciar_obra(obra_id) )
  with check ( public.pode_gerenciar_obra(obra_id) );
grant select, insert, update, delete on public.obra_selecoes to authenticated;

-- 4. RPC pública: catálogo por token, agrupável por categoria, SEM fornecedor
create or replace function public.catalogo_publico(p_token text)
returns json language sql stable security definer set search_path = public
as $$
  select case when not exists (select 1 from public.obras where share_token = p_token) then null
  else coalesce((
    select json_agg(json_build_object(
      'id',        fp.id,
      'item',      fp.produto,
      'descricao', fp.descricao,
      'categoria', coalesce(nullif(fp.categoria,''),'Outros'),
      'unidade',   fp.unidade,
      'preco',     coalesce(fp.preco_cliente, 0),
      'imagem',    fp.imagem_path              -- caminho no bucket público 'catalogo'
    ) order by fp.categoria, fp.produto)
    from public.fornecedor_produtos fp
    where fp.no_catalogo = true
  ), '[]'::json) end
$$;

-- 5. RPC pública: o que o cliente já escolheu (para reabrir e continuar)
create or replace function public.minhas_selecoes(p_token text)
returns json language sql stable security definer set search_path = public
as $$
  select coalesce((
    select json_agg(json_build_object(
      'produto_id', s.produto_id, 'item', s.item, 'categoria', s.categoria,
      'preco', s.preco_cliente, 'quantidade', s.quantidade, 'ambiente', s.ambiente))
    from public.obra_selecoes s
    join public.obras o on o.id = s.obra_id
    where o.share_token = p_token and s.status = 'desejo'
  ), '[]'::json)
$$;

-- 6. RPC pública: cliente salva/atualiza a lista de desejos (reenvia tudo)
create or replace function public.salvar_selecoes(p_token text, p_itens json)
returns int language plpgsql security definer set search_path = public
as $$
declare v_obra uuid; n int;
begin
  select id into v_obra from public.obras where share_token = p_token;
  if v_obra is null then return 0; end if;
  -- só mexe nos 'desejo' (aprovados pela equipe ficam intactos)
  delete from public.obra_selecoes where obra_id = v_obra and status = 'desejo';
  insert into public.obra_selecoes (obra_id, produto_id, item, categoria, preco_cliente, quantidade, ambiente)
  select v_obra,
    nullif(i->>'produto_id','')::uuid, i->>'item', i->>'categoria',
    coalesce((i->>'preco')::numeric,0), coalesce((i->>'quantidade')::numeric,1), i->>'ambiente'
  from json_array_elements(p_itens) as i
  where coalesce((i->>'quantidade')::numeric,0) > 0;
  get diagnostics n = row_count;
  return n;
end $$;

-- 7. Privilégios para o cliente sem login (anon)
grant usage on schema public to anon;
grant execute on function public.catalogo_publico(text) to anon, authenticated;
grant execute on function public.minhas_selecoes(text) to anon, authenticated;
grant execute on function public.salvar_selecoes(text, json) to anon, authenticated;

-- =====================================================================
--  PRONTO. O cliente vê preço de cliente (com margem) e categoria —
--  nunca o fornecedor nem o custo interno. As escolhas caem em
--  obra_selecoes como 'desejo' para a equipe revisar.
-- =====================================================================
