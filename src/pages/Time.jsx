import { useEffect, useMemo, useState } from 'react'
import { listTimes, addTime, deleteTime, listTarefas, addTarefa, updateTarefa, deleteTarefa, listObras } from '../lib/data'

const inp = { padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontSize: 13 }
const COLS = [['a_fazer', 'A fazer', 'pend'], ['fazendo', 'Fazendo', 'prog'], ['feito', 'Feito', 'ok']]
const TIPO = { operacao: 'Operação', administrativo: 'Administrativo' }

export default function Time() {
  const [times, setTimes] = useState(null)
  const [tarefas, setTarefas] = useState([])
  const [obras, setObras] = useState([])
  const [novoTime, setNovoTime] = useState({ nome: '', tipo: 'operacao' })
  const [t, setT] = useState({ titulo: '', time_id: '', obra_id: '', responsavel: '', prazo: '' })
  const [filtro, setFiltro] = useState('')
  const [err, setErr] = useState('')

  async function load() {
    try { setTimes(await listTimes()); setTarefas(await listTarefas()) } catch (e) { setErr(e.message) }
  }
  useEffect(() => { load(); listObras().then(setObras).catch(() => {}) }, [])

  async function criarTime() { if (!novoTime.nome.trim()) return; await addTime(novoTime); setNovoTime({ nome: '', tipo: novoTime.tipo }); load() }
  async function removerTime(id) { if (!confirm('Remover este time? As tarefas ficam sem time.')) return; await deleteTime(id); load() }
  async function criarTarefa() {
    if (!t.titulo.trim()) return
    await addTarefa({ titulo: t.titulo, time_id: t.time_id || null, obra_id: t.obra_id || null, responsavel: t.responsavel || null, prazo: t.prazo || null })
    setT({ titulo: '', time_id: t.time_id, obra_id: '', responsavel: '', prazo: '' }); load()
  }
  async function mover(id, status) { await updateTarefa(id, { status }); load() }
  async function remover(id) { await deleteTarefa(id); load() }

  const visiveis = useMemo(() => tarefas.filter((x) => !filtro || x.time_id === filtro), [tarefas, filtro])
  if (err) return <div className="content"><div className="center-note">Erro: {err}</div></div>
  if (!times) return <div className="spin" />

  const chip = (on, cor) => ({ padding: '6px 12px', borderRadius: 20, border: '1px solid var(--line)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: on ? (cor || 'var(--ink)') : 'var(--surface)', color: on ? '#fff' : 'var(--ink2)' })

  return (
    <>
      <div className="topbar"><div className="crumb"><b>Time</b></div><span className="chip-role">Interno</span></div>
      <div className="content">
        <div className="pg-head"><div><h1 className="pg">Time & tarefas</h1>
          <div className="pg-sub">{times.length} times · {tarefas.length} tarefas · delegue quem faz o quê</div></div></div>

        {/* times */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div className="sec-title" style={{ marginTop: 0 }}>Times</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: times.length ? 12 : 0 }}>
            <input placeholder="Nome do time (ex.: Obra Silva, Compras)" value={novoTime.nome} onChange={(e) => setNovoTime({ ...novoTime, nome: e.target.value })} style={{ ...inp, flex: 2, minWidth: 180 }} />
            <select value={novoTime.tipo} onChange={(e) => setNovoTime({ ...novoTime, tipo: e.target.value })} style={{ ...inp }}>
              <option value="operacao">Operação</option><option value="administrativo">Administrativo</option>
            </select>
            <button className="btn" onClick={criarTime}>+ Criar time</button>
          </div>
          {times.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {times.map((tm) => (
                <span key={tm.id} className="pill" style={{ background: 'var(--surface2)', color: 'var(--ink2)', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <b>{tm.nome}</b> <span className="muted" style={{ fontSize: 11 }}>{TIPO[tm.tipo]}</span>
                  <button className="muted" onClick={() => removerTime(tm.id)} style={{ fontSize: 13 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* nova tarefa */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div className="sec-title" style={{ marginTop: 0 }}>Nova tarefa</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input placeholder="O que precisa ser feito *" value={t.titulo} onChange={(e) => setT({ ...t, titulo: e.target.value })} style={{ ...inp, flex: 3, minWidth: 200 }} />
            <select value={t.time_id} onChange={(e) => setT({ ...t, time_id: e.target.value })} style={inp}>
              <option value="">Time…</option>{times.map((tm) => <option key={tm.id} value={tm.id}>{tm.nome}</option>)}
            </select>
            <select value={t.obra_id} onChange={(e) => setT({ ...t, obra_id: e.target.value })} style={inp}>
              <option value="">Obra (opcional)…</option>{obras.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
            <input placeholder="Responsável" value={t.responsavel} onChange={(e) => setT({ ...t, responsavel: e.target.value })} style={{ ...inp, width: 130 }} />
            <input type="date" value={t.prazo} onChange={(e) => setT({ ...t, prazo: e.target.value })} style={{ ...inp, fontFamily: 'IBM Plex Mono' }} />
            <button className="btn" onClick={criarTarefa}>+ Delegar</button>
          </div>
        </div>

        {times.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={chip(!filtro)} onClick={() => setFiltro('')}>Todos os times</span>
            {times.map((tm) => <span key={tm.id} style={chip(filtro === tm.id)} onClick={() => setFiltro(tm.id)}>{tm.nome}</span>)}
          </div>
        )}

        {/* quadro */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {COLS.map(([st, lbl, cls]) => {
            const items = visiveis.filter((x) => x.status === st)
            return (
              <div key={st}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className={'pill ' + cls}><span className="d" />{lbl}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{items.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 60 }}>
                  {items.map((x) => (
                    <div key={x.id} className="card" style={{ padding: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.3 }}>{x.titulo}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {x.time_nome && <span className="pill" style={{ background: 'var(--surface2)', color: 'var(--ink2)', fontSize: 10.5 }}>{x.time_nome}</span>}
                        {x.obra_nome && <span className="muted" style={{ fontSize: 11 }}>· {x.obra_nome}</span>}
                      </div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
                        {x.responsavel ? '👤 ' + x.responsavel : 'sem responsável'}{x.prazo ? ' · 📅 ' + fmt(x.prazo) : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
                        <select value={x.status} onChange={(e) => mover(x.id, e.target.value)}
                          style={{ ...inp, padding: '4px 7px', fontSize: 11.5, flex: 1 }}>
                          {COLS.map(([s, l]) => <option key={s} value={s}>{l}</option>)}
                        </select>
                        <button className="muted" onClick={() => remover(x.id)} style={{ fontSize: 14 }}>×</button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="muted" style={{ fontSize: 12, padding: '8px 4px' }}>—</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

function fmt(d) { const p = String(d).split('-'); return p.length === 3 ? `${p[2]}/${p[1]}` : d }
