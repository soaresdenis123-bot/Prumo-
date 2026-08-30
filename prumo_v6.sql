-- =====================================================================
--  PRUMO · Add-on v6
--   • Fornecedores classificados por CATEGORIA (esquadrias, tintas,
--     parafusos, cimento…) — antes de abrir cada fornecedor.
--   • Custos com STATUS (pendente / pago) e GRUPO (categoria fina vinda
--     do orçamento), para o check no Financeiro e o overview na obra.
--   • Aba PRODUTOS por obra, ligada à etapa (item · quantidade · pedir).
--  Rode no Supabase → SQL Editor (depois dos anteriores). Idempotente.
-- =====================================================================

-- 1. Fornecedor: categoria
alter table public.fornecedores add column if not exists categoria text;

-- 2. Custos: status pendente/pago, grupo (categoria fina) e vínculo à etapa
alter table public.custo_itens add column if not exists status text not null default 'pendente'
  check (status in ('pendente','pago'));
alter table public.custo_itens add column if not exists grupo text;
alter table public.custo_itens add column if not exists etapa_id uuid
  references public.etapas(id) on delete set null;

-- 3. Produtos da obra (lista de compras por fase, ligada à etapa)
create table if not exists public.obra_produtos (
  id          uuid primary key default gen_random_uuid(),
  obra_id     uuid not null references public.obras(id) on delete cascade,
  etapa_id    uuid references public.etapas(id) on delete set null,
  item        text not null,
  unidade     text default 'un',
  quantidade  numeric not null default 1,
  status      text not null default 'a_comprar'
              check (status in ('a_comprar','pedido','recebido')),
  pedir       boolean not null default false,   -- "pedir mais"
  obs         text,
  criado_em   timestamptz not null default now()
);
create index if not exists idx_obra_produtos_obra  on public.obra_produtos(obra_id);
create index if not exists idx_obra_produtos_etapa on public.obra_produtos(etapa_id);

alter table public.obra_produtos enable row level security;
drop policy if exists "obra_produtos: equipe da obra vê"    on public.obra_produtos;
drop policy if exists "obra_produtos: equipe da obra grava" on public.obra_produtos;
create policy "obra_produtos: equipe da obra vê"
  on public.obra_produtos for select using ( public.pode_gerenciar_obra(obra_id) );
create policy "obra_produtos: equipe da obra grava"
  on public.obra_produtos for all
  using ( public.pode_gerenciar_obra(obra_id) )
  with check ( public.pode_gerenciar_obra(obra_id) );

grant select, insert, update, delete on public.obra_produtos to authenticated;

-- =====================================================================
--  PRONTO. (Os custos continuam 100% internos — cliente e execução não
--  têm política de leitura sobre custo_itens nem obra_produtos.)
-- =====================================================================
