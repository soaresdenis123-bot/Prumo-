import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listFornecedores, addFornecedor, deleteFornecedor } from '../lib/data'

const inp = { padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontSize: 13 }

export default function Fornecedores() {
  const nav = useNavigate()
  const [forns, setForns] = useState(null)
  const [f, setF] = useState({ nome: '', fornece: '', contato: '' })
  const [err, setErr] = useState('')

  async function load() { try { setForns(await listFornecedores()) } catch (e) { setErr(e.message) } }
  useEffect(() => { load() }, [])

  async function add() {
    if (!f.nome.trim()) return
    await addFornecedor(f); setF({ nome: '', fornece: '', contato: '' }); load()
  }
  async function del(id) { await deleteFornecedor(id); load() }

  if (err) return <div className="content"><div className="center-note">Erro: {err}</div></div>
  if (!forns) return <div className="spin" />

  return (
    <>
      <div className="topbar"><div className="crumb"><b>Fornecedores</b></div><span className="chip-role">Interno</span></div>
      <div className="content">
        <div className="pg-head"><div><h1 className="pg">Fornecedores</h1>
          <div className="pg-sub">{forns.length} cadastrados</div></div></div>

        <div className="card" style={{ padding: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input placeholder="Nome *" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} style={{ ...inp, flex: 2, minWidth: 150 }} />
            <input placeholder="O que fornece" value={f.fornece} onChange={(e) => setF({ ...f, fornece: e.target.value })} style={{ ...inp, flex: 2, minWidth: 150 }} />
            <input placeholder="Contato (tel / e-mail)" value={f.contato} onChange={(e) => setF({ ...f, contato: e.target.value })} style={{ ...inp, flex: 2, minWidth: 150 }} />
            <button className="btn" onClick={add}>+ Adicionar</button>
          </div>
        </div>

        {forns.length === 0 ? (
          <div className="center-note">Nenhum fornecedor ainda.</div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead><tr>{['Fornecedor', 'Fornece', 'Contato', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700, padding: '11px 14px', borderBottom: '1px solid var(--line)' }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {forns.map((x) => (
                  <tr key={x.id} onClick={() => nav('/fornecedores/' + x.id)} style={{ borderBottom: '1px solid var(--line2)', cursor: 'pointer' }}>
                    <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: 13, color: 'var(--accent2)' }}>{x.nome}</td>
                    <td className="muted" style={{ padding: '11px 14px', fontSize: 13 }}>{x.fornece || '—'}</td>
                    <td className="muted" style={{ padding: '11px 14px', fontSize: 13 }}>{x.contato || '—'}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right' }}><button className="muted" onClick={(e) => { e.stopPropagation(); del(x.id) }} style={{ fontSize: 15 }}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
