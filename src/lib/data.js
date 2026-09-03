import { supabase } from './supabase'

export const BRL = (n) =>
  'R$ ' + (Number(n) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })

export const progresso = (etapas = []) =>
  etapas.length ? Math.round(etapas.reduce((t, e) => t + (e.pct || 0), 0) / etapas.length) : 0

const OBRA_SELECT =
  'id,nome,cliente_nome,cliente_email,cliente_tel,endereco,cidade,padrao,area_m2,pavimentos,inicio,previsao,status,gestor_id,share_token,' +
  'etapas(id,ordem,nome,status,pct,obs,inicio,fim,executor_id),obra_financeiro(orcado,meta_custo)'

// Categorias de uma obra (da fundação à entrega) — usadas em Fornecedores e no portfólio
export const OBRA_CATEGORIAS = [
  'Projeto & Legalização', 'Fundação', 'Estrutura Steel Frame', 'Fechamento & Isolamento', 'Cobertura',
  'Esquadrias', 'Elétrica', 'Hidráulica', 'Revestimentos', 'Acabamentos', 'Pintura', 'Marcenaria',
  'Louças / Metais', 'Jardinagem', 'Mão de obra', 'Outros',
]
// Categorias que o CLIENTE pode personalizar no portal (o resto não aparece pra ele)
export const CLIENTE_CATS = ['Revestimentos', 'Acabamentos', 'Luminárias', 'Iluminação', 'Jardinagem', 'Pintura', 'Louças / Metais', 'Esquadrias']
// Tipos de cômodo que o cliente pode adicionar na personalização
export const AMBIENTE_TIPOS = ['Sala', 'Quarto', 'Suíte', 'Cozinha', 'Banheiro', 'Lavabo', 'Área de serviço', 'Varanda', 'Área externa', 'Escritório', 'Closet', 'Corredor']

export async function listObras() {
  const { data, error } = await supabase
    .from('obras')
    .select(OBRA_SELECT)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data || []).map(sortEtapas)
}

export async function getObra(id) {
  const { data, error } = await supabase.from('obras').select(OBRA_SELECT).eq('id', id).single()
  if (error) throw error
  return sortEtapas(data)
}

function sortEtapas(o) {
  if (o?.etapas) o.etapas.sort((a, b) => a.ordem - b.ordem)
  return o
}

export async function createObra(payload) {
  const { orcado, ...obra } = payload
  const { data, error } = await supabase.from('obras').insert(obra).select('id').single()
  if (error) throw error
  const id = data.id
  if (orcado != null && orcado !== '') {
    await supabase.from('obra_financeiro').update({ orcado: Number(orcado) }).eq('obra_id', id)
  }
  return id
}

export async function updateEtapa(id, fields) {
  const { error } = await supabase.from('etapas').update(fields).eq('id', id)
  if (error) throw error
}

export async function setOrcado(obraId, valor) {
  const { error } = await supabase
    .from('obra_financeiro')
    .update({ orcado: Number(valor) || 0, atualizado_em: new Date().toISOString() })
    .eq('obra_id', obraId)
  if (error) throw error
}

export async function setMetaCusto(obraId, valor) {
  const { error } = await supabase
    .from('obra_financeiro')
    .update({ meta_custo: Number(valor) || 0, atualizado_em: new Date().toISOString() })
    .eq('obra_id', obraId)
  if (error) throw error
}

// ---- fotos ----
export async function listFotos(etapaId) {
  const { data, error } = await supabase
    .from('etapa_fotos')
    .select('id,storage_path,legenda')
    .eq('etapa_id', etapaId)
    .order('criado_em', { ascending: true })
  if (error) throw error
  const withUrls = await Promise.all(
    (data || []).map(async (f) => {
      const { data: s } = await supabase.storage
        .from('obra-fotos')
        .createSignedUrl(f.storage_path, 3600)
      return { ...f, url: s?.signedUrl }
    })
  )
  return withUrls
}

