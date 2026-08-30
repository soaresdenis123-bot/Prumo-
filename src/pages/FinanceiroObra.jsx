import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getObra } from '../lib/data'
import { orcadoDe, metaCustoDe } from './Painel'
import Custos from './Custos'

export default function FinanceiroObra() {
  const { id } = useParams()
  const [obra, setObra] = useState(null)
  const [err, setErr] = useState('')

  async function load() { try { setObra(await getObra(id)) } catch (e) { setErr(e.message) } }
  useEffect(() => { load() }, [id])

  if (err) return <div className="content"><div className="center-note">Erro: {err}</div></div>
  if (!obra) return <div className="spin" />

  return (
    <>
      <div className="topbar"><div className="crumb"><Link to="/financeiro">Financeiro</Link> / <b>{obra.nome}</b></div>
        <span className="chip-role">Interno</span></div>
      <div className="content">
        <div className="pg-head">
          <div><h1 className="pg">{obra.nome}</h1>
            <div className="pg-sub">Custos da obra · mão de obra, material e fornecedores · check pago/pendente</div></div>
          <Link className="btn ghost" to={'/obra/' + obra.id}>Ver evolução da obra</Link>
        </div>
        <Custos obra={obra} orcado={orcadoDe(obra)} meta={metaCustoDe(obra)} onOrcadoChange={load} onMetaChange={load} />
      </div>
    </>
  )
}
