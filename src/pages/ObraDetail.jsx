import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getObra, updateEtapa, listFotosObra, uploadFoto, deleteAnexo, updateObra, listGestores, resumoCustos, progresso, BRL } from '../lib/data'
import { orcadoDe } from './Painel'
import { useAuth } from '../lib/auth'
import ProdutosObra from './ProdutosObra'
import CasaProgresso from '../components/CasaProgresso'

const HOJE = new Date()

function Row({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line2)', fontSize: 13 }}>
      <span className="muted">{k}</span><span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span>
    </div>
  )
}

const dtInput = { padding: '5px 7px', border: '1px solid var(--line)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink)', fontSize: 11.5, fontFamily: 'IBM Plex Mono' }

const CAT_LABEL = { mao_obra: 'Mão de obra', material: 'Material', fornecedor: 'Fornecedores' }

// Resumo de custos por categoria (pendente/pago) — read-only. Lançamento fica no Financeiro.
function CustoOverview({ obraId }) {
  const [r, setR] = useState(null)
  useEffect(() => { resumoCustos(obraId).then(setR).catch(() => setR(null)) }, [obraId])
  if (!r) return null
  return (
    <div className="card" style={{ padding: 16, marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div className="sec-title" style={{ margin: 0 }}>Custos da obra <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.05em', color: 'var(--crit)', background: 'var(--crit-bg)', padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase' }}>Interno</span></div>
        <Link to={'/financeiro/' + obraId} className="muted" style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 600 }}>Lançar →</Link>
      </div>
      {r.nItens === 0 ? (
        <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Nenhum custo lançado. Aprove um orçamento vinculado ou lance no Financeiro.</div>
      ) : (
        <>
          {Object.entries(r.cats).filter(([, c]) => c.n > 0).map(([k, c]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line2)', fontSize: 13 }}>
              <span>{CAT_LABEL[k]} <span className="muted" style={{ fontSize: 11 }}>· {c.npago}/{c.n} pago</span></span>
              <span className="mono" style={{ fontWeight: 600 }}>{BRL(c.total)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12.5 }}>
            <span style={{ color: 'var(--ok)' }}>Pago {BRL(r.pago)}</span>
            <span style={{ color: 'var(--warn)' }}>Pendente {BRL(r.pendente)}</span>
          </div>
        </>
      )}
    </div>
  )
}

