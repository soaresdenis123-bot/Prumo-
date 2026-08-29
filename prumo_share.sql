-- =====================================================================
--  PRUMO · Add-on: LINK PÚBLICO DA OBRA (acesso do cliente sem senha)
--  Rode DEPOIS do prumo_schema.sql, no Supabase → SQL Editor.
--
--  Cria um token único por obra. Com ele, o cliente abre uma página
--  só da obra dele (evolução + fotos), SEM login e SEM custos.
--  Seguro rodar mais de uma vez.
-- =====================================================================

-- 1. token único por obra (gerado automático)
alter table public.obras add column if not exists share_token text;
update public.obras
  set share_token = encode(gen_random_bytes(16),'hex')
  where share_token is null;
alter table public.obras
  alter column share_token set default encode(gen_random_bytes(16),'hex');
create unique index if not exists idx_obras_share on public.obras(share_token);

-- 2. a obra está compartilhada? (usada pela política de fotos do link)
create or replace function public.obra_compartilhada(o_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.obras where id = o_id and share_token is not null)
$$;

-- 3. RPC pública: devolve os dados da obra pelo token — SEM custos/orçado.
--    Chamável por 'anon' (sem login).
create or replace function public.obra_publica(p_token text)
returns json language sql stable security definer set search_path = public
as $$
  select case when o.id is null then null else json_build_object(
    'nome',     o.nome,
    'cidade',   o.cidade,
    'endereco', o.endereco,
    'padrao',   o.padrao,
    'area_m2',  o.area_m2,
    'previsao', o.previsao,
    'etapas', coalesce((
      select json_agg(json_build_object(
        'id', e.id, 'ordem', e.ordem, 'nome', e.nome, 'status', e.status, 'pct', e.pct
      ) order by e.ordem)
      from public.etapas e where e.obra_id = o.id), '[]'::json),
    'fotos', coalesce((
      select json_agg(json_build_object('etapa_id', f.etapa_id, 'path', f.storage_path))
      from public.etapa_fotos f where f.obra_id = o.id), '[]'::json)
  ) end
  from (select * from public.obras where share_token = p_token limit 1) o
$$;

grant execute on function public.obra_publica(text)      to anon, authenticated;
grant execute on function public.obra_compartilhada(uuid) to anon, authenticated;

-- 4. Storage: deixa o 'anon' ler as FOTOS de obras compartilhadas
--    (só pra assinar a URL da imagem no link do cliente; custos nunca passam por aqui).
drop policy if exists "storage fotos: link publico" on storage.objects;
create policy "storage fotos: link publico"
  on storage.objects for select using (
    bucket_id = 'obra-fotos'
    and public.obra_compartilhada( ((storage.foldername(name))[1])::uuid )
  );

-- Pronto. O link de cada obra é:  https://SEU-APP/o/<share_token>
-- (o app mostra e copia esse link pra você na tela da obra).
