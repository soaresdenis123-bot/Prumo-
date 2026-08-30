import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listFornecedores, addFornecedor, deleteFornecedor, OBRA_CATEGORIAS } from '../lib/data'

const inp = { padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontSize: 13 }
const TIPO_LBL = { material: 'Material', mao_obra: 'Mão de obra', servico: 'Serviço' }

export default function Fornecedores() {
  const nav = useNavigate()
  const [forns, setForns] = useState(null)
  const [f, setF] = useState({ nome: '', tipo: 'material', categoria: '', fornece: '', contato: '' })
  const [filtroCat, setFiltroCat] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [err, setErr] = useState('')

  async function load() { try { setForns(await listFornecedores()) } catch (e) { setErr(e.message) } }
  useEffect(() => { load() }, [])

  async function add() {
    if (!f.nome.trim()) return
    await addFornecedor(f); setF({ nome: '', tipo: f.tipo, categoria: f.categoria, fornece: '', contato: '' }); load()
  }
  async function del(id) { await deleteFornecedor(id); load() }

  const catsPresentes = useMemo(() => {
    const set = new Set((forns || []).map((x) => x.categoria || 'Sem categoria'))
    // ordena pela ordem da obra
    return OBRA_CATEGORIAS.filter((c) => set.has(c)).concat(Array.from(set).filter((c) => !OBRA_CATEGORIAS.includes(c)))
  }, [forns])

  const visiveis = (forns || []).filter((x) =>
    (!filtroCat || (x.categoria || 'Sem categoria') === filtroCat) && (!filtroTipo || (x.tipo || 'material') === filtroTipo))
  const grupos = useMemo(() => {
    const g = {}
    visiveis.forEach((x) => { const k = x.categoria || 'Sem categoria'; (g[k] = g[k] || []).push(x) })
    const ordered = OBRA_CATEGORIAS.filter((c) => g[c]).map((c) => [c, g[c]])
    Object.keys(g).filter((c) => !OBRA_CATEGORIAS.includes(c)).sort().forEach((c) => ordered.push([c, g[c]]))
    return ordered
  }, [visiveis])

  if (err) return <div className="content"><div className="center-note">Erro: {err}</div></div>
  if (!forns) return <div className="spin" />

  const chip = (on) => ({ padding: '6px 12px', borderRadius: 20, border: '1px solid var(--line)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--bg)' : 'var(--ink2)' })
  const seg = (on) => ({ padding: '9px 13px', borderRadius: 9, border: '1px solid var(--line)', fontWeight: 600, fontSize: 13, cursor: 'pointer', flex: 1, background: on ? 'var(--accent)' : 'var(--surface)', color: on ? '#fff' : 'var(--ink2)' })

  const nMat = forns.filter((x) => (x.tipo || 'material') === 'material').length
  const nMo = forns.filter((x) => x.tipo === 'mao_obra').length

  return (
    <>
      <div className="topbar"><div className="crumb"><b>Fornecedores & Mão de obra</b></div><span className="chip-role">Interno</span></div>
      <div className="content">
        <div className="pg-head"><div><h1 className="pg">Fornecedores & Mão de obra</h1>
          <div className="pg-sub">{nMat} de material · {nMo} de mão de obra · {catsPresentes.length} categorias</div></div></div>

        <div className="card" style={{ padding: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button style={seg(f.tipo === 'material')} onClick={() => setF({ ...f, tipo: 'material' })}>Material</button>
            <button style={seg(f.tipo === 'mao_obra')} onClick={() => setF({ ...f, tipo: 'mao_obra' })}>Mão de obra</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input placeholder="Nome *" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} style={{ ...inp, flex: 2, minWidth: 140 }} />
            <input list="cat-list" placeholder="Categoria da obra…" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} style={{ ...inp, flex: 2, minWidth: 150 }} />
            <datalist id="cat-list">{OBRA_CATEGORIAS.map((c) => <option key={c} value={c} />)}</datalist>
            <input placeholder={f.tipo === 'mao_obra' ? 'O que executa' : 'O que fornece'} value={f.fornece} onChange={(e) => setF({ ...f, fornece: e.target.value })} style={{ ...inp, flex: 2, minWidth: 130 }} />
            <input placeholder="Contato" value={f.contato} onChange={(e) => setF({ ...f, contato: e.target.value })} style={{ ...inp, flex: 2, minWidth: 120 }} />
            <button className="btn" onClick={add}>+ Adicionar</button>
          </div>
        </div>

        {forns.length === 0 ? (
          <div className="center-note">Nenhum cadastro ainda. Classifique por tipo e categoria da obra ao adicionar.</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={chip(!filtroTipo)} onClick={() => setFiltroTipo('')}>Todos</span>
              <span style={chip(filtroTipo === 'material')} onClick={() => setFiltroTipo('material')}>Material</span>
              <span style={chip(filtroTipo === 'mao_obra')} onClick={() => setFiltroTipo('mao_obra')}>Mão de obra</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={chip(!filtroCat)} onClick={() => setFiltroCat('')}>Todas categorias</span>
              {catsPresentes.map((c) => <span key={c} style={chip(filtroCat === c)} onClick={() => setFiltroCat(c)}>{c}</span>)}
            </div>

            {grupos.map(([cat, itens]) => (
              <div key={cat} style={{ marginBottom: 18 }}>
                <div style={{ padding: '8px 4px', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent2)', fontWeight: 700 }}>
                  {cat} <span className="muted" style={{ fontWeight: 500 }}>· {itens.length}</span>
                </div>
                <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead><tr>{['Nome', 'Tipo', 'O que faz', 'Contato', ''].map((h) => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700, padding: '10px 14px', borderBottom: '1px solid var(--line)' }}>{h}</th>
                    ))}</tr></thead>
                    <tbody>
                      {itens.map((x) => (
                        <tr key={x.id} onClick={() => nav('/fornecedores/' + x.id)} style={{ borderBottom: '1px solid var(--line2)', cursor: 'pointer' }}>
                          <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: 13, color: 'var(--accent2)' }}>{x.nome}</td>
                          <td style={{ padding: '11px 14px' }}><span className="pill" style={{ background: x.tipo === 'mao_obra' ? 'var(--ok-bg,var(--surface2))' : 'var(--surface2)', color: x.tipo === 'mao_obra' ? 'var(--ok)' : 'var(--ink2)', fontSize: 11 }}>{TIPO_LBL[x.tipo] || 'Material'}</span></td>
                          <td className="muted" style={{ padding: '11px 14px', fontSize: 13 }}>{x.fornece || '—'}</td>
                          <td className="muted" style={{ padding: '11px 14px', fontSize: 13 }}>{x.contato || '—'}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}><button className="muted" onClick={(e) => { e.stopPropagation(); del(x.id) }} style={{ fontSize: 15 }}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  )
}
