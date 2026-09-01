// Catálogo de modelos de casa usado na página pública "Monte sua casa"
// e na aba Leads (para mostrar a foto que o cliente escolheu).
// Para trocar/adicionar fotos: substitua o arquivo em public/modelos/ ou edite aqui.
const M = (id, tipo, telhado, estilo, nome) => ({
  id, tipo, telhado, estilo, nome,
  padrao: tipo === 'sobrado' ? 'alto' : 'medio',
  img: `/modelos/${id}.jpg`,
})

export const MODELOS = [
  M('m01', 'terrea', 'aparente', 'Farm House', 'Farm House 01'),
  M('m02', 'terrea', 'aparente', 'Farm House', 'Farm House 02'),
  M('m03', 'terrea', 'aparente', 'Farm House', 'Farm House 03'),
  M('m04', 'terrea', 'aparente', 'Farm House', 'Farm House 04'),
  M('m05', 'terrea', 'platibanda', 'Moderna', 'Moderna 01'),
  M('m06', 'terrea', 'platibanda', 'Moderna', 'Moderna 02'),
  M('m07', 'terrea', 'platibanda', 'Moderna', 'Moderna 03'),
  M('m08', 'terrea', 'platibanda', 'Moderna', 'Moderna 04'),
  M('m09', 'sobrado', 'aparente', 'Sobrado', 'Sobrado 01'),
  M('m10', 'sobrado', 'aparente', 'Sobrado', 'Sobrado 02'),
  M('m11', 'sobrado', 'platibanda', 'Sobrado', 'Sobrado 03'),
  M('m12', 'sobrado', 'platibanda', 'Sobrado', 'Sobrado 04'),
  M('m13', 'sobrado', 'aparente', 'Alto Padrão', 'Alto Padrão 01'),
  M('m14', 'sobrado', 'aparente', 'Alto Padrão', 'Alto Padrão 02'),
  M('m15', 'sobrado', 'platibanda', 'Alto Padrão', 'Alto Padrão 03'),
  M('m16', 'sobrado', 'platibanda', 'Alto Padrão', 'Alto Padrão 04'),
]

// mapa nome do modelo -> foto (usado na aba Leads)
export const MODELO_IMG = Object.fromEntries(MODELOS.map((m) => [m.nome, m.img]))
