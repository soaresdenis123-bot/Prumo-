import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Login from './pages/Login'
import Layout from './components/Layout'
import Painel from './pages/Painel'
import Obras from './pages/Obras'
import ObraDetail from './pages/ObraDetail'
import NovaObra from './pages/NovaObra'
import Calculadora from './pages/Calculadora'
import Orcamentos from './pages/Orcamentos'
import Fornecedores from './pages/Fornecedores'
import FornecedorDetail from './pages/FornecedorDetail'
import Financeiro from './pages/Financeiro'
import Portal from './pages/Portal'
import PublicObra from './pages/PublicObra'

function Spinner() {
  return <div className="spin" />
}

function AppGated() {
  const { session, profile, loading } = useAuth()
  if (loading) return <Spinner />
  if (!session) return <Login />
  if (!profile) return <Spinner />

  // Cliente com conta (raro — o padrão é o link público): mostra só o portal
  if (profile.papel === 'cliente') return <Portal />

  // Equipe (admin / gestor)
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Painel />} />
        <Route path="/obras" element={<Obras />} />
        <Route path="/obra/:id" element={<ObraDetail />} />
        <Route path="/nova" element={<NovaObra />} />
        <Route path="/calculadora" element={<Calculadora />} />
        <Route path="/orcamentos" element={<Orcamentos />} />
        <Route path="/fornecedores" element={<Fornecedores />} />
        <Route path="/fornecedores/:id" element={<FornecedorDetail />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Link público do cliente — sem login */}
      <Route path="/o/:token" element={<PublicObra />} />
      {/* Todo o resto passa pelo login */}
      <Route path="/*" element={<AppGated />} />
    </Routes>
  )
}
