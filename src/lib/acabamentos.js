// =========================================================================
//  ACABAMENTOS SELECIONÁVEIS POR AMBIENTE (piso, paredes, teto, esquadrias)
//  Cada item liga a imagem (por opção) ao preço: compra + mão de obra → venda.
//  O valor escala com o m² do ambiente (piso e teto = 1×área, parede ≈ 2,7×área,
//  esquadria por unidade estimada a partir da área).
//  Preços = médias de mercado (placeholder da planilha). Troque quando tiver
//  os valores reais dos fornecedores.
// =========================================================================
import { ACABIMG } from './acab_img'
import { precoVenda, MARGEM_PCT_PADRAO } from './custos'

// coeficiente de consumo por m² de ambiente
export const COEF = { piso: 1.0, teto: 1.0, parede: 2.7 }

// A = item de acabamento. compra em R$/unidade; mo = mão de obra como % do material.
const A = (id, superficie, nome, padrao, compra, mo, img) => ({ id, superficie, nome, padrao, compra, mo, img: img || null })

// ---- PISOS (R$/m²) ----
export const PISOS = [
  A('piso-porcelanato-acetinado', 'piso', 'Porcelanato acetinado 60×60', 'medio', 80, 0.55, ACABIMG['piso-porcelanato-acetinado']),
  A('piso-porcelanato-polido', 'piso', 'Porcelanato polido 60×60', 'medio', 90, 0.50, ACABIMG['piso-porcelanato-polido']),
  A('piso-vinilico-spc', 'piso', 'Piso vinílico / laminado SPC', 'medio', 70, 0.35, ACABIMG['piso-vinilico-spc']),
  A('piso-ceramica-premium', 'piso', 'Cerâmica premium', 'medio', 55, 0.60, ACABIMG['piso-ceramica-premium']),
  A('piso-porcelanato-retificado', 'piso', 'Porcelanato retificado grande formato', 'alto', 140, 0.50, ACABIMG['piso-porcelanato-retificado']),
  A('piso-porcelanato-marmorizado', 'piso', 'Porcelanato marmorizado polido', 'alto', 180, 0.45, ACABIMG['piso-porcelanato-marmorizado']),
  A('piso-porcelanato-importado', 'piso', 'Porcelanato importado', 'alto', 260, 0.45, ACABIMG['piso-porcelanato-importado']),
  A('piso-madeira-engenheirada', 'piso', 'Madeira engenheirada / vinílico premium', 'alto', 160, 0.40, ACABIMG['piso-madeira-engenheirada']),
]

// ---- PAREDES (R$/m² de parede; área de parede ≈ 2,7× a área do piso) ----
export const PAREDES = [
  // médio padrão
  A('par-pintura-fosca', 'parede', 'Pintura acrílica fosca', 'medio', 10, 1.30, ACABIMG['par-pintura-fosca']),
  A('par-pintura-acetinada', 'parede', 'Pintura acrílica acetinada', 'medio', 14, 1.20, ACABIMG['par-pintura-acetinada']),
  A('par-textura-grafiato', 'parede', 'Textura projetada grafiato', 'medio', 22, 0.90, ACABIMG['par-textura-grafiato']),
  A('par-textura-riscada', 'parede', 'Textura projetada riscada', 'medio', 24, 0.90, ACABIMG['par-textura-riscada']),
  A('par-revest-3d-gesso', 'parede', 'Revestimento 3D (gesso)', 'medio', 90, 0.50, ACABIMG['par-revest-3d-gesso']),
  A('par-papel-vinilico', 'parede', 'Papel de parede vinílico', 'medio', 60, 0.40, ACABIMG['par-papel-vinilico']),
  A('par-cimenticio', 'parede', 'Revestimento cimentício', 'medio', 70, 0.60, ACABIMG['par-cimenticio']),
  A('par-ceramico', 'parede', 'Revestimento cerâmico', 'medio', 55, 0.70, ACABIMG['par-ceramico']),
  // alto padrão
  A('par-pintura-premium', 'parede', 'Pintura acrílica premium', 'alto', 22, 1.10, ACABIMG['par-pintura-premium']),
  A('par-cimento-queimado', 'parede', 'Efeito cimento queimado', 'alto', 55, 0.80, ACABIMG['par-cimento-queimado']),
  A('par-microcimento', 'parede', 'Microcimento', 'alto', 120, 0.70, ACABIMG['par-microcimento']),
  A('par-pedra-natural', 'parede', 'Revestimento em pedra natural', 'alto', 130, 0.70, ACABIMG['par-pedra-natural']),
  A('par-marmore-natural', 'parede', 'Mármore natural', 'alto', 400, 0.50, ACABIMG['par-marmore-natural']),
  A('par-painel-ripado', 'parede', 'Painel ripado (madeira / WPC)', 'alto', 150, 0.35, ACABIMG['par-painel-ripado']),
  A('par-laminado', 'parede', 'Laminado de alto padrão', 'alto', 160, 0.40, ACABIMG['par-laminado']),
  A('par-metalico', 'parede', 'Revestimento metálico', 'alto', 220, 0.40, ACABIMG['par-metalico']),
  A('par-onix', 'parede', 'Ônix natural retroiluminado', 'alto', 600, 0.50, ACABIMG['par-onix']),
  A('par-quartzito', 'parede', 'Quartzito natural', 'alto', 350, 0.50, ACABIMG['par-quartzito']),
  A('par-travertino', 'parede', 'Travertino natural', 'alto', 300, 0.50, ACABIMG['par-travertino']),
  A('par-tijolo', 'parede', 'Revestimento em tijolo aparente', 'alto', 90, 0.70, ACABIMG['par-tijolo']),
  A('par-painel-3d', 'parede', 'Painel 3D alto padrão', 'alto', 120, 0.50, ACABIMG['par-painel-3d']),
  A('par-papel-importado', 'parede', 'Papel de parede importado', 'alto', 140, 0.40, ACABIMG['par-papel-importado']),
  A('par-vidro-lacobel', 'parede', 'Vidro Lacobel', 'alto', 260, 0.35, ACABIMG['par-vidro-lacobel']),
  A('par-espelho-bronze', 'parede', 'Espelho bronze / fumê', 'alto', 300, 0.35, ACABIMG['par-espelho-bronze']),
]

