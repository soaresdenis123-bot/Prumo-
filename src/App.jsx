import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Login from './pages/Login'
import Layout from './components/Layout'
import Painel from './pages/Painel'
import Obras from './pages/Obras'
import ObraDetail from './pages/ObraDetail'
import NovaObra from './pages/NovaObra'
import Orcamento from './pages/Orcamento'
import Fornecedores from './pages/Fornecedores'
import CategoriaDetail from './pages/CategoriaDetail'
import FornecedorDetail from './pages/FornecedorDetail'
import Financeiro from './pages/Financeiro'
import FinanceiroObra from './pages/FinanceiroObra'
import Time from './pages/Time'
import Portal from './pages/Portal'
import PublicObra from './pages/PublicObra'
import MonteSuaCasa from './pages/MonteSuaCasa'
import Leads from './pages/Leads'

function Spinner() {
  return <div className="spin" />
}

function AppGated() {
  const { session, profile, loading, isStaff } = useAuth()
  if (loading) return <Spinner />
  if (!session) return <Login />
  if (!profile) return <Spinner />

  // Cliente com conta (raro — o padrão é o link público): mostra só o portal
  if (profile.papel === 'cliente') return <Portal />

  // Equipe (admin/gestor) = tudo. Execução = só obras + etapas.
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Painel />} />
        <Route path="/obras" element={<Obras />} />
        <Route path="/obra/:id" element={<ObraDetail />} />
        {isStaff && <Route path="/nova" element={<NovaObra />} />}
        {isStaff && <Route path="/orcamento" element={<Orcamento />} />}
        {isStaff && <Route path="/leads" element={<Leads />} />}
        {isStaff && <Route path="/calculadora" element={<Navigate to="/orcamento" replace />} />}
        {isStaff && <Route path="/orcamentos" element={<Navigate to="/orcamento" replace />} />}
        {isStaff && <Route path="/fornecedores" element={<Fornecedores />} />}
        {isStaff && <Route path="/fornecedores/cat/:categoria" element={<CategoriaDetail />} />}
        {isStaff && <Route path="/fornecedores/:id" element={<FornecedorDetail />} />}
        {isStaff && <Route path="/financeiro" element={<Financeiro />} />}
        {isStaff && <Route path="/financeiro/:id" element={<FinanceiroObra />} />}
        {isStaff && <Route path="/time" element={<Time />} />}
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
      {/* Página pública de captação — cliente monta a casa dele */}
      <Route path="/monte-sua-casa" element={<MonteSuaCasa />} />
      {/* Todo o resto passa pelo login */}
      <Route path="/*" element={<AppGated />} />
    </Routes>
  )
}
