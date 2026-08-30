import { useEffect, useMemo, useState } from 'react'
import { listProdutosObra, addProdutoObra, updateProdutoObra, deleteProdutoObra } from '../lib/data'

const inp = { padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontSize: 13 }
const STATUS = { a_comprar: { label: 'A comprar', cls: 'pend' }, pedido: { label: 'Pedido', cls: 'prog' }, recebido: { label: 'Recebido', cls: 'ok' } }

export default function ProdutosObra({ obra }) {
  const [prods, setProds] = useState(null)
  const [p, setP] = useState({ item: '', unidade: 'un', quantidade: 1, etapa_id: '' })

  async function load() { setProds(await listProdutosObra(obra.id)) }
  useEffect(() => { load() }, [obra.id])

  async function add() {
    if (!p.item.trim()) return
    await addProdutoObra(obra.id, { item: p.item, unidade: p.unidade || 'un', quantidade: Number(p.quantidade) || 1, etapa_id: p.etapa_id || null })
    setP({ item: '', unidade: 'un', quantidade: 1, etapa_id: p.etapa_id }); load()
  }
  async function upd(id, fields) { await updateProdutoObra(id, fields); load() }
  async function del(id) { await deleteProdutoObra(id); load() }

  const nomeEtapa = useMemo(() => Object.fromEntries((obra.etapas || []).map((e) => [e.id, e.nome])), [obra.etapas])
  const grupos = useMemo(() => {
    const g = {}
    ;(prods || []).forEach((x) => { const k = x.etapa_id || 'sem'; (g[k] = g[k] || []).push(x) })
    // ordena pelas etapas da obra; "sem etapa" por último
    const ordered = (obra.etapas || []).map((e) => e.id).filter((id) => g[id]).map((id) => [id, g[id]])
    if (g.sem) ordered.push(['sem', g.sem])
    return ordered
  }, [prods, obra.etapas])

  if (!prods) return <div className="spin" />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span className="pill" style={{ background: 'var(--accent-bg, var(--surface2))', color: 'var(--accent2)', fontWeight: 700 }}>Lista de compras · ligada às etapas</span>
        <span className="muted" style={{ fontSize: 12 }}>{prods.length} produtos</span>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Produto / item *" value={p.item} onChange={(e) => setP({ ...p, item: e.target.value })} style={{ ...inp, flex: 3, minWidth: 160 }} />
          <input type="number" placeholder="Qtd" value={p.quantidade} onChange={(e) => setP({ ...p, quantidade: e.target.value })} style={{ ...inp, width: 70, textAlign: 'right', fontFamily: 'IBM Plex Mono' }} />
          <input placeholder="Un." value={p.unidade} onChange={(e) => setP({ ...p, unidade: e.target.value })} style={{ ...inp, width: 70 }} />
          <select value={p.etapa_id} onChange={(e) => setP({ ...p, etapa_id: e.target.value })} style={{ ...inp, flex: 2, minWidth: 160 }}>
            <option value="">Fase / etapa…</option>
            {(obra.etapas || []).map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
          <button className="btn" onClick={add}>+ Adicionar</button>
        </div>
      </div>

      {prods.length === 0 ? (
        <div className="center-note">Nenhum produto na lista. Adicione o que precisa comprar para cada fase da obra.</div>
      ) : (
        grupos.map(([k, itens]) => (
          <div key={k} style={{ marginBottom: 18 }}>
            <div style={{ padding: '8px 4px', fontSize: 11, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--accent2)', fontWeight: 700 }}>
              {k === 'sem' ? 'Sem fase definida' : nomeEtapa[k]} <span className="muted" style={{ fontWeight: 500 }}>· {itens.length}</span>
            </div>
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead><tr>{['Produto', 'Qtd', 'Status', 'Pedir mais', ''].map((h) => (
                  <th key={h} style={{ textAlign: h === 'Qtd' ? 'right' : 'left', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700, padding: '10px 14px', borderBottom: '1px solid var(--line)' }}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {itens.map((x) => (
                    <tr key={x.id} style={{ borderBottom: '1px solid var(--line2)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{x.item}</td>
                      <td className="mono" style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, whiteSpace: 'nowrap' }}>{x.quantidade} {x.unidade}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <select value={x.status} onChange={(e) => upd(x.id, { status: e.target.value })}
                          className={'pill ' + (STATUS[x.status]?.cls || 'pend')} style={{ border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                          {Object.entries(STATUS).map(([kk, v]) => <option key={kk} value={kk}>{v.label}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => upd(x.id, { pedir: !x.pedir })} title="Marcar que precisa pedir mais"
                          className={'pill ' + (x.pedir ? 'crit' : 'pend')} style={{ border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 11 }}>
                          {x.pedir ? '⚠ Pedir mais' : 'ok'}
                        </button>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}><button className="muted" onClick={() => del(x.id)} style={{ fontSize: 15 }}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
