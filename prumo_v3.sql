-- =====================================================================
--  PRUMO · Add-on v3
--   • quantidade + valor unitário nos itens de custo
--   • catálogo de produtos por fornecedor (com preço)
--  Rode no Supabase → SQL Editor (depois dos anteriores). Idempotente.
-- =====================================================================

-- 1. Custos com quantidade e valor unitário
--    'valor' continua sendo o TOTAL da linha (o financeiro soma ele).
alter table public.custo_itens add column if not exists quantidade numeric not null default 1;
alter table public.custo_itens add column if not exists valor_unit numeric;

-- 2. Catálogo de produtos de cada fornecedor
create table if not exists public.fornecedor_produtos (
  id            uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references public.fornecedores(id) on delete cascade,
  produto       text not null,
  unidade       text default 'un',
  valor         numeric not null default 0,
  criado_em     timestamptz not null default now()
);
create index if not exists idx_fp_forn on public.fornecedor_produtos(fornecedor_id);

alter table public.fornecedor_produtos enable row level security;
drop policy if exists "fp: equipe vê"    on public.fornecedor_produtos;
drop policy if exists "fp: equipe grava" on public.fornecedor_produtos;
create policy "fp: equipe vê"    on public.fornecedor_produtos for select using ( public.eh_equipe() );
create policy "fp: equipe grava" on public.fornecedor_produtos for all
  using ( public.eh_equipe() ) with check ( public.eh_equipe() );

grant select, insert, update, delete on public.fornecedor_produtos to authenticated;
