import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { listObras, progresso, BRL } from '../lib/data'
import { useAuth } from '../lib/auth'

const finDe = (o) => (Array.isArray(o.obra_financeiro) ? o.obra_financeiro[0] : o.obra_financeiro) || {}
export const orcadoDe = (o) => finDe(o).orcado || 0
export const metaCustoDe = (o) => finDe(o).meta_custo || 0

function seg(etapas) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {etapas.map((e) => (
        <div
          key={e.id}
          title={`${e.nome}: ${e.status === 'concluida' ? 'Concluída' : e.status === 'andamento' ? e.pct + '%' : 'Pendente'}`}
          style={{
            flex: 1, height: 8, borderRadius: 2,
            background: e.status === 'concluida' ? 'var(--ok)' : e.status === 'andamento' ? 'var(--prog)' : 'var(--line)',
          }}
        />
      ))}
    </div>
  )
}

export default function Painel() {
  const { isStaff, papel } = useAuth()
  const nav = useNavigate()
  const [obras, setObras] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    listObras().then(setObras).catch((e) => setErr(e.message))
  }, [])

  if (err) return <div className="content"><div className="center-note">Erro ao carregar: {err}</div></div>
  if (!obras) return <div className="spin" />

  const ativas = obras.filter((o) => o.status === 'ativa').length
  const pmed = obras.length ? Math.round(obras.reduce((t, o) => t + progresso(o.etapas), 0) / obras.length) : 0
  const orc = obras.reduce((t, o) => t + orcadoDe(o), 0)

  return (
    <>
      <div className="topbar"><div className="crumb"><b>Painel</b></div>
        <span className="chip-role">{papel === 'admin' ? 'Administrador' : papel === 'gestor' ? 'Gestor' : 'Execução'}</span></div>
      <div className="content">
        <div className="pg-head">
          <div><h1 className="pg">Painel de obras</h1><div className="pg-sub">Obras do Grupo MS</div></div>
          {isStaff && (
            <Link to="/nova" className="btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>Nova obra
            </Link>
          )}
        </div>

        <div className="grid-kpi" style={{ gridTemplateColumns: isStaff ? '' : 'repeat(3,1fr)' }}>
          <div className="card kpi"><div className="k">Obras ativas</div><div className="v">{ativas}</div><div className="dsc">em andamento</div></div>
          <div className="card kpi"><div className="k">Progresso médio</div><div className="v">{pmed}%</div><div className="dsc">das etapas</div></div>
          {isStaff && <div className="card kpi"><div className="k">Orçado (total)</div><div className="v">{BRL(orc)}</div><div className="dsc">contratos em curso</div></div>}
          <div className="card kpi"><div className="k">Total de obras</div><div className="v">{obras.length}</div><div className="dsc">cadastradas</div></div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="sec-title" style={{ margin: '0 0 12px' }}>Progresso por obra</div>
          {obras.length === 0 && <div className="muted">Nenhuma obra ainda. Clique em “Nova obra”.</div>}
          {obras.map((o) => {
            const p = progresso(o.etapas)
            const dn = o.etapas.filter((e) => e.status === 'concluida').length
            const st = p >= 100 ? 'ok' : p > 0 ? 'prog' : 'pend'
            const lab = p >= 100 ? 'Concluída' : p > 0 ? 'Em obra' : 'Início'
            const prox = o.etapas.find((e) => e.status !== 'concluida')
            return (
              <div key={o.id} onClick={() => nav('/obra/' + o.id)}
                style={{ padding: '14px 0', borderBottom: '1px solid var(--line2)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9, gap: 10 }}>
                  <div style={{ minWidth: 0 }}><b>{o.nome}</b> <span className="muted" style={{ fontSize: 12 }}>· {o.cidade || '—'} · {o.padrao || '—'}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
                    <span className="mono" style={{ fontWeight: 600, fontSize: 15 }}>{p}%</span>
                    <span className={'pill ' + st}><span className="d" />{lab}</span>
                  </div>
                </div>
                {seg(o.etapas)}
                <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
                  {dn} de {o.etapas.length} etapas concluídas{prox ? ' · próxima: ' + prox.nome : ''}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