export async function listFotosObra(obraId) {
  const { data, error } = await supabase
    .from('etapa_fotos')
    .select('id,etapa_id,storage_path,tipo,nome')
    .eq('obra_id', obraId)
    .order('criado_em', { ascending: true })
  if (error) throw error
  const grouped = {}
  await Promise.all(
    (data || []).map(async (f) => {
      const { data: s } = await supabase.storage.from('obra-fotos').createSignedUrl(f.storage_path, 3600)
      ;(grouped[f.etapa_id] = grouped[f.etapa_id] || []).push({ ...f, url: s?.signedUrl })
    })
  )
  return grouped
}

// tipo: 'foto' (imagem) ou 'doc' (PDF, projeto, ART…)
export async function uploadFoto(obraId, etapaId, file, tipo = 'foto') {
  const ext = file.name.split('.').pop()
  const path = `${obraId}/${etapaId}/${Date.now()}.${ext}`
  const { error: upErr } = await supabase.storage.from('obra-fotos').upload(path, file)
  if (upErr) throw upErr
  const { error } = await supabase
    .from('etapa_fotos')
    .insert({ etapa_id: etapaId, obra_id: obraId, storage_path: path, tipo, nome: file.name })
  if (error) throw error
  return path
}

export async function deleteAnexo(id) {
  const { error } = await supabase.from('etapa_fotos').delete().eq('id', id)
  if (error) throw error
}

// ---- obra: atualização geral (gestor, status, datas…) ----
export async function updateObra(id, fields) {
  const { error } = await supabase.from('obras').update(fields).eq('id', id)
  if (error) throw error
}
export async function deleteObra(id) {
  const { error } = await supabase.from('obras').delete().eq('id', id)
  if (error) throw error
}

