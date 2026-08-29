// Casa que se constrói: começa como esqueleto steel frame e vai
// materializando por fase conforme as etapas avançam. Térrea ou sobrado.
export default function CasaProgresso({ etapas = [], pavimentos = 1 }) {
  const fase = (ords) => {
    const es = etapas.filter((e) => ords.includes(e.ordem))
    return es.length ? es.reduce((t, e) => t + (e.pct || 0), 0) / es.length / 100 : 0
  }
  const fFund = fase([4, 5])       // fundação / laje
  const fEstru = fase([6])         // estrutura steel frame
  const fPar = fase([7])           // paredes / fechamento
  const fTel = fase([8])           // cobertura / telhado
  const fEsq = fase([9, 10, 11])   // esquadrias + instalações + acab. interno
  const fFach = fase([12])         // fachada
  const fPais = fase([13])         // paisagismo
  const dois = Number(pavimentos) === 2

  const bodyTop = dois ? 66 : 118
  const bodyBot = 214
  const peakY = bodyTop - 50
  const L = 96, R = 304, MID = 200
  const eaveL = L - 14, eaveR = R + 14

  // linhas do steel frame (montantes verticais + travamentos)
  const studs = []
  for (let x = L + 20; x < R; x += 20.8) studs.push(x)
  const floorLine = dois ? (bodyTop + bodyBot) / 2 : null

  const T = { transition: 'opacity .8s ease' }

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(#DCEBFA,#EAF3FB 60%,#EAF0EC)', border: '1px solid var(--line)' }}>
      <svg viewBox="0 0 400 250" width="100%" style={{ display: 'block' }}>
        {/* chão */}
        <rect x="0" y="214" width="400" height="36" fill="#DfE8DC" />
        <rect x="0" y="214" width="400" height="3" fill="#CBD8C6" />

        {/* laje / fundação */}
        <g style={T} opacity={fFund}>
          <rect x={L - 8} y={bodyBot - 4} width={R - L + 16} height="12" rx="2" fill="#C7CCD3" />
          <rect x={L - 8} y={bodyBot + 6} width={R - L + 16} height="4" fill="#AEB4BD" />
        </g>

        {/* esqueleto steel frame (sempre visível, fraco) */}
        <g stroke="#2D63E0" strokeWidth="1.4" fill="none" opacity={0.28 + 0.5 * fEstru} style={T}>
          <rect x={L} y={bodyTop} width={R - L} height={bodyBot - bodyTop} />
          <polyline points={`${eaveL},${bodyTop} ${MID},${peakY} ${eaveR},${bodyTop}`} />
          {studs.map((x, i) => <line key={i} x1={x} y1={bodyTop} x2={x} y2={bodyBot} />)}
          {floorLine && <line x1={L} y1={floorLine} x2={R} y2={floorLine} />}
          {/* travamentos diagonais */}
          <line x1={L} y1={bodyBot} x2={L + 41} y2={floorLine || bodyTop} />
          <line x1={R} y1={bodyBot} x2={R - 41} y2={floorLine || bodyTop} />
          <line x1={MID} y1={peakY} x2={MID} y2={bodyTop} />
        </g>

        {/* paredes (materializa) */}
        <g style={T} opacity={fPar}>
          <rect x={L} y={bodyTop} width={R - L} height={bodyBot - bodyTop} fill="#ECE6D8" />
          {/* coluna de pedra (fachada) */}
          <rect x={L} y={bodyTop} width="30" height={bodyBot - bodyTop} fill="#B9B0A2" opacity={fFach} style={T} />
        </g>

        {/* telhado */}
        <g style={T} opacity={fTel}>
          <polygon points={`${eaveL},${bodyTop + 2} ${MID},${peakY} ${eaveR},${bodyTop + 2} ${eaveR},${bodyTop + 12} ${MID},${peakY + 11} ${eaveL},${bodyTop + 12}`} fill="#3B4453" />
          <polygon points={`${eaveL},${bodyTop + 2} ${MID},${peakY} ${MID},${peakY + 8} ${eaveL},${bodyTop + 10}`} fill="#2E3540" />
          {/* chaminé */}
          <rect x={MID - 62} y={peakY + 8} width="16" height="26" fill="#B9B0A2" />
        </g>

        {/* esquadrias: porta + janelas */}
        <g style={T} opacity={fEsq}>
          <rect x={MID - 16} y={bodyBot - 46} width="32" height="46" rx="2" fill="#7A5A3A" />
          <rect x={MID - 12} y={bodyBot - 42} width="24" height="38" fill="#8B6A45" />
          {/* janelas térreo */}
          <Janela x={L + 42} y={bodyBot - 52} />
          <Janela x={R - 74} y={bodyBot - 52} />
          {dois && <><Janela x={L + 42} y={bodyTop + 22} /><Janela x={R - 74} y={bodyTop + 22} /><Janela x={MID - 16} y={bodyTop + 22} /></>}
        </g>

        {/* paisagismo */}
        <g style={T} opacity={fPais}>
          <Arbusto x={L - 26} y={214} />
          <Arbusto x={R + 20} y={214} s={1.2} />
          {[...Array(9)].map((_, i) => <line key={i} x1={30 + i * 12} y1="220" x2={30 + i * 12} y2="214" stroke="#6FA867" strokeWidth="1.4" />)}
        </g>
      </svg>
    </div>
  )
}

function Janela({ x, y }) {
  return (
    <g>
      <rect x={x} y={y} width="32" height="30" rx="1.5" fill="#9EC3E6" stroke="#5E7A93" strokeWidth="1" />
      <line x1={x + 16} y1={y} x2={x + 16} y2={y + 30} stroke="#5E7A93" strokeWidth="1" />
      <line x1={x} y1={y + 15} x2={x + 32} y2={y + 15} stroke="#5E7A93" strokeWidth="1" />
    </g>
  )
}
function Arbusto({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x="-2" y="-16" width="4" height="16" fill="#7A5A3A" />
      <circle cx="0" cy="-22" r="12" fill="#5A8F52" />
      <circle cx="-8" cy="-16" r="9" fill="#6BA063" />
      <circle cx="8" cy="-17" r="9" fill="#6BA063" />
    </g>
  )
}
