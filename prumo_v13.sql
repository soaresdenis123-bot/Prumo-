-- =====================================================================
--  PRUMO · v13 — "Monte sua casa": captação de leads (página pública)
--  Cliente sem login escolhe um modelo e deixa o contato. Salva aqui,
--  a equipe vê no Prumo. Nenhum custo/fornecedor envolvido.
--  Idempotente.
-- =====================================================================
create table if not exists public.leads_projeto (
  id         uuid primary key default gen_random_uuid(),
  nome       text,
  contato    text,
  cidade     text,
  tipo       text,   -- terrea | sobrado
  padrao     text,   -- medio | alto
  telhado    text,   -- aparente | platibanda
  modelo     text,   -- nome do modelo escolhido
  obs        text,
  status     text not null default 'novo' check (status in ('novo','contatado','arquivado')),
  criado_em  timestamptz not null default now()
);
create index if not exists idx_leads_projeto_criado on public.leads_projeto(criado_em desc);

alter table public.leads_projeto enable row level security;
drop policy if exists "leads: equipe vê"       on public.leads_projeto;
drop policy if exists "leads: equipe gerencia"  on public.leads_projeto;
create policy "leads: equipe vê"
  on public.leads_projeto for select using ( public.eh_equipe() );
create policy "leads: equipe gerencia"
  on public.leads_projeto for update using ( public.eh_equipe() ) with check ( public.eh_equipe() );
grant select, update on public.leads_projeto to authenticated;

-- RPC pública: cliente sem login grava o lead (SECURITY DEFINER passa pela RLS)
create or replace function public.salvar_lead_projeto(p json)
returns uuid language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.leads_projeto (nome, contato, cidade, tipo, padrao, telhado, modelo, obs)
  values (nullif(p->>'nome',''), nullif(p->>'contato',''), nullif(p->>'cidade',''),
          nullif(p->>'tipo',''), nullif(p->>'padrao',''), nullif(p->>'telhado',''),
          nullif(p->>'modelo',''), nullif(p->>'obs',''))
  returning id into v_id;
  return v_id;
end $$;
grant execute on function public.salvar_lead_projeto(json) to anon, authenticated;
