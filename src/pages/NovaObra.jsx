import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createObra, listGestores } from '../lib/data'
import { useAuth } from '../lib/auth'

export default function NovaObra() {
  const nav = useNavigate()
  const { session, isAdmin } = useAuth()
  const [f, setF] = useState({
    nome: '', cidade: '', endereco: '', padrao: 'Médio', area_m2: '',
    cliente_nome: '', cliente_tel: '', cliente_email: '', inicio: '', previsao: '', orcado: '',
  })
  const [gestores, setGestores] = useState([])
  const [gestorId, setGestorId] = useState(session.user.id)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => { if (isAdmin) listGestores().then(setGestores) }, [isAdmin])

  async function salvar(e) {
    e.preventDefault()
    setErr('')
    if (!f.nome || !f.cliente_email) { setErr('Nome da obra e e-mail do cliente são obrigatórios.'); return }
    setSaving(true)
    try {
      const id = await createObra({
        nome: f.nome, cidade: f.cidade, endereco: f.endereco, padrao: f.padrao,
        area_m2: f.area_m2 ? Number(f.area_m2) : null,
        cliente_nome: f.cliente_nome, cliente_tel: f.cliente_tel, cliente_email: f.cliente_email.trim(),
        inicio: f.inicio || null, previsao: f.previsao || null,
        gestor_id: gestorId || session.user.id, criado_por: session.user.id,
        orcado: f.orcado,
      })
      nav('/obra/' + id)
    } catch (e2) { setErr(e2.message); setSaving(false) }
  }

  return (
    <>
      <div className="topbar"><div className="crumb"><Link to="/obras">Obras</Link> / <b>Nova obra</b></div></div>
      <div className="content">
        <div className="pg-head"><div><h1 className="pg">Nova obra</h1>
          <div className="pg-sub">O sistema cria as 14 etapas do steel frame automaticamente.</div></div></div>
        <form onSubmit={salvar} style={{ maxWidth: 640 }}>
          <div className="card" style={{ padding: 22 }}>
            <div className="sec-title" style={{ marginTop: 0 }}>Obra</div>
            <div className="grid2">
              <div className="field"><label>Nome da obra *</label><input value={f.nome} onChange={set('nome')} placeholder="Residência Baumann" /></div>
              <div className="field"><label>Cidade / UF</label><input value={f.cidade} onChange={set('cidade')} placeholder="Santa Rosa/RS" /></div>
            </div>
            <div className="field"><label>Endereço</label><input value={f.endereco} onChange={set('endereco')} placeholder="Loteamento, rua, lote" /></div>
            <div className="grid2">
              <div className="field"><label>Padrão</label>
                <select value={f.padrao} onChange={set('padrao')}><option>Médio</option><option>Alto</option><option>Popular</option></select></div>
              <div className="field"><label>Área construída (m²)</label><input type="number" value={f.area_m2} onChange={set('area_m2')} placeholder="150" /></div>
            </div>
            {isAdmin && (
              <div className="field"><label>Gestor responsável</label>
                <select value={gestorId} onChange={(e) => setGestorId(e.target.value)}>
                  <option value={session.user.id}>Eu ({session.user.email})</option>
                  {gestores.filter((g) => g.id !== session.user.id).map((g) => (
                    <option key={g.id} value={g.id}>{g.nome || g.email} · {g.papel}</option>
                  ))}
                </select>
                <div className="muted" style={{ fontSize: 11, marginTop: 5 }}>Quem acompanha e atualiza esta obra.</div>
              </div>
            )}

            <div className="sec-title">Cliente & acesso</div>
            <div className="grid2">
              <div className="field"><label>Nome do cliente</label><input value={f.cliente_nome} onChange={set('cliente_nome')} /></div>
              <div className="field"><label>Telefone</label><input value={f.cliente_tel} onChange={set('cliente_tel')} /></div>
            </div>
            <div className="field"><label>E-mail de acesso do cliente *</label>
              <input type="email" value={f.cliente_email} onChange={set('cliente_email')} placeholder="cliente@email.com" />
              <div className="muted" style={{ fontSize: 11, marginTop: 5 }}>É por este e-mail que o cliente entra e vê só esta obra — sem custos.</div>
            </div>

            <div className="sec-title">Prazo & contrato</div>
            <div className="grid2">
              <div className="field"><label>Início</label><input type="date" value={f.inicio} onChange={set('inicio')} /></div>
              <div className="field"><label>Previsão de entrega</label><input type="date" value={f.previsao} onChange={set('previsao')} /></div>
            </div>
            <div className="field"><label>Valor do contrato (orçado)</label><input type="number" value={f.orcado} onChange={set('orcado')} placeholder="640000" />
              <div className="muted" style={{ fontSize: 11, marginTop: 5 }}>Interno — invisível para o cliente.</div></div>

            {err && <div style={{ color: 'var(--crit)', fontSize: 13, marginBottom: 12 }}>{err}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Link to="/obras" className="btn ghost">Cancelar</Link>
              <button className="btn" disabled={saving}>{saving ? 'Criando…' : 'Criar obra'}</button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
