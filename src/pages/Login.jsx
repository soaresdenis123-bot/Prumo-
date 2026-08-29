import { useState } from 'react'
import { supabase } from '../lib/supabase'
import PlumbMark from '../components/PlumbMark'

export default function Login() {
  const [modo, setModo] = useState('entrar') // 'entrar' | 'criar'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setErr(''); setMsg(''); setLoading(true)
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
        if (error) throw error
        // sucesso → o AuthProvider assume e troca a tela
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password: senha, options: { data: { nome } },
        })
        if (error) throw error
        if (!data.session) {
          setMsg('Conta criada. Se a confirmação por e-mail estiver ligada, confirme antes de entrar.')
          setModo('entrar')
        }
      }
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

        <h1>{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
          {modo === 'entrar' ? 'Acesso da equipe — e-mail e senha.' : 'Crie seu acesso de equipe.'}
        </p>

        <form onSubmit={submit} style={{ textAlign: 'left' }}>
          {modo === 'criar' && (
            <div className="field"><label>Seu nome</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" /></div>
          )}
          <div className="field"><label>E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" /></div>
          <div className="field"><label>Senha</label>
            <input type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" /></div>

          {err && <div style={{ color: 'var(--crit)', fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
          {msg && <div style={{ color: 'var(--ok)', fontSize: 12.5, marginBottom: 10 }}>{msg}</div>}
          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? '…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button className="muted" style={{ fontSize: 12.5, marginTop: 16 }}
          onClick={() => { setModo(modo === 'entrar' ? 'criar' : 'entrar'); setErr(''); setMsg('') }}>
          {modo === 'entrar' ? 'Primeiro acesso? Criar conta' : '← Já tenho conta'}
        </button>
      </div>
    </div>
  )
}

function traduz(m = '') {
  if (/Invalid login/i.test(m)) return 'E-mail ou senha incorretos.'
  if (/already registered/i.test(m)) return 'Este e-mail já tem conta. Use Entrar.'
  if (/at least 6/i.test(m)) return 'A senha precisa de ao menos 6 caracteres.'
  return m
}
