-- =====================================================================
--  PRUMO · SETUP COMPLETO (rode este arquivo inteiro, de uma vez)
--  Contém schema + todos os add-ons na ordem certa. É idempotente:
--  seguro rodar mesmo que partes já existam no seu banco.
-- =====================================================================

-- ############  prumo_schema.sql  ############
-- =====================================================================
--  PRUMO · Fundação do banco de dados (Supabase / PostgreSQL)
--  by Grupo MS · Construções Inteligentes
--
--  O que este arquivo cria:
--   • Tabelas do produto (obras, etapas, fotos, custos, orçamentos…)
--   • Papéis de acesso: admin · gestor · cliente
--   • RLS (Row Level Security) — a regra de ouro: o CLIENTE vê só a
--     obra dele e NUNCA custo/margem/orçado. Garantido no banco.
--   • Storage de fotos por obra (bucket privado + políticas)
--   • Gatilhos: cria as 14 etapas sozinho ao cadastrar a obra,
--     e cria o perfil automaticamente quando alguém se cadastra.
--
--  Como usar: cole tudo no  Supabase → SQL Editor → Run.
--  É seguro rodar mais de uma vez (usa IF NOT EXISTS / OR REPLACE).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensões
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- 1. PROFILES  (estende auth.users com o papel de acesso)
--    Papéis:  'admin'  = vê tudo (dono/sócios)
--             'gestor' = vê só as obras ligadas a ele
--             'cliente'= vê só a própria obra, sem custos
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text,
  email      text,
  papel      text not null default 'cliente'
             check (papel in ('admin','gestor','cliente')),
  criado_em  timestamptz not null default now()
);

comment on table public.profiles is 'Perfil + papel de acesso de cada usuário.';

-- ---------------------------------------------------------------------
-- 2. OBRAS  (somente dados NÃO sensíveis — seguro o cliente ver)
--    O valor de contrato/custos vive em tabelas separadas (item 3 e 7),
--    que o cliente não tem permissão nenhuma de ler.
-- ---------------------------------------------------------------------
create table if not exists public.obras (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  cliente_nome   text,
  cliente_email  text,                       -- é por aqui que o cliente é ligado à obra
  cliente_tel    text,
  endereco       text,
  cidade         text,
  padrao         text check (padrao in ('Popular','Médio','Alto')),
  area_m2        numeric,
  inicio         date,
  previsao       date,
  gestor_id      uuid references public.profiles(id) on delete set null,
  status         text not null default 'ativa'
                 check (status in ('ativa','pausada','concluida')),
  criado_por     uuid references public.profiles(id) on delete set null,
  criado_em      timestamptz not null default now()
);
create index if not exists idx_obras_cliente_email on public.obras (lower(cliente_email));
create index if not exists idx_obras_gestor        on public.obras (gestor_id);

comment on column public.obras.cliente_email is 'E-mail de acesso do cliente — casa com auth.email() no login.';

