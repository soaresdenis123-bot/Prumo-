// =========================================================================
//  PORTFÓLIO DE ACABAMENTOS — catálogo de materiais MS (imagens em /materiais)
//  Cada categoria tem 3 opções. Imagem: /materiais/<slug>.jpg
//  Para trocar/atualizar, é só substituir o arquivo ou editar aqui.
// =========================================================================
import { IMG } from './materiais_img'
const M = (slug, nome, grupo, opcoes) => ({ slug, nome, grupo, opcoes, img: IMG[slug] })

export const GRUPOS = [
  'Esquadrias & Portas', 'Coberturas', 'Pisos & Decks',
  'Painéis & Ripados', 'Pedras & Mármores', 'Fachada & Brises', 'Forros', 'Arremates',
  'Paisagismo · Fachadas', 'Paisagismo · Jardins', 'Paisagismo · Áreas externas',
  'Paisagismo · Árvores & detalhes', 'Paisagismo · Composições',
]

export const MATERIAIS_CAT = [
  M('esquadrias-aluminio', 'Esquadrias de Alumínio', 'Esquadrias & Portas', ['Preto Fosco', 'Cinza Anodizado', 'Bronze']),
  M('esquadrias-pvc', 'Esquadrias de PVC', 'Esquadrias & Portas', ['Branco', 'Cinza Claro', 'Amadeirado']),
  M('esquadrias-madeira', 'Esquadrias de Madeira', 'Esquadrias & Portas', ['Madeira Clara', 'Madeira Escura', 'Madeira Rústica']),
  M('portas-entrada', 'Portas de Entrada', 'Esquadrias & Portas', ['Madeira Maciça', 'ACM Preto', 'Pivotante Madeira']),

  M('telhas-ceramicas', 'Telhas Cerâmicas', 'Coberturas', ['Bege', 'Terracota', 'Cinza']),
  M('telhas-metalicas', 'Telhas Metálicas', 'Coberturas', ['Trapezoidal', 'Ondulada', 'Termoacústica']),
  M('telhas-shingle', 'Telhas Shingle', 'Coberturas', ['Preto', 'Marrom', 'Cinza']),
  M('pergolados-coberturas', 'Pergolados e Coberturas', 'Coberturas', ['Alumínio', 'Madeira', 'Policarbonato']),
  M('calhas-rufos', 'Calhas e Rufos', 'Coberturas', ['Galvanizado', 'Branco', 'Preto']),

  M('piso-wpc', 'Piso WPC (interno)', 'Pisos & Decks', ['Carvalho Claro', 'Freijó', 'Nogueira']),
  M('deck-wpc', 'Deck WPC (externo)', 'Pisos & Decks', ['Ipê', 'Teca', 'Cinza']),

  M('painel-ripado-interno', 'Painel Ripado Interno (WPC)', 'Painéis & Ripados', ['Carvalho', 'Nogueira', 'Cinza']),
  M('painel-ripado-externo', 'Painel Ripado Externo (WPC)', 'Painéis & Ripados', ['Teca', 'Ipê', 'Grafite']),
  M('painel-ripado-pvc', 'Painel Ripado PVC', 'Painéis & Ripados', ['Branco', 'Amadeirado', 'Preto']),
  M('painel-ripado-ps', 'Painel Ripado PS', 'Painéis & Ripados', ['Madeira', 'Branco', 'Preto']),
  M('painel-decorativo-uv', 'Painel Decorativo UV', 'Painéis & Ripados', ['Mármore Branco', 'Nogueira', 'Cinza Concreto']),
  M('painel-3d', 'Painel 3D', 'Painéis & Ripados', ['Geométrico', 'Ondas', 'Cubos']),
  M('painel-acustico', 'Painel Acústico (interno)', 'Painéis & Ripados', ['Ripado', 'Microperfurado', 'Com Tela']),
  M('painel-parede-spc', 'Painel de Parede SPC', 'Painéis & Ripados', ['Ripado', 'Mármore', 'Concreto']),
  M('painel-parede-wpc', 'Painel de Parede WPC', 'Painéis & Ripados', ['Carvalho', 'Nogueira', 'Cinza']),
  M('painel-parede-pvc', 'Painel de Parede PVC', 'Painéis & Ripados', ['Branco Liso', 'Amadeirado', 'Mármore']),
  M('painel-acm', 'Painel ACM', 'Painéis & Ripados', ['Preto', 'Branco', 'Madeira']),

  M('revestimento-pedra-flexivel', 'Revestimento em Pedra Flexível', 'Pedras & Mármores', ['Pedra Natural', 'Quartzito', 'Ardósia']),
  M('pedra-flexivel', 'Pedra Flexível', 'Pedras & Mármores', ['Areia', 'Cinza', 'Ferrugem']),
  M('marmore-flexivel', 'Mármore Flexível', 'Pedras & Mármores', ['Branco', 'Bege', 'Preto']),
  M('painel-imitacao-pedra-marmore', 'Imitação Pedra / Mármore', 'Pedras & Mármores', ['Pedra', 'Mármore Branco', 'Travertino']),

  M('wpc-fachada', 'WPC para Fachada', 'Fachada & Brises', ['Madeira Clara', 'Nogueira', 'Cinza']),
  M('brise-wpc', 'Brise WPC', 'Fachada & Brises', ['Carvalho', 'Nogueira', 'Cinza']),
  M('brise-aluminio', 'Brise Alumínio', 'Fachada & Brises', ['Preto', 'Cinza', 'Branco']),

  M('forro-wpc', 'Forro WPC', 'Forros', ['Carvalho', 'Nogueira', 'Cinza']),
  M('forro-pvc-premium', 'Forro PVC Premium', 'Forros', ['Branco', 'Madeira Clara', 'Cinza Claro']),
  M('painel-pet-acustico', 'Painel PET Acústico', 'Forros', ['Cinza Claro', 'Bege', 'Verde']),

  M('rodape-wpc', 'Rodapé WPC', 'Arremates', ['Carvalho', 'Branco', 'Nogueira']),
  M('rodape-pvc', 'Rodapé PVC', 'Arremates', ['Branco', 'Bege', 'Preto']),
  M('rodape-ps', 'Rodapé PS', 'Arremates', ['Branco', 'Off White', 'Cinza Claro']),
  M('molduras-boiserie', 'Molduras / Boiserie', 'Arremates', ['Clássica', 'Moderna', 'Minimalista']),
  M('perfis-acabamento', 'Perfis de Acabamento', 'Arremates', ['Preto', 'Dourado', 'Prata Escovado']),

  // ---- PAISAGISMO ----
  M('pais-fachada-terrea', 'Fachadas e Entradas · Térreas', 'Paisagismo · Fachadas', ['Moderna e Minimalista', 'Tropical Contemporânea', 'Rústica Chic']),
  M('pais-fachada-sobrado', 'Fachadas e Entradas · 2 Pavimentos', 'Paisagismo · Fachadas', ['Contemporânea com Muro Verde', 'Moderna com Palmeiras', 'Clássica Elegante']),

  M('pais-jardim-tropical', 'Jardins com Palmeiras e Tropicais', 'Paisagismo · Jardins', ['Palmeiras Imperiais com Iluminação', 'Jardim Tropical Denso', 'Mix de Palmeiras e Folhagens']),
  M('pais-jardim-minimalista', 'Jardins Minimalistas', 'Paisagismo · Jardins', ['Pedras e Suculentas', 'Jardim Seco Contemporâneo', 'Linhas Retas e Vegetação Baixa']),
  M('pais-jardim-flores', 'Jardins com Flores e Coloridos', 'Paisagismo · Jardins', ['Boulevard Florido', 'Massas de Flores e Arbustos', 'Jardim Romântico']),
  M('pais-jardins-internos', 'Jardins Internos e Pátios', 'Paisagismo · Jardins', ['Jardim Interno com Pedras', 'Pátio Central com Vegetação', 'Jardim de Inverno']),
  M('pais-gramados', 'Gramados e Áreas Verdes', 'Paisagismo · Jardins', ['Gramado com Palmeiras', 'Área Verde com Paisagismo', 'Gramado com Jardim Ornamental']),

  M('pais-calcadas', 'Calçadas e Caminhos', 'Paisagismo · Áreas externas', ['Degraus em Concreto com Grama', 'Caminho de Madeira', 'Pedras Naturais com Seixos']),
  M('pais-muros-verdes', 'Muros e Cercas Verdes', 'Paisagismo · Áreas externas', ['Muro com Trepadeiras', 'Cerca Viva Podada', 'Muro Verde com Iluminação']),
  M('pais-convivio', 'Áreas de Convívio Externas', 'Paisagismo · Áreas externas', ['Lounge com Fire Pit', 'Pérgola com Deck', 'Varanda Gourmet']),
  M('pais-piscinas', 'Piscinas e Espelhos d’Água', 'Paisagismo · Áreas externas', ['Borda Infinita', 'Deck de Madeira', 'Espelho d’Água com Cascata']),
  M('pais-iluminacao', 'Iluminação Paisagística', 'Paisagismo · Áreas externas', ['Iluminação de Palmeiras', 'Balizadores de Caminhos', 'Luz Embutida em Degraus']),

  M('pais-arvores', 'Árvores Ornamentais', 'Paisagismo · Árvores & detalhes', ['Oliveira', 'Ipê Amarelo', 'Flamboyant']),
  M('pais-detalhes', 'Detalhes Decorativos', 'Paisagismo · Árvores & detalhes', ['Vasos Decorativos', 'Pedras Ornamentais', 'Fonte e Espelho d’Água']),

  M('pais-composicao-terrea', 'Composições Completas · Térreas', 'Paisagismo · Composições', ['Tropical Moderna', 'Minimalista', 'Rústica Contemporânea']),
  M('pais-composicao-sobrado', 'Composições Completas · 2 Pavimentos', 'Paisagismo · Composições', ['Contemporânea', 'Com Palmeiras', 'Clássica']),
]
