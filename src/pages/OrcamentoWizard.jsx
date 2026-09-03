import { useState, useEffect, Fragment } from 'react'
import { BRL, saveOrcamento, listProdutosComFornecedor, listObras } from '../lib/data'
import { SERVICOS, areaDosComodos } from '../lib/precificacao'
import { MO_PCT_PADRAO, MO_MIN, MO_MAX, MARGEM_PCT_PADRAO, custoInstalado, precoVenda, margemDe } from '../lib/custos'
import { parseSelecoes, ACAB_POR_ID, COEF, esquadAreaM2 } from '../lib/acabamentos'

// grupo do orçamento gerado a partir do que o cliente escolheu no "Monte sua casa"
const SUP_LABEL = { piso: 'Piso', parede: 'Paredes', teto: 'Teto', esquadria: 'Esquadrias' }
const SUP_CAT = { piso: 'Revestimento', parede: 'Revestimento', teto: 'Acabamento', esquadria: 'Esquadrias' }
function gerarAcabamentosCliente(selecoes) {
  const itens = []
  selecoes.forEach((a) => {
    ;['piso', 'parede', 'teto', 'esquadria'].forEach((sup) => {
      const it = ACAB_POR_ID[a.sel?.[sup]]
      if (!it) return
      const area = Number(a.area) || 0
      const qty = sup === 'esquadria' ? esquadAreaM2(area) : Math.max(1, Math.round((COEF[sup] || 1) * area))
      const un = 'm²'
      const preco = Math.round(custoInstalado(it.compra, it.mo)) // custo material + mão de obra
      itens.push({ ...AU(`${a.tipo} · ${SUP_LABEL[sup]}: ${it.nome}`, un, qty, preco, '', true, SUP_CAT[sup]), qtd: qty })
    })
  })
  return { nome: 'Acabamentos escolhidos pelo cliente', itens }
}
const ACAB_GROUPS = ['Revestimento', 'Acabamento', 'Esquadrias']
import PlumbMark from '../components/PlumbMark'

/* =========================================================================
 *  ASSISTENTE DE ORÇAMENTO (guiado) — steel frame, Brasil
 *  Passo 1: térrea ou sobrado  ·  Passo 2: área + cômodos + features + telhado
 *  Passo 3: orçamento detalhado gerado (obra + por ambiente), cada material
 *  com 3 níveis (popular/médio/alto), puxar fornecedor ou manual, editável.
 * ======================================================================= */
const inp = { padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 9, background: 'var(--surface)', color: 'var(--ink)', fontSize: 13.5 }
const T = (n, p) => ({ n, p })
// item de ESCOLHA (3 níveis) e item AUTO (calculado)
const CH = (desc, un, coef, tiers, local = '', fixo = false, g = 'Acabamento') => ({ k: 'ch', desc, un, coef, local, fixo, tiers, sel: 1, g })
const AU = (desc, un, coef, preco = 0, local = '', fixo = false, g = 'Infra') => ({ k: 'au', desc, un, coef, local, fixo, preco, g })

const ELET = (tom, int = 1, luz = 1, ex = []) => [
  AU('Eletroduto / mangueira', 'm', 1.4, 3.5, 'Interno', false, 'Elétrica'),
  AU('Cabo / fio elétrico', 'm', 3.5, 3.2, 'Interno', false, 'Elétrica'),
  AU('Caixas + módulos', 'un', tom + int, 4, '', true, 'Elétrica'),
  AU('Tomadas', 'un', tom, 9, '', true, 'Elétrica'),
  AU('Interruptores', 'un', int, 8, '', true, 'Elétrica'),
  CH('Luminárias', 'un', luz, [T('LED sobrepor', 35), T('Plafon / spot', 60), T('Pendente / design', 180)], '', true, 'Iluminação'),
  ...ex,
]
const HIDR = (q = false) => [
  AU('Tubo água fria (PVC)', 'm', 4, 6, '', true, 'Hidráulica'),
  ...(q ? [AU('Tubo água quente (PEX)', 'm', 3, 9, '', true, 'Hidráulica')] : []),
  AU('Tubo de esgoto', 'm', 4, 7, '', true, 'Hidráulica'),
  AU('Conexões', 'cj', 1, 80, '', true, 'Hidráulica'),
  AU('Registros', 'un', 2, 45, '', true, 'Hidráulica'),
]
const PISO = (local = 'Interno') => CH('Piso', 'm²', 1.0, [T('Cerâmica', 35), T('Porcelanato', 75), T('Porcelanato retificado / SPC', 120)], local, false, 'Revestimento')
const PINT = () => CH('Massa + pintura (paredes)', 'm²', 2.7, [T('Acrílica econômica', 22), T('Acrílica premium', 32), T('Textura / efeito', 48)], 'Interno', false, 'Acabamento')
const FORRO = () => CH('Forro', 'm²', 1.0, [T('PVC', 45), T('Gesso', 70), T('Gesso + sanca', 110)], 'Interno', false, 'Acabamento')
const PORTA = () => CH('Porta interna', 'un', 1, [T('Semi-oca', 280), T('Madeira', 480), T('Madeira maciça', 900)], '', true, 'Esquadrias')
const JANELA = () => CH('Janela / esquadria', 'un', 1, [T('PVC', 350), T('Alumínio', 600), T('Alumínio + vidro duplo', 1100)], '', true, 'Esquadrias')
const RODAPE = () => AU('Rodapé', 'm', 1.3, 12, 'Interno', false, 'Acabamento')

