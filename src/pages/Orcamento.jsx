import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BRL, listOrcamentos, setOrcamentoStatus, aprovarOrcamento, orcamentoParaObra } from '../lib/data'
import { useAuth } from '../lib/auth'
import OrcamentoWizard from './OrcamentoWizard'

/* =========================================================================
 *  ORÇAMENTO — assistente guiado (térrea/sobrado → cômodos → detalhado)
 *  + lista dos orçamentos salvos (aprovar vira a lista de custos da obra).
 * ======================================================================= */
export default function Orcamento() {
  const location = useLocation()
  const lead = location.state?.lead || null
  return (
    <>
      <div className="topbar"><div className="crumb"><b>Orçamento</b></div></div>
      <div className="content">
        <div className="pg-head"><div><h1 className="pg">Orçamento</h1>
          <div className="pg-sub">Do sonho ao valor — escolha o tipo de casa, monte os cômodos e a plataforma gera o orçamento detalhado. Aprovou, vira a lista de custos da obra.</div></div></div>

        <OrcamentosSalvos />

        <div className="sec-title">{lead ? `Novo orçamento · a partir do lead ${lead.nome || ''}` : 'Novo orçamento'}</div>
        {lead && <div className="muted" style={{ fontSize: 12.5, margin: '-4px 0 10px' }}>Puxamos o que o cliente já informou. Refine os itens e salve — ao aprovar, ele vira cliente automaticamente.</div>}
        <OrcamentoWizard prefill={lead} />
      </div>
    </>
  )
}

/* ======================= LISTA DE ORÇAMENTOS SALVOS ======================= */
const STATUS = {
  rascunho: { label: 'Rascunho', cls: 'pend' }, enviado: { label: 'Enviado', cls: 'prog' },
  aprovado: { label: 'Aprovado', cls: 'ok' }, recusado: { label: 'Recusado', cls: 'crit' },
}
function OrcamentosSalvos() {
  const nav = useNavigate()
  const { session } = useAuth()
  const [orcs, setOrcs] = useState(null)
  const [msg, setMsg] = useState('')

  async function load() { try { setOrcs(await listOrcamentos()) } catch { setOrcs([]) } }
  useEffect(() => { load() }, [])

  async function mudarStatus(o, status) {
    if (status === 'aprovado') {
      const obraId = await aprovarOrcamento({ id: o.id, obra_id: o.obra_id, lead_id: o.lead_id })
      const virou = o.lead_id ? ' O lead virou cliente ✓' : ''
      setMsg((obraId ? 'Aprovado — custos gerados na obra ✓' : 'Aprovado. Clique “Virar obra” para gerar a obra e os custos.') + virou)
      setTimeout(() => setMsg(''), 3600)
    } else { await setOrcamentoStatus(o.id, status) }
    load()
  }
  async function converter(o) {
    if (!confirm(`Criar uma obra a partir do orçamento de ${o.cliente_nome || '—'}? Os custos entram como pendentes.`)) return
    const id = await orcamentoParaObra(o, session.user.id)
    nav('/obra/' + id)
  }

  if (!orcs) return null
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="sec-title" style={{ margin: '0 0 0' }}>Meus orçamentos <span className="muted" style={{ fontWeight: 400 }}>· {orcs.length}</span></div>
        {msg && <span style={{ fontSize: 12.5, color: 'var(--ok)' }}>{msg}</span>}
      </div>
      {orcs.length === 0 ? (
        <div className="muted" style={{ fontSize: 12.5, margin: '8px 0 0' }}>Nenhum orçamento salvo ainda. Monte um abaixo e clique “Salvar no sistema”.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto', marginTop: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead><tr>{['Número', 'Cliente', 'Descrição', 'Total', 'Status', ''].map((h, i) => (
              <th key={h} style={{ textAlign: i === 3 ? 'right' : 'left', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700, padding: '11px 14px', borderBottom: '1px solid var(--line)' }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {orcs.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--line2)' }}>
                  <td className="mono" style={{ padding: '11px 14px', fontSize: 12.5 }}>{o.numero || '—'}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: 13 }}>{o.cliente_nome || '—'}</td>
                  <td className="muted" style={{ padding: '11px 14px', fontSize: 12.5 }}>{o.descricao || '—'}</td>
                  <td className="mono" style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13 }}>{BRL(o.total)}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <select value={o.status} onChange={(e) => mudarStatus(o, e.target.value)}
                      className={'pill ' + (STATUS[o.status]?.cls || 'pend')} style={{ border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                    {o.obra_id
                      ? <button className="btn ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => nav('/obra/' + o.obra_id)}>Ver obra</button>
                      : <button className="btn" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => converter(o)}>Virar obra</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
