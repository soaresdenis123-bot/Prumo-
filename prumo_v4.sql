-- =====================================================================
--  PRUMO · Add-on v4 — meta de custo por obra
--  Rode no Supabase → SQL Editor. Idempotente.
--
--  Orçado  = preço fechado com o cliente (receita).
--  Meta    = quanto a MS planeja GASTAR na obra (custo alvo).
--  Custo   = o que já foi lançado (realizado).
--  A aba Custos compara realizado × meta, e a margem = orçado − custo.
-- =====================================================================

alter table public.obra_financeiro
  add column if not exists meta_custo numeric not null default 0;
