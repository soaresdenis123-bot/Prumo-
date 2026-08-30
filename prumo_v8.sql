-- =====================================================================
--  PRUMO · Add-on v8
--   • Fornecedor tem TIPO: material ou mão de obra (serviço).
--   • Portfólio em PDF por fornecedor (arquivos internos).
--   • Cada ETAPA da obra pode ter um EXECUTOR (mão de obra/fornecedor).
--   • Módulo TIME: times (operação/administrativo) e tarefas alocadas.
--  Rode no Supabase → SQL Editor (depois dos anteriores). Idempotente.
-- =====================================================================

-- 1. Fornecedor: tipo (material / mão de obra)
alter table public.fornecedores add column if not exists tipo text not null default 'material'
  check (tipo in ('material','mao_obra','servico'));

-- 2. Arquivos (PDF de portfólio) por fornecedor — internos
create table if not exists public.fornecedor_arquivos (
  id            uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references public.fornecedores(id) on delete cascade,
  nome          text,
  path          text not null,          -- caminho no bucket 'portfolios'
  criado_em     timestamptz not null default now()
);
create index if not exists idx_forn_arq on public.fornecedor_arquivos(fornecedor_id);
alter table public.fornecedor_arquivos enable row level security;
drop policy if exists "forn_arq: equipe vê"    on public.fornecedor_arquivos;
drop policy if exists "forn_arq: equipe grava" on public.fornecedor_arquivos;
create policy "forn_arq: equipe vê"    on public.fornecedor_arquivos for select using ( public.eh_equipe() );
create policy "forn_arq: equipe grava" on public.fornecedor_arquivos for all using ( public.eh_equipe() ) with check ( public.eh_equipe() );
grant select, insert, update, delete on public.fornecedor_arquivos to authenticated;

-- bucket privado dos portfólios (só equipe, via URL assinada)
insert into storage.buckets (id, name, public) values ('portfolios','portfolios', false)
  on conflict (id) do nothing;
drop policy if exists "portfolios: equipe vê"    on storage.objects;
drop policy if exists "portfolios: equipe grava" on storage.objects;
drop policy if exists "portfolios: equipe mexe"  on storage.objects;
drop policy if exists "portfolios: equipe apaga" on storage.objects;
create policy "portfolios: equipe vê"    on storage.objects for select using ( bucket_id='portfolios' and public.eh_equipe() );
create policy "portfolios: equipe grava" on storage.objects for insert with check ( bucket_id='portfolios' and public.eh_equipe() );
create policy "portfolios: equipe mexe"  on storage.objects for update using ( bucket_id='portfolios' and public.eh_equipe() );
create policy "portfolios: equipe apaga" on storage.objects for delete using ( bucket_id='portfolios' and public.eh_equipe() );

-- 3. Executor da etapa (quem está tocando aquela fase)
alter table public.etapas add column if not exists executor_id uuid
  references public.fornecedores(id) on delete set null;

-- 4. Módulo TIME — times e tarefas (por enquanto só alocação)
create table if not exists public.times (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  tipo      text not null default 'operacao' check (tipo in ('operacao','administrativo')),
  cor       text,
  criado_em timestamptz not null default now()
);
alter table public.times enable row level security;
drop policy if exists "times: equipe vê"    on public.times;
drop policy if exists "times: equipe grava" on public.times;
create policy "times: equipe vê"    on public.times for select using ( public.eh_equipe() );
create policy "times: equipe grava" on public.times for all using ( public.eh_equipe() ) with check ( public.eh_equipe() );
grant select, insert, update, delete on public.times to authenticated;

create table if not exists public.tarefas (
  id          uuid primary key default gen_random_uuid(),
  time_id     uuid references public.times(id) on delete set null,
  obra_id     uuid references public.obras(id) on delete set null,
  titulo      text not null,
  descricao   text,
  responsavel text,
  prazo       date,
  status      text not null default 'a_fazer' check (status in ('a_fazer','fazendo','feito')),
  criado_em   timestamptz not null default now()
);
create index if not exists idx_tarefas_time on public.tarefas(time_id);
create index if not exists idx_tarefas_obra on public.tarefas(obra_id);
alter table public.tarefas enable row level security;
drop policy if exists "tarefas: equipe vê"    on public.tarefas;
drop policy if exists "tarefas: equipe grava" on public.tarefas;
create policy "tarefas: equipe vê"    on public.tarefas for select using ( public.eh_equipe() );
create policy "tarefas: equipe grava" on public.tarefas for all using ( public.eh_equipe() ) with check ( public.eh_equipe() );
grant select, insert, update, delete on public.tarefas to authenticated;

-- =====================================================================
--  PRONTO. (Executor da etapa aparece no painel da obra; times e
--  tarefas são internos — cliente e execução não têm acesso.)
-- =====================================================================