const AMBS = {
  Quarto: { area: 12, itens: () => [PISO(), RODAPE(), PINT(), FORRO(), PORTA(), JANELA(), ...ELET(5, 1, 1)] },
  Suíte: { area: 16, itens: () => [PISO(), RODAPE(), PINT(), FORRO(), PORTA(), JANELA(), CH('Marcenaria / closet', 'cj', 1, [T('MDF', 900), T('Planejado', 1800), T('Premium', 3200)], '', true, 'Marcenaria'), ...ELET(6, 2, 2)] },
  Banheiro: { area: 5, itens: () => [CH('Piso antiderrapante', 'm²', 1.0, [T('Cerâmica', 40), T('Porcelanato', 85), T('Porcelanato retif.', 130)], 'Interno', false, 'Revestimento'), CH('Revestimento de parede', 'm²', 2.8, [T('Cerâmica', 40), T('Porcelanato', 85), T('SPC wall panel', 160)], 'Interno', false, 'Revestimento'), CH('Forro', 'm²', 1.0, [T('PVC', 45), T('Gesso', 70), T('Gesso + iluminação', 110)], 'Interno', false, 'Acabamento'), CH('Bancada + cuba', 'm', 1.2, [T('Granito', 350), T('Quartzo', 700), T('Porcelanato', 1100)], '', true, 'Louças/Metais'), CH('Vaso sanitário', 'un', 1, [T('Popular', 350), T('Médio', 800), T('Alto', 1800)], '', true, 'Louças/Metais'), CH('Metais (torneira/chuveiro/registro)', 'cj', 1, [T('Popular', 300), T('Médio', 700), T('Alto', 1600)], '', true, 'Louças/Metais'), CH('Box de vidro', 'un', 1, [T('Popular', 350), T('Médio', 650), T('Alto', 1200)], '', true, 'Esquadrias'), PORTA(), ...ELET(2, 1, 1, [AU('Ponto do chuveiro (6mm)', 'un', 1, 60, '', true, 'Elétrica')]), ...HIDR(true)] },
  Lavabo: { area: 3, itens: () => [PISO(), CH('Revestimento decorativo', 'm²', 2.4, [T('Cerâmica', 40), T('Porcelanato', 85), T('Papel/cimento queimado', 130)], 'Interno', false, 'Revestimento'), CH('Cuba + vaso', 'cj', 1, [T('Popular', 500), T('Médio', 1100), T('Alto', 2200)], '', true, 'Louças/Metais'), CH('Metais', 'cj', 1, [T('Popular', 300), T('Médio', 700), T('Alto', 1500)], '', true, 'Louças/Metais'), PORTA(), ...ELET(1, 1, 1), ...HIDR(false)] },
  Cozinha: { area: 12, itens: () => [PISO(), CH('Revestimento de parede', 'm²', 1.6, [T('Cerâmica', 40), T('Porcelanato', 85), T('SPC wall panel', 160)], 'Interno', false, 'Revestimento'), RODAPE(), PINT(), FORRO(), CH('Bancada', 'm', 3, [T('Granito', 350), T('Quartzo', 700), T('Dekton / porcelanato', 1200)], '', true, 'Marcenaria'), CH('Cuba + torneira', 'cj', 1, [T('Popular', 250), T('Médio', 600), T('Alto', 1200)], '', true, 'Louças/Metais'), PORTA(), ...ELET(6, 1, 2, [AU('Ponto de força (fogão/coifa)', 'un', 2, 25, '', true, 'Elétrica')]), ...HIDR(true)] },
  'Sala de estar': { area: 22, itens: () => [PISO(), RODAPE(), PINT(), CH('Forro + sanca', 'm²', 1.0, [T('Gesso liso', 55), T('Sanca simples', 85), T('Sanca + LED', 130)], 'Interno', false, 'Acabamento'), CH('Esquadria / sacada', 'un', 1, [T('Alumínio', 1200), T('Alu + vidro temperado', 2200), T('Vidro de correr premium', 3800)], '', true, 'Esquadrias'), ...ELET(6, 2, 2)] },
  'Sala de jantar': { area: 14, itens: () => [PISO(), RODAPE(), PINT(), FORRO(), ...ELET(4, 1, 1)] },
  Garagem: { area: 20, itens: () => [CH('Piso', 'm²', 1.0, [T('Cimento queimado', 45), T('Porcelanato', 80), T('Concreto polido', 65)], '', false, 'Revestimento'), CH('Pintura', 'm²', 1.4, [T('Acrílica', 22), T('Premium', 32), T('Epóxi', 55)], '', false, 'Acabamento'), CH('Portão', 'un', 1, [T('Basculante', 1800), T('Deslizante', 2600), T('Automatizado', 4200)], '', true, 'Esquadrias'), ...ELET(2, 1, 1)] },
  'Área de serviço': { area: 6, itens: () => [PISO(), CH('Revestimento de parede', 'm²', 1.8, [T('Cerâmica', 40), T('Porcelanato', 80), T('SPC', 150)], 'Interno', false, 'Revestimento'), CH('Tanque + torneira', 'cj', 1, [T('Popular', 250), T('Médio', 500), T('Alto', 900)], '', true, 'Louças/Metais'), PORTA(), ...ELET(3, 1, 1, [AU('Ponto máquina de lavar', 'un', 1, 40, '', true, 'Elétrica')]), ...HIDR(false)] },
  Varanda: { area: 10, itens: () => [CH('Piso externo', 'm²', 1.0, [T('Cerâmica externa', 40), T('Porcelanato', 80), T('Deck / porcelanato', 150)], 'Externo', false, 'Revestimento'), AU('Forro', 'm²', 1.0, 60, 'Externo', false, 'Acabamento'), CH('Guarda-corpo', 'm', 4, [T('Alumínio', 220), T('Vidro', 420), T('Vidro + inox', 650)], '', true, 'Esquadrias'), ...ELET(2, 1, 1)] },
  Escritório: { area: 10, itens: () => [PISO(), RODAPE(), PINT(), FORRO(), PORTA(), JANELA(), ...ELET(4, 1, 1)] },
  Corredor: { area: 6, itens: () => [PISO(), RODAPE(), PINT(), FORRO(), ...ELET(1, 1, 1)] },
}
const COMODOS = Object.keys(AMBS)
const FEATURES = [
  { key: 'piscina', nome: 'Piscina', it: () => CH('Piscina', 'vb', 1, [T('Fibra', 25000), T('Vinil', 38000), T('Alvenaria / azulejo', 60000)], '', true, 'Externo') },
  { key: 'lareira', nome: 'Lareira', it: () => CH('Lareira', 'vb', 1, [T('Pré-moldada', 3500), T('Ecológica', 5500), T('Revestida', 9000)], '', true, 'Externo') },
  { key: 'gourmet', nome: 'Área gourmet / churrasqueira', it: () => CH('Área gourmet', 'vb', 1, [T('Simples', 4000), T('Média', 8000), T('Completa', 15000)], '', true, 'Externo') },
  { key: 'paisagismo', nome: 'Paisagismo', it: () => CH('Paisagismo (projeto + execução)', 'vb', 1, [T('Jardim de entrada', 6000), T('Paisagismo completo', 15000)], '', true, 'Jardinagem') },
]
const TELHADOS = [['Fibrocimento', 0], ['Cerâmico', 1], ['Shingle', 2], ['Metálico sanduíche', 2], ['Laje impermeabilizada', 1]]

