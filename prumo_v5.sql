-- =====================================================================
--  PRUMO · Add-on v5
--   • Papel "execucao" — conta de campo (obras@ms) que só atualiza
--     etapas e fotos. Sem financeiro, custos, calculadora, orçamentos.
--   • Campo "pavimentos" na obra (1 = térrea, 2 = sobrado) — usado
--     na casa progressiva do cliente.
--  Rode no Supabase → SQL Editor. Idempotente.
-- =====================================================================

-- 1. novo papel
alter table public.profiles drop constraint if exists profiles_papel_check;
alter table public.profiles add constraint profiles_papel_check
  check (papel in ('admin','gestor','cliente','execucao'));

-- 2. pavimentos na obra
alter table public.obras add column if not exists pavimentos int not null default 1
  check (pavimentos in (1,2));

-- 3. quem pode VER a obra? (+ execucao vê todas)
create or replace function public.pode_ver_obra(o_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.obras o
    where o.id = o_id
      and (
        public.papel_atual() = 'admin'
        or (public.papel_atual() = 'gestor' and o.gestor_id = auth.uid())
        or public.papel_atual() = 'execucao'
        or lower(o.cliente_email) = lower(auth.email())
      )
  )
$$;

-- 4. quem pode EDITAR execução (etapas/fotos)? equipe da obra OU execucao
create or replace function public.pode_editar_exec(o_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.pode_gerenciar_obra(o_id) or public.papel_atual() = 'execucao'
$$;

-- 5. obras: execucao enxerga na listagem
drop policy if exists "obras: ver conforme papel" on public.obras;
create policy "obras: ver conforme papel"
  on public.obras for select using (
    public.papel_atual() = 'admin'
    or (public.papel_atual() = 'gestor' and gestor_id = auth.uid())
    or public.papel_atual() = 'execucao'
    or lower(cliente_email) = lower(auth.email())
  );

-- 6. etapas: execucao pode editar
drop policy if exists "etapas: equipe da obra edita" on public.etapas;
create policy "etapas: edita (equipe ou execução)"
  on public.etapas for all
  using ( public.pode_editar_exec(obra_id) )
  with check ( public.pode_editar_exec(obra_id) );

-- 7. fotos/anexos: execucao pode gravar
drop policy if exists "fotos: equipe da obra grava" on public.etapa_fotos;
create policy "fotos: grava (equipe ou execução)"
  on public.etapa_fotos for all
  using ( public.pode_editar_exec(obra_id) )
  with check ( public.pode_editar_exec(obra_id) );

-- 8. storage: execucao pode enviar/mexer fotos
drop policy if exists "storage fotos: enviar" on storage.objects;
drop policy if exists "storage fotos: mexer"  on storage.objects;
drop policy if exists "storage fotos: apagar" on storage.objects;
create policy "storage fotos: enviar"
  on storage.objects for insert with check (
    bucket_id = 'obra-fotos' and public.pode_editar_exec( ((storage.foldername(name))[1])::uuid ) );
create policy "storage fotos: mexer"
  on storage.objects for update using (
    bucket_id = 'obra-fotos' and public.pode_editar_exec( ((storage.foldername(name))[1])::uuid ) );
create policy "storage fotos: apagar"
  on storage.objects for delete using (
    bucket_id = 'obra-fotos' and public.pode_editar_exec( ((storage.foldername(name))[1])::uuid ) );

-- 9. link público passa a incluir os pavimentos (para a casa progressiva)
create or replace function public.obra_publica(p_token text)
returns json language sql stable security definer set search_path = public
as $$
  select case when o.id is null then null else json_build_object(
    'nome',     o.nome,
    'cidade',   o.cidade,
    'endereco', o.endereco,
    'padrao',   o.padrao,
    'area_m2',  o.area_m2,
    'pavimentos', o.pavimentos,
    'previsao', o.previsao,
    'etapas', coalesce((
      select json_agg(json_build_object(
        'id', e.id, 'ordem', e.ordem, 'nome', e.nome, 'status', e.status, 'pct', e.pct
      ) order by e.ordem)
      from public.etapas e where e.obra_id = o.id), '[]'::json),
    'fotos', coalesce((
      select json_agg(json_build_object('etapa_id', f.etapa_id, 'path', f.storage_path))
      from public.etapa_fotos f where f.obra_id = o.id and f.tipo <> 'doc'), '[]'::json)
  ) end
  from (select * from public.obras where share_token = p_token limit 1) o
$$;

-- Pronto. Para criar a conta de campo:
--   1) a pessoa se cadastra no app (obras@seudominio) — entra como 'cliente';
--   2) você roda:  update public.profiles set papel='execucao' where email='obras@...';
