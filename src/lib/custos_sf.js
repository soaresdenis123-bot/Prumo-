// =========================================================================
//  MOTOR DE CUSTOS — STEEL FRAME (MS Construções Inteligentes)
//  Base: planilha de referência ENG+ (mercado) + regras confirmadas pelo Denis.
//  Todos os valores são CUSTO (material e mão de obra). A venda aplica a
//  margem por cima (ver aplicarMargem no final).
//
//  Regras confirmadas:
//   • Aço: material R$17/kg + mão de obra (montador) R$10/kg = R$27/kg instalado.
//   • kg de aço da obra = (área de paredes + divisórias + laje/entrepiso, em m²) × 6.
//   • Cobertura, radier, fechamentos e forro: valor de mercado por m², com a
//     proporção material/mão de obra segundo o mercado (abaixo).
// =========================================================================

// ---- 1. AÇO / ESTRUTURA ------------------------------------------------
export const ACO = {
  material_kg: 17,      // R$/kg de aço (material)
  mo_kg: 10,            // R$/kg (mão de obra do montador)
  kg_por_m2: 6,         // kg de aço por m² de paredes + divisórias
  kg_por_m2_laje: 9,    // kg de aço por m² de laje/entrepiso (mais pesado: vigas + steel deck)
}
export const ACO_INSTALADO_KG = ACO.material_kg + ACO.mo_kg // R$27/kg

// área de laje/entrepiso: só existe em sobrado (2+ pavimentos).
// = área de piso de um pavimento × (nº de pavimentos − 1). térrea = 0.
export function areaLajeEntrepiso(areaTotalPiso, pavimentos = 1) {
  const p = Math.max(1, Number(pavimentos) || 1)
  if (p < 2) return 0
  const areaPorPav = (Number(areaTotalPiso) || 0) / p
  return Math.round(areaPorPav * (p - 1))
}

// kg de aço a partir das áreas (m²). Regra: (paredes + divisórias) × 6 + laje × 9.
// Sobrado: passe areaLaje = entrepiso (use areaLajeEntrepiso), que puxa o aço pra cima.
export function kgAco({ areaParedes = 0, areaDivisorias = 0, areaLaje = 0 }) {
  const paredes = (Number(areaParedes) + Number(areaDivisorias)) * ACO.kg_por_m2
  const laje = Number(areaLaje) * ACO.kg_por_m2_laje
  return Math.round(paredes + laje)
}
export function custoAco(areas) {
  const kg = kgAco(areas)
  const material = kg * ACO.material_kg
  const mo = kg * ACO.mo_kg
  return { kg, material, mo, total: material + mo }
}

// ---- 2. LINHAS POR m² (valor de mercado + proporção material/MO) --------
// pct_mat = fração de material; o resto é mão de obra.
const L = (nome, unidade, valor, pct_mat, desc) => ({ nome, unidade, valor, pct_mat, mo: +(valor * (1 - pct_mat)).toFixed(2), mat: +(valor * pct_mat).toFixed(2), desc })

export const LINHAS = {
  radier: L('Radier / fundação', 'm²', 400, 0.62,
    'Esgoto e infra interna, forma, lona 200µ, malha dupla, treliça H8, espaçadores, concreto FCK30 e execução.'),
  cobertura: L('Cobertura', 'm²', 250, 0.70,
    'Telha sanduíche, calhas, rufos e pingadeiras — material e mão de obra.'),
  fechamentoExterno: L('Fechamento externo (obra cinza)', 'm²', 250, 0.60,
    'Sistema cimentício/glasrocX externo completo, pronto para pintar — material e mão de obra.'),
  fechamentoInterno: L('Fechamento interno', 'm²', 120, 0.55,
    'Placa de gesso acartonado + lã de PET + tratamento de junta.'),
  forro: L('Forro acartonado', 'm²', 110, 0.55,
    'Forro de gesso acartonado liso — material e mão de obra.'),
  acompanhamento: L('Acompanhamento técnico', 'm²', 150, 0.10,
    'Acompanhamento de engenharia em todas as etapas.'), // quase tudo serviço
}

