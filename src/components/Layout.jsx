import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import PlumbMark from './PlumbMark'

const IconPanel = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
)
const IconObras = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>
)
const IconFin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M7 15l4-4 3 3 5-6"/></svg>
)
const IconCalc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h2M8 15h2M14 11h2M14 15h2"/></svg>
)
const IconDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/></svg>
)
const IconTruck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4h14v11H1zM15 8h4l3 3v4h-7"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>
)
const IconLead = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.5h13l3.5 6.5v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5z"/></svg>
)
const IconTeam = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="3"/><path d="M2 21v-2a5 5 0 015-5h4a5 5 0 015 5v2"/><path d="M16 3.5a3 3 0 010 5.8M22 21v-2a5 5 0 00-3-4.5"/></svg>
)

export default function Layout({ children }) {
  const { profile, signOut, isStaff } = useAuth()
  const papelLabel = profile.papel === 'admin' ? 'Administrador' : profile.papel === 'gestor' ? 'Gestor de obra' : 'Execução de obra'
  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <PlumbMark size={30} ink="var(--side-ink)" />
          <div>
            <div className="nm">Prumo<span style={{ color: 'var(--accent)' }}>.</span></div>
            <div className="sub">by Grupo MS</div>
          </div>
        </div>
        <nav className="nav">
          <div className="lbl">Gestão</div>
          <NavLink to="/" end><IconPanel />Painel</NavLink>
          <NavLink to="/obras"><IconObras />Obras</NavLink>
          {isStaff && <NavLink to="/orcamento"><IconCalc />Orçamento</NavLink>}
          {isStaff && <NavLink to="/leads"><IconLead />Leads</NavLink>}
          {isStaff && <div className="lbl">Interno</div>}
          {isStaff && <NavLink to="/financeiro"><IconFin />Financeiro</NavLink>}
          {isStaff && <NavLink to="/fornecedores"><IconTruck />Fornecedores</NavLink>}
          {isStaff && <NavLink to="/time"><IconTeam />Time</NavLink>}
        </nav>
        <div className="foot">
          <div className="who">
            {profile.nome || profile.email}
            <small>{papelLabel}</small>
          </div>
          <button className="out" onClick={signOut}>Sair</button>
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  )
}
