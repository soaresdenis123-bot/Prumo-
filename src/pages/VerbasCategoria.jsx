import { useEffect, useMemo, useState } from 'react'
import { listVerbas, setVerba, deleteVerba, listSelecoes, OBRA_CATEGORIAS, BRL } from '../lib/data'

// Orçamento definido por categoria (verba) e o quanto as escolhas do cliente já consumiram.
export default function VerbasCategoria({ obra }) {
  const [verbas, setVerbas] = useState(null)
  const [sel, setSel] = useState([])
  const [nova, setNova] = useState({ categoria: '', valor: '' })

  async function load() {
    setVerbas(await listVerbas(obra.id))
    try { setSel(await listSelecoes(obra.id)) } catch { setSel([]) }
  }
  useEffect(() => { load() }, [obra.id])

  // consumo por categoria = soma das escolhas do cliente (preço de cliente × qtd)
  const consumo = useMemo(() => {
    const c = {}
    sel.forEach((s) => { const k = s.categoria || 'Outros'; c[k] = (c[k] || 0) + (Number(s.preco_cliente) || 0) * (Number(s.quantidade) || 0) })
    return c
  }, [sel])

  if (!verbas) return null

  // linhas = verbas cadastradas + categorias que já têm consumo mas ainda sem verba
  const cats = Array.from(new Set([...verbas.map((v) => v.categoria), ...Object.keys(consumo)]))
  const linhas = cats.map((cat) => {
    const v = verbas.find((x) => x.categoria === cat)
    const verba = v ? Number(v.valor) : 0
    const cons = consumo[cat] || 0
    return { cat, id: v?.id, temVerba: !!v, verba, cons, saldo: verba - cons }
  }).sort((a, b) => {
    const ia = OBRA_CATEGORIAS.indexOf(a.cat), ib = OBRA_CATEGORIAS.indexOf(b.cat)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })

  const totVerba = linhas.reduce((t, l) => t + l.verba, 0)
  const totCons = linhas.reduce((t, l) => t + l.cons, 0)

  async function salvarVerba(cat, valor) { await setVerba(obra.id, cat, valor); load() }
  async function addLinha() { if (!nova.categoria) return; await setVerba(obra.id, nova.categoria, Number(nova.valor) || 0); setNova({ categoria: '', valor: '' }); load() }
  async function remover(id) { if (!id) return; await deleteVerba(id); load() }

  const inp = { padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink)', fontSize: 12.5 }
  const catsLivres = OBRA_CATEGORIAS.filter((c) => !linhas.some((l) => l.cat === c))

  return (
    <div className="card" style={{ padding: 16, marginBottom: 18 }}>
      <div className="sec-title" style={{ marginTop: 0 }}>Verba por categoria <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>· quanto do orçamento é pra cada parte</span></div>
      <div className="muted" style={{ fontSize: 12, margin: '-2px 0 12px' }}>
        Defina a verba de cada categoria (ex.: Fundação, Estrutura, Revestimentos). O que o cliente escolhe é <b>descontado</b> da verba da categoria — o saldo mostra se sobrou ou estourou.
      </div>

      <div className="tbl-scroll" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead><tr>{['Categoria', 'Verba', 'Escolhas do cliente', 'Saldo', ''].map((h, i) => (
            <th key={h} style={{ textAlign: i === 0 ? 'left' : i === 4 ? 'center' : 'right', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700, padding: '9px 12px', borderBottom: '1px solid var(--line)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>
            {linhas.length === 0 && <tr><td colSpan="5" className="muted" style={{ padding: '12px', fontSize: 12.5 }}>Nenhuma verba ainda. Adicione abaixo (ex.: Revestimentos = R$ 12.000).</td></tr>}
            {linhas.map((l) => (
              <tr key={l.cat} style={{ borderBottom: '1px solid var(--line2)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, fontSize: 13 }}>{l.cat}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                  <input type="number" defaultValue={l.temVerba ? l.verba : ''} placeholder="0" onBlur={(e) => salvarVerba(l.cat, e.target.value)}
                    style={{ ...inp, width: 110, textAlign: 'right', fontFamily: 'IBM Plex Mono' }} />
                </td>
                <td className="mono" style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, color: 'var(--ink2)' }}>{BRL(l.cons)}</td>
                <td className="mono" style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: l.saldo < 0 ? 'var(--crit)' : 'var(--ok)' }}>
                  {l.saldo < 0 ? '− ' + BRL(-l.saldo) : BRL(l.saldo)}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>{l.id && <button className="muted" onClick={() => remover(l.id)} style={{ fontSize: 14 }}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
        <select value={nova.categoria} onChange={(e) => setNova({ ...nova, categoria: e.target.value })} style={{ ...inp, minWidth: 170 }}>
          <option value="">Adicionar categoria…</option>{catsLivres.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="number" placeholder="Verba (R$)" value={nova.valor} onChange={(e) => setNova({ ...nova, valor: e.target.value })} style={{ ...inp, width: 130, textAlign: 'right', fontFamily: 'IBM Plex Mono' }} />
        <button className="btn ghost" style={{ fontSize: 12.5, padding: '7px 11px' }} onClick={addLinha}>+ Definir verba</button>
        <div style={{ marginLeft: 'auto', fontSize: 12.5 }} className="muted">
          Total verba <b className="mono" style={{ color: 'var(--ink)' }}>{BRL(totVerba)}</b> · escolhas <b className="mono" style={{ color: 'var(--ink)' }}>{BRL(totCons)}</b> · saldo <b className="mono" style={{ color: totVerba - totCons < 0 ? 'var(--crit)' : 'var(--ok)' }}>{BRL(totVerba - totCons)}</b>
        </div>
      </div>
    </div>
  )
}