function Etapa({ etapa, obraId, anexos, onChange, onFoto }) {
  const fotoRef = useRef()
  const docRef = useRef()
  const [busy, setBusy] = useState(false)
  const cls = etapa.status === 'concluida' ? 'done' : etapa.status === 'andamento' ? 'prog' : ''
  const imgs = (anexos || []).filter((a) => a.tipo !== 'doc')
  const docs = (anexos || []).filter((a) => a.tipo === 'doc')
  const atrasada = etapa.fim && etapa.status !== 'concluida' && new Date(etapa.fim) < HOJE

  async function setStatus(status) {
    const pct = status === 'concluida' ? 100 : status === 'pendente' ? 0 : etapa.pct || 25
    await updateEtapa(etapa.id, { status, pct }); onChange()
  }
  async function setPct(pct) {
    pct = Math.max(0, Math.min(100, Number(pct) || 0))
    const status = pct >= 100 ? 'concluida' : pct > 0 ? 'andamento' : 'pendente'
    await updateEtapa(etapa.id, { status, pct }); onChange()
  }
  async function setData(campo, v) { await updateEtapa(etapa.id, { [campo]: v || null }); onChange() }
  async function upload(e, tipo) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try { await uploadFoto(obraId, etapa.id, file, tipo); await onFoto() }
    catch (err) { alert('Falha no upload: ' + err.message) }
    setBusy(false); e.target.value = ''
  }
  async function remover(id) { await deleteAnexo(id); await onFoto() }

  return (
    <div className={'etapa ' + cls}>
      <div><div className="node">{etapa.status === 'concluida' ? '✓' : etapa.status === 'andamento' ? '•' : etapa.ordem}</div></div>
      <div>
        <div className="nm">{etapa.nome}</div>
        <div className="meta">
          <span className={'pill ' + (etapa.status === 'concluida' ? 'ok' : etapa.status === 'andamento' ? 'prog' : 'pend')}>
            <span className="d" />{etapa.status === 'concluida' ? 'Concluída' : etapa.status === 'andamento' ? 'Em andamento · ' + etapa.pct + '%' : 'Pendente'}
          </span>
          {atrasada && <span className="pill" style={{ background: 'var(--crit-bg)', color: 'var(--crit)' }}><span className="d" style={{ background: 'var(--crit)' }} />Atrasada</span>}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11, color: 'var(--ink3)' }}>Início<br /><input type="date" value={etapa.inicio || ''} onChange={(e) => setData('inicio', e.target.value)} style={dtInput} /></label>
          <label style={{ fontSize: 11, color: 'var(--ink3)' }}>Prazo<br /><input type="date" value={etapa.fim || ''} onChange={(e) => setData('fim', e.target.value)} style={dtInput} /></label>
        </div>
        {imgs.length > 0 && (
          <div className="photos">
            {imgs.map((f) => (
              <span key={f.id} className="anx-img">
                <a href={f.url} target="_blank" rel="noreferrer"><img className="ph" src={f.url} alt="" /></a>
                <button className="anx-x" onClick={() => remover(f.id)} title="Remover">×</button>
              </span>
            ))}
          </div>
        )}
        {docs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {docs.map((d) => (
              <span key={d.id} className="doc-chip">
                <a href={d.url} target="_blank" rel="noreferrer">📄 {d.nome || 'documento'}</a>
                <button onClick={() => remover(d.id)} title="Remover">×</button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
          <button className="btn ghost" style={{ fontSize: 11.5, padding: '5px 10px' }} disabled={busy} onClick={() => fotoRef.current.click()}>+ Foto</button>
          <button className="btn ghost" style={{ fontSize: 11.5, padding: '5px 10px' }} disabled={busy} onClick={() => docRef.current.click()}>+ Documento</button>
          <input ref={fotoRef} type="file" accept="image/*" hidden onChange={(e) => upload(e, 'foto')} />
          <input ref={docRef} type="file" hidden onChange={(e) => upload(e, 'doc')} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <select value={etapa.status} onChange={(e) => setStatus(e.target.value)}
          style={{ padding: '5px 8px', border: '1px solid var(--line)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }}>
          <option value="pendente">Pendente</option>
          <option value="andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
        </select>
        {etapa.status === 'andamento' && (
          <input type="number" min="0" max="100" value={etapa.pct} onChange={(e) => setPct(e.target.value)}
            style={{ width: 64, padding: '4px 6px', border: '1px solid var(--line)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink)', textAlign: 'right', fontFamily: 'IBM Plex Mono' }} />
        )}
      </div>
    </div>
  )
}

export default function ObraDetail() {
  const { id } = useParams()
  const { isAdmin, isStaff } = useAuth()
  const [obra, setObra] = useState(null)
  const [fotos, setFotos] = useState({})
  const [gestores, setGestores] = useState([])
  const [tab, setTab] = useState('etapas')
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')

  async function load() { try { setObra(await getObra(id)) } catch (e) { setErr(e.message) } }
  async function loadFotos() { try { setFotos(await listFotosObra(id)) } catch { /* opcional */ } }
  useEffect(() => { load(); loadFotos() }, [id])
  useEffect(() => { if (isAdmin) listGestores().then(setGestores) }, [isAdmin])

  async function trocarGestor(gid) { await updateObra(id, { gestor_id: gid }); load() }

  if (err) return <div className="content"><div className="center-note">Erro: {err}</div></div>
  if (!obra) return <div className="spin" />
  const p = progresso(obra.etapas)
  const linkCliente = obra.share_token ? `${window.location.origin}/o/${obra.share_token}` : null

  return (
    <>
      <div className="topbar"><div className="crumb"><Link to="/obras">Obras</Link> / <b>{obra.nome}</b></div></div>
      <div className="content">
        <div className="pg-head">
          <div><h1 className="pg">{obra.nome}</h1>
            <div className="pg-sub">{obra.cliente_nome || '—'} · {obra.endereco || ''}{obra.cidade ? ', ' + obra.cidade : ''}</div></div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 30, fontWeight: 600 }}>{p}%</div>
            <div className="muted" style={{ fontSize: 12 }}>{obra.etapas.filter((e) => e.status === 'concluida').length}/{obra.etapas.length} etapas</div>
          </div>
        </div>

        {linkCliente && isStaff && (
          <div className="card" style={{ padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700 }}>Link do cliente</div>
              <div className="mono muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{linkCliente}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <a className="btn ghost" href={linkCliente} target="_blank" rel="noreferrer" style={{ fontSize: 12, padding: '7px 11px' }}>Abrir</a>
              <button className="btn" style={{ fontSize: 12, padding: '7px 11px' }}
                onClick={() => { navigator.clipboard?.writeText(linkCliente); setCopied(true); setTimeout(() => setCopied(false), 1600) }}>
                {copied ? 'Copiado ✓' : 'Copiar link'}
              </button>
            </div>
          </div>
        )}

        <div className="tabbar" style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
          {[['etapas', 'Etapas & anexos'], ...(isStaff ? [['produtos', 'Produtos']] : []), ['dados', 'Dados da obra']].map(([t, lbl]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '10px 15px', fontSize: 13.5, fontWeight: 600, color: tab === t ? 'var(--accent2)' : 'var(--ink3)', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1 }}>
              {lbl}
            </button>
          ))}
        </div>

        {tab === 'etapas' && (
          <div className="obra-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
            <div className="card" style={{ padding: '8px 20px' }}>
              {obra.etapas.map((e) => (
                <Etapa key={e.id} etapa={e} obraId={obra.id} anexos={fotos[e.id]} onChange={load} onFoto={loadFotos} />
              ))}
            </div>
            <div style={{ position: 'sticky', top: 82 }}>
              <div className="sec-title" style={{ marginTop: 0 }}>Casa em construção</div>
              <CasaProgresso etapas={obra.etapas} pavimentos={obra.pavimentos} />
              <div className="muted" style={{ fontSize: 11.5, textAlign: 'center', marginTop: 8 }}>É isto que o cliente vê no link dele.</div>
              {isStaff && <CustoOverview obraId={obra.id} />}
            </div>
          </div>
        )}

        {tab === 'produtos' && isStaff && <ProdutosObra obra={obra} />}

        {tab === 'dados' && (
          <div className="card" style={{ padding: 18, maxWidth: 620 }}>
            <div className="sec-title" style={{ marginTop: 0 }}>Dados da obra</div>
            <Row k="Cliente" v={obra.cliente_nome || '—'} />
            <Row k="E-mail (acesso)" v={obra.cliente_email || '—'} />
            <Row k="Telefone" v={obra.cliente_tel || '—'} />
            <Row k="Endereço" v={(obra.endereco || '—') + (obra.cidade ? ', ' + obra.cidade : '')} />
            <Row k="Padrão" v={obra.padrao || '—'} />
            <Row k="Área construída" v={(obra.area_m2 || '—') + ' m²'} />
            <Row k="Início" v={obra.inicio || '—'} />
            <Row k="Previsão de entrega" v={obra.previsao || '—'} />
            {isStaff && <Row k="Orçado (interno)" v={BRL(orcadoDe(obra))} />}
            {isAdmin && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', fontSize: 13 }}>
                <span className="muted">Gestor responsável</span>
                <select value={obra.gestor_id || ''} onChange={(e) => trocarGestor(e.target.value)}
                  style={{ padding: '6px 9px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontSize: 12.5 }}>
                  <option value="">— sem gestor —</option>
                  {gestores.map((g) => <option key={g.id} value={g.id}>{g.nome || g.email} · {g.papel}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
