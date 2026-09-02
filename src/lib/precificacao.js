// =========================================================================
//  PRECIFICAÇÃO — fachada da estimativa (usa o motor de custos custos.js)
//  Serviços/projetos: valores REAIS por m² (documento de contratação).
//  Obra: puxada do motor (OBRA_VENDA_M2), que você troca com seus custos.
//  A estimativa do cliente escala com área, cômodos, extras e paisagismo.
// =========================================================================
import { OBRA_VENDA_M2, EXTRAS_VENDA, PAISAGISMO_VENDA, AREA_COMODO } from './custos'

// Projetos & serviços inclusos na contratação (R$/m²) — valores fixos.
export const SERVICOS = [
  { nome: 'Projeto de arquitetura', m2: 100, desc: 'Entrevista, projeto 3D, arquitetônico, hidrossanitário, elétrico e aprovações (cliente/condomínio e prefeitura).' },
  { nome: 'Projeto estrutural steel frame', m2: 45, desc: 'Planta de perfis e fixação, manual técnico e lista de materiais.' },
  { nome: 'Projeto estrutural de fundação', m2: 60, desc: 'Planta de armadura, dimensional e instalações enterradas.' },
  { nome: 'Processo de aprovação (Caixa)', m2: 20, desc: 'Book de projetos + memoriais descritivos e cronograma físico-financeiro.' },
  { nome: 'Projeto de paisagismo', m2: 30, opcional: true, desc: 'Conceito, projeto, estudo de iluminação, 3D, espécies e materiais.' },
  { nome: 'Book de entrega de obra', m2: 0, desc: 'Projetos aprovados + ART, manual de uso e manutenção, notas fiscais e certificados de garantia dos materiais.' },
]

export const servicosM2 = (comPaisagismo) =>
  SERVICOS.filter((s) => !s.opcional || comPaisagismo).reduce((t, s) => t + s.m2, 0)

// estima a área a partir dos cômodos (quando o cliente não informa m²)
export function areaDosComodos(comodos = {}) {
  let a = 0
  Object.entries(comodos).forEach(([c, n]) => {
    const q = Number(n) || 0
    const chave = c.toLowerCase()
    a += q * (AREA_COMODO[chave] || 8)
  })
  return a ? Math.round(a * 1.15) : 0 // +15% de circulação/paredes
}

const escopoPaisagismo = (txt) => {
  if (!txt) return null
  return /completo|18/.test(txt.toLowerCase()) ? 'completo' : 'entrada'
}

// -------------------------------------------------------------------------
//  ESTIMATIVA (faixa de venda, chave na mão). Aceita um objeto de programa;
//  também aceita a chamada antiga estimativa(area, padrao, comPaisagismo).
// -------------------------------------------------------------------------
export function estimativa(programa, padraoLegado, comPaisLegado) {
  const p = (typeof programa === 'object' && programa !== null)
    ? programa
    : { area: programa, padrao: padraoLegado, paisagismo: comPaisLegado ? 'completo' : '' }

  const padrao = String(p.padrao || '').toLowerCase().includes('alto') ? 'alto' : 'medio'
  const areaInformada = Number(p.area) || 0
  const areaCom = areaDosComodos(p.comodos)
  const area = areaInformada || areaCom || (p.tipo === 'sobrado' ? 150 : 100)

  const pais = escopoPaisagismo(p.paisagismo)
  const serv = area * servicosM2(!!pais)
  const obra = area * (OBRA_VENDA_M2[padrao] || OBRA_VENDA_M2.medio)

  let extrasV = 0
  const ex = p.extras || {}
  if (ex.piscina || ex.Piscina) extrasV += EXTRAS_VENDA.piscina
  if (ex.gourmet || ex['Área gourmet / churrasqueira']) extrasV += EXTRAS_VENDA.gourmet
  if (ex.lareira || ex.Lareira) extrasV += EXTRAS_VENDA.lareira
  const paisV = pais ? (PAISAGISMO_VENDA[pais] || 0) : 0

  const base = obra + serv + extrasV + paisV
  const round = (n) => Math.round(n / 1000) * 1000
  return {
    area, padrao, servM2: servicosM2(!!pais),
    min: round(base * 0.92), max: round(base * 1.12),
  }
}

export const brl = (n) => 'R$ ' + Math.round(Number(n) || 0).toLocaleString('pt-BR')
