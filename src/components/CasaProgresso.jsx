// Casa que se constrói — elevação arquitetônica moderna (médio/alto padrão).
// Começa como esqueleto steel frame e materializa por fase: laje → estrutura →
// paredes (render) → telhado 4 águas → pele de vidro com luz quente → pedra/madeira → paisagismo.
export default function CasaProgresso({ etapas = [], pavimentos = 1 }) {
  const fase = (ords) => {
    const es = etapas.filter((e) => ords.includes(e.ordem))
    return es.length ? es.reduce((t, e) => t + (e.pct || 0), 0) / es.length / 100 : 0
  }
  const fFund = fase([4, 5])
  const fEstru = fase([6])
  const fPar = fase([7])
  const fTel = fase([8])
  const fVidro = fase([9, 10, 11]) // esquadrias + instalações + acab. interno
  const fFach = fase([12])          // fachada (pedra/madeira)
  const fPais = fase([13])
  const dois = Number(pavimentos) === 2
  const T = { transition: 'opacity 1s ease' }

  // geometria
  const groundY = 226
  const bodyTop = dois ? 62 : 132
  const bodyBot = 214
  const L = 78, R = 322
  const ridgeY = bodyTop - 30
  const eaveOver = 12
  const floorY = (bodyTop + bodyBot) / 2 // linha de piso (sobrado)

  // montantes do frame
  const studs = []
  for (let x = L + 16; x < R; x += 16) studs.push(x)

  // janelas (grandes panos)
  const glowOp = fVidro * (0.35 + 0.65 * fFach) // luz interna cresce no fim

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line)' }}>
      <svg viewBox="0 0 400 250" width="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#CFE2F3" /><stop offset="0.7" stopColor="#E8F0F6" /><stop offset="1" stopColor="#EAF0EC" />
          </linearGradient>
          <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3A424E" /><stop offset="1" stopColor="#272C34" />
          </linearGradient>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F1EBDF" /><stop offset="1" stopColor="#DFD6C6" />
          </linearGradient>
          <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#AFD0E6" /><stop offset="1" stopColor="#6E93B4" />
          </linearGradient>
          <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#9A6B3F" /><stop offset="1" stopColor="#7E5632" />
          </linearGradient>
          <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#B9C6D2" /><stop offset="1" stopColor="#8A9AA8" />
          </linearGradient>
          <radialGradient id="glow" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0" stopColor="#FBE6B0" /><stop offset="1" stopColor="#F3D48A" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="400" height="250" fill="url(#sky)" />
        {/* terreno */}
        <rect x="0" y={groundY} width="400" height={250 - groundY} fill="#DDE4DA" />
        <ellipse cx="200" cy={bodyBot + 8} rx="150" ry="10" fill="#000" opacity="0.06" />

        {/* laje */}
        <g style={T} opacity={fFund}>
          <rect x={L - 10} y={bodyBot} width={R - L + 20} height="12" fill="#C6CBD2" />
          <rect x={L - 10} y={bodyBot + 12} width={R - L + 20} height="4" fill="#A9AFB8" />
        </g>

        {/* esqueleto steel frame */}
        <g stroke="url(#steel)" strokeWidth="1.5" fill="none" opacity={0.35 + 0.55 * fEstru} style={T} strokeLinecap="round">
          <rect x={L} y={bodyTop} width={R - L} height={bodyBot - bodyTop} />
          {dois && <line x1={L} y1={floorY} x2={R} y2={floorY} strokeWidth="2.2" />}
          {studs.map((x, i) => <line key={i} x1={x} y1={bodyTop} x2={x} y2={bodyBot} />)}
          {/* telhado 4 águas (linhas) */}
          <polyline points={`${L - eaveOver},${bodyTop} ${L + 46},${ridgeY} ${R - 46},${ridgeY} ${R + eaveOver},${bodyTop}`} />
          <line x1={L - eaveOver} y1={bodyTop} x2={R + eaveOver} y2={bodyTop} />
          {/* treliças */}
          {[...Array(8)].map((_, i) => { const x = L + 20 + i * ((R - L - 40) / 7); return <line key={'t' + i} x1={x} y1={bodyTop} x2={(L + R) / 2} y2={ridgeY} opacity="0.5" /> })}
          <line x1={L} y1={bodyBot} x2={L + 34} y2={dois ? floorY : bodyTop} />
          <line x1={R} y1={bodyBot} x2={R - 34} y2={dois ? floorY : bodyTop} />
        </g>

        {/* paredes (render) */}
        <g style={T} opacity={fPar}>
          <rect x={L} y={bodyTop} width={R - L} height={bodyBot - bodyTop} fill="url(#wall)" />
          {/* volume recuado central (sombra sutil) */}
          <rect x="176" y={bodyTop} width="48" height={bodyBot - bodyTop} fill="#000" opacity="0.05" />
        </g>

        {/* telhado 4 águas */}
        <g style={T} opacity={fTel}>
          <polygon points={`${L - eaveOver},${bodyTop + 2} ${L + 46},${ridgeY} ${R - 46},${ridgeY} ${R + eaveOver},${bodyTop + 2}`} fill="url(#roof)" />
          <polygon points={`${L - eaveOver},${bodyTop + 2} ${R + eaveOver},${bodyTop + 2} ${R + eaveOver},${bodyTop + 9} ${L - eaveOver},${bodyTop + 9}`} fill="#20242B" />
          <line x1={L + 46} y1={ridgeY} x2={R - 46} y2={ridgeY} stroke="#454E5A" strokeWidth="1.4" />
        </g>

        {/* pele de vidro + luz interna */}
        <g style={T} opacity={fVidro}>
          {/* brilho quente por trás do vidro */}
          <g opacity={glowOp} style={T}>
            <rect x={L + 10} y={bodyTop + 10} width="52" height={(dois ? floorY : bodyBot) - bodyTop - 18} fill="url(#glow)" />
            {dois && <rect x={L + 10} y={floorY + 8} width="52" height={bodyBot - floorY - 16} fill="url(#glow)" />}
            <rect x="230" y={bodyTop + 10} width="60" height={(dois ? floorY : bodyBot) - bodyTop - 18} fill="url(#glow)" />
          </g>
          <Vidro x={L + 10} y={bodyTop + 10} w={52} h={(dois ? floorY : bodyBot) - bodyTop - 18} />
          <Vidro x={230} y={bodyTop + 10} w={60} h={(dois ? floorY : bodyBot) - bodyTop - 18} />
          {dois && <><Vidro x={L + 10} y={floorY + 8} w={52} h={bodyBot - floorY - 16} /><Vidro x={230} y={floorY + 8} w={60} h={bodyBot - floorY - 16} /></>}
          {/* porta de entrada (madeira) */}
          <rect x="188" y={bodyBot - 44} width="24" height="44" fill="url(#wood)" />
          <line x1="200" y1={bodyBot - 44} x2="200" y2={bodyBot} stroke="#5E421F" strokeWidth="0.8" />
          <rect x="207" y={bodyBot - 26} width="2.5" height="8" fill="#D8C7A0" />
        </g>

        {/* fachada: pedra + madeira */}
        <g style={T} opacity={fFach}>
          <Pedra x={168} y={bodyTop} w={20} h={bodyBot - bodyTop} />
          {/* ripado de madeira (lateral direita) */}
          <g>
            <rect x={R - 46} y={dois ? floorY + 6 : bodyTop + 12} width="40" height={dois ? bodyBot - floorY - 6 : bodyBot - bodyTop - 12} fill="url(#wood)" />
            {[...Array(7)].map((_, i) => <line key={i} x1={R - 46} y1={(dois ? floorY + 6 : bodyTop + 12) + 6 + i * 8} x2={R - 6} y2={(dois ? floorY + 6 : bodyTop + 12) + 6 + i * 8} stroke="#5E421F" strokeWidth="0.7" opacity="0.5" />)}
          </g>
        </g>

        {/* paisagismo */}
        <g style={T} opacity={fPais}>
          {/* passeio */}
          <g opacity="0.9">{[...Array(4)].map((_, i) => <rect key={i} x={192} y={bodyBot + 18 + i * 6} width={16 + i * 6} height="4" rx="1" fill="#CFCFCC" transform={`translate(${-i * 3},0)`} />)}</g>
          <Arv x={L - 30} y={bodyBot + 8} s={1.1} />
          <Vege x={L + 2} y={bodyBot + 10} />
          <Vege x={R - 2} y={bodyBot + 10} />
          {[...Array(11)].map((_, i) => <line key={i} x1={26 + i * 10} y1={groundY + 6} x2={26 + i * 10} y2={groundY} stroke="#7BA86A" strokeWidth="1.4" />)}
        </g>
      </svg>
    </div>
  )
}