// itens por ponto / circuito (não por m²)
export const PONTOS = {
  arCondicionado: { nome: 'Ar-condicionado (ponto — infra)', unidade: 'ponto', valor: 2500, pct_mat: 0.55,
    desc: 'Infra do ponto: tubulação pex, ponto elétrico e comunicação 4 vias, dreno e reforço para evaporadora (sem o equipamento).' },
  aguaM2: { nome: 'Água (sistema pex)', unidade: 'm²', valor: 280, pct_mat: 0.55,
    desc: 'Sistema pex com quadro hidráulico de distribuição, pontos individuais.' },
  eletricaCircuito: { nome: 'Elétrica (circuito)', unidade: 'circuito', valor: 2500, pct_mat: 0.55,
    desc: 'Conduítes de distribuição individual por cômodo e circuito, caixas fixas, quadro metálico aterrado.' },
}

// ---- 3. REVESTIMENTO EXTERNO — quebra de material por m² de parede ------
// Consumos médios de mercado (por m² de face externa de parede). Ajuste com
// os seus fornecedores. `perda` já embutida nos coeficientes.
export const REVEST_EXT = {
  placaCimenticia: { nome: 'Placa cimentícia (glasrocX/externa 10–12mm)', un: 'm²', consumo_m2: 1.05, preco_un: 78 },
  mantaHidrofuga:  { nome: 'Manta hidrófuga (membrana de proteção)',       un: 'm²', consumo_m2: 1.05, preco_un: 12 },
  telaFibraVidro:  { nome: 'Tela de fibra de vidro (reforço)',             un: 'm²', consumo_m2: 1.10, preco_un: 8 },
  baseCoat:        { nome: 'Base coat (argamassa polimérica p/ embutir a tela)', un: 'kg', consumo_kg: 4.5, preco_un: 6 },
  argamassaJunta:  { nome: 'Massa/argamassa de tratamento de junta',       un: 'kg', consumo_kg: 0.5, preco_un: 9 },
}

// devolve a lista de materiais (quantidade + custo) para X m² de parede externa
export function revestimentoExterno(m2Parede) {
  const a = Number(m2Parede) || 0
  const out = []
  for (const [key, it] of Object.entries(REVEST_EXT)) {
    const consumo = it.consumo_m2 != null ? it.consumo_m2 : it.consumo_kg
    const qtd = +(consumo * a).toFixed(2)
    out.push({ key, nome: it.nome, un: it.un, consumoUnit: consumo, qtd, preco_un: it.preco_un, custo: +(qtd * it.preco_un).toFixed(2) })
  }
  const materialTotal = out.reduce((s, x) => s + x.custo, 0)
  // mão de obra do fechamento externo (do valor cheio R$250/m², parte de MO)
  const moTotal = +(LINHAS.fechamentoExterno.mo * a).toFixed(2)
  return { itens: out, materialTotal: +materialTotal.toFixed(2), moTotal, total: +(materialTotal + moTotal).toFixed(2) }
}

// ---- 4. ÁREAS AUXILIARES ------------------------------------------------
// estimativa de área de parede externa a partir da área de piso e pé-direito
// (perímetro ≈ 4·√área para planta ~quadrada; ajustável)
export function areaParedeExterna(areaPiso, peDireito = 2.8, fatorPerimetro = 4.2) {
  const lado = Math.sqrt(Math.max(0, Number(areaPiso) || 0))
  const perimetro = fatorPerimetro * lado
  return +(perimetro * peDireito).toFixed(1)
}

// ---- 5. MARGEM / VENDA --------------------------------------------------
export const MARGEM_PADRAO = 0.10 // 10% sobre o custo (alinhado ao Prumo)
export const aplicarMargem = (custo, margem = MARGEM_PADRAO) => +(custo * (1 + margem)).toFixed(2)
