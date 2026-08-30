import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listOrcamentos, setOrcamentoStatus, orcamentoParaObra, BRL } from '../lib/data'
import { useAuth } from '../lib/auth'

const STATUS = {
  rascunho: { label: 'Rascunho', cls: 'pend' },
  enviado: { label: 'Enviado', cls: 'prog' },
  aprovado: { label: 'Aprovado', cls: 'ok' },
  recusado: { label: 'Recusado', cls: 'crit' },
}

export default function Orcamentos() {
  const nav = useNavigate()
  const { session } = useAuth()
  const [orcs, setOrcs] = useState(null)
  const [err, setErr] = useState('')

  async function load() { try { setOrcs(await listOrcamentos()) } catch (e) { setErr(e.message) } }
  useEffect(() => { load() }, [])

  async function mudarStatus(id, status) { await setOrcamentoStatus(id, status); load() }
  async function converter(o) {
    if (!confirm(`Criar uma obra a partir do orçamento de ${o.cliente_nome || '—'}?`)) return
    const id = await orcamentoParaObra(o, session.user.id)
    nav('/obra/' + id)
  }

  if (err) return <div className="content"><div className="center-note">Erro: {err}</div></div>
  if (!orcs) return <div className="spin" />

  return (
    <>
      <div className="topbar"><div className="crumb"><b>Orçamentos</b></div></div>
      <div className="content">
        <div className="pg-head"><div><h1 className="pg">Orçamentos</h1>
          <div className="pg-sub">{orcs.length} propostas · gere na Calculadora → Exatidão</div></div>
          <button className="btn" onClick={() => nav('/calculadora')}>Novo orçamento</button></div>

        {orcs.length === 0 && <div className="center-note">Nenhum orçamento salvo. Vá na Calculadora, aba Exatidão, e clique “Salvar no sistema”.</div>}

        {orcs.length > 0 && (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
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
                      <select value={o.status} onChange={(e) => mudarStatus(o.id, e.target.value)}
                        className={'pill ' + (STATUS[o.status]?.cls || 'pend')}
                        style={{ border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                        {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                      {o.obra_id ? (
                        <button className="btn ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => nav('/obra/' + o.obra_id)}>Ver obra</button>
                      ) : (
                        <button className="btn" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => converter(o)}>Virar obra</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