// mapa: categoria "de obra" do item (g) → categoria de VERBA (mesma linguagem das
// escolhas do cliente e dos fornecedores), pra verba e desconto baterem certo.
const GCAT = {
  Preliminares: 'Fundação', Fundação: 'Fundação', Estrutura: 'Estrutura Steel Frame',
  Fechamento: 'Fechamento & Isolamento', Cobertura: 'Cobertura', Instalações: 'Elétrica',
  Fachada: 'Pintura', Entrega: 'Outros', Revestimento: 'Revestimentos', Acabamento: 'Acabamentos',
  Esquadrias: 'Esquadrias', Elétrica: 'Elétrica', Iluminação: 'Iluminação', Hidráulica: 'Hidráulica',
  'Louças/Metais': 'Louças / Metais', Marcenaria: 'Marcenaria', Externo: 'Jardinagem',
}
const catDe = (it) => GCAT[it.g] || 'Outros'

function qtd(it, area) { if (it.fixo) return it.coef; if (/m²|m2|m\b/.test(it.un)) return Math.max(1, Math.round((Number(area) || 0) * it.coef)); return it.coef }
function valorDe(it) { return it.k === 'ch' ? (it.tiers[it.sel]?.p || 0) : (it.preco || 0) }

function gerarProjeto(cfg) {
  const A = Number(cfg.area) || 0
  const sobrado = cfg.tipo === 'sobrado'
  const footprint = sobrado ? A / 2 : A
  const telhadoArea = Math.round(footprint * 1.25)
  const tSel = cfg.telhadoTier ?? 1
  // cada push usa coef = quantidade absoluta já calculada (footprint, área, etc.)
  const P = []
  P.push(AU('Limpeza do terreno / terraplanagem', 'm²', footprint, 25, '', true, 'Preliminares'))
  P.push(AU('Fundação — radier', 'm²', footprint, 540, '', true, 'Fundação'))
  P.push(AU('Kit estrutura steel frame', 'm²', A, 380, '', true, 'Estrutura'))
  P.push(AU('Montagem da estrutura (mão de obra)', 'm²', A, 120, '', true, 'Estrutura'))
  P.push(AU('Fechamento (OSB + placa cimentícia + isolamento)', 'm²', Math.round(A * 1.1), 200, '', true, 'Fechamento'))
  if (sobrado) { P.push(AU('Entrepiso (laje seca / wall)', 'm²', footprint, 208, '', true, 'Estrutura')); P.push(CH('Escada', 'un', 1, [T('Concreto revestido', 6000), T('Madeira', 9000), T('Metálica / vidro', 15000)], '', true, 'Estrutura')) }
  P.push(CH('Cobertura / telhado', 'm²', telhadoArea, [T('Fibrocimento', 85), T('Cerâmico', 169), T('Shingle / metálico', 215)], '', true, 'Cobertura'))
  P[P.length - 1].sel = tSel
  P.push(AU('Manta / subcobertura + calhas', 'm²', telhadoArea, 33, '', true, 'Cobertura'))
  P.push(AU('Entrada de energia + quadro (QDC)', 'vb', 1, 3360, '', true, 'Instalações'))
  P.push(AU('Instalação hidráulica — barrilete / geral', 'vb', 1, 3840, '', true, 'Instalações'))
  P.push(CH('Fachada / pintura externa', 'm²', Math.round(footprint * (sobrado ? 2.4 : 1.6)), [T('Textura', 30), T('Premium', 45), T('Grafiato', 60)], 'Externo', false, 'Fachada'))
  P.push(AU('Impermeabilização', 'm²', footprint, 104, '', true, 'Fundação'))
  P.push(AU('Limpeza final / entrega', 'vb', 1, 1500, '', true, 'Entrega'))
  FEATURES.forEach((f) => {
    if (!cfg.features[f.key]) return
    const item = f.it()
    if (f.key === 'paisagismo') item.sel = cfg.paisEscopo === 'completo' ? 1 : 0
    P.push(item)
  })
  // coef já é a quantidade absoluta de cada item da obra
  return { nome: 'Projeto & Obra', itens: P.map((it) => ({ ...it, qtd: Math.max(1, Math.round(it.coef)) })) }
}

