import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apresentacaoPublica } from '../lib/data'
import { parseSelecoes, ACAB_POR_ID, TELHADOS_POR_ID } from '../lib/acabamentos'
import { MODELO_IMG } from '../lib/modelos'
import { montarApresHTML } from '../lib/apresTemplate'

const BRL = (n) => 'R$ ' + Math.round(Number(n) || 0).toLocaleString('pt-BR')

// "2 quartos · banheiro · cozinha · sala" a partir dos ambientes montados
function programaResumo(ambientes = []) {
  const cont = {}
  ambientes.forEach((a) => { const t = (a.tipo || '').trim(); if (t) cont[t] = (cont[t] || 0) + 1 })
  const partes = []
  const plural = (n, sing, plu) => (n > 1 ? `${n} ${plu}` : sing.toLowerCase())
  if (cont['Quarto']) partes.push(plural(cont['Quarto'], 'quarto', 'quartos'))
  if (cont['Suíte']) partes.push(plural(cont['Suíte'], 'suíte', 'suítes'))
  if (cont['Banheiro']) partes.push(plural(cont['Banheiro'], 'banheiro', 'banheiros'))
  if (cont['Lavabo']) partes.push('lavabo')
  if (cont['Cozinha']) partes.push('cozinha')
  if (cont['Sala de estar'] || cont['Sala de jantar']) partes.push('sala')
  if (cont['Escritório']) partes.push('escritório')
  return partes.join(' · ')
}
// nome mais frequente de um acabamento (piso/esquadria) entre os ambientes
function maisFrequente(ambientes, chave) {
  const cont = {}
  ambientes.forEach((a) => { const id = a.sel?.[chave]; const it = id && ACAB_POR_ID[id]; if (it) cont[it.nome] = (cont[it.nome] || 0) + 1 })
  let melhor = '', max = 0
  Object.entries(cont).forEach(([k, v]) => { if (v > max) { max = v; melhor = k } })
  return melhor
}

function montarConfig(lead) {
  const sel = parseSelecoes(lead?.obs) || {}
  const apres = lead?.apres || {}
  const primeiroNome = (lead?.nome || '').trim().split(/\s+/)[0] || ''
  const modeloNome = sel.modelo || lead?.modelo || 'sua casa'
  const renderCustom = apres.render_url || ''
  const renderSrc = renderCustom || MODELO_IMG[modeloNome] || '/modelos/m06.jpg'
  const provisorio = apres.personalizada === true ? false : !renderCustom

  const tipo = sel.tipo || lead?.tipo || ''
  const telhado = sel.telhado || lead?.telhado || ''
  const specTipo = [tipo === 'sobrado' ? 'Sobrado' : tipo === 'terrea' ? 'Térrea' : '',
    telhado === 'platibanda' ? 'platibanda' : telhado === 'aparente' ? 'telhado aparente' : '']
    .filter(Boolean).join(' · ')
  const padrao = sel.padrao || lead?.padrao || ''
  const specPadrao = padrao === 'alto' ? 'Alto' : padrao === 'medio' ? 'Médio' : ''

  const ambientes = Array.isArray(sel.ambientes) ? sel.ambientes : []
  const specPrograma = programaResumo(ambientes)
  const temGourmet = ambientes.some((a) => /gourmet|varanda/i.test(a.tipo || ''))
  const specExtras = [temGourmet && 'Área gourmet', sel.paisagismo && 'Paisagismo'].filter(Boolean).join(' · ')
  const specArea = sel.areaTotal ? `≈ ${Math.round(sel.areaTotal)} m²` : ''

  const precoLabel = (sel.estMin && sel.estMax) ? `De ${BRL(sel.estMin)} a ${BRL(sel.estMax)}` : ''

  const pickPiso = maisFrequente(ambientes, 'piso')
  const pickEsquadria = maisFrequente(ambientes, 'esquadria')
  const cob = sel.cobertura && TELHADOS_POR_ID[sel.cobertura]
  const pickCobertura = cob ? cob.nome : ''

  const familia = apres.familia ? `Proposta exclusiva · ${apres.familia}` : 'Proposta exclusiva'

  return { familia, primeiroNome, modeloNome, renderSrc, provisorio, specTipo, specPadrao,
    specPrograma, specExtras, specArea, precoLabel, pickPiso, pickCobertura, pickEsquadria, cidade: lead?.cidade }
}

export default function Apresentacao() {
  const { token } = useParams()
  const [html, setHtml] = useState('')
  const [estado, setEstado] = useState('carregando') // carregando | ok | vazio | erro

  useEffect(() => {
    let vivo = true
    apresentacaoPublica(token)
      .then((lead) => {
        if (!vivo) return
        if (!lead) { setEstado('vazio'); return }
        setHtml(montarApresHTML(montarConfig(lead)))
        setEstado('ok')
      })
      .catch(() => { if (vivo) setEstado('erro') })
    return () => { vivo = false }
  }, [token])

  if (estado === 'ok') {
    return (
      <iframe
        title="Apresentação"
        srcDoc={html}
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 'none', background: '#0E0B08' }}
      />
    )
  }

  const msg = estado === 'vazio' ? 'Apresentação não encontrada. Confira o link.'
    : estado === 'erro' ? 'Não deu pra carregar agora. Tente novamente em instantes.'
    : 'Carregando a sua apresentação...'
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0E0B08', color: '#F3ECDF', display: 'grid', placeItems: 'center', fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center', padding: 24 }}>
      <div>
        <div style={{ fontSize: 15, letterSpacing: '.02em' }}>{msg}</div>
      </div>
    </div>
  )
}