function Vidro({ x, y, w, h }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="url(#glass)" opacity="0.9" />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#2A2E35" strokeWidth="2" />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#2A2E35" strokeWidth="1.3" />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="#2A2E35" strokeWidth="1.3" />
      <polygon points={`${x + 4},${y + 4} ${x + w * 0.42},${y + 4} ${x + 4},${y + h * 0.5}`} fill="#fff" opacity="0.14" />
    </g>
  )
}
function Pedra({ x, y, w, h }) {
  const rows = []
  for (let j = 0; j < Math.floor(h / 8); j++) for (let i = 0; i < 3; i++)
    rows.push(<rect key={j + '-' + i} x={x + i * (w / 3) + (j % 2) * 2} y={y + j * 8} width={w / 3 - 1.5} height="6.5" rx="1" fill={i % 2 ? '#B4A996' : '#A79B86'} />)
  return <g><rect x={x} y={y} width={w} height={h} fill="#ADA189" />{rows}</g>
}
function Arv({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x="-2.5" y="-30" width="5" height="30" fill="#6E5236" />
      <circle cx="0" cy="-40" r="16" fill="#4E7E48" />
      <circle cx="-11" cy="-32" r="12" fill="#5C8C52" />
      <circle cx="11" cy="-33" r="12" fill="#5C8C52" />
      <circle cx="0" cy="-30" r="12" fill="#67985B" />
    </g>
  )
}
function Vege({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {[...Array(5)].map((_, i) => <line key={i} x1="0" y1="0" x2={(i - 2) * 3} y2={-12 - Math.abs(i - 2) * 2} stroke="#6FA35E" strokeWidth="1.6" strokeLinecap="round" />)}
    </g>
  )
}