-- ---------------------------------------------------------------------
-- 3. OBRA_FINANCEIRO  (valor de contrato — INTERNO, separado de propósito)
--    Fica em tabela própria justamente pra o cliente nunca alcançar.
-- ---------------------------------------------------------------------
create table if not exists public.obra_financeiro (
  obra_id    uuid primary key references public.obras(id) on delete cascade,
  orcado     numeric not null default 0,     -- valor do contrato com o cliente
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. ETAPAS  (as 14 fases do steel frame — criadas por gatilho)
-- ---------------------------------------------------------------------
create table if not exists public.etapas (
  id          uuid primary key default gen_random_uuid(),
  obra_id     uuid not null references public.obras(id) on delete cascade,
  ordem       int  not null,
  nome        text not null,
  status      text not null default 'pendente'
              check (status in ('pendente','andamento','concluida')),
  pct         int  not null default 0 check (pct between 0 and 100),
  obs         text,
  inicio      date,
  fim         date,
  atualizado_em timestamptz not null default now(),
  unique (obra_id, ordem)
);
create index if not exists idx_etapas_obra on public.etapas (obra_id);

-- ---------------------------------------------------------------------
-- 5. ETAPA_FOTOS  (fotos de cada etapa; o arquivo vive no Storage)
--    obra_id é guardado aqui também pra a RLS ser simples e rápida.
-- ---------------------------------------------------------------------
create table if not exists public.etapa_fotos (
  id            uuid primary key default gen_random_uuid(),
  etapa_id      uuid not null references public.etapas(id) on delete cascade,
  obra_id       uuid not null references public.obras(id) on delete cascade,
  storage_path  text not null,               -- caminho no bucket 'obra-fotos'
  legenda       text,
  criado_por    uuid references public.profiles(id) on delete set null,
  criado_em     timestamptz not null default now()
);
create index if not exists idx_fotos_etapa on public.etapa_fotos (etapa_id);
create index if not exists idx_fotos_obra  on public.etapa_fotos (obra_id);

-- ---------------------------------------------------------------------
-- 6. FORNECEDORES  (interno)
-- ---------------------------------------------------------------------
create table if not exists public.fornecedores (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  fornece   text,
  contato   text,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7. CUSTO_ITENS  (mão de obra / material / fornecedor — INTERNO)
-- ---------------------------------------------------------------------
create table if not exists public.custo_itens (
  id            uuid primary key default gen_random_uuid(),
  obra_id       uuid not null references public.obras(id) on delete cascade,
  categoria     text not null check (categoria in ('mao_obra','material','fornecedor')),
  etapa_nome    text,
  descricao     text,
  valor         numeric not null default 0,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  criado_em     timestamptz not null default now()
);
create index if not exists idx_custo_obra on public.custo_itens (obra_id);

-- ---------------------------------------------------------------------
-- 8. ORÇAMENTOS  (propostas pro cliente — INTERNO até virar contrato)
-- ---------------------------------------------------------------------
create table if not exists public.orcamentos (
  id            uuid primary key default gen_random_uuid(),
  obra_id       uuid references public.obras(id) on delete set null,
  numero        text,
  cliente_nome  text,
  descricao     text,
  cidade        text,
  validade_dias int default 15,
  total         numeric not null default 0,
  status        text not null default 'rascunho'
                check (status in ('rascunho','enviado','aprovado','recusado')),
  criado_por    uuid references public.profiles(id) on delete set null,
  criado_em     timestamptz not null default now()
);

create table if not exists public.orcamento_itens (
  id            uuid primary key default gen_random_uuid(),
  orcamento_id  uuid not null references public.orcamentos(id) on delete cascade,
  categoria     text,
  item          text,
  qtd           numeric not null default 1,
  unidade       text default 'un',
  valor_unit    numeric not null default 0
);
create index if not exists idx_orc_itens on public.orcamento_itens (orcamento_id);

-- =====================================================================
--  FUNÇÕES AUXILIARES
--  SECURITY DEFINER = rodam como dono do banco, então elas leem as
--  tabelas sem disparar RLS (evita recursão infinita nas políticas).
-- =====================================================================

-- Papel do usuário logado
create or replace function public.papel_atual()
returns text
language sql stable security definer set search_path = public
as $$
  select papel from public.profiles where id = auth.uid()
$$;

-- Pode VER a obra? (admin, ou gestor da obra, ou o cliente daquela obra)
create or replace function public.pode_ver_obra(o_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.obras o
    where o.id = o_id
      and (
        public.papel_atual() = 'admin'
        or (public.papel_atual() = 'gestor' and o.gestor_id = auth.uid())
        or lower(o.cliente_email) = lower(auth.email())
      )
  )
$$;

-- Pode GERENCIAR a obra? (só equipe: admin ou gestor da obra — nunca cliente)
create or replace function public.pode_gerenciar_obra(o_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.obras o
    where o.id = o_id
      and (
        public.papel_atual() = 'admin'
        or (public.papel_atual() = 'gestor' and o.gestor_id = auth.uid())
      )
  )
$$;

-- É equipe interna? (admin ou gestor)
create or replace function public.eh_equipe()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.papel_atual() in ('admin','gestor')
$$;

-- ---- Gatilho: cria perfil automático quando alguém se cadastra --------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)),
    new.email,
    'cliente'                       -- todo mundo entra como cliente; você promove p/ admin/gestor
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- Gatilho: cria as 14 etapas automaticamente ao inserir a obra -----
create or replace function public.seed_etapas()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.etapas (obra_id, ordem, nome)
  values
    (new.id, 1,'Projeto Arquitetônico'),
    (new.id, 2,'Projeto Estrutural + ART'),
    (new.id, 3,'Aprovação / Licenças'),
    (new.id, 4,'Terraplanagem / Fundação'),
    (new.id, 5,'Laje (terceirizada)'),
    (new.id, 6,'Estrutura Steel Frame'),
    (new.id, 7,'Fechamento / Paredes'),
    (new.id, 8,'Cobertura / Telhado'),
    (new.id, 9,'Instalações Elétricas'),
    (new.id,10,'Instalações Hidráulicas'),
    (new.id,11,'Acabamentos Internos'),
    (new.id,12,'Acabamentos Externos / Fachada'),
    (new.id,13,'Paisagismo / Jardinagem'),
    (new.id,14,'Limpeza / Entrega da Chave');
  -- cria a linha de financeiro (orçado 0 até você preencher)
  insert into public.obra_financeiro (obra_id) values (new.id)
    on conflict (obra_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_obra_created on public.obras;
create trigger on_obra_created
  after insert on public.obras
  for each row execute function public.seed_etapas();

-- ---- Gatilho: mantém atualizado_em das etapas -------------------------
create or replace function public.touch_updated()
returns trigger language plpgsql as $$
begin new.atualizado_em = now(); return new; end;
$$;

drop trigger if exists trg_etapas_touch on public.etapas;
create trigger trg_etapas_touch
  before update on public.etapas
  for each row execute function public.touch_updated();

-- =====================================================================
--  RLS · LIGAR EM TODAS AS TABELAS
-- =====================================================================
alter table public.profiles         enable row level security;
alter table public.obras            enable row level security;
alter table public.obra_financeiro  enable row level security;
alter table public.etapas           enable row level security;
alter table public.etapa_fotos      enable row level security;
alter table public.fornecedores     enable row level security;
alter table public.custo_itens      enable row level security;
alter table public.orcamentos       enable row level security;
alter table public.orcamento_itens  enable row level security;

-- Limpa políticas antigas (re-execução segura)
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname='public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ---------------- PROFILES ----------------
create policy "profiles: ver o próprio ou admin vê todos"
  on public.profiles for select using (
    id = auth.uid() or public.papel_atual() = 'admin'
  );
create policy "profiles: editar o próprio"
  on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: admin edita qualquer um"
  on public.profiles for update using (public.papel_atual() = 'admin');

-- ---------------- OBRAS ----------------
create policy "obras: ver conforme papel"
  on public.obras for select using (
    public.papel_atual() = 'admin'
    or (public.papel_atual() = 'gestor' and gestor_id = auth.uid())
    or lower(cliente_email) = lower(auth.email())     -- cliente vê a própria
  );
create policy "obras: equipe cria"
  on public.obras for insert with check ( public.eh_equipe() );
create policy "obras: equipe da obra edita"
  on public.obras for update using ( public.pode_gerenciar_obra(id) );
create policy "obras: só admin apaga"
  on public.obras for delete using ( public.papel_atual() = 'admin' );

-- ---------------- OBRA_FINANCEIRO (só equipe — cliente NÃO tem política) ----------------
create policy "financeiro: equipe da obra vê"
  on public.obra_financeiro for select using ( public.pode_gerenciar_obra(obra_id) );
create policy "financeiro: equipe da obra grava"
  on public.obra_financeiro for all
  using ( public.pode_gerenciar_obra(obra_id) )
  with check ( public.pode_gerenciar_obra(obra_id) );

-- ---------------- ETAPAS (cliente vê; só equipe edita) ----------------
create policy "etapas: quem vê a obra vê as etapas"
  on public.etapas for select using ( public.pode_ver_obra(obra_id) );
create policy "etapas: equipe da obra edita"
  on public.etapas for all
  using ( public.pode_gerenciar_obra(obra_id) )
  with check ( public.pode_gerenciar_obra(obra_id) );

-- ---------------- ETAPA_FOTOS (cliente vê; só equipe adiciona) ----------------
create policy "fotos: quem vê a obra vê as fotos"
  on public.etapa_fotos for select using ( public.pode_ver_obra(obra_id) );
create policy "fotos: equipe da obra grava"
  on public.etapa_fotos for all
  using ( public.pode_gerenciar_obra(obra_id) )
  with check ( public.pode_gerenciar_obra(obra_id) );

-- ---------------- CUSTO_ITENS (100% interno) ----------------
create policy "custos: equipe da obra vê"
  on public.custo_itens for select using ( public.pode_gerenciar_obra(obra_id) );
create policy "custos: equipe da obra grava"
  on public.custo_itens for all
  using ( public.pode_gerenciar_obra(obra_id) )
  with check ( public.pode_gerenciar_obra(obra_id) );

-- ---------------- FORNECEDORES (interno) ----------------
create policy "fornecedores: equipe vê"
  on public.fornecedores for select using ( public.eh_equipe() );
create policy "fornecedores: equipe grava"
  on public.fornecedores for all
  using ( public.eh_equipe() ) with check ( public.eh_equipe() );

-- ---------------- ORÇAMENTOS (interno) ----------------
create policy "orcamentos: equipe vê"
  on public.orcamentos for select using ( public.eh_equipe() );
create policy "orcamentos: equipe grava"
  on public.orcamentos for all
  using ( public.eh_equipe() ) with check ( public.eh_equipe() );

create policy "orcamento_itens: equipe vê"
  on public.orcamento_itens for select using ( public.eh_equipe() );
create policy "orcamento_itens: equipe grava"
  on public.orcamento_itens for all
  using ( public.eh_equipe() ) with check ( public.eh_equipe() );

-- =====================================================================
--  PRIVILÉGIOS (o PostgREST filtra por RLS depois disto)
--  Só 'authenticated' recebe acesso. 'anon' (sem login) não toca nada.
-- =====================================================================
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- =====================================================================
--  STORAGE · bucket privado de fotos + políticas
--  Convenção de caminho:  obra-fotos/<obra_id>/<etapa_id>/<arquivo>
--  A 1ª pasta do caminho é o obra_id — é isso que a RLS confere.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('obra-fotos','obra-fotos', false)
on conflict (id) do nothing;

-- limpa políticas de storage antigas deste bucket
drop policy if exists "storage fotos: ver"    on storage.objects;
drop policy if exists "storage fotos: enviar" on storage.objects;
drop policy if exists "storage fotos: mexer"  on storage.objects;
drop policy if exists "storage fotos: apagar" on storage.objects;

create policy "storage fotos: ver"
  on storage.objects for select using (
    bucket_id = 'obra-fotos'
    and public.pode_ver_obra( ((storage.foldername(name))[1])::uuid )
  );
create policy "storage fotos: enviar"
  on storage.objects for insert with check (
    bucket_id = 'obra-fotos'
    and public.pode_gerenciar_obra( ((storage.foldername(name))[1])::uuid )
  );
create policy "storage fotos: mexer"
  on storage.objects for update using (
    bucket_id = 'obra-fotos'
    and public.pode_gerenciar_obra( ((storage.foldername(name))[1])::uuid )
  );
create policy "storage fotos: apagar"
  on storage.objects for delete using (
    bucket_id = 'obra-fotos'
    and public.pode_gerenciar_obra( ((storage.foldername(name))[1])::uuid )
  );

-- =====================================================================
--  PRONTO.
--  Próximo passo humano (uma vez): depois de você fazer login no app,
--  vire administrador rodando —
--      update public.profiles set papel = 'admin'
--      where email = 'SEU-EMAIL-AQUI';
--  Veja o guia SETUP para o passo a passo completo.
-- =====================================================================


-- ############  prumo_share.sql  ############
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


-- ############  prumo_v2.sql  ############
-- =====================================================================
--  PRUMO · Add-on v2 — anexos por etapa (documentos além de fotos)
--  Rode no Supabase → SQL Editor (depois do schema e do share). Idempotente.
-- =====================================================================

-- A tabela etapa_fotos passa a guardar também documentos (PDF, ART, projeto…).
alter table public.etapa_fotos add column if not exists tipo text not null default 'foto'
  check (tipo in ('foto','doc'));
alter table public.etapa_fotos add column if not exists nome text;

-- (As políticas de RLS e o storage já cobrem estes registros — nada mais a fazer.)


-- ############  prumo_v3.sql  ############
-- =====================================================================
--  PRUMO · Add-on v3
--   • quantidade + valor unitário nos itens de custo
--   • catálogo de produtos por fornecedor (com preço)
--  Rode no Supabase → SQL Editor (depois dos anteriores). Idempotente.
-- =====================================================================

-- 1. Custos com quantidade e valor unitário
--    'valor' continua sendo o TOTAL da linha (o financeiro soma ele).
alter table public.custo_itens add column if not exists quantidade numeric not null default 1;
alter table public.custo_itens add column if not exists valor_unit numeric;

-- 2. Catálogo de produtos de cada fornecedor
create table if not exists public.fornecedor_produtos (
  id            uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references public.fornecedores(id) on delete cascade,
  produto       text not null,
  unidade       text default 'un',
  valor         numeric not null default 0,
  criado_em     timestamptz not null default now()
);
create index if not exists idx_fp_forn on public.fornecedor_produtos(fornecedor_id);

alter table public.fornecedor_produtos enable row level security;
drop policy if exists "fp: equipe vê"    on public.fornecedor_produtos;
drop policy if exists "fp: equipe grava" on public.fornecedor_produtos;
create policy "fp: equipe vê"    on public.fornecedor_produtos for select using ( public.eh_equipe() );
create policy "fp: equipe grava" on public.fornecedor_produtos for all
  using ( public.eh_equipe() ) with check ( public.eh_equipe() );

grant select, insert, update, delete on public.fornecedor_produtos to authenticated;


-- ############  prumo_v4.sql  ############
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


-- ############  prumo_v5.sql  ############
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



-- =====================================================================
--  PRUMO · Add-on v6
--   • Fornecedores classificados por CATEGORIA (esquadrias, tintas,
--     parafusos, cimento…) — antes de abrir cada fornecedor.
--   • Custos com STATUS (pendente / pago) e GRUPO (categoria fina vinda
--     do orçamento), para o check no Financeiro e o overview na obra.
--   • Aba PRODUTOS por obra, ligada à etapa (item · quantidade · pedir).
--  Rode no Supabase → SQL Editor (depois dos anteriores). Idempotente.
-- =====================================================================

-- 1. Fornecedor: categoria
alter table public.fornecedores add column if not exists categoria text;

-- 2. Custos: status pendente/pago, grupo (categoria fina) e vínculo à etapa
alter table public.custo_itens add column if not exists status text not null default 'pendente'
  check (status in ('pendente','pago'));
alter table public.custo_itens add column if not exists grupo text;
alter table public.custo_itens add column if not exists etapa_id uuid
  references public.etapas(id) on delete set null;

-- 3. Produtos da obra (lista de compras por fase, ligada à etapa)
create table if not exists public.obra_produtos (
  id          uuid primary key default gen_random_uuid(),
  obra_id     uuid not null references public.obras(id) on delete cascade,
  etapa_id    uuid references public.etapas(id) on delete set null,
  item        text not null,
  unidade     text default 'un',
  quantidade  numeric not null default 1,
  status      text not null default 'a_comprar'
              check (status in ('a_comprar','pedido','recebido')),
  pedir       boolean not null default false,   -- "pedir mais"
  obs         text,
  criado_em   timestamptz not null default now()
);
create index if not exists idx_obra_produtos_obra  on public.obra_produtos(obra_id);
create index if not exists idx_obra_produtos_etapa on public.obra_produtos(etapa_id);

alter table public.obra_produtos enable row level security;
drop policy if exists "obra_produtos: equipe da obra vê"    on public.obra_produtos;
drop policy if exists "obra_produtos: equipe da obra grava" on public.obra_produtos;
create policy "obra_produtos: equipe da obra vê"
  on public.obra_produtos for select using ( public.pode_gerenciar_obra(obra_id) );
create policy "obra_produtos: equipe da obra grava"
  on public.obra_produtos for all
  using ( public.pode_gerenciar_obra(obra_id) )
  with check ( public.pode_gerenciar_obra(obra_id) );

grant select, insert, update, delete on public.obra_produtos to authenticated;

-- =====================================================================
--  PRONTO. (Os custos continuam 100% internos — cliente e execução não
--  têm política de leitura sobre custo_itens nem obra_produtos.)
-- =====================================================================


-- =====================================================================


-- =====================================================================
--  PRUMO · Add-on v7 — Portfólio dos fornecedores + Personalização do cliente
--   • Cada produto do fornecedor pode virar item de PORTFÓLIO: imagem,
--     categoria (Elétrica, Revestimentos, Acabamentos, Jardinagem…),
--     preço de CLIENTE (com margem) e flag "mostrar no catálogo".
--   • O cliente navega o catálogo por CATEGORIA, sem NUNCA ver o
--     fornecedor (RPC SECURITY DEFINER esconde a origem).
--   • As escolhas do cliente viram uma lista de desejos na obra.
--  Rode no Supabase → SQL Editor (depois dos anteriores). Idempotente.
-- =====================================================================

-- 1. Produto do fornecedor ganha os campos de portfólio
alter table public.fornecedor_produtos add column if not exists categoria     text;
alter table public.fornecedor_produtos add column if not exists descricao     text;
alter table public.fornecedor_produtos add column if not exists imagem_path   text;
alter table public.fornecedor_produtos add column if not exists preco_cliente numeric;   -- preço de venda (com margem)
alter table public.fornecedor_produtos add column if not exists no_catalogo   boolean not null default false; -- aparece pro cliente?

-- 2. Bucket PÚBLICO só de imagens do catálogo (a foto não identifica o fornecedor)
insert into storage.buckets (id, name, public) values ('catalogo','catalogo', true)
  on conflict (id) do nothing;
drop policy if exists "catalogo: público lê"  on storage.objects;
drop policy if exists "catalogo: equipe grava" on storage.objects;
drop policy if exists "catalogo: equipe mexe"  on storage.objects;
drop policy if exists "catalogo: equipe apaga" on storage.objects;
create policy "catalogo: público lê"  on storage.objects for select using ( bucket_id='catalogo' );
create policy "catalogo: equipe grava" on storage.objects for insert with check ( bucket_id='catalogo' and public.eh_equipe() );
create policy "catalogo: equipe mexe"  on storage.objects for update using ( bucket_id='catalogo' and public.eh_equipe() );
create policy "catalogo: equipe apaga" on storage.objects for delete using ( bucket_id='catalogo' and public.eh_equipe() );

-- 3. Seleções do cliente (personalização) — lista de desejos por obra
create table if not exists public.obra_selecoes (
  id            uuid primary key default gen_random_uuid(),
  obra_id       uuid not null references public.obras(id) on delete cascade,
  produto_id    uuid references public.fornecedor_produtos(id) on delete set null,
  item          text not null,
  categoria     text,
  preco_cliente numeric not null default 0,
  quantidade    numeric not null default 1,
  ambiente      text,
  status        text not null default 'desejo' check (status in ('desejo','aprovado','recusado')),
  criado_em     timestamptz not null default now()
);
create index if not exists idx_selecoes_obra on public.obra_selecoes(obra_id);
-- marca que a escolha já foi somada ao orçado (evita contar duas vezes)
alter table public.obra_selecoes add column if not exists no_orcado boolean not null default false;

alter table public.obra_selecoes enable row level security;
drop policy if exists "selecoes: equipe da obra vê"    on public.obra_selecoes;
drop policy if exists "selecoes: equipe da obra grava" on public.obra_selecoes;
create policy "selecoes: equipe da obra vê"
  on public.obra_selecoes for select using ( public.pode_gerenciar_obra(obra_id) );
create policy "selecoes: equipe da obra grava"
  on public.obra_selecoes for all
  using ( public.pode_gerenciar_obra(obra_id) )
  with check ( public.pode_gerenciar_obra(obra_id) );
grant select, insert, update, delete on public.obra_selecoes to authenticated;

-- 4. RPC pública: catálogo por token, agrupável por categoria, SEM fornecedor
create or replace function public.catalogo_publico(p_token text)
returns json language sql stable security definer set search_path = public
as $$
  select case when not exists (select 1 from public.obras where share_token = p_token) then null
  else coalesce((
    select json_agg(json_build_object(
      'id',        fp.id,
      'item',      fp.produto,
      'descricao', fp.descricao,
      'categoria', coalesce(nullif(fp.categoria,''),'Outros'),
      'unidade',   fp.unidade,
      'preco',     coalesce(fp.preco_cliente, 0),
      'imagem',    fp.imagem_path              -- caminho no bucket público 'catalogo'
    ) order by fp.categoria, fp.produto)
    from public.fornecedor_produtos fp
    where fp.no_catalogo = true
  ), '[]'::json) end
$$;

-- 5. RPC pública: o que o cliente já escolheu (para reabrir e continuar)
create or replace function public.minhas_selecoes(p_token text)
returns json language sql stable security definer set search_path = public
as $$
  select coalesce((
    select json_agg(json_build_object(
      'produto_id', s.produto_id, 'item', s.item, 'categoria', s.categoria,
      'preco', s.preco_cliente, 'quantidade', s.quantidade, 'ambiente', s.ambiente))
    from public.obra_selecoes s
    join public.obras o on o.id = s.obra_id
    where o.share_token = p_token and s.status = 'desejo'
  ), '[]'::json)
$$;

-- 6. RPC pública: cliente salva/atualiza a lista de desejos (reenvia tudo)
create or replace function public.salvar_selecoes(p_token text, p_itens json)
returns int language plpgsql security definer set search_path = public
as $$
declare v_obra uuid; n int;
begin
  select id into v_obra from public.obras where share_token = p_token;
  if v_obra is null then return 0; end if;
  -- só mexe nos 'desejo' (aprovados pela equipe ficam intactos)
  delete from public.obra_selecoes where obra_id = v_obra and status = 'desejo';
  insert into public.obra_selecoes (obra_id, produto_id, item, categoria, preco_cliente, quantidade, ambiente)
  select v_obra,
    nullif(i->>'produto_id','')::uuid, i->>'item', i->>'categoria',
    coalesce((i->>'preco')::numeric,0), coalesce((i->>'quantidade')::numeric,1), i->>'ambiente'
  from json_array_elements(p_itens) as i
  where coalesce((i->>'quantidade')::numeric,0) > 0;
  get diagnostics n = row_count;
  return n;
end $$;

-- 7. Privilégios para o cliente sem login (anon)
grant usage on schema public to anon;
grant execute on function public.catalogo_publico(text) to anon, authenticated;
grant execute on function public.minhas_selecoes(text) to anon, authenticated;
grant execute on function public.salvar_selecoes(text, json) to anon, authenticated;

-- =====================================================================
--  PRONTO. O cliente vê preço de cliente (com margem) e categoria —
--  nunca o fornecedor nem o custo interno. As escolhas caem em
--  obra_selecoes como 'desejo' para a equipe revisar.
-- =====================================================================


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


-- =====================================================================
--  PRUMO · Add-on v9 — Personalização por AMBIENTE + portfólio do cliente
--   • Portfólio em PDF pode ser marcado "mostrar ao cliente" (com categoria).
--     Esses PDFs ficam no bucket público 'catalogo' (sem identificar o
--     fornecedor); os PDFs internos continuam no bucket privado 'portfolios'.
--   • RPC catálogo de PDFs do cliente por token.
--   • RPC dos ambientes da obra (vindos do orçamento por ambientes aprovado).
--  Rode no Supabase → SQL Editor (depois dos anteriores). Idempotente.
-- =====================================================================

-- 1. Arquivo do fornecedor pode virar portfólio do CLIENTE (categoria + flag)
alter table public.fornecedor_arquivos add column if not exists categoria   text;
alter table public.fornecedor_arquivos add column if not exists no_catalogo boolean not null default false;
alter table public.fornecedor_arquivos add column if not exists bucket      text not null default 'portfolios';

-- 2. RPC: portfólios (PDF) liberados pro cliente, por token, SEM o fornecedor
create or replace function public.portfolios_publicos(p_token text)
returns json language sql stable security definer set search_path = public
as $$
  select case when not exists (select 1 from public.obras where share_token = p_token) then null
  else coalesce((
    select json_agg(json_build_object(
      'id', a.id, 'nome', a.nome,
      'categoria', coalesce(nullif(a.categoria,''),'Outros'),
      'path', a.path
    ) order by a.categoria)
    from public.fornecedor_arquivos a
    where a.no_catalogo = true
  ), '[]'::json) end
$$;

-- 3. RPC: ambientes da obra (categorias do orçamento aprovado) — para pré-carregar
create or replace function public.ambientes_obra(p_token text)
returns json language sql stable security definer set search_path = public
as $$
  select coalesce((
    select json_agg(distinct oi.categoria)
    from public.orcamento_itens oi
    join public.orcamentos o on o.id = oi.orcamento_id
    join public.obras ob on ob.id = o.obra_id
    where ob.share_token = p_token and o.status = 'aprovado'
      and oi.categoria is not null and oi.categoria <> ''
  ), '[]'::json)
$$;

grant execute on function public.portfolios_publicos(text) to anon, authenticated;
grant execute on function public.ambientes_obra(text) to anon, authenticated;

-- =====================================================================
--  PRONTO. PDFs marcados "no catálogo" precisam ser enviados ao bucket
--  público 'catalogo' (o app faz isso); os internos seguem privados.
-- =====================================================================


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
