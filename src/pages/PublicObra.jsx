import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getObraPublica, progresso } from '../lib/data'
import PlumbMark from '../components/PlumbMark'

export default function PublicObra() {
  const { token } = useParams()
  const [obra, setObra] = useState(undefined) // undefined=carregando, null=inválido
  const [err, setErr] = useState('')

  useEffect(() => {
    getObraPublica(token).then(setObra).catch((e) => { setErr(e.message); setObra(null) })
  }, [token])

  const header = (
    <div style={{ borderBottom: '1px solid var(--line)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <PlumbMark size={26} ink="var(--ink)" />
      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.3px' }}>Prumo<span style={{ color: 'var(--accent)' }}>.</span></div>
      <div className="muted" style={{ marginLeft: 'auto', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }}>MS Construções</div>
    </div>
  )

  if (obra === undefined) return <>{header}<div className="spin" /></>
  if (obra === null)
    return <>{header}<div className="center-note">Link inválido ou expirado. {err && <div style={{ fontSize: 12, marginTop: 8 }}>{err}</div>}Fale com a equipe da MS.</div></>

  const p = progresso(obra.etapas || [])
  const done = (obra.etapas || []).filter((e) => e.status === 'concluida').length
  const curr = (obra.etapas || []).find((e) => e.status === 'andamento')

  return (
    <>
      {header}
      <div className="content" style={{ maxWidth: 820, margin: '0 auto' }}>
        <div className="portal-hero">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--accent)' }}>Sua obra · MS Construções</div>
              <div className="big">{obra.nome}</div>
              <div style={{ color: 'var(--side-mut)', fontSize: 13 }}>
                {obra.endereco || ''}{obra.cidade ? ', ' + obra.cidade : ''}{obra.previsao ? ' · Entrega prevista ' + fmt(obra.previsao) : ''}
              </div>
              <div style={{ display: 'flex', gap: 22, marginTop: 16 }}>
                <div><div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{done}/{(obra.etapas || []).length}</div><div style={{ fontSize: 11, color: 'var(--side-mut)' }}>etapas concluídas</div></div>
                <div><div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{curr ? curr.nome.split(' ')[0] : '—'}</div><div style={{ fontSize: 11, color: 'var(--side-mut)' }}>etapa atual</div></div>
              </div>
            </div>
            <div className="ring" style={{ '--p': p }}><b>{p}%</b></div>
          </div>
        </div>

        <div className="card" style={{ padding: '8px 20px', marginTop: 20 }}>
          <div className="sec-title" style={{ paddingTop: 14 }}>Linha do tempo da sua casa</div>
          {(obra.etapas || []).map((e) => {
            const cls = e.status === 'concluida' ? 'done' : e.status === 'andamento' ? 'prog' : ''
            const fs = (obra.fotosPorEtapa && obra.fotosPorEtapa[e.id]) || []
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
                  {fs.length > 0 && <div className="photos">{fs.map((u, i) => <img key={i} className="ph" src={u} alt="" />)}</div>}
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

function fmt(d) {
  if (!d) return ''
  const p = String(d).split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d
}
