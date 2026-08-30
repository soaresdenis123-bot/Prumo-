import { useEffect, useMemo, useState } from 'react'
import { catalogoPublico, minhasSelecoes, salvarSelecoes, CLIENTE_CATS, BRL } from '../lib/data'

// Cliente escolhe produtos por CATEGORIA — nunca vê o fornecedor.
export default function Personalizacao({ token }) {
  const [cat, setCat] = useState(null)          // itens do catálogo
  const [sel, setSel] = useState({})            // { [id]: quantidade }
  const [aba, setAba] = useState('')            // categoria ativa
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    catalogoPublico(token).then((all) => {
      // só categorias que o cliente pode personalizar
      const items = all.filter((i) => CLIENTE_CATS.includes(i.categoria))
      setCat(items)
      if (items[0]) setAba(items[0].categoria)
    }).catch(() => setCat([]))
    minhasSelecoes(token).then((ss) => {
      const m = {}; ss.forEach((s) => { if (s.produto_id) m[s.produto_id] = Number(s.quantidade) || 1 })
      setSel(m)
    }).catch(() => {})
  }, [token])

  const categorias = useMemo(() => {
    const set = []; (cat || []).forEach((i) => { if (!set.includes(i.categoria)) set.push(i.categoria) })
    return set
  }, [cat])

  if (!cat) return null
  if (cat.length === 0) return null   // sem catálogo liberado, não mostra a seção

  const setQtd = (id, q) => setSel((s) => { const n = { ...s }; if (q <= 0) delete n[id]; else n[id] = q; return n })
  const itensCat = cat.filter((i) => i.categoria === aba)
  const escolhidos = cat.filter((i) => sel[i.id] > 0)
  const total = escolhidos.reduce((t, i) => t + (Number(i.preco) || 0) * sel[i.id], 0)

  async function salvar() {
    setSaving(true)
    const itens = escolhidos.map((i) => ({ produto_id: i.id, item: i.item, categoria: i.categoria, preco: i.preco, quantidade: sel[i.id] }))
    try { await salvarSelecoes(token, itens); setMsg('Enviado pra equipe da MS ✓ — eles vão confirmar com você.') }
    catch (e) { setMsg('Não consegui salvar: ' + e.message) }
    setSaving(false); setTimeout(() => setMsg(''), 4000)
  }

  const chip = (on) => ({ padding: '7px 14px', borderRadius: 20, border: '1px solid var(--line)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: on ? 'var(--accent)' : 'var(--surface)', color: on ? '#fff' : 'var(--ink2)', whiteSpace: 'nowrap' })

  return (
    <div style={{ marginTop: 28 }}>
      <div className="sec-title">Personalize sua casa</div>
      <div className="muted" style={{ fontSize: 12.5, margin: '-4px 0 14px' }}>
        Escolha os acabamentos, revestimentos, luminárias e itens da sua casa. Monte do seu jeito — a equipe confirma com você.
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
        {categorias.map((c) => <span key={c} style={chip(aba === c)} onClick={() => setAba(c)}>{c}</span>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
        {itensCat.map((i) => {
          const q = sel[i.id] || 0
          return (
            <div key={i.id} className="card" style={{ padding: 0, overflow: 'hidden', border: q ? '1.5px solid var(--accent)' : '1px solid var(--line)' }}>
              <div style={{ height: 120, background: i.imagemUrl ? `center/cover no-repeat url(${i.imagemUrl})` : 'var(--surface2)', display: 'grid', placeItems: 'center', color: 'var(--ink3)', fontSize: 26 }}>
                {i.imagemUrl ? '' : '🏠'}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.25 }}>{i.item}</div>
                {i.descricao && <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{i.descricao}</div>}
                <div className="mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 6, color: 'var(--accent2)' }}>
                  {Number(i.preco) > 0 ? BRL(i.preco) : 'sob consulta'}<span className="muted" style={{ fontSize: 11, fontWeight: 400 }}> /{i.unidade || 'un'}</span>
                </div>
                {q === 0 ? (
                  <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '7px' }} onClick={() => setQtd(i.id, 1)}>Escolher</button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <button className="btn ghost" style={{ padding: '5px 11px' }} onClick={() => setQtd(i.id, q - 1)}>−</button>
                    <input type="number" value={q} onChange={(e) => setQtd(i.id, Math.max(0, Number(e.target.value) || 0))}
                      style={{ width: 54, textAlign: 'center', padding: '6px', border: '1px solid var(--line)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'IBM Plex Mono' }} />
                    <button className="btn ghost" style={{ padding: '5px 11px' }} onClick={() => setQtd(i.id, q + 1)}>+</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {escolhidos.length > 0 && (
        <div className="card" style={{ padding: 16, marginTop: 18 }}>
          <div className="sec-title" style={{ marginTop: 0 }}>Meu projeto · {escolhidos.length} {escolhidos.length === 1 ? 'item' : 'itens'}</div>
          {escolhidos.map((i) => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--line2)', fontSize: 13 }}>
              <span>{i.item} <span className="muted" style={{ fontSize: 12 }}>· {sel[i.id]} {i.unidade || 'un'}</span></span>
              <span className="mono" style={{ fontWeight: 600 }}>{BRL((Number(i.preco) || 0) * sel[i.id])}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
            <div><div className="muted" style={{ fontSize: 12 }}>Total estimado das escolhas</div><div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>{BRL(total)}</div></div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {msg && <span style={{ fontSize: 12.5, color: 'var(--ok)' }}>{msg}</span>}
              <button className="btn" onClick={salvar} disabled={saving}>{saving ? 'Enviando…' : 'Enviar minhas escolhas'}</button>
            </div>
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>Valores estimados. A equipe da MS confirma disponibilidade e o valor final com você.</div>
        </div>
      )}
    </div>
  )
}
