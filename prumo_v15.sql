-- =====================================================================
--  PRUMO · v15 — liga o orçamento ao lead (para aprovar = virar cliente)
--  Idempotente.
-- =====================================================================
alter table public.orcamentos add column if not exists lead_id uuid references public.leads_projeto(id) on delete set null;
