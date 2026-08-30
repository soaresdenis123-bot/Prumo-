import { supabase } from './supabase'

export const BRL = (n) =>
  'R$ ' + (Number(n) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })

export const progresso = (etapas = []) =>
  etapas.length ? Math.round(etapas.reduce((t, e) => t + (e.pct || 0), 0) / etapas.length) : 0

const OBRA_SELECT =
  'id,nome,cliente_nome,cliente_email,cliente_tel,endereco,cidade,padrao,area_m2,pavimentos,inicio,previsao,status,gestor_id,share_token,' +
  'etapas(id,ordem,nome,status,pct,obs),obra_financeiro(orcado,meta_custo)'

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
export async function deleteProduto(id) {
  const { error } = await supabase.from('fornecedor_produtos').delete().eq('id', id)
  if (error) throw error
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
    .select('id,numero,cliente_nome,descricao,cidade,total,status,validade_dias,criado_em,obra_id')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data || []
}
export async function setOrcamentoStatus(id, status) {
  const { error } = await supabase.from('orcamentos').update({ status }).eq('id', id)
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

// aprova um orçamento já ligado a uma obra → gera a lista de custos nela
export async function aprovarOrcamento(orc) {
  await supabase.from('orcamentos').update({ status: 'aprovado' }).eq('id', orc.id)
  if (orc.obra_id) await semearCustosDoOrcamento(orc.id, orc.obra_id)
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

// ---- orçamentos (salvar a proposta da calculadora) ----
export async function saveOrcamento(meta, rows) {
  const total = rows.reduce((t, r) => t + (Number(r.qtd) || 0) * (Number(r.valor) || 0), 0)
  const { data, error } = await supabase
    .from('orcamentos')
    .insert({
      obra_id: meta.obra_id || null,
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
