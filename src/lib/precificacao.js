// =========================================================================
//  PRECIFICAÇÃO — base interna da estimativa
//  Serviços/projetos: valores REAIS por m² (do documento de contratação).
//  Obra (material + execução): faixa por m², PLACEHOLDER — ajuste com os
//  seus custos reais antes de divulgar. O cliente vê só a faixa final.
// =========================================================================

// Serviços inclusos na contratação (R$/m²) — valores fixos e conhecidos.
export const SERVICOS = [
  { nome: 'Projeto de arquitetura', m2: 100, desc: 'Entrevista, projeto 3D, arquitetônico, hidrossanitário, elétrico e aprovações (cliente/condomínio e prefeitura).' },
  { nome: 'Projeto estrutural steel frame', m2: 45, desc: 'Planta de perfis e fixação, manual técnico e lista de materiais.' },
  { nome: 'Projeto estrutural de fundação', m2: 60, desc: 'Planta de armadura, dimensional e instalações enterradas.' },
  { nome: 'Processo de aprovação (Caixa)', m2: 20, desc: 'Book de projetos + memoriais descritivos e cronograma físico-financeiro.' },
  { nome: 'Projeto de paisagismo', m2: 30, opcional: true, desc: 'Conceito, projeto, estudo de iluminação, 3D, espécies e materiais.' },
  { nome: 'Book de entrega de obra', m2: 0, desc: 'Projetos aprovados + ART, manual de uso e manutenção, notas fiscais e certificados de garantia dos materiais.' },
]

// >>> AJUSTE: faixa de investimento da OBRA (material + execução), em R$/m².
//     É o que varia com acabamentos e revestimentos. Estes números são um
//     ponto de partida — troque pelos seus reais quando tiver os portfólios.
export const OBRA_M2 = {
  medio: [2600, 3900],
  alto: [3900, 6200],
}

export const servicosM2 = (comPaisagismo) =>
  SERVICOS.filter((s) => !s.opcional || comPaisagismo).reduce((t, s) => t + s.m2, 0)

// Estimativa final (faixa): serviços (fixo) + obra (faixa) × área.
export function estimativa(area, padrao, comPaisagismo = false) {
  const a = Number(area) || 0
  const serv = servicosM2(comPaisagismo)
  const [omin, omax] = OBRA_M2[padrao === 'alto' ? 'alto' : 'medio']
  const round = (n) => Math.round(n / 1000) * 1000 // arredonda pro milhar
  return {
    area: a, servM2: serv, obraMin: omin, obraMax: omax,
    min: round(a * (serv + omin)), max: round(a * (serv + omax)),
  }
}

export const brl = (n) => 'R$ ' + Math.round(Number(n) || 0).toLocaleString('pt-BR')
