// =========================================================================
//  MOTOR DE PROMPT — traduz a seleção de acabamentos de cada ambiente
//  numa descrição visual (inglês, que os modelos de imagem entendem melhor)
//  para gerar a "foto do cômodo" na versão real (OpenAI / Flux / Imagen).
//
//  Uso:  montarPromptAmbiente(amb, { padrao, modelo })
//        amb = { tipo, area, sel: { piso, parede, teto, esquadria, loucas } }
//  Retorna { prompt, negative, resumoPt } — resumoPt é só pra conferência humana.
//
//  Nada aqui chama IA. É só a tradução. O backend usa `prompt`/`negative`.
// =========================================================================
import { ACAB_POR_ID } from './acabamentos'

// ---- tradução visual dos materiais (por id do catálogo) ----
const MAT = {
  // pisos
  'piso-porcelanato-acetinado': 'large satin-finish porcelain floor tiles, soft light beige',
  'piso-porcelanato-polido': 'polished porcelain floor tiles with a subtle sheen',
  'piso-vinilico-spc': 'warm wood-look SPC vinyl plank flooring',
  'piso-ceramica-premium': 'clean ceramic floor tiles, neutral tone',
  'piso-porcelanato-retificado': 'large-format rectified porcelain floor, seamless grout lines',
  'piso-porcelanato-marmorizado': 'polished marble-look porcelain floor, white with soft grey veining',
  'piso-porcelanato-importado': 'premium imported porcelain floor, refined marble pattern',
  'piso-madeira-engenheirada': 'engineered wood plank flooring, natural oak tone',
  // paredes
  'par-pintura-fosca': 'smooth matte painted walls, warm off-white',
  'par-pintura-acetinada': 'smooth satin painted walls, soft neutral',
  'par-textura-grafiato': 'lightly textured graffiato painted wall',
  'par-textura-riscada': 'subtly combed-texture painted wall',
  'par-revest-3d-gesso': 'one accent wall in 3D plaster relief panels',
  'par-papel-vinilico': 'vinyl wallpaper accent wall, discreet pattern',
  'par-cimenticio': 'cementitious wall cladding, contemporary grey',
  'par-ceramico': 'ceramic wall tiles',
  'par-pintura-premium': 'premium matte painted walls, elegant neutral',
  'par-cimento-queimado': 'burnished cement (cimento queimado) wall finish, soft grey',
  'par-microcimento': 'microcement wall finish, seamless warm grey',
  'par-pedra-natural': 'natural stone cladding accent wall',
  'par-marmore-natural': 'natural marble slab feature wall',
  'par-painel-ripado': 'slatted wood (ripado) accent wall panel, warm tone',
  'par-laminado': 'high-end laminate wall panel',
  'par-metalico': 'brushed metallic accent panel',
  'par-onix': 'backlit onyx feature wall, glowing veins',
  'par-quartzito': 'natural quartzite feature wall',
  'par-travertino': 'travertine stone wall finish',
  'par-tijolo': 'exposed brick accent wall',
  'par-painel-3d': 'sculptural 3D wall panel accent',
  'par-papel-importado': 'imported designer wallpaper accent wall',
  'par-vidro-lacobel': 'coloured back-painted glass (Lacobel) wall',
  'par-espelho-bronze': 'bronze/smoked mirror accent wall',
  // tetos
  'teto-gesso': 'flat smooth plaster ceiling',
  'teto-gesso-sanca': 'plaster ceiling with cove lighting (sanca) and warm LED strip',
  'teto-forro-pvc': 'clean PVC lining ceiling',
  'teto-forro-wpc': 'WPC wood-look slatted ceiling',
  // esquadrias
  'esq-aluminio-branco-persiana': 'white aluminium windows with integrated roller shutter',
  'esq-pvc-persiana': 'white PVC windows with integrated shutter',
  'esq-aluminio-cor-persiana': 'dark-framed aluminium windows with integrated shutter',
  'esq-aluminio-branco-vidro': 'white aluminium framed glass window',
  'esq-pvc-vidro': 'white PVC framed glass window',
  'esq-aluminio-cor-vidro': 'black-framed aluminium glass window',
  'esq-vidro-correr-minimal': 'large minimal-frame sliding glass doors, floor to ceiling',
}

