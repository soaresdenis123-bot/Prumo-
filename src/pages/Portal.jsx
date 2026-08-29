import { useEffect, useState } from 'react'
import { listObras, listFotosObra, progresso } from '../lib/data'
import { useAuth } from '../lib/auth'
import PlumbMark from '../components/PlumbMark'

export default function Portal() {
  const { profile, signOut } = useAuth()
  const [obras, setObras] = useState(null)
  const [sel, setSel] = useState(0)
  const [fotos, setFotos] = useState({})
  const [err, setErr] = useState('')

  useEffect(() => {
    listObras().then((os) => { setObras(os); if (os[0]) listFotosObra(os[0].id).then(setFotos) })
      .catch((e) => setErr(e.message))
  }, [])

  function trocar(i) {
    setSel(i)
    if (obras[i]) listFotosObra(obras[i].id).then(setFotos).catch(() => {})
  }

  const header = (
    <div style={{ borderBottom: '1px solid var(--line)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <PlumbMark size={26} ink="var(--ink)" />
      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.3px' }}>Prumo<span style={{ color: 'var(--accent)' }}>.</span></div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="muted" style={{ fontSize: 12 }}>{profile.nome || profile.email}</span>
        <button className="muted" style={{ fontSize: 12 }} onClick={signOut}>Sair</button>
      </div>
    </div>
  )

  if (err) return <>{header}<div className="center-note">Erro: {err}</div></>
  if (!obras) return <>{header}<div className="spin" /></>
  if (obras.length === 0)
    return <>{header}<div className="center-note">Sua obra ainda não foi liberada aqui. Fale com a equipe da MS.</div></>

  const o = obras[sel]
  const p = progresso(o.etapas)
  const done = o.etapas.filter((e) => e.status === 'concluida').length
  const curr = o.etapas.find((e) => e.status === 'andamento')

  return (
    <>
      {header}
      <div className="content" style={{ maxWidth: 820, margin: '0 auto' }}>
        {obras.length > 1 && (
          <div style={{ marginBottom: 16 }}>
            <select value={sel} onChange={(e) => trocar(Number(e.target.value))}
              style={{ padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 9, background: 'var(--surface)', color: 'var(--ink)' }}>
              {obras.map((x, i) => <option key={x.id} value={i}>{x.nome}</option>)}
            </select>
          </div>
        )}

        <div className="portal-hero">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--accent)' }}>Sua obra · MS Construções</div>
              <div className="big">{o.nome}</div>
              <div style={{ color: 'var(--side-mut)', fontSize: 13 }}>{o.endereco || ''}{o.cidade ? ', ' + o.cidade : ''}{o.previsao ? ' · Entrega prevista ' + o.previsao : ''}</div>
              <div style={{ display: 'flex', gap: 22, marginTop: 16 }}>
                <div><div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{done}/{o.etapas.length}</div><div style={{ fontSize: 11, color: 'var(--side-mut)' }}>etapas concluídas</div></div>
                <div><div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{curr ? curr.nome.split(' ')[0] : '—'}</div><div style={{ fontSize: 11, color: 'var(--side-mut)' }}>etapa atual</div></div>
              </div>
            </div>
            <div className="ring" style={{ '--p': p }}><b>{p}%</b></div>
          </div>
        </div>

        <div className="card" style={{ padding: '8px 20px', marginTop: 20 }}>
          <div className="sec-title" style={{ paddingTop: 14 }}>Linha do tempo da sua casa</div>
          {o.etapas.map((e) => {
            const cls = e.status === 'concluida' ? 'done' : e.status === 'andamento' ? 'prog' : ''
            const fs = fotos[e.id] || []
            return (
              <div key={e.id} className={'etapa ' + cls}>
                <div><div className="node">{e.status === 'concluida' ? '✓' : e.status === 'andamento' ? '•' : e.ordem}</div></div>
                <div>
                  <div className="nm">{e.nome}</div>
                  <div className="meta">
                    <span className={'pill ' + (e.status === 'concluida' ? 'ok' : e.status === 'andamento' ? 'prog' : 'pend')}>
                      <span className="d" />{e.status === 'concluida' ? 'Concluída' : e.status === 'andamento' ? 'Em andamento · ' + e.pct + '%' : 'A iniciar'}
                    </span>
                  </div>
                  {fs.length > 0 && (
                    <div className="photos">{fs.map((f) => <img key={f.id} className="ph" src={f.url} alt="" />)}</div>
                  )}
                </div>
                <div />
              </div>
            )
          })}
        </div>
        <div className="center-note" style={{ margin: '24px auto', fontSize: 12 }}>
          Acompanhamento pelo Prumo · Grupo MS · Construindo de família para família
        </div>
      </div>
    </>
  )
}
