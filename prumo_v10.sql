-- =====================================================================
--  PRUMO · Add-on v10 — Portfólio por CATEGORIA (não só por fornecedor)
--   • O portfólio (PDF) do cliente pode ser da CATEGORIA, sem depender de
--     um fornecedor específico. Por isso o fornecedor vira opcional no
--     arquivo. Os PDFs marcados "no catálogo" já aparecem pro cliente.
--  Rode no Supabase → SQL Editor (depois dos anteriores). Idempotente.
-- =====================================================================

alter table public.fornecedor_arquivos alter column fornecedor_id drop not null;

-- =====================================================================
--  PRONTO. (portfolios_publicos e a RLS de equipe já cobrem os arquivos
--  de categoria — fornecedor_id nulo é permitido.)
-- =====================================================================
