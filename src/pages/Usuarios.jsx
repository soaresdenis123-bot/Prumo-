import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { listarUsuarios, setPapelUsuario, adminCriarUsuario, adminResetSenha, adminRemoverUsuario } from '../lib/data'

const PAPEL = {
  admin: { label: 'Administrador', cls: 'prog', desc: 'Vê e faz tudo' },
  gestor: { label: 'Gestor', cls: 'ok', desc: 'Obras dele + orçamento/financeiro' },
  execucao: { label: 'Execução', cls: 'pend', desc: 'Campo: só etapas e fotos' },
  cliente: { label: 'Cliente', cls: 'pend', desc: 'Só o portal dele' },
}
const inp = { width: '100%', padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface,#fff)', color: 'var(--ink)', fontSize: 13.5 }
const senhaAleatoria = () => {
  const c = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 10 }, () => c[Math.floor(Math.random() * c.length)]).join('')
}

export default function Usuarios() {
  const { profile } = useAuth()
  const [users, setUsers] = useState(null)
  const [novo, setNovo] = useState(null)     // objeto do form de criação
  const [senhaDe, setSenhaDe] = useState(null) // usuário cuja senha será resetada
  const [busy, setBusy] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')

  async function load() { try { setUsers(await listarUsuarios()) } catch { setUsers([]) } }
  useEffect(() => { load() }, [])
  if (!users) return null

  const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
  const flash = (m) => { setOk(m); setTimeout(() => setOk(''), 3500) }

  async function mudarPapel(u, papel) {
    setErro('')
    try { await setPapelUsuario(u.id, papel); await load() }
    catch (e) { setErro(e.message || String(e)) }
  }
  async function criar() {
    setErro('')
    if (!novo.email || !novo.senha) { setErro('Preencha e-mail e senha.'); return }
    setBusy('criar')
    try {
      await adminCriarUsuario({ nome: novo.nome, email: novo.email, senha: novo.senha, papel: novo.papel })
      setNovo(null); await load(); flash(`Usuário ${novo.email} criado. Entregue o login e a senha pra ele.`)
    } catch (e) { setErro(e.message || String(e)) }
    setBusy('')
  }
  async function resetar() {
    setErro('')
    if (!senhaDe.senha || senhaDe.senha.length < 6) { setErro('A nova senha precisa de ao menos 6 caracteres.'); return }
    setBusy('senha')
    try {
      await adminResetSenha(senhaDe.id, senhaDe.senha)
      const email = senhaDe.email; setSenhaDe(null); flash(`Senha de ${email} redefinida.`)
    } catch (e) { setErro(e.message || String(e)) }
    setBusy('')
  }
  async function remover(u) {
    if (!window.confirm(`Excluir o acesso de ${u.nome || u.email}? Essa ação não volta.`)) return
    setErro('')
    try { await adminRemoverUsuario(u.id); await load(); flash('Usuário excluído.') }
    catch (e) { setErro(e.message || String(e)) }
  }

  return (
    <>
      <div className="topbar"><div className="crumb"><b>Usuários</b></div></div>
      <div className="content">
        <div className="pg-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="pg">Usuários</h1>
            <div className="pg-sub">Quem tem acesso ao Prumo. Você cria o login e a senha e define o nível de acesso.</div>
          </div>
          <button className="btn" onClick={() => { setErro(''); setNovo({ nome: '', email: '', senha: senhaAleatoria(), papel: 'execucao' }) }}>+ Novo usuário</button>
        </div>

        {ok && <div style={{ fontSize: 13, color: 'var(--ok)', background: 'var(--ok-bg)', border: '1px solid var(--line)', borderRadius: 9, padding: '9px 12px', marginBottom: 12 }}>{ok}</div>}
        {erro && !novo && !senhaDe && <div style={{ fontSize: 13, color: 'var(--crit)', background: 'var(--crit-bg,#f6e3dc)', borderRadius: 9, padding: '9px 12px', marginBottom: 12 }}>{erro}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map((u) => {
            const p = PAPEL[u.papel] || { label: u.papel, cls: 'pend' }
            const euMesmo = u.id === profile.id
            return (
              <div key={u.id} className="card" style={{ padding: 14, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent2)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16, flex: '0 0 auto' }}>
                  {(u.nome || u.email || '?').trim().charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{u.nome || '— sem nome'} {euMesmo && <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>(você)</span>}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{u.email}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>Desde {fmt(u.criado_em)} · {p.desc}</div>
                </div>
                <div style={{ flex: '0 0 auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select value={u.papel} onChange={(e) => mudarPapel(u, e.target.value)} disabled={euMesmo}
                    className={'pill ' + p.cls} style={{ border: 'none', fontWeight: 600, cursor: euMesmo ? 'default' : 'pointer', padding: '6px 10px', opacity: euMesmo ? .7 : 1 }}
                    title={euMesmo ? 'Você não pode mudar o próprio papel' : 'Mudar nível de acesso'}>
                    {Object.entries(PAPEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <button className="btn ghost" style={{ fontSize: 12, padding: '7px 11px' }} onClick={() => { setErro(''); setSenhaDe({ ...u, senha: senhaAleatoria() }) }}>Resetar senha</button>
                  {!euMesmo && <button className="btn ghost" style={{ fontSize: 14, padding: '7px 11px', color: 'var(--crit,#b23)' }} title="Excluir" onClick={() => remover(u)}>×</button>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* modal: novo usuário */}
      {novo && (
        <div onClick={() => setNovo(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 55, display: 'grid', placeItems: 'center', padding: 18 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ padding: 22, width: 'min(460px,100%)' }}>
            <div className="sec-title" style={{ marginTop: 0 }}>Novo usuário</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: -4, marginBottom: 14 }}>Crie o acesso e entregue o e-mail e a senha pra pessoa. Ela entra direto, sem confirmar e-mail.</div>
            <div style={{ display: 'grid', gap: 11 }}>
              <div className="field"><label>Nome</label><input style={inp} value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Nome da pessoa" /></div>
              <div className="field"><label>E-mail (login)</label><input style={inp} type="email" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} placeholder="pessoa@email.com" /></div>
              <div className="field"><label>Senha</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inp, flex: 1 }} value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} placeholder="mínimo 6 caracteres" />
                  <button className="btn ghost" style={{ fontSize: 12, padding: '0 12px', whiteSpace: 'nowrap' }} type="button" onClick={() => setNovo({ ...novo, senha: senhaAleatoria() })}>Gerar</button>
                </div>
              </div>
              <div className="field"><label>Nível de acesso</label>
                <select style={inp} value={novo.papel} onChange={(e) => setNovo({ ...novo, papel: e.target.value })}>
                  {Object.entries(PAPEL).map(([k, v]) => <option key={k} value={k}>{v.label} — {v.desc}</option>)}
                </select>
              </div>
            </div>
            {erro && <div style={{ color: 'var(--crit)', fontSize: 12.5, marginTop: 10 }}>{erro}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn ghost" onClick={() => setNovo(null)}>Cancelar</button>
              <button className="btn" disabled={busy === 'criar'} onClick={criar}>{busy === 'criar' ? 'Criando…' : 'Criar usuário'}</button>
            </div>
          </div>
        </div>
      )}

      {/* modal: resetar senha */}
      {senhaDe && (
        <div onClick={() => setSenhaDe(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 55, display: 'grid', placeItems: 'center', padding: 18 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ padding: 22, width: 'min(420px,100%)' }}>
            <div className="sec-title" style={{ marginTop: 0 }}>Resetar senha</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: -4, marginBottom: 14 }}>Nova senha de <b>{senhaDe.nome || senhaDe.email}</b>. Anote e entregue pra pessoa.</div>
            <div className="field"><label>Nova senha</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...inp, flex: 1 }} value={senhaDe.senha} onChange={(e) => setSenhaDe({ ...senhaDe, senha: e.target.value })} />
                <button className="btn ghost" style={{ fontSize: 12, padding: '0 12px', whiteSpace: 'nowrap' }} type="button" onClick={() => setSenhaDe({ ...senhaDe, senha: senhaAleatoria() })}>Gerar</button>
              </div>
            </div>
            {erro && <div style={{ color: 'var(--crit)', fontSize: 12.5, marginTop: 10 }}>{erro}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn ghost" onClick={() => setSenhaDe(null)}>Cancelar</button>
              <button className="btn" disabled={busy === 'senha'} onClick={resetar}>{busy === 'senha' ? 'Salvando…' : 'Salvar senha'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
