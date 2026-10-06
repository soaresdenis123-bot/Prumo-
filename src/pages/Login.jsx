import { useState } from 'react'
import { supabase } from '../lib/supabase'
import PlumbMark from '../components/PlumbMark'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
      if (error) throw error
      // sucesso → o AuthProvider assume e troca a tela
    } catch (e2) {
      setErr(traduz(e2.message))
    }
    setLoading(false)
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="lg">
          <PlumbMark size={40} ink="var(--ink)" />
          <div className="nm">Prumo<span style={{ color: 'var(--accent)' }}>.</span></div>
        </div>
        <div className="muted" style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase' }}>
          Gestão de obra · Grupo MS
        </div>

        <h1>Entrar</h1>
        <p className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
          Acesso da equipe — e-mail e senha.
        </p>

        <form onSubmit={submit} style={{ textAlign: 'left' }}>
          <div className="field"><label>E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" /></div>
          <div className="field"><label>Senha</label>
            <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" /></div>

          {err && <div style={{ color: 'var(--crit)', fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? '…' : 'Entrar'}
          </button>
        </form>

        <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
          Sem acesso? Fale com o administrador pra criar o seu.
        </p>
      </div>
    </div>
  )
}

function traduz(m = '') {
  if (/Invalid login/i.test(m)) return 'E-mail ou senha incorretos.'
  if (/Email not confirmed/i.test(m)) return 'E-mail ainda não confirmado. Fale com o administrador.'
  return m
}
