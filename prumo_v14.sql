-- =====================================================================
--  PRUMO · v14 — Clientes/Leads: virar cliente + excluir
--  Idempotente.
-- =====================================================================
-- marca se o lead já virou cliente (aba Clientes vs Leads)
alter table public.leads_projeto add column if not exists cliente boolean not null default false;

-- permitir a equipe EXCLUIR registros (antes só lia e atualizava)
drop policy if exists "leads: equipe exclui" on public.leads_projeto;
create policy "leads: equipe exclui"
  on public.leads_projeto for delete using ( public.eh_equipe() );
grant delete on public.leads_projeto to authenticated;
