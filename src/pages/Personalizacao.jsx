import { useEffect, useMemo, useState } from 'react'
import { catalogoPublico, portfoliosPublicos, ambientesObra, minhasSelecoes, salvarSelecoes, CLIENTE_CATS, AMBIENTE_TIPOS, BRL } from '../lib/data'

// Cliente personaliza a casa AMBIENTE por AMBIENTE — cards + portfólio PDF. Nunca vê o fornecedor.
export default function Personalizacao({ token }) {
  const [cat, setCat] = useState(null)     // produtos do catálogo (cards)
  const [pdfs, setPdfs] = useState([])     // portfólios PDF liberados
  const [amb, setAmb] = useState([])       // lista de ambientes (nomes)
  const [ativo, setAtivo] = useState('')   // ambiente selecionado
  const [novo, setNovo] = useState(AMBIENTE_TIPOS[0])
  const [sel, setSel] = useState({})       // { ambiente: { prodId: qtd } }
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [catAtiva, setCatAtiva] = useState('')

  useEffect(() => {
    Promise.all([
      catalogoPublico(token).then((all) => all.filter((i) => CLIENTE_CATS.includes(i.categoria))).catch(() => []),
      portfoliosPublicos(token).catch(() => []),
      ambientesObra(token).catch(() => []),
      minhasSelecoes(token).catch(() => []),
    ]).then(([produtos, docs, ambObra, escolhas]) => {
      setCat(produtos); setPdfs(docs)
      // ambientes: os da obra (que parecem cômodo) + os já escolhidos antes
      const daObra = (ambObra || []).filter((n) => AMBIENTE_TIPOS.some((t) => (n || '').toLowerCase().startsWith(t.toLowerCase())))
      const dasEscolhas = Array.from(new Set((escolhas || []).map((e) => e.ambiente).filter(Boolean)))
      const lista = Array.from(new Set([...daObra, ...dasEscolhas]))
      setAmb(lista); setAtivo(lista[0] || '')
      // reconstrói seleção salva
      const m = {}
      ;(escolhas || []).forEach((e) => {
        if (!e.produto_id) return
        const a = e.ambiente || 'Casa'
        ;(m[a] = m[a] || {})[e.produto_id] = Number(e.quantidade) || 1
      })
      setSel(m)
    })
  }, [token])

  const prodById = useMemo(() => Object.fromEntries((cat || []).map((p) => [p.id, p])), [cat])
  if (!cat) return null
  if (cat.length === 0 && pdfs.length === 0) return null   // sem catálogo liberado

  function addAmbiente() {
    let nome = novo, n = 2
    while (amb.includes(nome)) { nome = `${novo} ${n++}` }
    setAmb([...amb, nome]); setAtivo(nome)
  }
  function removerAmbiente(a) {
    setAmb(amb.filter((x) => x !== a))
    setSel((s) => { const c = { ...s }; delete c[a]; return c })
    if (ativo === a) setAtivo(amb.filter((x) => x !== a)[0] || '')
  }
  const setQtd = (a, id, q) => setSel((s) => {
    const c = { ...s, [a]: { ...(s[a] || {}) } }
    if (q <= 0) delete c[a][id]; else c[a][id] = q
    return c
  })

  const escolhidosDe = (a) => Object.entries(sel[a] || {}).map(([id, q]) => ({ p: prodById[id], q })).filter((x) => x.p)
  const totalGeral = amb.reduce((t, a) => t + escolhidosDe(a).reduce((s, x) => s + (Number(x.p.preco) || 0) * x.q, 0), 0)
  const totalItens = amb.reduce((t, a) => t + escolhidosDe(a).length, 0)

  async function salvar() {
    setSaving(true)
    const itens = []
    amb.forEach((a) => escolhidosDe(a).forEach((x) => itens.push({
      produto_id: x.p.id, item: x.p.item, categoria: x.p.categoria, preco: x.p.preco, quantidade: x.q, ambiente: a,
    })))
    try { await salvarSelecoes(token, itens); setMsg('Enviado pra equipe da MS ✓ — eles confirmam com você.') }
    catch (e) { setMsg('Não consegui salvar: ' + e.message) }
    setSaving(false); setTimeout(() => setMsg(''), 4000)
  }

  const chip = (on) => ({ padding: '7px 13px', borderRadius: 20, border: '1px solid var(--line)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: on ? 'var(--accent)' : 'var(--surface)', color: on ? '#fff' : 'var(--ink2)', whiteSpace: 'nowrap', display: 'inline-flex', gap: 6, alignItems: 'center' })
  const inpS = { padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontSize: 13 }

  const catsAtivas = CLIENTE_CATS.filter((c) => (cat.some((p) => p.categoria === c) || pdfs.some((d) => d.categoria === c)))
  const cAtiva = catsAtivas.includes(catAtiva) ? catAtiva : catsAtivas[0]

  return (
    <div style={{ marginTop: 28 }}>
      <div className="sec-title">Personalize sua casa</div>
      <div className="muted" style={{ fontSize: 12.5, margin: '-4px 0 14px' }}>
        Escolha cômodo a cômodo os acabamentos, revestimentos, luminárias e mais. Monte do seu jeito — a equipe confirma com você.
      </div>

      {/* ambientes */}
      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink3)', fontWeight: 700, marginBottom: 8 }}>Seus cômodos</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {amb.map((a) => {
            const n = escolhidosDe(a).length
            return <span key={a} style={chip(ativo === a)} onClick={() => setAtivo(a)}>{a}{n > 0 && <b style={{ background: ativo === a ? 'rgba(255,255,255,.25)' : 'var(--accent)', color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: 11 }}>{n}</b>}
              <button onClick={(e) => { e.stopPropagation(); removerAmbiente(a) }} style={{ color: 'inherit', fontSize: 13, opacity: .7 }}>×</button></span>
          })}
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginLeft: amb.length ? 8 : 0 }}>
            <select value={novo} onChange={(e) => setNovo(e.target.value)} style={{ ...inpS, padding: '6px 8px', fontSize: 12.5 }}>
              {AMBIENTE_TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn ghost" style={{ fontSize: 12.5, padding: '6px 10px' }} onClick={addAmbiente}>+ Cômodo</button>
          </span>
        </div>
        {amb.length === 0 && <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>Adicione os cômodos da sua casa pra começar a escolher.</div>}
      </div>

      {/* categorias (clicáveis) do ambiente ativo */}
      {ativo && catsAtivas.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
          {catsAtivas.map((c) => <span key={c} style={chip(cAtiva === c)} onClick={() => setCatAtiva(c)}>{c}</span>)}
        </div>
      )}

      {/* catálogo da categoria ativa */}
      {ativo && [cAtiva].filter(Boolean).map((c) => {
        const prods = cat.filter((p) => p.categoria === c)
        const docs = pdfs.filter((d) => d.categoria === c)
        if (prods.length === 0 && docs.length === 0) return null
        return (
          <div key={c} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent2)' }}>{c}</div>
              {docs.map((d) => (
                <a key={d.id} href={d.url} target="_blank" rel="noreferrer" className="btn ghost" style={{ fontSize: 11.5, padding: '5px 10px' }}>📄 Ver portfólio{d.nome ? ' · ' + d.nome.replace(/\.pdf$/i, '') : ''}</a>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(158px,1fr))', gap: 12 }}>
              {prods.map((i) => {
                const q = (sel[ativo] && sel[ativo][i.id]) || 0
                return (
                  <div key={i.id} className="card" style={{ padding: 0, overflow: 'hidden', border: q ? '1.5px solid var(--accent)' : '1px solid var(--line)' }}>
                    <div style={{ height: 110, background: i.imagemUrl ? `center/cover no-repeat url(${i.imagemUrl})` : 'var(--surface2)', display: 'grid', placeItems: 'center', color: 'var(--ink3)', fontSize: 24 }}>{i.imagemUrl ? '' : '🏠'}</div>
                    <div style={{ padding: '10px 11px' }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.25 }}>{i.item}</div>
                      <div className="mono" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 5, color: 'var(--accent2)' }}>
                        {Number(i.preco) > 0 ? BRL(i.preco) : 'sob consulta'}<span className="muted" style={{ fontSize: 10.5, fontWeight: 400 }}> /{i.unidade || 'un'}</span>
                      </div>
                      {q === 0 ? (
                        <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '6px' }} onClick={() => setQtd(ativo, i.id, 1)}>Escolher</button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <button className="btn ghost" style={{ padding: '4px 10px' }} onClick={() => setQtd(ativo, i.id, q - 1)}>−</button>
                          <input type="number" value={q} onChange={(e) => setQtd(ativo, i.id, Math.max(0, Number(e.target.value) || 0))} style={{ width: 48, textAlign: 'center', padding: '5px', border: '1px solid var(--line)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'IBM Plex Mono' }} />
                          <button className="btn ghost" style={{ padding: '4px 10px' }} onClick={() => setQtd(ativo, i.id, q + 1)}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* resumo */}
      {totalItens > 0 && (
        <div className="card" style={{ padding: 16, marginTop: 6 }}>
          <div className="sec-title" style={{ marginTop: 0 }}>Meu projeto · {totalItens} {totalItens === 1 ? 'item' : 'itens'}</div>
          {amb.filter((a) => escolhidosDe(a).length).map((a) => (
            <div key={a} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink3)', fontWeight: 700, margin: '4px 0' }}>{a}</div>
              {escolhidosDe(a).map((x) => (
                <div key={x.p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--line2)', fontSize: 12.5 }}>
                  <span>{x.p.item} <span className="muted" style={{ fontSize: 11 }}>· {x.q} {x.p.unidade || 'un'}</span></span>
                  <span className="mono" style={{ fontWeight: 600 }}>{BRL((Number(x.p.preco) || 0) * x.q)}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 10 }}>
            <div><div className="muted" style={{ fontSize: 12 }}>Total estimado</div><div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>{BRL(totalGeral)}</div></div>
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
