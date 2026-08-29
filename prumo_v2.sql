-- =====================================================================
--  PRUMO · Add-on v2 — anexos por etapa (documentos além de fotos)
--  Rode no Supabase → SQL Editor (depois do schema e do share). Idempotente.
-- =====================================================================

-- A tabela etapa_fotos passa a guardar também documentos (PDF, ART, projeto…).
alter table public.etapa_fotos add column if not exists tipo text not null default 'foto'
  check (tipo in ('foto','doc'));
alter table public.etapa_fotos add column if not exists nome text;

-- (As políticas de RLS e o storage já cobrem estes registros — nada mais a fazer.)
