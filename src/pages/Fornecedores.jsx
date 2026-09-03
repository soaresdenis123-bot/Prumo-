import { useEffect, useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { contarPorCategoria, OBRA_CATEGORIAS } from '../lib/data'
const PortfolioGrid = lazy(() => import('../components/PortfolioGrid'))

export default function Fornecedores() {
  const nav = useNavigate()
  const [cont, setCont] = useState(null)
  const [err, setErr] = useState('')
  const [aba, setAba] = useState('materiais') // materiais | portfolios

  useEffect(() => { contarPorCategoria().then(setCont).catch((e) => setErr(e.message)) }, [])

  if (err) return <div className="content"><div className="center-note">Erro: {err}</div></div>
  if (!cont) return <div className="spin" />

  // categorias da obra + quaisquer extras que já tenham cadastro
  const extras = Object.keys(cont).filter((c) => !OBRA_CATEGORIAS.includes(c))
  const cats = [...OBRA_CATEGORIAS, ...extras]
  const totForn = Object.values(cont).reduce((t, c) => t + c.forn, 0)
  const totItens = Object.values(cont).reduce((t, c) => t + c.itens, 0)
  const tab = (on) => ({ padding: '9px 18px', borderRadius: 999, border: '1px solid var(--line)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', background: on ? 'var(--accent)' : 'transparent', color: on ? '#fff' : 'var(--ink2,#555)' })

  return (
    <>
      <div className="topbar"><div className="crumb"><b>Fornecedores</b></div><span className="chip-role">Interno</span></div>
      <div className="content">
        <div className="pg-head"><div><h1 className="pg">Fornecedores</h1>
          <div className="pg-sub">Material e mão de obra dos seus parceiros, e o portfólio de acabamentos que o cliente vê.</div></div></div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button style={tab(aba === 'materiais')} onClick={() => setAba('materiais')}>Materiais & Serviços</button>
          <button style={tab(aba === 'portfolios')} onClick={() => setAba('portfolios')}>Portfólios</button>
        </div>

        {aba === 'portfolios' ? (
          <div>
            <div className="pg-sub" style={{ fontSize: 13, marginBottom: 14 }}>Catálogo de acabamentos, revestimentos e paisagismo. Também aberto ao cliente em <b>/acabamentos</b>.</div>
            <Suspense fallback={<div className="spin" />}><PortfolioGrid /></Suspense>
          </div>
        ) : (<>
        <div className="pg-head" style={{ marginTop: 0 }}><div><div className="pg-sub">{totForn} fornecedores · {totItens} itens · clique numa categoria pra ver os itens</div></div></div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 }}>
          {cats.map((c) => {
            const n = cont[c] || { forn: 0, itens: 0 }
            const vazio = n.forn === 0 && n.itens === 0
            return (
              <button key={c} onClick={() => nav('/fornecedores/cat/' + encodeURIComponent(c))}
                className="card" style={{ padding: 16, textAlign: 'left', cursor: 'pointer', border: '1px solid var(--line)', opacity: vazio ? 0.72 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface2)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                    <svg viewBox="0 0 24 24" width="19" fill="none" stroke="var(--accent2)" strokeWidth="2"><path d="M1 4h14v11H1zM15 8h4l3 3v4h-7" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{c}</div>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 12, display: 'flex', gap: 12 }}>
                  <span><b className="mono" style={{ color: 'var(--ink)' }}>{n.forn}</b> fornec.</span>
                  <span><b className="mono" style={{ color: 'var(--ink)' }}>{n.itens}</b> itens</span>
                </div>
              </button>
            )
          })}
        </div>
        </>)}
      </div>
    </>
  )
}