// Projetos & serviços de contratação — valores REAIS por m² (documento MS).
// Entram no detalhado interno; o Book de entrega (R$0) fica de fora.
function gerarServicos(cfg) {
  const A = Number(cfg.area) || 0
  const itens = SERVICOS.filter((s) => s.m2 > 0 && !s.opcional).map((s) =>
    ({ ...AU(s.nome, 'm²', A, s.m2, '', true, 'Entrega'), qtd: Math.max(1, A) })
  )
  return { nome: 'Projetos & Serviços', itens }
}

function gerarAmbientes(cfg, excluirAcab) {
  const tg = cfg.tierGlobal // nível padrão vindo do cliente (0/1/2), se houver
  const grupos = []
  COMODOS.forEach((tipo) => {
    const n = Number(cfg.comodos[tipo]) || 0
    for (let i = 1; i <= n; i++) {
      const base = AMBS[tipo]
      // quando o cliente já escolheu piso/parede/teto/esquadria, tira esses daqui pra não duplicar
      let itens = base.itens()
      if (excluirAcab) itens = itens.filter((it) => !ACAB_GROUPS.includes(it.g))
      itens = itens.map((it) => ({ ...it, qtd: qtd(it, base.area), sel: (it.k === 'ch' && tg != null) ? tg : it.sel }))
      grupos.push({ nome: n > 1 ? `${tipo} ${i}` : tipo, area: base.area, itens })
    }
  })
  return grupos
}