// ---- base de cada ambiente: o que precisa aparecer na cena ----
const ROOM = {
  Quarto: { en: 'a modern bedroom with a made double bed, bedside tables and soft styling', pov: 'wide-angle interior photo from the doorway' },
  'Suíte': { en: 'a master suite bedroom with a large bed, integrated wardrobe and an en-suite feel', pov: 'wide-angle interior photo' },
  Banheiro: { en: 'a bathroom with vanity, toilet, glass shower enclosure and shower', pov: 'wide-angle interior photo' },
  Lavabo: { en: 'a compact powder room (lavabo) with a vessel basin and toilet, no shower', pov: 'interior photo' },
  Cozinha: { en: 'a kitchen with cabinetry, countertop, sink and appliances', pov: 'wide-angle interior photo' },
  'Sala de estar': { en: 'a living room with a sofa, rug and contemporary furniture', pov: 'wide-angle interior photo' },
  'Sala de jantar': { en: 'a dining room with a table and chairs', pov: 'wide-angle interior photo' },
  'Área de serviço': { en: 'a laundry / service room with a utility sink and cabinetry', pov: 'interior photo' },
  Escritório: { en: 'a home office with a desk and shelving', pov: 'wide-angle interior photo' },
  'Varanda / gourmet': { en: 'a covered gourmet balcony with barbecue counter and seating', pov: 'wide-angle photo' },
  Varanda: { en: 'a covered balcony with seating', pov: 'wide-angle photo' },
}

// louças: usa a descrição do kit do catálogo (já em PT), traduz o essencial
const LOUCAS_EN = {
  'loucas-banheiro-medio': 'chrome fixtures, wall-mounted toilet with cistern, vessel basin, glass shower box, hand shower',
  'loucas-banheiro-alto': 'brushed-gold fixtures, wall-hung toilet, sculpted basin, rain shower head, large glass shower box',
  'loucas-suite-medio': 'stone vanity counter with basin, chrome fixtures, glass shower box, rain shower',
  'loucas-suite-alto': 'double-basin marble vanity, brushed-gold fixtures, ceiling rain shower, large walk-in glass shower box',
  'loucas-lavabo-medio': 'white vessel basin and chrome tall faucet, toilet with cistern',
  'loucas-lavabo-alto': 'sculpted vessel basin, coloured single-lever faucet, wall-hung toilet',
  'loucas-cozinha-medio': 'stainless steel sink with a chrome kitchen faucet',
  'loucas-cozinha-alto': 'double stainless sink, gooseneck gourmet faucet, countertop water purifier',
  'loucas-servico-medio': 'ceramic utility tub with tap',
  'loucas-servico-alto': 'countertop utility basin with single-lever faucet',
}

const feat = (id) => (id && MAT[id]) ? MAT[id] : null

// nível → linguagem de estilo
const ESTILO = {
  alto: 'high-end upscale Brazilian residential interior, sophisticated, magazine-quality',
  medio: 'comfortable modern Brazilian residential interior, clean and tasteful',
}

export function montarPromptAmbiente(amb, opts = {}) {
  const tipo = amb?.tipo || 'Quarto'
  const room = ROOM[tipo] || ROOM['Quarto']
  const padrao = (opts.padrao === 'alto') ? 'alto' : (opts.padrao === 'medio' ? 'medio' : (String(amb?.padrao || '').includes('alto') ? 'alto' : 'medio'))

  const piso = feat(amb?.sel?.piso)
  const parede = feat(amb?.sel?.parede)
  const teto = feat(amb?.sel?.teto)
  const esq = feat(amb?.sel?.esquadria)
  const loucas = amb?.sel?.loucas ? LOUCAS_EN[amb.sel.loucas] : null

  const partes = []
  if (piso) partes.push(`floor: ${piso}`)
  if (parede) partes.push(`walls: ${parede}`)
  if (teto) partes.push(`ceiling: ${teto}`)
  if (esq) partes.push(`windows/doors: ${esq}`)
  if (loucas) partes.push(`fixtures: ${loucas}`)

  const prompt = [
    `${room.pov} of ${room.en}`,
    partes.join(', '),
    ESTILO[padrao],
    'realistic photograph, soft natural daylight, shallow depth of field, architectural interior photography, 4:3, no people, no text, no watermark',
  ].filter(Boolean).join('. ')

  const negative = 'text, watermark, logo, distorted proportions, extra rooms, lowres, cartoon, cluttered, dirty, unrealistic lighting'

  // resumo em PT só para conferência humana no painel
  const nomePt = (id) => ACAB_POR_ID[id]?.nome
  const resumoPt = {
    ambiente: tipo,
    area: amb?.area,
    piso: nomePt(amb?.sel?.piso) || '—',
    parede: nomePt(amb?.sel?.parede) || '—',
    teto: nomePt(amb?.sel?.teto) || '—',
    esquadria: nomePt(amb?.sel?.esquadria) || '—',
    loucas: nomePt(amb?.sel?.loucas) || '—',
  }

  return { prompt, negative, resumoPt }
}

// monta os prompts de todos os ambientes de uma seleção (para gerar o projeto visual)
export function montarPromptsProjeto(selecoes, opts = {}) {
  if (!Array.isArray(selecoes)) return []
  return selecoes.map((amb, i) => ({ idx: i, ...montarPromptAmbiente(amb, opts) }))
}
