// =========================================================================
//  MOTOR DE CUSTOS — base única de preços do Prumo
//  Cada item tem CUSTO DE COMPRA (material, o que a MS paga). Sobre ele
//  entram a MÃO DE OBRA (% do material) e a MARGEM de venda (editável).
//     venda = compra × (1 + mão de obra) × (1 + margem)
//
//  Preços = MÉDIA pesquisada nas melhores praças de RS / SC / PR (set/2026).
//  São PLACEHOLDERS realistas — quando chegarem os portfólios e planilhas
//  dos fornecedores, é só trocar os números aqui que todo o sistema (a
//  estimativa do cliente e o orçamento detalhado) se ajusta sozinho.
// =========================================================================

// ---- fatores globais (editáveis na tela do orçamento) ----
export const MO_PCT_PADRAO = 0.25 // mão de obra: 25% (faixa aceita 20%–30%)
export const MO_MIN = 0.20
export const MO_MAX = 0.30
export const MARGEM_PCT_PADRAO = 0.30 // margem de venda inicial: 30%

// custo instalado = material + mão de obra
export const custoInstalado = (compra, mo = MO_PCT_PADRAO) => (Number(compra) || 0) * (1 + mo)
// preço de venda ao cliente = custo instalado + margem
export const precoVenda = (compra, mo = MO_PCT_PADRAO, margem = MARGEM_PCT_PADRAO) =>
  custoInstalado(compra, mo) * (1 + margem)
// margem embutida a partir de um preço de venda editado manualmente
export const margemDe = (venda, compra, mo = MO_PCT_PADRAO) => {
  const ci = custoInstalado(compra, mo)
  return ci > 0 ? (Number(venda) || 0) / ci - 1 : 0
}

