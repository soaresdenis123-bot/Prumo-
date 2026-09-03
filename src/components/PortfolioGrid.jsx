import { useMemo, useState } from 'react'
import { MATERIAIS_CAT, GRUPOS } from '../lib/materiais'

/* Grid do portfólio (acabamentos + paisagismo), reutilizado na página pública
   /acabamentos e na aba Fornecedores > Portfólios. */
export default function PortfolioGrid() {
  const [q, setQ] = useState('')
  const [grupo, setGrupo] = useState('todos')
  const [zoom, setZoom] = useState(null)

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    return MATERIAIS_CAT.filter((m) =>
      (grupo === 'todos' || m.grupo === grupo) &&
      (!t || m.nome.toLowerCase().includes(t) || m.opcoes.join(' ').toLowerCase().includes(t))
    )
  }, [q, grupo])
  const porGrupo = useMemo(() => { const g = {}; lista.forEach((m) => { (g[m.grupo] = g[m.grupo] || []).push(m) }); return g }, [lista])

  const chip = (on) => ({ padding: '7px 14px', borderRadius: 999, border: '1px solid var(--line)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', background: on ? 'var(--accent)' : 'transparent', color: on ? '#fff' : 'var(--ink3,#666)', whiteSpace: 'nowrap' })
  const inp = { width: '100%', padding: '11px 13px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface,#fff)', color: 'var(--ink)', fontSize: 14 }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', margin: '4px 0 22px' }}>
        <div style={{ maxWidth: 340, width: '100%' }}>
          <input style={inp} placeholder="Buscar (porcelanato, alumínio, mármore, jardim…)" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button style={chip(grupo === 'todos')} onClick={() => setGrupo('todos')}>Todos</button>
          {GRUPOS.map((g) => <button key={g} style={chip(grupo === g)} onClick={() => setGrupo(g)}>{g}</button>)}
        </div>
      </div>

      {lista.length === 0 && <div className="muted" style={{ textAlign: 'center', fontSize: 13 }}>Nada encontrado.</div>}

      {GRUPOS.filter((g) => porGrupo[g]?.length).map((g) => (
        <div key={g} style={{ marginBottom: 30 }}>
          <div className="sec-title" style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>{g} <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>· {porGrupo[g].length}</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16, marginTop: 10 }}>
            {porGrupo[g].map((m) => (
              <div key={m.slug} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <button onClick={() => setZoom(m)} style={{ display: 'block', width: '100%', border: 'none', padding: 0, cursor: 'zoom-in', background: '#111' }}>
                  <img src={m.img} alt={m.nome} loading="lazy" style={{ width: '100%', display: 'block' }} />
                </button>
                <div style={{ padding: '11px 13px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.nome}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {m.opcoes.map((o) => <span key={o} className="pill" style={{ fontSize: 11, background: 'var(--surface2,#f2ede4)', color: 'var(--ink2,#555)', fontWeight: 600 }}>{o}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {zoom && (
        <div onClick={() => setZoom(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,.9)', zIndex: 60, display: 'grid', placeItems: 'center', padding: 20, cursor: 'zoom-out' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900, width: '100%' }}>
            <img src={zoom.img} alt={zoom.nome} style={{ width: '100%', borderRadius: 12, boxShadow: '0 30px 80px rgba(0,0,0,.5)' }} />
            <div style={{ color: '#F4EFE6', textAlign: 'center', marginTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{zoom.nome}</div>
              <div style={{ opacity: .8, fontSize: 13, marginTop: 2 }}>{zoom.opcoes.join(' · ')}</div>
              <button onClick={() => setZoom(null)} style={{ marginTop: 12, background: 'transparent', border: '1px solid rgba(244,239,230,.4)', color: '#F4EFE6', padding: '8px 16px', borderRadius: 999, cursor: 'pointer', fontSize: 13 }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