// ---- TETO / FORRO (R$/m²) ----
export const TETOS = [
  A('teto-gesso', 'teto', 'Forro de gesso liso', 'medio', 55, 0.60, null),
  A('teto-gesso-sanca', 'teto', 'Gesso + sanca + LED', 'alto', 90, 0.60, null),
  A('teto-forro-pvc', 'teto', 'Forro PVC premium', 'medio', 38, 0.80, ACABIMG['teto-forro-pvc']),
  A('teto-forro-wpc', 'teto', 'Forro WPC', 'alto', 90, 0.50, ACABIMG['teto-forro-wpc']),
]

// ---- ESQUADRIAS (R$/unidade; nº de unidades estimado pela área) ----
export const ESQUADRIAS = [
  A('esq-aluminio-branca', 'esquadria', 'Alumínio linha branca', 'medio', 480, 0.20, ACABIMG['esq-aluminio-branca']),
  A('esq-pvc', 'esquadria', 'PVC', 'medio', 420, 0.20, ACABIMG['esq-pvc']),
  A('esq-aluminio-anodizado', 'esquadria', 'Alumínio anodizado', 'medio', 650, 0.20, ACABIMG['esq-aluminio-anodizado']),
  A('esq-aluminio-premium', 'esquadria', 'Alumínio premium (preto / amadeirado)', 'alto', 900, 0.20, ACABIMG['esq-aluminio-premium']),
  A('esq-pvc-alto', 'esquadria', 'PVC alto desempenho', 'alto', 700, 0.20, ACABIMG['esq-pvc-alto']),
  A('esq-vidro-duplo', 'esquadria', 'Vidro duplo acústico / térmico', 'alto', 1100, 0.25, ACABIMG['esq-vidro-duplo']),
  A('esq-vidro-correr-minimal', 'esquadria', 'Vidro de correr amplo / sistema minimal', 'alto', 2200, 0.25, ACABIMG['esq-vidro-correr-minimal']),
]

