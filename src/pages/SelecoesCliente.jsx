import { useEffect, useState } from 'react'
import { listSelecoes, setSelecaoStatus, deleteSelecao, somarSelecoesAoOrcado, BRL } from '../lib/data'
import { orcadoDe } from './Painel'

// Escolhas do cliente (personalização) — lado da equipe.
export default function SelecoesCliente({ obra, onOrcado }) {
  const [sel, setSel] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() { setSel(await listSelecoes(obra.id)) }
  useEffect(() => { load() }, [obra.id])

  if (!sel) return null
  if (sel.length === 0) return null

  const desejos = sel.filter((s) => s.status === 'desejo')
  const aprovados = sel.filter((s) => s.status === 'aprovado')
  const val = (s) => (Number(s.preco_cliente) || 0) * (Number(s.quantidade) || 0)
  const aSomar = aprovados.filter((s) => !s.no_orcado)
  const totalASomar = aSomar.reduce((t, s) => t + val(s), 0)

  async function status(id, st) { await setSelecaoStatus(id, st); load() }
  async function rem(id) { await deleteSelecao(id); load() }
  async function somar() {
    if (aSomar.length === 0) return
    setBusy(true)
    const novo = (Number(orcadoDe(obra)) || 0) + totalASomar
    try {
      await somarSelecoesAoOrcado(obra.id, aSomar.map((s) => s.id), novo)
      setMsg('Somado ao orçado ✓'); onOrcado?.()
      await load()
    } catch (e) { setMsg('Erro: ' + e.message) }
    setBusy(false); setTimeout(() => setMsg(''), 3000)
  }

  const Linha = (s) => (
    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--line2)', fontSize: 12.5 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.item}</div>
        <div className="muted" style={{ fontSize: 11 }}>{s.categoria || '—'} · {s.quantidade} un{s.no_orcado ? ' · no orçado' : ''}</div>
      </div>
      <span className="mono" style={{ fontWeight: 600 }}>{BRL(val(s))}</span>
      {s.status === 'desejo' ? (
        <>
          <button className="btn ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => status(s.id, 'aprovado')}>Aprovar</button>
          <button className="muted" style={{ fontSize: 14 }} title="Recusar" onClick={() => rem(s.id)}>×</button>
        </>
      ) : (
        <button className="muted" style={{ fontSize: 14 }} title="Remover" onClick={() => rem(s.id)}>×</button>
      )}
    </div>
  )

  return (
    <div className="card" style={{ padding: 16, marginTop: 16 }}>
      <div className="sec-title" style={{ marginTop: 0 }}>Escolhas do cliente <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.05em', color: 'var(--accent2)', background: 'var(--surface2)', padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase' }}>Personalização</span></div>
      {desejos.length > 0 && <>
        <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700, margin: '4px 0' }}>A revisar</div>
        {desejos.map(Linha)}
      </>}
      {aprovados.length > 0 && <>
        <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700, margin: '12px 0 4px' }}>Aprovados</div>
        {aprovados.map(Linha)}
      </>}
      {totalASomar > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 10, flexWrap: 'wrap' }}>
          <div className="muted" style={{ fontSize: 11.5 }}>{msg || `${BRL(totalASomar)} aprovados fora do orçado`}</div>
          <button className="btn" style={{ fontSize: 12, padding: '7px 11px' }} onClick={somar} disabled={busy}>{busy ? '…' : 'Somar ao orçado'}</button>
        </div>
      )}
      {msg && totalASomar === 0 && <div className="muted" style={{ fontSize: 11.5, marginTop: 10, color: 'var(--ok)' }}>{msg}</div>}
    </div>
  )
}