// =========================================================================
//  CATÁLOGO DE MATERIAIS + MÃO DE OBRA (médias RS/SC/PR — compra)
//  coef = consumo por m² de piso/parede quando aplicável (pra insumos).
//  Serve de referência única e alimenta a planilha que vai pro Denis.
// =========================================================================
export const MATERIAIS = [
  // --- ESTRUTURA / OBRA CINZA (steel frame) ---
  { cat: 'Estrutura', nome: 'Fundação — radier (concreto + armadura)', un: 'm²', compra: 220, mo: 0.30, nota: 'por m² de projeção' },
  { cat: 'Estrutura', nome: 'Kit estrutura steel frame (perfis galvanizados)', un: 'm²', compra: 380, mo: 0.32, nota: 'perfis + fixação' },
  { cat: 'Estrutura', nome: 'Montagem da estrutura (mão de obra)', un: 'm²', compra: 0, mo: 0, nota: 'incluída no % de MO' },
  { cat: 'Estrutura', nome: 'Fechamento OSB + placa cimentícia + isolamento (lã)', un: 'm²', compra: 150, mo: 0.35, nota: 'parede dupla face' },
  { cat: 'Estrutura', nome: 'Entrepiso / laje seca (sobrado)', un: 'm²', compra: 160, mo: 0.30 },
  { cat: 'Estrutura', nome: 'Impermeabilização (áreas molhadas + radier)', un: 'm²', compra: 35, mo: 0.30 },

  // --- COBERTURA ---
  { cat: 'Cobertura', nome: 'Telha fibrocimento + estrutura', un: 'm²', compra: 55, mo: 0.30 },
  { cat: 'Cobertura', nome: 'Telha cerâmica + madeiramento', un: 'm²', compra: 95, mo: 0.35 },
  { cat: 'Cobertura', nome: 'Telha shingle', un: 'm²', compra: 120, mo: 0.30 },
  { cat: 'Cobertura', nome: 'Telha metálica termoacústica (sanduíche)', un: 'm²', compra: 135, mo: 0.25 },
  { cat: 'Cobertura', nome: 'Manta subcobertura + calhas + rufos', un: 'm²', compra: 25, mo: 0.30 },

  // --- REVESTIMENTOS DE PISO (material, por m²) ---
  { cat: 'Revestimentos', nome: 'Porcelanato popular 60×60', un: 'm²', compra: 45, mo: 0, nota: 'compra do piso' },
  { cat: 'Revestimentos', nome: 'Porcelanato médio 60×60 (acetinado/polido)', un: 'm²', compra: 80, mo: 0 },
  { cat: 'Revestimentos', nome: 'Porcelanato retificado 80×80 / 90×90', un: 'm²', compra: 140, mo: 0 },
  { cat: 'Revestimentos', nome: 'Porcelanato grande formato / marmorizado', un: 'm²', compra: 240, mo: 0 },
  { cat: 'Revestimentos', nome: 'Argamassa colante AC-III (assentamento)', un: 'm²', compra: 9, coef: 1, mo: 0, nota: '~R$32/saco 20kg, rende ~4 m²' },
  { cat: 'Revestimentos', nome: 'Rejunte', un: 'm²', compra: 7, coef: 1, mo: 0 },
  { cat: 'Revestimentos', nome: 'Regularização / contrapiso', un: 'm²', compra: 18, mo: 0.30 },
  { cat: 'Revestimentos', nome: 'Mão de obra assentamento de piso', un: 'm²', compra: 0, mo: 0, nota: 'R$45–80/m² — no % de MO' },
  { cat: 'Revestimentos', nome: 'Rodapé (material)', un: 'm', compra: 18, mo: 0, nota: 'porcelanato/poliestireno' },

  // --- PAREDES / PINTURA ---
  { cat: 'Pintura', nome: 'Massa corrida + selador (material)', un: 'm²', compra: 9, mo: 0 },
  { cat: 'Pintura', nome: 'Tinta acrílica premium (material, 2 demãos)', un: 'm²', compra: 12, mo: 0, nota: 'lata 18L ~R$320' },
  { cat: 'Pintura', nome: 'Textura / grafiato (material)', un: 'm²', compra: 20, mo: 0 },
  { cat: 'Pintura', nome: 'Mão de obra pintura', un: 'm²', compra: 0, mo: 0, nota: 'R$12–18/m² — no % de MO' },

  // --- FORRO ---
  { cat: 'Acabamentos', nome: 'Forro PVC (material)', un: 'm²', compra: 38, mo: 0.30 },
  { cat: 'Acabamentos', nome: 'Forro de gesso liso', un: 'm²', compra: 55, mo: 0.35 },
  { cat: 'Acabamentos', nome: 'Forro gesso + sanca + LED', un: 'm²', compra: 90, mo: 0.35 },
  { cat: 'Acabamentos', nome: 'Drywall (parede interna)', un: 'm²', compra: 90, mo: 0.30 },

  // --- ESQUADRIAS ---
  { cat: 'Esquadrias', nome: 'Janela alumínio linha branca', un: 'un', compra: 480, mo: 0.20 },
  { cat: 'Esquadrias', nome: 'Janela alumínio premium (preto/amadeirado)', un: 'un', compra: 900, mo: 0.20 },
  { cat: 'Esquadrias', nome: 'Vidro de correr amplo / temperado', un: 'm²', compra: 220, mo: 0.25 },
  { cat: 'Esquadrias', nome: 'Porta interna semi-oca', un: 'un', compra: 320, mo: 0.25 },
  { cat: 'Esquadrias', nome: 'Porta madeira / maciça', un: 'un', compra: 550, mo: 0.25 },
  { cat: 'Esquadrias', nome: 'Box de vidro temperado', un: 'un', compra: 550, mo: 0.20 },
  { cat: 'Esquadrias', nome: 'Portão de garagem automatizado', un: 'un', compra: 3200, mo: 0.20 },

  // --- LOUÇAS / METAIS ---
  { cat: 'Louças / Metais', nome: 'Vaso sanitário popular', un: 'un', compra: 350, mo: 0.20 },
  { cat: 'Louças / Metais', nome: 'Vaso sanitário médio', un: 'un', compra: 800, mo: 0.20 },
  { cat: 'Louças / Metais', nome: 'Vaso sanitário alto padrão', un: 'un', compra: 1800, mo: 0.15 },
  { cat: 'Louças / Metais', nome: 'Bancada granito / quartzo', un: 'm', compra: 550, mo: 0.20, nota: 'R$350–1500/m²' },
  { cat: 'Louças / Metais', nome: 'Conjunto metais (torneira/chuveiro/registro)', un: 'cj', compra: 700, mo: 0.15 },

  // --- INSTALAÇÕES ---
  { cat: 'Elétrica', nome: 'Ponto elétrico completo (tomada/interruptor/luz)', un: 'pt', compra: 20, mo: 1.25, nota: 'MO ~R$25/ponto' },
  { cat: 'Elétrica', nome: 'Entrada de energia + quadro (QDC)', un: 'vb', compra: 2800, mo: 0.20 },
  { cat: 'Iluminação', nome: 'Luminária LED / spot (material)', un: 'un', compra: 60, mo: 0.30 },
  { cat: 'Hidráulica', nome: 'Ponto hidráulico completo', un: 'pt', compra: 30, mo: 1.10, nota: 'MO ~R$25–35/ponto' },
  { cat: 'Hidráulica', nome: 'Barrilete / instalação geral', un: 'vb', compra: 3200, mo: 0.20 },

  // --- MARCENARIA ---
  { cat: 'Marcenaria', nome: 'Marcenaria planejada (cozinha/dorm.)', un: 'm', compra: 1200, mo: 0.15, nota: 'por metro linear' },

  // --- PAISAGISMO / EXTERNO ---
  { cat: 'Jardinagem', nome: 'Jardim de entrada (até 9 m²) — completo', un: 'vb', compra: 4500, mo: 0.30, nota: 'palmeira, forrações, iluminação' },
  { cat: 'Jardinagem', nome: 'Paisagismo completo (até 18 m²)', un: 'vb', compra: 10500, mo: 0.30, nota: 'canteiros, pedras, iluminação' },
  { cat: 'Externo', nome: 'Piscina (fibra/vinil)', un: 'vb', compra: 28000, mo: 0.20 },
  { cat: 'Externo', nome: 'Área gourmet / churrasqueira', un: 'vb', compra: 8000, mo: 0.25 },
  { cat: 'Externo', nome: 'Lareira', un: 'vb', compra: 5000, mo: 0.25 },
]

// =========================================================================
//  COMPOSIÇÃO POR m² (venda, chave na mão) — usada pela ESTIMATIVA do cliente.
//  Buildup material+MO derivado do catálogo acima; a venda já inclui margem
//  padrão. Escala direto com a área. Troque com seus custos reais depois.
// =========================================================================
export const OBRA_VENDA_M2 = {
  medio: 3400, // R$/m² — steel frame chave na mão, médio padrão (RS/SC/PR)
  alto: 4600,  // R$/m² — alto padrão
}

// adicionais de venda (fora do m² de obra)
export const EXTRAS_VENDA = { piscina: 45000, gourmet: 13000, lareira: 8000 }
export const PAISAGISMO_VENDA = { entrada: 8000, completo: 18000 }

// área média por cômodo (pra estimar m² quando o cliente não informa)
export const AREA_COMODO = {
  quartos: 12, suítes: 16, banheiros: 5, lavabo: 3, cozinha: 12,
  'sala de estar': 22, 'sala de jantar': 14, 'garagem (vagas)': 15,
  'área de serviço': 6, escritório: 10, varanda: 10,
}