// ---- TELHADO / COBERTURA (R$/m² de telhado; área ≈ projeção × 1,25) ----
const T = (id, nome, padrao, compra, mo, img, platibanda = false) => ({ id, nome, padrao, compra, mo, img: img || null, platibanda })
export const TELHADOS = [
  T('telha-concreto', 'Telha de concreto', 'medio', 55, 0.30, ACABIMG['telha-concreto']),
  T('telha-ceramica', 'Telha cerâmica', 'medio', 70, 0.35, ACABIMG['telha-ceramica']),
  T('telha-metalica', 'Telha metálica (galvalume)', 'medio', 60, 0.25, ACABIMG['telha-metalica']),
  T('fibrocimento-forro', 'Fibrocimento com forro', 'medio', 45, 0.30, ACABIMG['fibrocimento-forro']),
  T('telha-ceramica-esmaltada', 'Telha cerâmica esmaltada', 'alto', 110, 0.35, ACABIMG['telha-ceramica-esmaltada']),
  T('telha-shingle', 'Telha shingle', 'alto', 120, 0.30, ACABIMG['telha-shingle']),
  T('laje-impermeabilizada', 'Laje impermeabilizada / telhado embutido', 'alto', 130, 0.30, ACABIMG['laje-impermeabilizada']),
  T('telha-termoacustica', 'Telha termoacústica (sanduíche)', 'alto', 135, 0.25, ACABIMG['telha-termoacustica']),
  // só para platibanda
  T('platibanda-fibrocimento', 'Fibrocimento (platibanda)', 'medio', 45, 0.30, ACABIMG['platibanda-fibrocimento'], true),
  T('platibanda-metalica', 'Telha metálica (platibanda)', 'medio', 60, 0.25, ACABIMG['platibanda-metalica'], true),
]
export const TELHADOS_POR_ID = {}
TELHADOS.forEach((t) => { TELHADOS_POR_ID[t.id] = t })
export const telhadosDisponiveis = (platibanda) => TELHADOS.filter((t) => platibanda ? t.platibanda : !t.platibanda)
export const areaTelhado = (areaTotal, sobrado) => Math.round((sobrado ? areaTotal / 2 : areaTotal) * 1.25)

// ---- PAISAGISMO (venda fixa) ----
export const PAISAGISMOS = [
  { id: 'pais-entrada', nome: 'Jardim de entrada (até 9 m²)', venda: 8000, img: ACABIMG['pais-entrada'] },
  { id: 'pais-completo', nome: 'Paisagismo completo (até 18 m²)', venda: 18000, img: ACABIMG['pais-completo'] },
]
export const PAISAGISMOS_POR_ID = {}
PAISAGISMOS.forEach((p) => { PAISAGISMOS_POR_ID[p.id] = p })

export const SUPERFICIES = [
  { key: 'piso', label: 'Piso', itens: PISOS },
  { key: 'parede', label: 'Paredes', itens: PAREDES },
  { key: 'teto', label: 'Teto / forro', itens: TETOS },
  { key: 'esquadria', label: 'Esquadrias', itens: ESQUADRIAS },
]

// índice id -> item (para admin e orçamento reconstruírem a seleção)
export const ACAB_POR_ID = {}
SUPERFICIES.forEach((s) => s.itens.forEach((it) => { ACAB_POR_ID[it.id] = it }))

// venda unitária (com mão de obra + margem)
export const vendaItem = (it, margem = MARGEM_PCT_PADRAO) => precoVenda(it.compra, it.mo, margem)

// nº de esquadrias estimado pela área do ambiente
export const esquadUnidades = (area) => Math.max(1, Math.round((Number(area) || 0) / 12))

// custo (venda) de uma superfície num ambiente de `area` m²
export function custoSuperficie(superficie, it, area, margem = MARGEM_PCT_PADRAO) {
  if (!it) return 0
  const a = Number(area) || 0
  const v = vendaItem(it, margem)
  if (superficie === 'esquadria') return esquadUnidades(a) * v
  return (COEF[superficie] || 1) * a * v
}

// extrai o bloco de seleções salvo no lead (obs): [[SEL]]{...}[[/SEL]]
export function parseSelecoes(obs) {
  if (!obs) return null
  const m = String(obs).match(/\[\[SEL\]\]([\s\S]*?)\[\[\/SEL\]\]/)
  if (!m) return null
  try { return JSON.parse(m[1]) } catch (e) { return null }
}

// ambientes padrão que o cliente monta
export const AMBIENTES_BASE = [
  { tipo: 'Quarto', area: 12 }, { tipo: 'Suíte', area: 16 }, { tipo: 'Banheiro', area: 5 },
  { tipo: 'Lavabo', area: 3 }, { tipo: 'Cozinha', area: 12 }, { tipo: 'Sala de estar', area: 22 },
  { tipo: 'Sala de jantar', area: 14 }, { tipo: 'Área de serviço', area: 6 },
  { tipo: 'Escritório', area: 10 }, { tipo: 'Varanda / gourmet', area: 12 },
]
