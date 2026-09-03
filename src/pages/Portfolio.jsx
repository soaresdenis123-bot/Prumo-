import PlumbMark from '../components/PlumbMark'
import PortfolioGrid from '../components/PortfolioGrid'

/* Portfólio público (sem login) — acabamentos, revestimentos e paisagismo. */
export default function Portfolio() {
  return (
    <>
      <div style={{ borderBottom: '1px solid var(--line)', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <PlumbMark size={26} ink="var(--ink)" />
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.3px' }}>MS <span style={{ fontWeight: 500 }}>Construções</span></div>
        <div className="muted" style={{ marginLeft: 'auto', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }}>Portfólio MS</div>
      </div>
      <div className="content" style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div className="pg-head" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700 }}>Acabamentos, revestimentos & paisagismo</div>
          <h1 className="pg" style={{ marginTop: 6 }}>Portfólio MS</h1>
          <div className="pg-sub" style={{ maxWidth: 620, margin: '8px auto 0' }}>As opções que dão cara à sua casa, dos revestimentos ao paisagismo. Cada categoria com 3 padrões. Clique numa imagem para ampliar.</div>
        </div>
        <PortfolioGrid />
        <div className="center-note" style={{ margin: '22px auto', fontSize: 12 }}>MS Construções Inteligentes · Os acabamentos definem o padrão e o valor final da obra</div>
      </div>
    </>
  )
}