// ---- fornecedores ----
export async function listFornecedores() {
  const { data, error } = await supabase.from('fornecedores').select('*').order('nome')
  if (error) throw error
  return data || []
}
export async function addFornecedor(f) {
  const { error } = await supabase.from('fornecedores').insert(f)
  if (error) throw error
}
export async function updateFornecedor(id, f) {
  const { error } = await supabase.from('fornecedores').update(f).eq('id', id)
  if (error) throw error
}
export async function deleteFornecedor(id) {
  const { error } = await supabase.from('fornecedores').delete().eq('id', id)
  if (error) throw error
}
export async function getFornecedor(id) {
  const { data, error } = await supabase.from('fornecedores').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

// catálogo de produtos do fornecedor
export async function listProdutos(fornId) {
  const { data, error } = await supabase.from('fornecedor_produtos').select('*').eq('fornecedor_id', fornId).order('produto')
  if (error) throw error
  return data || []
}
export async function addProduto(fornId, p) {
  const { error } = await supabase.from('fornecedor_produtos').insert({ fornecedor_id: fornId, ...p })
  if (error) throw error
}
export async function addProdutosBulk(fornId, rows) {
  const payload = rows.map((r) => ({ fornecedor_id: fornId, produto: r.produto, unidade: r.unidade || 'un', valor: Number(r.valor) || 0 }))
  const { error } = await supabase.from('fornecedor_produtos').insert(payload)
  if (error) throw error
}
export async function updateProduto(id, fields) {
  const { error } = await supabase.from('fornecedor_produtos').update(fields).eq('id', id)
  if (error) throw error
}
export async function deleteProduto(id) {
  const { error } = await supabase.from('fornecedor_produtos').delete().eq('id', id)
  if (error) throw error
}
// ---- portfólio: imagem do produto no bucket público 'catalogo' ----
export async function uploadCatalogoImagem(fornId, file) {
  const ext = file.name.split('.').pop()
  const path = `${fornId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('catalogo').upload(path, file, { upsert: true })
  if (error) throw error
  return path
}
export function catalogoImagemUrl(path) {
  if (!path) return null
  const { data } = supabase.storage.from('catalogo').getPublicUrl(path)
  return data?.publicUrl || null
}

// ---- portfólio em PDF (interno = bucket privado; cliente = bucket público) ----
export async function uploadPortfolioArquivo(fornId, file, { cliente = false, categoria = '' } = {}) {
  const bucket = cliente ? 'catalogo' : 'portfolios'
  const path = `${cliente ? 'docs/' : ''}${fornId}/${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw error
  const { error: e2 } = await supabase.from('fornecedor_arquivos').insert({ fornecedor_id: fornId, nome: file.name, path, bucket, categoria: cliente ? categoria : null, no_catalogo: cliente })
  if (e2) throw e2
  return path
}
export async function listArquivos(fornId) {
  const { data, error } = await supabase.from('fornecedor_arquivos').select('*').eq('fornecedor_id', fornId).order('criado_em', { ascending: true })
  if (error) throw error
  return data || []
}
export async function arquivoUrl(a) {
  // a = objeto do arquivo (path + bucket). PDFs de cliente ficam no bucket público.
  if (a?.bucket === 'catalogo' || a?.no_catalogo) {
    const { data } = supabase.storage.from('catalogo').getPublicUrl(a.path)
    return data?.publicUrl || null
  }
  const { data } = await supabase.storage.from('portfolios').createSignedUrl(a.path, 3600)
  return data?.signedUrl || null
}
export async function deleteArquivo(id) {
  const { error } = await supabase.from('fornecedor_arquivos').delete().eq('id', id)
  if (error) throw error
}

// ---- visão por CATEGORIA (cards + página da categoria) ----
export async function contarPorCategoria() {
  const [{ data: fs }, { data: ps }] = await Promise.all([
    supabase.from('fornecedores').select('categoria'),
    supabase.from('fornecedor_produtos').select('categoria'),
  ])
  const r = {}
  ;(fs || []).forEach((x) => { const k = x.categoria || 'Outros'; (r[k] = r[k] || { forn: 0, itens: 0 }).forn++ })
  ;(ps || []).forEach((x) => { const k = x.categoria || 'Outros'; (r[k] = r[k] || { forn: 0, itens: 0 }).itens++ })
  return r
}
export async function listProdutosPorCategoria(cat) {
  const { data, error } = await supabase
    .from('fornecedor_produtos')
    .select('id,produto,categoria,unidade,valor,preco_cliente,no_catalogo,imagem_path,fornecedor_id,fornecedores(nome)')
    .eq('categoria', cat).order('produto')
  if (error) throw error
  return (data || []).map((r) => ({ ...r, fornecedor: r.fornecedores?.nome }))
}
export async function listFornecedoresPorCategoria(cat) {
  const { data, error } = await supabase.from('fornecedores').select('*').eq('categoria', cat).order('nome')
  if (error) throw error
  return data || []
}
export async function uploadCategoriaPortfolio(categoria, file) {
  const path = `docs/cat/${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`
  const { error } = await supabase.storage.from('catalogo').upload(path, file)
  if (error) throw error
  const { error: e2 } = await supabase.from('fornecedor_arquivos').insert({ fornecedor_id: null, nome: file.name, path, bucket: 'catalogo', categoria, no_catalogo: true })
  if (e2) throw e2
  return path
}
export async function listCategoriaArquivos(cat) {
  const { data, error } = await supabase.from('fornecedor_arquivos').select('*').eq('categoria', cat).eq('no_catalogo', true).order('criado_em', { ascending: true })
  if (error) throw error
  return data || []
}

// ---- personalização por ambiente (cliente, sem login) ----
export async function portfoliosPublicos(token) {
  const { data, error } = await supabase.rpc('portfolios_publicos', { p_token: token })
  if (error) throw error
  return (data || []).map((d) => {
    const { data: u } = supabase.storage.from('catalogo').getPublicUrl(d.path)
    return { ...d, url: u?.publicUrl || null }
  })
}
export async function ambientesObra(token) {
  const { data, error } = await supabase.rpc('ambientes_obra', { p_token: token })
  if (error) throw error
  return data || []
}
// todos os produtos de todos os fornecedores (para puxar no orçamento)
export async function listProdutosComFornecedor() {
  const { data, error } = await supabase
    .from('fornecedor_produtos')
    .select('id,produto,unidade,valor,fornecedor_id,fornecedores(nome)')
    .order('produto')
  if (error) throw error
  return (data || []).map((r) => ({ ...r, fornecedor: r.fornecedores?.nome }))
}

// ---- orçamentos salvos (com status) ----
export async function listOrcamentos() {
  const { data, error } = await supabase
    .from('orcamentos')
    .select('id,numero,cliente_nome,descricao,cidade,total,status,validade_dias,criado_em,obra_id,lead_id')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data || []
}
export async function setOrcamentoStatus(id, status) {
  const { error } = await supabase.from('orcamentos').update({ status }).eq('id', id)
  if (error) throw error
}
export async function updateOrcamentoMeta(id, campos) {
  const { error } = await supabase.from('orcamentos').update(campos).eq('id', id)
  if (error) throw error
}
export async function deleteOrcamento(id) {
  await supabase.from('orcamento_itens').delete().eq('orcamento_id', id)
  const { error } = await supabase.from('orcamentos').delete().eq('id', id)
  if (error) throw error
}
export async function getOrcamentoItens(id) {
  const { data } = await supabase.from('orcamento_itens').select('*').eq('orcamento_id', id)
  return data || []
}
// classifica um item do orçamento em mão de obra ou material (heurística)
function categoriaCusto(cat, item) {
  const s = ((cat || '') + ' ' + (item || '')).toLowerCase()
  if (/m[ãa]o de obra|montagem|servi[çc]o|instala|execu[çc]|aplica[çc]|assentam/.test(s)) return 'mao_obra'
  return 'material'
}

// semeia os custos da obra a partir dos itens de um orçamento (só se ainda não houver)
export async function semearCustosDoOrcamento(orcId, obraId) {
  const { data: existentes } = await supabase.from('custo_itens').select('id').eq('obra_id', obraId).limit(1)
  if (existentes && existentes.length) return 0 // já tem custos — não duplica
  const itens = await getOrcamentoItens(orcId)
  const rows = itens.map((it) => {
    const q = Number(it.qtd) || 1
    const u = Number(it.valor_unit) || 0
    return {
      obra_id: obraId,
      categoria: categoriaCusto(it.categoria, it.item),
      grupo: it.categoria || null,
      etapa_nome: it.item || 'Item',
      descricao: it.categoria || '',
      quantidade: q,
      valor_unit: u,
      valor: q * u,
      status: 'pendente',
    }
  })
  if (rows.length) {
    const { error } = await supabase.from('custo_itens').insert(rows)
    if (error) throw error
  }
  return rows.length
}

// define a verba de cada categoria da obra a partir do orçamento aprovado
// (grupo_cat = categoria de verba). Só semeia se a obra ainda não tem verbas,
// pra não sobrescrever ajustes que o gestor já tenha feito à mão.
export async function semearVerbasDoOrcamento(orcId, obraId) {
  const { data: existentes } = await supabase.from('obra_verbas').select('id').eq('obra_id', obraId).limit(1)
  if (existentes && existentes.length) return 0 // já tem verbas — não sobrescreve
  const itens = await getOrcamentoItens(orcId)
  const soma = {}
  itens.forEach((it) => {
    const cat = it.grupo_cat || it.categoria || 'Outros'
    soma[cat] = (soma[cat] || 0) + (Number(it.qtd) || 0) * (Number(it.valor_unit) || 0)
  })
  const rows = Object.entries(soma)
    .filter(([, v]) => v > 0)
    .map(([categoria, valor]) => ({ obra_id: obraId, categoria, valor }))
  if (rows.length) {
    const { error } = await supabase.from('obra_verbas').insert(rows)
    if (error) throw error
  }
  return rows.length
}

// aprova um orçamento já ligado a uma obra → gera a lista de custos e as verbas
export async function aprovarOrcamento(orc) {
  await supabase.from('orcamentos').update({ status: 'aprovado' }).eq('id', orc.id)
  if (orc.obra_id) {
    await semearCustosDoOrcamento(orc.id, orc.obra_id)
    await semearVerbasDoOrcamento(orc.id, orc.obra_id)
  }
  // orçamento aprovado que veio de um lead → esse lead vira cliente
  if (orc.lead_id) { try { await supabase.from('leads_projeto').update({ cliente: true, status: 'contatado' }).eq('id', orc.lead_id) } catch (e) {} }
  return orc.obra_id || null
}

// transforma um orçamento aprovado em obra (cria a obra e já semeia os custos)
export async function orcamentoParaObra(orc, gestorId) {
  const id = await createObra({
    nome: orc.descricao || orc.cliente_nome || 'Nova obra',
    cliente_nome: orc.cliente_nome,
    cidade: orc.cidade,
    gestor_id: gestorId,
    criado_por: gestorId,
    orcado: orc.total,
  })
  await supabase.from('orcamentos').update({ status: 'aprovado', obra_id: id }).eq('id', orc.id)
  await semearCustosDoOrcamento(orc.id, id)
  await semearVerbasDoOrcamento(orc.id, id)
  return id
}

// perfis (para escolher gestor)

// ---- custos (interno) ----
export async function listCustos(obraId) {
  const { data, error } = await supabase
    .from('custo_itens')
    .select('id,categoria,etapa_nome,descricao,grupo,quantidade,valor_unit,valor,status,fornecedor_id,etapa_id')
    .eq('obra_id', obraId)
    .order('criado_em', { ascending: true })
  if (error) throw error
  return data || []
}

export async function addCusto(obraId, item) {
  const { error } = await supabase.from('custo_itens').insert({ obra_id: obraId, ...item })
  if (error) throw error
}
export async function deleteCusto(id) {
  const { error } = await supabase.from('custo_itens').delete().eq('id', id)
  if (error) throw error
}
// marca um custo como pago / pendente (o "check" no Financeiro)
export async function setCustoStatus(id, status) {
  const { error } = await supabase.from('custo_itens').update({ status }).eq('id', id)
  if (error) throw error
}
// resumo de custos por categoria + pendente/pago (para o overview na obra)
export async function resumoCustos(obraId) {
  const itens = await listCustos(obraId)
  const cats = { mao_obra: { total: 0, pago: 0, n: 0, npago: 0 }, material: { total: 0, pago: 0, n: 0, npago: 0 }, fornecedor: { total: 0, pago: 0, n: 0, npago: 0 } }
  itens.forEach((i) => {
    const c = cats[i.categoria] || cats.material
    const v = Number(i.valor || 0)
    c.total += v; c.n += 1
    if (i.status === 'pago') { c.pago += v; c.npago += 1 }
  })
  const total = itens.reduce((t, i) => t + Number(i.valor || 0), 0)
  const pago = itens.filter((i) => i.status === 'pago').reduce((t, i) => t + Number(i.valor || 0), 0)
  return { cats, total, pago, pendente: total - pago, nItens: itens.length }
}

// ---- produtos da obra (lista de compras por etapa) ----
export async function listProdutosObra(obraId) {
  const { data, error } = await supabase
    .from('obra_produtos')
    .select('id,etapa_id,item,unidade,quantidade,status,pedir,obs,criado_em')
    .eq('obra_id', obraId)
    .order('criado_em', { ascending: true })
  if (error) throw error
  return data || []
}
export async function addProdutoObra(obraId, p) {
  const { error } = await supabase.from('obra_produtos').insert({ obra_id: obraId, ...p })
  if (error) throw error
}
export async function updateProdutoObra(id, fields) {
  const { error } = await supabase.from('obra_produtos').update(fields).eq('id', id)
  if (error) throw error
}
export async function deleteProdutoObra(id) {
  const { error } = await supabase.from('obra_produtos').delete().eq('id', id)
  if (error) throw error
}
// custos de todas as obras visíveis (para o Financeiro consolidado)
export async function listCustosAll() {
  const { data, error } = await supabase.from('custo_itens').select('obra_id,valor')
  if (error) throw error
  const soma = {}
  ;(data || []).forEach((r) => { soma[r.obra_id] = (soma[r.obra_id] || 0) + Number(r.valor || 0) })
  return soma
}

// ---- "Monte sua casa" — captação de leads (página pública, sem login) ----
export async function salvarLeadProjeto(payload) {
  const { data, error } = await supabase.rpc('salvar_lead_projeto', { p: payload })
  if (error) throw error
  return data
}
export async function listLeadsProjeto() {
  const { data, error } = await supabase.from('leads_projeto').select('*').order('criado_em', { ascending: false })
  if (error) throw error
  return data || []
}
export async function updateLead(id, campos) {
  const { error } = await supabase.from('leads_projeto').update(campos).eq('id', id)
  if (error) throw error
}
export async function deleteLead(id) {
  const { error } = await supabase.from('leads_projeto').delete().eq('id', id)
  if (error) throw error
}
// contagem de leads novos (para o aviso no menu)
export async function contarLeadsNovos() {
  const { count } = await supabase.from('leads_projeto').select('id', { count: 'exact', head: true }).eq('cliente', false).eq('status', 'novo')
  return count || 0
}

// ---- Apresentação por cliente (link público, sem login) ----
// dados da apresentação de um cliente a partir do token (RPC pública)
export async function apresentacaoPublica(token) {
  const { data, error } = await supabase.rpc('apresentacao_publica', { p_token: token })
  if (error) throw error
  return data // { nome, cidade, tipo, padrao, telhado, modelo, obs, apres } ou null
}
// sobe um render/foto personalizada do cliente (bucket público 'catalogo')
export async function uploadApresRender(leadId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').replace(/[^\w]/g, '')
  const path = `apres/${leadId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('catalogo').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('catalogo').getPublicUrl(path)
  return data?.publicUrl || null
}
// grava/atualiza o bloco de overrides da apresentação (merge no jsonb apres)
export async function salvarApres(leadId, apresAtual, patch) {
  const novo = { ...(apresAtual || {}), ...patch }
  await updateLead(leadId, { apres: novo })
  return novo
}

// ---- link público do cliente (sem login) ----
export async function getObraPublica(token) {
  const { data, error } = await supabase.rpc('obra_publica', { p_token: token })
  if (error) throw error
  if (!data) return null
  const obra = data
  ;(obra.etapas || []).sort((a, b) => a.ordem - b.ordem)
  // agrupa e assina as fotos
  const fotos = {}
  await Promise.all(
    (obra.fotos || []).map(async (f) => {
      const { data: s } = await supabase.storage.from('obra-fotos').createSignedUrl(f.path, 3600)
      ;(fotos[f.etapa_id] = fotos[f.etapa_id] || []).push(s?.signedUrl)
    })
  )
  obra.fotosPorEtapa = fotos
  return obra
}

// ---- catálogo do cliente (personalização) — cliente NÃO vê o fornecedor ----
export async function catalogoPublico(token) {
  const { data, error } = await supabase.rpc('catalogo_publico', { p_token: token })
  if (error) throw error
  return (data || []).map((p) => ({ ...p, imagemUrl: catalogoImagemUrl(p.imagem) }))
}
export async function minhasSelecoes(token) {
  const { data, error } = await supabase.rpc('minhas_selecoes', { p_token: token })
  if (error) throw error
  return data || []
}
export async function salvarSelecoes(token, itens) {
  const { data, error } = await supabase.rpc('salvar_selecoes', { p_token: token, p_itens: itens })
  if (error) throw error
  return data
}
// lado da equipe: ler / mover status das escolhas do cliente
export async function listSelecoes(obraId) {
  const { data, error } = await supabase
    .from('obra_selecoes')
    .select('id,produto_id,item,categoria,preco_cliente,quantidade,ambiente,status,no_orcado,criado_em')
    .eq('obra_id', obraId)
    .order('criado_em', { ascending: true })
  if (error) throw error
  return data || []
}
export async function setSelecaoStatus(id, status) {
  const { error } = await supabase.from('obra_selecoes').update({ status }).eq('id', id)
  if (error) throw error
}
export async function deleteSelecao(id) {
  const { error } = await supabase.from('obra_selecoes').delete().eq('id', id)
  if (error) throw error
}
// ---- verbas por categoria (orçamento definido por parte da obra) ----
export async function listVerbas(obraId) {
  const { data, error } = await supabase.from('obra_verbas').select('*').eq('obra_id', obraId).order('categoria')
  if (error) throw error
  return data || []
}
export async function setVerba(obraId, categoria, valor) {
  const { error } = await supabase.from('obra_verbas').upsert({ obra_id: obraId, categoria, valor: Number(valor) || 0 }, { onConflict: 'obra_id,categoria' })
  if (error) throw error
}
export async function deleteVerba(id) {
  const { error } = await supabase.from('obra_verbas').delete().eq('id', id)
  if (error) throw error
}

// soma as escolhas aprovadas ao orçado da obra (usa o preço de cliente = receita, margem protegida)
export async function somarSelecoesAoOrcado(obraId, ids, novoOrcado) {
  await setOrcado(obraId, novoOrcado)
  const { error } = await supabase.from('obra_selecoes').update({ no_orcado: true }).in('id', ids)
  if (error) throw error
}

// ---- orçamentos (salvar a proposta da calculadora) ----
export async function saveOrcamento(meta, rows) {
  const total = rows.reduce((t, r) => t + (Number(r.qtd) || 0) * (Number(r.valor) || 0), 0)
  const { data, error } = await supabase
    .from('orcamentos')
    .insert({
      obra_id: meta.obra_id || null,
      lead_id: meta.lead_id || null,
      numero: meta.numero,
      cliente_nome: meta.cliente,
      descricao: meta.obra,
      cidade: meta.cidade,
      validade_dias: Number(meta.validade) || 15,
      total,
      status: 'rascunho',
    })
    .select('id')
    .single()
  if (error) throw error
  const itens = rows.map((r) => ({
    orcamento_id: data.id,
    categoria: r.categoria,
    grupo_cat: r.grupo || null,
    item: r.item,
    qtd: Number(r.qtd) || 0,
    unidade: r.un,
    valor_unit: Number(r.valor) || 0,
  }))
  if (itens.length) await supabase.from('orcamento_itens').insert(itens)
  return data.id
}

// perfis (para escolher gestor)
export async function listGestores() {
  const { data } = await supabase.from('profiles').select('id,nome,email,papel').in('papel', ['admin', 'gestor'])
  return data || []
}

// ---- Módulo TIME: times e tarefas ----
export async function listTimes() {
  const { data, error } = await supabase.from('times').select('*').order('criado_em', { ascending: true })
  if (error) throw error
  return data || []
}
export async function addTime(t) {
  const { data, error } = await supabase.from('times').insert(t).select('id').single()
  if (error) throw error
  return data.id
}
export async function deleteTime(id) {
  const { error } = await supabase.from('times').delete().eq('id', id)
  if (error) throw error
}
export async function listTarefas() {
  const { data, error } = await supabase
    .from('tarefas')
    .select('id,time_id,obra_id,titulo,descricao,responsavel,prazo,status,criado_em,obras(nome),times(nome,tipo,cor)')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data || []).map((t) => ({ ...t, obra_nome: t.obras?.nome, time_nome: t.times?.nome, time_tipo: t.times?.tipo, time_cor: t.times?.cor }))
}
export async function addTarefa(t) {
  const { error } = await supabase.from('tarefas').insert(t)
  if (error) throw error
}
export async function updateTarefa(id, fields) {
  const { error } = await supabase.from('tarefas').update(fields).eq('id', id)
  if (error) throw error
}
export async function deleteTarefa(id) {
  const { error } = await supabase.from('tarefas').delete().eq('id', id)
  if (error) throw error
}
