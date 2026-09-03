import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listLeadsProjeto, updateLead, deleteLead } from '../lib/data'
import { MODELO_IMG } from '../lib/modelos'
import { parseSelecoes, SUPERFICIES, ACAB_POR_ID, custoSuperficie } from '../lib/acabamentos'
import { brl } from '../lib/precificacao'

const STATUS = { novo: 'Novo', contatado: 'Contatado', arquivado: 'Arquivado' }
const inp = { width: '100%', padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface,#fff)', color: 'var(--ink)', fontSize: 13.5 }

export default function Clientes() {
  const nav = useNavigate()
  const [rows, setRows] = useState(null)
  const [view, setView] = useState('hub') // hub | leads | clientes
  const [edit, setEdit] = useState(null)
  const [verSel, setVerSel] = useState(null) // lead cujas seleções estão abertas

  async function load() { try { setRows(await listLeadsProjeto()) } catch { setRows([]) } }
  useEffect(() => { load() }, [])
  if (!rows) return null

  const leads = rows.filter((r) => !r.cliente)
  const clientes = rows.filter((r) => r.cliente)
  const novos = leads.filter((l) => l.status === 'novo').length
  const fmt = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

  async function status(id, s) { await updateLead(id, { status: s }); load() }
  async function tornarCliente(l) { await updateLead(l.id, { cliente: true, status: l.status === 'novo' ? 'contatado' : l.status }); load() }
  async function voltarLead(l) { await updateLead(l.id, { cliente: false }); load() }
  async function remover(l) { if (!confirm(`Excluir ${l.nome || 'este registro'}? Essa ação não volta.`)) return; await deleteLead(l.id); load() }
  async function salvarEdit() { const { id, nome, contato, cidade, obs } = edit; await updateLead(id, { nome, contato, cidade, obs }); setEdit(null); load() }

  /* ---------- HUB: dois cards ---------- */
  if (view === 'hub') return (
    <>
      <div className="topbar"><div className="crumb"><b>Clientes</b></div></div>
      <div className="content">
        <div className="pg-head"><div>
          <h1 className="pg">Clientes</h1>
          <div className="pg-sub">Quem chega pela página pública “Monte sua casa”. Vire o lead em cliente quando fechar.</div>
        </div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginTop: 8 }}>
          <button className="card" onClick={() => setView('leads')} style={{ padding: 22, textAlign: 'left', cursor: 'pointer', position: 'relative' }}>
            {novos > 0 && <span style={{ position: 'absolute', top: 16, right: 16, background: 'var(--accent)', color: '#fff', borderRadius: 999, fontSize: 12, fontWeight: 700, padding: '2px 9px' }}>{novos} novo{novos > 1 ? 's' : ''}</span>}
            <div style={{ fontSize: 30 }}>📥</div>
            <div style={{ fontWeight: 700, fontSize: 20, marginTop: 8 }}>Leads</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{leads.length} interessado{leads.length !== 1 ? 's' : ''} que ainda não fecharam.</div>
            <div className="btn" style={{ marginTop: 14, width: 'fit-content' }}>Ver leads →</div>
          </button>
          <button className="card" onClick={() => setView('clientes')} style={{ padding: 22, textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ fontSize: 30 }}>🤝</div>
            <div style={{ fontWeight: 700, fontSize: 20, marginTop: 8 }}>Clientes</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} (leads que viraram negócio).</div>
            <div className="btn ghost" style={{ marginTop: 14, width: 'fit-content' }}>Ver clientes →</div>
          </button>
        </div>
      </div>
    </>
  )

  /* ---------- LISTA (leads ou clientes) ---------- */
  const isLeads = view === 'leads'
  const data = isLeads ? leads : clientes
  return (
    <>
      <div className="topbar"><div className="crumb"><button className="muted" style={{ fontSize: 13 }} onClick={() => setView('hub')}>Clientes</button> <span className="muted">/</span> <b>{isLeads ? 'Leads' : 'Clientes'}</b></div></div>
      <div className="content">
        <div className="pg-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <button className="muted" style={{ fontSize: 12.5, marginBottom: 6 }} onClick={() => setView('hub')}>← voltar</button>
            <h1 className="pg">{isLeads ? 'Leads' : 'Clientes'}</h1>
            <div className="pg-sub">{isLeads ? <>Interessados da página pública. {novos > 0 && <b style={{ color: 'var(--accent)' }}>{novos} novo{novos > 1 ? 's' : ''}.</b>}</> : 'Leads que viraram cliente.'}</div>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="muted" style={{ fontSize: 13 }}>{isLeads ? 'Nenhum lead ainda. Divulgue o link /monte-sua-casa.' : 'Nenhum cliente ainda. Nos leads, clique “Virou cliente”.'}</div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead><tr>{['Quando', 'Nome', 'Contato', 'Cidade', 'Modelo', 'Quer', 'Status', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700, padding: '11px 14px', borderBottom: '1px solid var(--line)' }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {data.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--line2)' }}>
                    <td className="mono" style={{ padding: '10px 14px', fontSize: 12.5, whiteSpace: 'nowrap' }}>{fmt(l.criado_em)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{l.nome || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{l.contato || '—'}</td>
                    <td className="muted" style={{ padding: '10px 14px', fontSize: 12.5 }}>{l.cidade || '—'}</td>
                    <td style={{ padding: '10px 14px', width: 150 }}>
                      {MODELO_IMG[l.modelo]
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><img src={MODELO_IMG[l.modelo]} alt={l.modelo} style={{ width: 64, height: 42, objectFit: 'cover', borderRadius: 7, border: '1px solid var(--line)' }} /><span style={{ fontSize: 11.5, fontWeight: 600 }}>{l.modelo}</span></div>
                        : <span className="muted" style={{ fontSize: 12 }}>{l.modelo || '— sem modelo'}</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>
                      <div className="muted">{[l.tipo === 'sobrado' ? '2 pav.' : l.tipo === 'terrea' ? 'térrea' : '', l.telhado, l.padrao].filter(Boolean).join(' · ')}</div>
                      {l.obs && <div style={{ marginTop: 3, maxWidth: 360 }}>{l.obs}</div>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <select value={l.status} onChange={(e) => status(l.id, e.target.value)} className={'pill ' + (l.status === 'novo' ? 'prog' : l.status === 'contatado' ? 'ok' : 'pend')} style={{ border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                        {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {isLeads
                          ? <>
                              <button className="btn" style={{ fontSize: 11.5, padding: '5px 10px' }} onClick={() => nav('/orcamento', { state: { lead: l } })} title="Fazer orçamento detalhado">📄 Orçamento</button>
                              <button className="btn ghost" style={{ fontSize: 11.5, padding: '5px 9px' }} onClick={() => tornarCliente(l)} title="Marcar como cliente">✓ Cliente</button>
                            </>
                          : <button className="btn ghost" style={{ fontSize: 11.5, padding: '5px 10px' }} onClick={() => voltarLead(l)} title="Voltar para leads">↩ Lead</button>}
                        {parseSelecoes(l.obs) && <button className="btn ghost" style={{ fontSize: 11.5, padding: '5px 9px' }} onClick={() => setVerSel(l)} title="Ver materiais que o cliente escolheu">🖼 Seleção</button>}
                        <button className="muted" title="Editar" onClick={() => setEdit({ ...l })} style={{ fontSize: 15, cursor: 'pointer' }}>✏️</button>
                        <button className="muted" title="Excluir" onClick={() => remover(l)} style={{ fontSize: 16, cursor: 'pointer', color: 'var(--crit,#b23)' }}>×</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* modal: materiais escolhidos pelo cliente */}
      {verSel && (() => {
        const s = parseSelecoes(verSel.obs)
        if (!s) return null
        return (
          <div onClick={() => setVerSel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 55, display: 'grid', placeItems: 'center', padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} className="card" style={{ padding: 20, width: 'min(920px,100%)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <div><div className="sec-title" style={{ margin: 0 }}>Seleção de {verSel.nome || 'cliente'}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{s.modelo || '—'} · {s.tipo} · {s.padrao} padrão · {s.areaTotal} m² · {(s.ambientes || []).length} ambientes</div></div>
                <div style={{ textAlign: 'right' }}>
                  <div className="muted" style={{ fontSize: 11 }}>Estimativa vista pelo cliente</div>
                  <div style={{ fontWeight: 700 }}>{brl(s.estMin)} a {brl(s.estMax)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                {(s.ambientes || []).map((a, i) => (
                  <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <b style={{ fontSize: 14 }}>{a.tipo} <span className="muted" style={{ fontWeight: 400 }}>· {a.area} m²</span></b>
                      <span className="mono" style={{ fontSize: 12.5 }}>{brl(SUPERFICIES.reduce((t, sup) => t + custoSuperficie(sup.key, ACAB_POR_ID[a.sel[sup.key]], a.area), 0))}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
                      {SUPERFICIES.map((sup) => {
                        const it = ACAB_POR_ID[a.sel[sup.key]]
                        return (
                          <div key={sup.key} style={{ border: '1px solid var(--line2,#eee)', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{ aspectRatio: '4/3', background: '#f0ece4', display: 'grid', placeItems: 'center' }}>
                              {it?.img ? <img src={it.img} alt={it.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span className="muted" style={{ fontSize: 11, textAlign: 'center', padding: 6 }}>{it ? it.nome : '—'}</span>}
                            </div>
                            <div style={{ padding: '7px 9px' }}>
                              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink3)', fontWeight: 700 }}>{sup.label}</div>
                              <div style={{ fontSize: 11.5, fontWeight: 600 }}>{it ? it.nome : '— não escolhido'}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                <button className="btn ghost" onClick={() => setVerSel(null)}>Fechar</button>
                <button className="btn" onClick={() => { setVerSel(null); nav('/orcamento', { state: { lead: verSel } }) }}>📄 Fazer orçamento</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* modal de edição */}
      {edit && (
        <div onClick={() => setEdit(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 50, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ padding: 20, width: 'min(460px,100%)' }}>
            <div className="sec-title" style={{ marginTop: 0 }}>Editar registro</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div className="field"><label>Nome</label><input style={inp} value={edit.nome || ''} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} /></div>
              <div className="field"><label>Contato</label><input style={inp} value={edit.contato || ''} onChange={(e) => setEdit({ ...edit, contato: e.target.value })} /></div>
              <div className="field"><label>Cidade</label><input style={inp} value={edit.cidade || ''} onChange={(e) => setEdit({ ...edit, cidade: e.target.value })} /></div>
              <div className="field"><label>Anotações (Quer)</label><textarea style={{ ...inp, minHeight: 70, fontFamily: 'inherit' }} value={edit.obs || ''} onChange={(e) => setEdit({ ...edit, obs: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn ghost" onClick={() => setEdit(null)}>Cancelar</button>
              <button className="btn" onClick={salvarEdit}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
