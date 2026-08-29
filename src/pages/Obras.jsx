import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listObras, progresso } from '../lib/data'

export default function Obras() {
  const nav = useNavigate()
  const [obras, setObras] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    listObras().then(setObras).catch((e) => setErr(e.message))
  }, [])

  if (err) return <div className="content"><div className="center-note">Erro: {err}</div></div>
  if (!obras) return <div className="spin" />

  return (
    <>
      <div className="topbar"><div className="crumb"><b>Obras</b></div></div>
      <div className="content">
        <div className="pg-head">
          <div><h1 className="pg">Obras</h1><div className="pg-sub">{obras.length} cadastradas</div></div>
          <Link to="/nova" className="btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>Nova obra
          </Link>
        </div>
        <div className="obras-grid">
          {obras.map((o) => {
            const p = progresso(o.etapas)
            const st = p >= 100 ? 'ok' : p > 0 ? 'prog' : 'pend'
            return (
              <div key={o.id} className="card obra-card" onClick={() => nav('/obra/' + o.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div><div style={{ fontSize: 18, fontWeight: 600 }}>{o.nome}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{o.cliente_nome || '—'}</div></div>
                  <span className={'pill ' + st}><span className="d" />{p >= 100 ? 'Concluída' : p > 0 ? 'Em obra' : 'Início'}</span>
                </div>
                <div className="muted" style={{ fontSize: 12, margin: '12px 0 8px' }}>{o.endereco || '—'} · {o.cidade || ''}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                  <div className={'bar ' + (p >= 100 ? 'ok' : '')}><i style={{ width: p + '%' }} /></div>
                  <span className="mono" style={{ fontSize: 12 }}>{p}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink2)' }}>
                  <span>Padrão <b>{o.padrao || '—'}</b></span><span>{o.area_m2 || '—'} m²</span><span>Entrega {o.previsao || '—'}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
