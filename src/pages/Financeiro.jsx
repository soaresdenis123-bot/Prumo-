import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listObras, listCustosAll, BRL } from '../lib/data'
import { orcadoDe } from './Painel'

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function ReceitaChart({ obras }) {
  // soma o orçado por mês de início da obra (carteira contratada no tempo)
  const bucket = {}
  obras.forEach((o) => {
    if (!o.inicio) return
    const d = new Date(o.inicio)
    if (isNaN(d)) return
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    bucket[key] = (bucket[key] || 0) + orcadoDe(o)
  })
  const keys = Object.keys(bucket).sort().slice(-12)
  if (keys.length === 0) return null
  const max = Math.max(...keys.map((k) => bucket[k]), 1)
  const W = Math.max(keys.length * 64, 320), H = 150, pad = 24
  const bw = (W - pad) / keys.length

  return (
    <div className="card" style={{ padding: 18, marginBottom: 20 }}>
      <div className="sec-title" style={{ marginTop: 0 }}>Receita contratada no tempo <span className="muted" style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· orçado por mês de início</span></div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%" style={{ maxWidth: W, minWidth: 320 }}>
          {[0.25, 0.5, 0.75, 1].map((g) => (
            <line key={g} x1={pad} x2={W} y1={H - g * (H - 10)} y2={H - g * (H - 10)} stroke="var(--line2)" strokeWidth="1" />
          ))}
          {keys.map((k, i) => {
            const h = (bucket[k] / max) * (H - 10)
            const x = pad + i * bw + bw * 0.18
            const [y, m] = k.split('-')
            return (
              <g key={k}>
                <rect x={x} y={H - h} width={bw * 0.64} height={h} rx="4" fill="var(--accent)" />
                <text x={x + bw * 0.32} y={H + 15} textAnchor="middle" fontSize="10" fill="var(--ink3)" fontFamily="IBM Plex Sans">{MES[+m - 1]}/{y.slice(2)}</text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>Total contratado no período: <b className="mono" style={{ color: 'var(--ink)' }}>{BRL(keys.reduce((t, k) => t + bucket[k], 0))}</b></div>
    </div>
  )
}

export default function Financeiro() {
  const nav = useNavigate()
  const [obras, setObras] = useState(null)
  const [custos, setCustos] = useState({})
  const [err, setErr] = useState('')

  useEffect(() => {
    Promise.all([listObras(), listCustosAll()])
      .then(([os, cs]) => { setObras(os); setCustos(cs) })
      .catch((e) => setErr(e.message))
  }, [])

  if (err) return <div className="content"><div className="center-note">Erro: {err}</div></div>
  if (!obras) return <div className="spin" />

  const rows = obras.map((o) => {
    const orc = orcadoDe(o)
    const custo = custos[o.id] || 0
    const margem = orc ? Math.round((1 - custo / orc) * 100) : 0
    const consumo = orc ? Math.round((custo / orc) * 100) : 0
    return { o, orc, custo, margem, consumo }
  })
  const orcTot = rows.reduce((t, r) => t + r.orc, 0)
  const custoTot = rows.reduce((t, r) => t + r.custo, 0)
  const lucroTot = orcTot - custoTot
  const margemMedia = orcTot ? Math.round((1 - custoTot / orcTot) * 100) : 0

  return (
    <>
      <div className="topbar"><div className="crumb"><b>Financeiro</b></div>
        <span className="chip-role">Interno</span></div>
      <div className="content">
        <div className="pg-head"><div><h1 className="pg">Financeiro</h1>
          <div className="pg-sub">Orçado × custo × margem — consolidado do Grupo MS</div></div></div>

        <div className="grid-kpi">
          <div className="card kpi"><div className="k">Carteira (orçado)</div><div className="v">{BRL(orcTot)}</div><div className="dsc">{obras.length} obras</div></div>
          <div className="card kpi"><div className="k">Custo realizado</div><div className="v">{BRL(custoTot)}</div><div className="dsc">{orcTot ? Math.round(custoTot / orcTot * 100) : 0}% do orçado</div></div>
          <div className="card kpi"><div className="k">Lucro projetado</div><div className="v" style={{ color: lucroTot >= 0 ? 'var(--ok)' : 'var(--crit)' }}>{BRL(lucroTot)}</div><div className="dsc">margem {margemMedia}%</div></div>
          <div className="card kpi"><div className="k">Ticket médio</div><div className="v">{BRL(obras.length ? Math.round(orcTot / obras.length) : 0)}</div><div className="dsc">por obra</div></div>
        </div>

        <ReceitaChart obras={obras} />


        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Obra', 'Orçado', 'Custo atual', 'Margem', 'Consumo do orçamento'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 || i === 4 ? 'left' : 'right', fontSize: 10.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700, padding: '11px 14px', borderBottom: '1px solid var(--line)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ o, orc, custo, margem, consumo }) => (
                <tr key={o.id} onClick={() => nav('/obra/' + o.id)} style={{ cursor: 'pointer', borderBottom: '1px solid var(--line2)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13 }}>{o.nome}</td>
                  <td className="mono" style={{ padding: '12px 14px', textAlign: 'right', fontSize: 13 }}>{BRL(orc)}</td>
                  <td className="mono" style={{ padding: '12px 14px', textAlign: 'right', fontSize: 13 }}>{BRL(custo)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <span className={'pill ' + (margem > 25 ? 'ok' : margem > 12 ? 'prog' : 'pend')}><span className="d" />{margem}%</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div className="bar"><i style={{ width: Math.min(consumo, 100) + '%', background: consumo > 82 ? 'var(--crit)' : 'var(--accent)' }} /></div>
                      <span className="mono" style={{ fontSize: 12, minWidth: 34, textAlign: 'right' }}>{consumo}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
