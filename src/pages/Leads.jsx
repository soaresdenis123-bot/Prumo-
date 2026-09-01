import { useEffect, useState } from 'react'
import { listLeadsProjeto } from '../lib/data'
import { MODELO_IMG } from '../lib/modelos'
import { supabase } from '../lib/supabase'

const STATUS = { novo: 'Novo', contatado: 'Contatado', arquivado: 'Arquivado' }

export default function Leads() {
  const [leads, setLeads] = useState(null)

  async function load() { try { setLeads(await listLeadsProjeto()) } catch { setLeads([]) } }
  useEffect(() => { load() }, [])

  async function mudarStatus(id, status) {
    await supabase.from('leads_projeto').update({ status }).eq('id', id)
    load()
  }

  if (!leads) return null
  const novos = leads.filter((l) => l.status === 'novo').length
  const fmt = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

  return (
    <>
      <div className="topbar"><div className="crumb"><b>Leads</b></div></div>
      <div className="content">
        <div className="pg-head"><div>
          <h1 className="pg">Leads · Monte sua casa</h1>
          <div className="pg-sub">Quem preencheu a página pública de captação. {novos > 0 && <b style={{ color: 'var(--accent)' }}>{novos} novo{novos > 1 ? 's' : ''}.</b>}</div>
        </div></div>

        {leads.length === 0 ? (
          <div className="muted" style={{ fontSize: 13 }}>Nenhum lead ainda. Divulgue o link <b>/monte-sua-casa</b> e eles aparecem aqui.</div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead><tr>{['Quando', 'Nome', 'Contato', 'Cidade', 'Modelo', 'Quer', 'Status'].map((h) => (
                <th key={h} style={{ textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700, padding: '11px 14px', borderBottom: '1px solid var(--line)' }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--line2)' }}>
                    <td className="mono" style={{ padding: '10px 14px', fontSize: 12.5, whiteSpace: 'nowrap' }}>{fmt(l.criado_em)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{l.nome || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{l.contato || '—'}</td>
                    <td className="muted" style={{ padding: '10px 14px', fontSize: 12.5 }}>{l.cidade || '—'}</td>
                    <td style={{ padding: '10px 14px', width: 160 }}>
                      {MODELO_IMG[l.modelo]
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <img src={MODELO_IMG[l.modelo]} alt={l.modelo} style={{ width: 72, height: 46, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} />
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{l.modelo}</div>
                          </div>
                        : <span className="muted" style={{ fontSize: 12 }}>{l.modelo || '— sem modelo'}</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>
                      <div className="muted">
                        {[l.tipo === 'sobrado' ? '2 pav.' : l.tipo === 'terrea' ? 'térrea' : '', l.telhado, l.padrao].filter(Boolean).join(' · ')}
                      </div>
                      {l.obs && <div style={{ marginTop: 3, maxWidth: 420 }}>{l.obs}</div>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <select value={l.status} onChange={(e) => mudarStatus(l.id, e.target.value)}
                        className={'pill ' + (l.status === 'novo' ? 'prog' : l.status === 'contatado' ? 'ok' : 'pend')}
                        style={{ border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                        {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
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