export default function OrcamentoWizard({ prefill }) {
  const [etapa, setEtapa] = useState('tipo')
  const [cfg, setCfg] = useState({ tipo: 'terrea', area: 120, comodos: {}, features: {}, telhado: 'Cerâmico', telhadoTier: 1 })
  const [grupos, setGrupos] = useState([])
  const [meta, setMeta] = useState({ cliente: '', obra: '', cidade: '', validade: 15, obra_id: '', lead_id: '' })
  const [obras, setObras] = useState([])
  const [picker, setPicker] = useState(null) // {gi, ii}
  const [showPrint, setShowPrint] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [margemPct, setMargemPct] = useState(Math.round(MARGEM_PCT_PADRAO * 100)) // % de margem sobre o custo
  const [numero] = useState(() => 'MS-' + new Date().getFullYear() + '-' + String(Math.floor(100 + Math.random() * 899)))

  useEffect(() => { listObras().then(setObras).catch(() => {}) }, [])

  // pré-preenche a partir de um lead ("Fazer orçamento" na aba Clientes)
  useEffect(() => {
    if (!prefill) return
    // ---- formato novo: seleções por ambiente do "Monte sua casa" ----
    const selData = parseSelecoes(prefill.obs)
    if (selData && selData.ambientes && selData.ambientes.length) {
      const tipoN = selData.tipo === 'sobrado' ? 'sobrado' : 'terrea'
      const MAPA = { 'Quarto': 'Quarto', 'Suíte': 'Suíte', 'Banheiro': 'Banheiro', 'Lavabo': 'Lavabo', 'Cozinha': 'Cozinha', 'Sala de estar': 'Sala de estar', 'Sala de jantar': 'Sala de jantar', 'Área de serviço': 'Área de serviço', 'Escritório': 'Escritório', 'Varanda / gourmet': 'Varanda' }
      const comodosN = {}
      selData.ambientes.forEach((a) => { const k = MAPA[a.tipo] || 'Quarto'; comodosN[k] = (comodosN[k] || 0) + 1 })
      const tgN = String(selData.padrao || '').toLowerCase().includes('alto') ? 2 : 1
      const featN = {}
      let paisEsc = 'entrada'
      if (selData.paisagismo) { featN.paisagismo = true; paisEsc = /completo/.test(selData.paisagismo) ? 'completo' : 'entrada' }
      setCfg((c) => ({ ...c, tipo: tipoN, area: selData.areaTotal || 120, comodos: comodosN, features: featN, tierGlobal: tgN, selecoes: selData.ambientes, paisEscopo: paisEsc }))
      setMeta((m) => ({ ...m, cliente: prefill.nome || '', cidade: prefill.cidade || '', obra: prefill.modelo ? 'Casa ' + prefill.modelo : '', lead_id: prefill.id }))
      setEtapa('config')
      return
    }
    // ---- formato antigo (leads anteriores) ----
    const obs = (prefill.obs || '').toLowerCase()
    const tipo = prefill.tipo === 'sobrado' ? 'sobrado' : 'terrea'
    const areaM = obs.match(/(\d+)\s*m²/)
    const MAP = { 'quartos': 'Quarto', 'suítes': 'Suíte', 'banheiros': 'Banheiro', 'lavabo': 'Lavabo', 'cozinha': 'Cozinha', 'sala de estar': 'Sala de estar', 'sala de jantar': 'Sala de jantar', 'garagem (vagas)': 'Garagem', 'área de serviço': 'Área de serviço', 'escritório': 'Escritório', 'varanda': 'Varanda' }
    const comodos = {}
    Object.entries(MAP).forEach(([lbl, key]) => {
      const m = obs.match(new RegExp('(\\d+)\\s+' + lbl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      if (m) comodos[key] = Math.max(comodos[key] || 0, Number(m[1]))
    })
    // área: usa o m² informado; se faltar, estima pela soma dos cômodos (nunca dobra)
    const areaCom = Object.entries(comodos).reduce((t, [k, n]) => t + (AMBS[k]?.area || 8) * (Number(n) || 0), 0)
    const area = areaM ? Number(areaM[1]) : (areaCom ? Math.round(areaCom * 1.15) : (tipo === 'sobrado' ? 150 : 100))
    const def = tipo === 'sobrado'
      ? { Quarto: 2, Suíte: 1, Banheiro: 2, Lavabo: 1, Cozinha: 1, 'Sala de estar': 1, 'Sala de jantar': 1, Garagem: 1, 'Área de serviço': 1, Varanda: 1 }
      : { Quarto: 2, Suíte: 1, Banheiro: 1, Lavabo: 1, Cozinha: 1, 'Sala de estar': 1, Garagem: 1, 'Área de serviço': 1 }
    const features = {}
    if (obs.includes('piscina')) features.piscina = true
    if (obs.includes('gourmet') || obs.includes('churrasqueira')) features.gourmet = true
    if (obs.includes('lareira')) features.lareira = true
    // acabamentos que o cliente escolheu no "Monte sua casa" (texto original)
    const raw = prefill.obs || ''
    const grab = (lbl) => { const m = raw.match(new RegExp(lbl + ':\\s*([^·]+)')); return m ? m[1].trim() : '' }
    const acabCliente = { piso: grab('Piso'), telhado: grab('Telhado'), esquadrias: grab('Esquadrias'), paisagismo: grab('Paisagismo') }
    // paisagismo escolhido pelo cliente entra como item da obra
    if (acabCliente.paisagismo) features.paisagismo = true
    const paisEscopo = /completo|18/.test(acabCliente.paisagismo.toLowerCase()) ? 'completo' : 'entrada'
    // padrão do cliente vira o nível padrão do detalhado (0 popular · 1 médio · 2 alto)
    const tierGlobal = String(prefill.padrao || '').toLowerCase().includes('alto') ? 2 : 1
    setCfg((c) => ({ ...c, tipo, area, comodos: Object.keys(comodos).length ? comodos : def, features, acabCliente, tierGlobal, paisEscopo }))
    setMeta((m) => ({ ...m, cliente: prefill.nome || '', cidade: prefill.cidade || '', obra: prefill.modelo ? 'Casa ' + prefill.modelo : '', lead_id: prefill.id }))
    setEtapa('config')
  }, [prefill])

  function escolherTipo(tipo) {
    const def = tipo === 'sobrado'
      ? { Quarto: 2, Suíte: 1, Banheiro: 2, Lavabo: 1, Cozinha: 1, 'Sala de estar': 1, 'Sala de jantar': 1, Garagem: 1, 'Área de serviço': 1, Varanda: 1 }
      : { Quarto: 2, Suíte: 1, Banheiro: 1, Lavabo: 1, Cozinha: 1, 'Sala de estar': 1, Garagem: 1, 'Área de serviço': 1 }
    setCfg({ ...cfg, tipo, area: tipo === 'sobrado' ? 180 : 120, comodos: def })
    setEtapa('config')
  }
  function avancar() {
    const temSel = cfg.selecoes && cfg.selecoes.length
    setGrupos([
      gerarServicos(cfg),
      ...(temSel ? [gerarAcabamentosCliente(cfg.selecoes)] : []),
      gerarProjeto(cfg),
      ...gerarAmbientes(cfg, !!temSel),
    ])
    setEtapa('detalhado')
  }
  const setComodo = (t, v) => setCfg({ ...cfg, comodos: { ...cfg.comodos, [t]: Math.max(0, v) } })

  // edição no detalhado
  const upd = (gi, ii, fn) => setGrupos(grupos.map((g, x) => x !== gi ? g : { ...g, itens: g.itens.map((it, y) => y !== ii ? it : fn(it)) }))
  const setTier = (gi, ii, s) => upd(gi, ii, (it) => ({ ...it, sel: s, vendaOv: undefined }))
  const setCampo = (gi, ii, k, v) => upd(gi, ii, (it) => ({ ...it, [k]: v }))
  const delItem = (gi, ii) => setGrupos(grupos.map((g, x) => x !== gi ? g : { ...g, itens: g.itens.filter((_, y) => y !== ii) }))
  const addItem = (gi) => setGrupos(grupos.map((g, x) => x !== gi ? g : { ...g, itens: [...g.itens, AU('Novo item', 'un', 1, 0, '', true, 'Outros')] }))
  function puxarForn(gi, ii, p) { upd(gi, ii, (it) => ({ ...it, k: 'au', desc: p.produto, un: p.unidade || it.un, preco: Number(p.valor) || 0, forn: p.fornecedor })); setPicker(null) }

  // compra = custo (material + execução já embutida) · venda = custo + margem (editável)
  const compraUn = (it) => valorDe(it)
  const vendaUn = (it) => (it.vendaOv != null && it.vendaOv !== '') ? Number(it.vendaOv) : precoVenda(valorDe(it), 0, margemPct / 100)
  const subtotal = (g) => g.itens.reduce((t, it) => t + (Number(it.qtd) || 0) * vendaUn(it), 0)
  const custoSubtotal = (g) => g.itens.reduce((t, it) => t + (Number(it.qtd) || 0) * compraUn(it), 0)
  const total = grupos.reduce((t, g) => t + subtotal(g), 0)
  const custoTotal = grupos.reduce((t, g) => t + custoSubtotal(g), 0)

  function flatten() {
    const rows = []
    grupos.forEach((g) => g.itens.forEach((it) => {
      const v = vendaUn(it), q = Number(it.qtd) || 0
      if (q * v > 0) rows.push({ categoria: g.nome, grupo: catDe(it), item: it.desc + (it.k === 'ch' ? ' · ' + it.tiers[it.sel].n : ''), qtd: q, un: it.un, valor: v, custo: compraUn(it), local: it.local })
    }))
    return rows
  }
  async function salvar() {
    try { await saveOrcamento({ ...meta, numero }, flatten()); setSaveMsg('Orçamento salvo ✓') }
    catch (e) { setSaveMsg('Erro: ' + e.message) }
    setTimeout(() => setSaveMsg(''), 3000)
  }

  /* ---------- PASSO 1: cards ---------- */
  if (etapa === 'tipo') return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginTop: 8 }}>
      {[['terrea', 'Casa Térrea', 'Um pavimento. Ex.: 3 dorm., 120 m².', 1], ['sobrado', 'Sobrado (2 pavimentos)', 'Dois pavimentos, com escada e entrepiso.', 2]].map(([k, nome, desc, pav]) => (
        <button key={k} className="card" onClick={() => escolherTipo(k)} style={{ padding: 22, textAlign: 'left', cursor: 'pointer', border: '1px solid var(--line)' }}>
          <CasaIcon pav={pav} />
          <div style={{ fontWeight: 700, fontSize: 17, marginTop: 12 }}>{nome}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{desc}</div>
          <div className="btn" style={{ marginTop: 14, width: 'fit-content' }}>Começar →</div>
        </button>
      ))}
    </div>
  )

  /* ---------- PASSO 2: configuração ---------- */
  if (etapa === 'config') return (
    <div>
      <button className="muted" style={{ fontSize: 12.5, marginBottom: 12 }} onClick={() => setEtapa('tipo')}>← Trocar tipo</button>
      {cfg.acabCliente && (cfg.acabCliente.piso || cfg.acabCliente.telhado || cfg.acabCliente.esquadrias || cfg.acabCliente.paisagismo) && (
        <div className="card" style={{ padding: 16, marginBottom: 16, borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent2)', fontWeight: 700 }}>O que o cliente escolheu</div>
          <div className="muted" style={{ fontSize: 12, margin: '2px 0 10px' }}>Puxado do “Monte sua casa”. Usamos o padrão {cfg.tierGlobal === 2 ? 'alto' : 'médio'} como nível inicial no detalhado — ajuste item a item na próxima etapa.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 8 }}>
            {[['Piso', cfg.acabCliente.piso], ['Telhado', cfg.acabCliente.telhado], ['Esquadrias', cfg.acabCliente.esquadrias], ['Paisagismo', cfg.acabCliente.paisagismo]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{ border: '1px solid var(--line)', borderRadius: 9, padding: '8px 11px' }}>
                <div className="muted" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 1 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="sec-title" style={{ marginTop: 0 }}>{cfg.tipo === 'sobrado' ? 'Sobrado' : 'Casa térrea'} · a casa</div>
        <div className="grid2">
          <div className="field"><label>Área construída (m²)</label><input type="number" value={cfg.area} onChange={(e) => setCfg({ ...cfg, area: e.target.value })} style={inp} /></div>
          <div className="field"><label>Telhado</label><select value={cfg.telhado} onChange={(e) => { const t = TELHADOS.find((x) => x[0] === e.target.value); setCfg({ ...cfg, telhado: e.target.value, telhadoTier: t ? t[1] : 1 }) }} style={inp}>{TELHADOS.map(([n]) => <option key={n} value={n}>{n}</option>)}</select></div>
        </div>
      </div>
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="sec-title" style={{ marginTop: 0 }}>Cômodos</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
          {COMODOS.map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--line)', borderRadius: 10, padding: '9px 12px', background: 'var(--surface2)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn ghost" style={{ padding: '3px 9px' }} onClick={() => setComodo(t, (Number(cfg.comodos[t]) || 0) - 1)}>−</button>
                <b className="mono" style={{ minWidth: 16, textAlign: 'center' }}>{Number(cfg.comodos[t]) || 0}</b>
                <button className="btn ghost" style={{ padding: '3px 9px' }} onClick={() => setComodo(t, (Number(cfg.comodos[t]) || 0) + 1)}>+</button>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="sec-title" style={{ marginTop: 0 }}>Extras</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {FEATURES.map((f) => (
            <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid var(--line)', borderRadius: 10, padding: '9px 13px', cursor: 'pointer', background: cfg.features[f.key] ? 'var(--accent)' : 'var(--surface)', color: cfg.features[f.key] ? '#fff' : 'var(--ink2)', fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" checked={!!cfg.features[f.key]} onChange={(e) => setCfg({ ...cfg, features: { ...cfg.features, [f.key]: e.target.checked } })} style={{ display: 'none' }} />
              {cfg.features[f.key] ? '✓ ' : '+ '}{f.nome}
            </label>
          ))}
        </div>
      </div>
      <button className="btn" style={{ padding: '12px 20px', fontSize: 14 }} onClick={avancar}>Gerar orçamento detalhado →</button>
    </div>
  )

  /* ---------- PASSO 3: detalhado ---------- */
  const cell = { border: 'none', background: 'none', width: '100%', color: 'var(--ink)', fontSize: 13 }
  const tierBtn = (on) => ({ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: on ? 'var(--accent)' : 'var(--surface)', color: on ? '#fff' : 'var(--ink3)' })
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className="muted" style={{ fontSize: 12.5 }} onClick={() => setEtapa('config')}>← Ajustar cômodos</button>
        <span className="pill" style={{ background: 'var(--surface2)', color: 'var(--accent2)' }}>{cfg.tipo === 'sobrado' ? 'Sobrado' : 'Térrea'} · {cfg.area} m² · {Math.max(0, grupos.length - 2)} ambientes</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, border: '1px solid var(--line)', borderRadius: 8, padding: '4px 10px' }}>
          <b>Margem</b>
          <input type="number" value={margemPct} onChange={(e) => setMargemPct(e.target.value)} style={{ width: 52, textAlign: 'right', border: '1px solid var(--line)', borderRadius: 6, padding: '2px 6px', background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'IBM Plex Mono' }} />%
        </span>
        <span className="muted" style={{ fontSize: 11.5, maxWidth: 340 }}>Custo = material + execução (mão de obra já embutida). Venda = custo + margem — editável por linha.</span>
      </div>

      {grupos.map((g, gi) => (
        <div key={gi} className="card" style={{ padding: 0, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--line)' }}>
            <b style={{ fontSize: 14 }}>{g.nome}</b>
            <span style={{ display: 'inline-flex', gap: 12, alignItems: 'baseline' }}>
              <span className="muted" style={{ fontSize: 11.5 }}>custo {BRL(custoSubtotal(g))}</span>
              <span className="mono" style={{ fontWeight: 600 }}>{BRL(subtotal(g))}</span>
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
              <thead><tr>{['Item', 'Opção / nível', 'Qtd', 'Un.', 'Custo un.', 'Venda un.', 'Subtotal', ''].map((h) => (
                <th key={h} style={{ textAlign: ['Qtd', 'Custo un.', 'Venda un.', 'Subtotal'].includes(h) ? 'right' : 'left', fontSize: 10, textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700, padding: '8px 12px', borderBottom: '1px solid var(--line2)' }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {g.itens.map((it, ii) => (
                  <Fragment key={ii}>
                    <tr style={{ borderBottom: picker && picker.gi === gi && picker.ii === ii ? 'none' : '1px solid var(--line2)' }}>
                      <td style={{ padding: '6px 12px' }}><input value={it.desc} onChange={(e) => setCampo(gi, ii, 'desc', e.target.value)} style={cell} />{it.forn && <span className="muted" style={{ fontSize: 10.5 }}> · {it.forn}</span>}</td>
                      <td style={{ padding: '6px 12px', width: 220 }}>
                        {it.k === 'ch'
                          ? <span style={{ display: 'inline-flex', gap: 4 }}>{it.tiers.map((tr, s) => <button key={s} style={tierBtn(it.sel === s)} title={BRL(tr.p)} onClick={() => setTier(gi, ii, s)}>{['Popular', 'Médio', 'Alto'][s]}</button>)}</span>
                          : <button className="muted" style={{ fontSize: 11.5, color: 'var(--accent2)' }} onClick={() => setPicker({ gi, ii })}>puxar fornecedor</button>}
                        {it.k === 'ch' && <div className="muted" style={{ fontSize: 10.5, marginTop: 2 }}>{it.tiers[it.sel].n}</div>}
                      </td>
                      <td style={{ padding: '6px 12px', width: 56 }}><input type="number" value={it.qtd} onChange={(e) => setCampo(gi, ii, 'qtd', e.target.value)} style={{ ...cell, textAlign: 'right', fontFamily: 'IBM Plex Mono' }} /></td>
                      <td style={{ padding: '6px 12px', width: 44 }}><input value={it.un} onChange={(e) => setCampo(gi, ii, 'un', e.target.value)} style={cell} /></td>
                      <td style={{ padding: '6px 12px', width: 90 }}>
                        {it.k === 'ch'
                          ? <span className="mono" style={{ fontSize: 12.5, color: 'var(--ink2)' }}>{BRL(compraUn(it))}</span>
                          : <input type="number" value={it.preco} onChange={(e) => setCampo(gi, ii, 'preco', Number(e.target.value))} style={{ ...cell, textAlign: 'right', fontFamily: 'IBM Plex Mono', color: 'var(--ink2)' }} />}
                      </td>
                      <td style={{ padding: '6px 12px', width: 108 }}>
                        <input type="number" value={Math.round(vendaUn(it))} onChange={(e) => setCampo(gi, ii, 'vendaOv', e.target.value)} style={{ ...cell, textAlign: 'right', fontFamily: 'IBM Plex Mono', fontWeight: 600 }} />
                        <div className="muted" style={{ fontSize: 9.5, textAlign: 'right', marginTop: 1 }}>{compraUn(it) > 0 ? '+' + Math.round(margemDe(vendaUn(it), compraUn(it), 0) * 100) + '%' : '—'}</div>
                      </td>
                      <td className="mono" style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{BRL((Number(it.qtd) || 0) * vendaUn(it))}</td>
                      <td style={{ padding: '6px 8px', width: 22 }}><button className="muted" onClick={() => delItem(gi, ii)} style={{ fontSize: 14 }}>×</button></td>
                    </tr>
                    {picker && picker.gi === gi && picker.ii === ii && <tr><td colSpan="8" style={{ padding: 0 }}><FornecedorPicker onPick={(p) => puxarForn(gi, ii, p)} onClose={() => setPicker(null)} /></td></tr>}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '8px 12px' }}><button className="btn ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => addItem(gi)}>+ Item manual</button></div>
        </div>
      ))}

      <div className="card" style={{ padding: 18, marginTop: 4 }}>
        <div className="sec-title" style={{ marginTop: 0 }}>Dados do orçamento</div>
        <div className="grid2">
          <div className="field"><label>Cliente</label><input value={meta.cliente} onChange={(e) => setMeta({ ...meta, cliente: e.target.value })} style={inp} /></div>
          <div className="field"><label>Obra / descrição</label><input value={meta.obra} onChange={(e) => setMeta({ ...meta, obra: e.target.value })} placeholder={`${cfg.tipo === 'sobrado' ? 'Sobrado' : 'Residência'} ${cfg.area} m²`} style={inp} /></div>
          <div className="field"><label>Local</label><input value={meta.cidade} onChange={(e) => setMeta({ ...meta, cidade: e.target.value })} style={inp} /></div>
          <div className="field"><label>Vincular a uma obra (opcional)</label><select value={meta.obra_id} onChange={(e) => setMeta({ ...meta, obra_id: e.target.value })} style={inp}><option value="">— nenhuma —</option>{obras.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></div>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 26, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div className="muted" style={{ fontSize: 11 }}>Custo (interno)</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink2)' }}>{BRL(custoTotal)}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12 }}>Venda ao cliente</div>
            <div className="result-big">{BRL(total)}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11 }}>Margem</div>
            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ok)' }}>{BRL(total - custoTotal)} <span style={{ fontSize: 12 }}>({custoTotal > 0 ? Math.round((total / custoTotal - 1) * 100) : 0}%)</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saveMsg && <span style={{ fontSize: 12.5, color: 'var(--ok)' }}>{saveMsg}</span>}
          <button className="btn ghost" onClick={salvar}>Salvar no sistema</button>
          <button className="btn" onClick={() => setShowPrint(true)}>Exportar (PDF)</button>
        </div>
      </div>

      {showPrint && <OrcamentoPDF rows={flatten()} meta={{ ...meta, numero }} total={total} onClose={() => setShowPrint(false)} />}
    </div>
  )
}

function CasaIcon({ pav }) {
  return (
    <svg viewBox="0 0 80 60" width="72" height="54">
      <polygon points="8,26 40,6 72,26" fill="none" stroke="var(--accent2)" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="16" y="26" width="48" height={pav === 2 ? 30 : 22} fill="none" stroke="var(--accent2)" strokeWidth="2.5" />
      {pav === 2 && <line x1="16" y1="41" x2="64" y2="41" stroke="var(--accent2)" strokeWidth="2" />}
      <rect x="34" y={pav === 2 ? 44 : 38} width="12" height={pav === 2 ? 12 : 10} fill="var(--accent)" opacity="0.35" />
    </svg>
  )
}

function FornecedorPicker({ onPick, onClose }) {
  const [prods, setProds] = useState(null)
  const [q, setQ] = useState('')
  useEffect(() => { listProdutosComFornecedor().then(setProds).catch(() => setProds([])) }, [])
  const filtered = (prods || []).filter((p) => (p.produto + ' ' + (p.fornecedor || '')).toLowerCase().includes(q.toLowerCase()))
  return (
    <div style={{ padding: 12, background: 'var(--surface)', borderBottom: '1px solid var(--accent)' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input autoFocus placeholder="Filtrar produto ou fornecedor…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inp, flex: 1 }} />
        <button className="muted" onClick={onClose} style={{ fontSize: 13 }}>Fechar</button>
      </div>
      {prods === null ? <div className="muted" style={{ fontSize: 12.5 }}>Carregando…</div>
        : filtered.length === 0 ? <div className="muted" style={{ fontSize: 12.5 }}>Nenhum produto cadastrado nos fornecedores.</div>
          : <div style={{ maxHeight: 220, overflowY: 'auto' }}>{filtered.map((p) => (
            <div key={p.id} onClick={() => onPick(p)} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 6px', borderBottom: '1px solid var(--line2)', cursor: 'pointer', fontSize: 13 }}>
              <span><b>{p.produto}</b> <span className="muted" style={{ fontSize: 12 }}>· {p.fornecedor || 'forn.'} · {p.unidade}</span></span><b className="mono" style={{ fontSize: 13 }}>{BRL(p.valor)}</b>
            </div>))}</div>}
    </div>
  )
}

function OrcamentoPDF({ rows, meta, total, onClose }) {
  const hoje = new Date().toLocaleDateString('pt-BR')
  const validos = rows.filter((r) => (Number(r.qtd) || 0) * (Number(r.valor) || 0) > 0)
  let cat = ''
  return (
    <div className="pd-overlay">
      <div className="pd-bar">
        <button className="btn ghost" onClick={onClose}>✕ Fechar</button>
        <button className="btn" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
      </div>
      <div className="sheet">
        <div className="pd-head">
          <div className="pd-brand">
            <PlumbMark size={40} ink="#14171D" accent="#2D63E0" />
            <div><div className="nm">Prumo<span style={{ color: '#2D63E0' }}>.</span></div><div className="kick">Grupo MS · Construções Inteligentes</div></div>
          </div>
          <div className="pd-doctag"><b>Orçamento</b>Nº {meta.numero}<br />Emitido em {hoje}</div>
        </div>
        <div className="pd-title">Proposta de investimento</div>
        <div className="pd-sub">{meta.obra || 'Construção em steel frame'} — chave na mão</div>
        <div className="pd-grid">
          <div className="pd-kv"><span>Cliente</span><b>{meta.cliente || '—'}</b></div>
          <div className="pd-kv"><span>Local</span><b>{meta.cidade || '—'}</b></div>
          <div className="pd-kv"><span>Validade</span><b>{meta.validade || 15} dias</b></div>
          <div className="pd-kv"><span>Data</span><b>{hoje}</b></div>
        </div>
        <div className="pd-sec">Composição do orçamento</div>
        <table className="pd-tbl">
          <thead><tr><th>Categoria</th><th>Item</th><th className="num">Qtd</th><th className="num">Valor un.</th><th className="num">Subtotal</th></tr></thead>
          <tbody>{validos.map((r, i) => { const nova = r.categoria !== cat; cat = r.categoria; return (
            <tr key={i}><td>{nova ? <b>{r.categoria}</b> : ''}</td><td>{r.item}{r.local ? ' · ' + r.local : ''}</td><td className="num">{r.qtd} {r.un}</td><td className="num">{BRL(r.valor)}</td><td className="num"><b>{BRL((Number(r.qtd) || 0) * (Number(r.valor) || 0))}</b></td></tr>
          )})}</tbody>
        </table>
        <div className="pd-total"><div className="tl">Investimento total</div><div className="tv">{BRL(total)}</div></div>
        <div className="pd-terms">
          Proposta válida por {meta.validade || 15} dias a partir da emissão. Valores incluem material, mão de obra e gestão de obra pela
          MS Construções Inteligentes. Condições de pagamento e cronograma físico-financeiro detalhados em contrato.
          Prazo de execução definido após aprovação do projeto executivo.
        </div>
        <div className="pd-foot"><span>MS Construções Inteligentes · Nº {meta.numero}</span><span>Construindo de família para família</span></div>
      </div>
    </div>
  )
}
