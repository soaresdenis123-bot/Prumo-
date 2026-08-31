-- =====================================================================
--  PRUMO · Add-on v11 — Verbas por categoria (orçamento definido por parte)
--   • Cada obra pode ter uma VERBA por categoria (Fundação = X, Estrutura
--     = Y, Revestimentos = Z…). O que o cliente escolhe na personalização
--     é descontado da verba da categoria correspondente (saldo ao vivo).
--  Rode no Supabase → SQL Editor (depois dos anteriores). Idempotente.
-- =====================================================================

create table if not exists public.obra_verbas (
  id        uuid primary key default gen_random_uuid(),
  obra_id   uuid not null references public.obras(id) on delete cascade,
  categoria text not null,
  valor     numeric not null default 0,
  criado_em timestamptz not null default now(),
  unique (obra_id, categoria)
);
create index if not exists idx_obra_verbas_obra on public.obra_verbas(obra_id);

alter table public.obra_verbas enable row level security;
drop policy if exists "verbas: equipe da obra vê"    on public.obra_verbas;
drop policy if exists "verbas: equipe da obra grava" on public.obra_verbas;
create policy "verbas: equipe da obra vê"
  on public.obra_verbas for select using ( public.pode_gerenciar_obra(obra_id) );
create policy "verbas: equipe da obra grava"
  on public.obra_verbas for all
  using ( public.pode_gerenciar_obra(obra_id) )
  with check ( public.pode_gerenciar_obra(obra_id) );
grant select, insert, update, delete on public.obra_verbas to authenticated;

-- =====================================================================
--  PRONTO. O consumo (o que o cliente escolheu por categoria) é somado
--  no app a partir de obra_selecoes; a verba menos o consumo = saldo.
-- =====================================================================
