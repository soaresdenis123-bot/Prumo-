import { useEffect, useState } from 'react'
import { listCustos, addCusto, deleteCusto, setOrcado, listFornecedores, BRL } from '../lib/data'

const inp = { width: '100%', padding: '7px 9px', border: '1px solid var(--line)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink)', fontSize: 12.5 }
const num = { ...inp, textAlign: 'right', fontFamily: 'IBM Plex Mono' }

// ---- Mão de obra: etapa · descrição · valor ----
function SecaoMO({ itens, etapas, onAdd, onDel }) {
  const [ref, setRef] = useState(''); const [desc, setDesc] = useState(''); const [valor, setValor] = useState('')
  const total = itens.reduce((t, i) => t + Number(i.valor || 0), 0)
  async function add() {
    if (!ref && !desc) return
    await onAdd('mao_obra', { etapa_nome: ref, descricao: desc, quantidade: 1, valor_unit: Number(valor) || 0, valor: Number(valor) || 0 })
    setRef(''); setDesc(''); setValor('')
  }
  return (
    <Bloco titulo="Mão de obra" total={total}>
      {itens.map((i) => <Linha key={i.id} a={i.etapa_nome} b={i.descricao} val={i.valor} onDel={() => onDel(i.id)} />)}
      <tr>
        <td style={cell}><select value={ref} onChange={(e) => setRef(e.target.value)} style={inp}><option value="">Etapa…</option>{etapas.map((e) => <option key={e.id} value={e.nome}>{e.nome}</option>)}</select></td>
        <td style={cell} colSpan="2"><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição" style={inp} /></td>
        <td style={cell}><input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor" style={num} /></td>
        <td style={cell}><AddBtn onClick={add} /></td>
      </tr>
    </Bloco>
  )
}

// ---- Material: item · descrição · qtd · valor unit · total ----
function SecaoMaterial({ itens, onAdd, onDel }) {
  const [item, setItem] = useState(''); const [desc, setDesc] = useState(''); const [qtd, setQtd] = useState(1); const [vu, setVu] = useState('')
  const total = itens.reduce((t, i) => t + Number(i.valor || 0), 0)
  async function add() {
    if (!item) return
    const q = Number(qtd) || 1, u = Number(vu) || 0
    await onAdd('material', { etapa_nome: item, descricao: desc, quantidade: q, valor_unit: u, valor: q * u })
    setItem(''); setDesc(''); setQtd(1); setVu('')
  }
  return (
    <Bloco titulo="Material" total={total} cols={['Item', 'Descrição', 'Qtd', 'Valor un.', 'Total', '']}>
      {itens.map((i) => <LinhaQ key={i.id} i={i} onDel={() => onDel(i.id)} />)}
      <tr>
        <td style={cell}><input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Item" style={inp} /></td>
        <td style={cell}><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição" style={inp} /></td>
        <td style={{ ...cell, width: 64 }}><input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} style={num} /></td>
        <td style={{ ...cell, width: 100 }}><input type="number" value={vu} onChange={(e) => setVu(e.target.value)} placeholder="Un." style={num} /></td>
        <td style={{ ...cell, width: 100, textAlign: 'right', fontFamily: 'IBM Plex Mono', fontSize: 12.5, color: 'var(--ink3)' }}>{BRL((Number(qtd) || 0) * (Number(vu) || 0))}</td>
        <td style={cell}><AddBtn onClick={add} /></td>
      </tr>
    </Bloco>
  )
}

// ---- Fornecedor: seleção do banco · descrição · qtd · valor unit · total ----
function SecaoForn({ itens, fornecedores, onAdd, onDel }) {
  const [nome, setNome] = useState(''); const [desc, setDesc] = useState(''); const [qtd, setQtd] = useState(1); const [vu, setVu] = useState('')
  const total = itens.reduce((t, i) => t + Number(i.valor || 0), 0)
  async function add() {
    if (!nome) return
    const q = Number(qtd) || 1, u = Number(vu) || 0
    const match = fornecedores.find((f) => f.nome.toLowerCase() === nome.trim().toLowerCase())
    await onAdd('fornecedor', { etapa_nome: nome, descricao: desc, quantidade: q, valor_unit: u, valor: q * u, fornecedor_id: match?.id || null })
    setNome(''); setDesc(''); setQtd(1); setVu('')
  }
  return (
    <Bloco titulo="Fornecedores" total={total} cols={['Fornecedor', 'Descrição', 'Qtd', 'Valor un.', 'Total', '']}>
      {itens.map((i) => <LinhaQ key={i.id} i={i} onDel={() => onDel(i.id)} />)}
      <tr>
        <td style={cell}>
          <input list="forn-list" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Fornecedor (escolha ou novo)" style={inp} />
          <datalist id="forn-list">{fornecedores.map((f) => <option key={f.id} value={f.nome} />)}</datalist>
        </td>
        <td style={cell}><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Produto / descrição" style={inp} /></td>
        <td style={{ ...cell, width: 64 }}><input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} style={num} /></td>
        <td style={{ ...cell, width: 100 }}><input type="number" value={vu} onChange={(e) => setVu(e.target.value)} placeholder="Un." style={num} /></td>
        <td style={{ ...cell, width: 100, textAlign: 'right', fontFamily: 'IBM Plex Mono', fontSize: 12.5, color: 'var(--ink3)' }}>{BRL((Number(qtd) || 0) * (Number(vu) || 0))}</td>
        <td style={cell}><AddBtn onClick={add} /></td>
      </tr>
    </Bloco>
  )
}

const cell = { padding: 8, borderBottom: '1px solid var(--line2)' }
function Bloco({ titulo, total, cols, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: '10px 10px 0 0', fontWeight: 600, fontSize: 13.5 }}>
        <span>{titulo}</span><span className="mono">{BRL(total)}</span>
      </div>
      <div className="card" style={{ borderRadius: '0 0 10px 10px', borderTop: 'none', padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: cols ? 560 : 420 }}><tbody>{children}</tbody></table>
      </div>
    </div>
  )
}
function Linha({ a, b, val, onDel }) {
  return (
    <tr>
      <td style={{ ...cell, fontWeight: 600, fontSize: 13, width: '32%' }}>{a || '—'}</td>
      <td style={{ ...cell, color: 'var(--ink2)', fontSize: 13 }} colSpan="2">{b || '—'}</td>
      <td className="mono" style={{ ...cell, textAlign: 'right', fontSize: 13, whiteSpace: 'nowrap' }}>{BRL(val)}</td>
      <td style={{ ...cell, width: 30 }}><button className="muted" onClick={onDel} style={{ fontSize: 15 }}>×</button></td>
    </tr>
  )
}
function LinhaQ({ i, onDel }) {
  const q = Number(i.quantidade ?? 1), u = Number(i.valor_unit ?? i.valor)
  return (
    <tr>
      <td style={{ ...cell, fontWeight: 600, fontSize: 13 }}>{i.etapa_nome || '—'}</td>
      <td style={{ ...cell, color: 'var(--ink2)', fontSize: 13 }}>{i.descricao || '—'}</td>
      <td className="mono" style={{ ...cell, textAlign: 'right', fontSize: 12.5, width: 64 }}>{q}</td>
      <td className="mono" style={{ ...cell, textAlign: 'right', fontSize: 12.5, width: 100 }}>{BRL(u)}</td>
      <td className="mono" style={{ ...cell, textAlign: 'right', fontSize: 13, fontWeight: 600, width: 100, whiteSpace: 'nowrap' }}>{BRL(i.valor)}</td>
      <td style={{ ...cell, width: 30 }}><button className="muted" onClick={onDel} style={{ fontSize: 15 }}>×</button></td>
    </tr>
  )
}
function AddBtn({ onClick }) {
  return <button className="btn" style={{ padding: '7px 10px', fontSize: 12 }} onClick={onClick}>+</button>
}

export default function Custos({ obra, orcado, onOrcadoChange }) {
  const [itens, setItens] = useState(null)
  const [forns, setForns] = useState([])
  const [orc, setOrc] = useState(orcado || 0)
  const [savingOrc, setSavingOrc] = useState(false)

  async function load() { setItens(await listCustos(obra.id)) }
  useEffect(() => { load(); listFornecedores().then(setForns).catch(() => {}) }, [obra.id])
  useEffect(() => { setOrc(orcado || 0) }, [orcado])

  async function add(cat, item) { await addCusto(obra.id, { categoria: cat, ...item }); await load() }
  async function del(id) { await deleteCusto(id); await load() }
  async function salvarOrc() { setSavingOrc(true); await setOrcado(obra.id, orc); onOrcadoChange?.(Number(orc) || 0); setSavingOrc(false) }

  if (!itens) return <div className="spin" />
  const porCat = (k) => itens.filter((i) => i.categoria === k)
  const tmo = porCat('mao_obra').reduce((t, i) => t + Number(i.valor || 0), 0)
  const tmat = porCat('material').reduce((t, i) => t + Number(i.valor || 0), 0)
  const tforn = porCat('fornecedor').reduce((t, i) => t + Number(i.valor || 0), 0)
  const custo = tmo + tmat + tforn
  const orcadoN = Number(orc) || 0
  const margem = orcadoN ? Math.round((1 - custo / orcadoN) * 100) : 0
  const lucro = orcadoN - custo

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className="pill" style={{ background: 'var(--crit-bg)', color: 'var(--crit)', fontWeight: 700 }}>Interno · invisível para o cliente</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="muted" style={{ fontSize: 12 }}>Orçado (contrato)</span>
          <input type="number" value={orc} onChange={(e) => setOrc(e.target.value)} style={{ width: 130, padding: '7px 9px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', textAlign: 'right', fontFamily: 'IBM Plex Mono' }} />
          <button className="btn ghost" style={{ fontSize: 12, padding: '7px 11px' }} onClick={salvarOrc} disabled={savingOrc}>{savingOrc ? '…' : 'Salvar'}</button>
        </div>
      </div>

      <div className="grid-kpi" style={{ marginBottom: 18 }}>
        <div className="card kpi"><div className="k">Orçado</div><div className="v">{BRL(orcadoN)}</div><div className="dsc">contrato</div></div>
        <div className="card kpi"><div className="k">Mão de obra</div><div className="v">{BRL(tmo)}</div><div className="dsc">por etapa</div></div>
        <div className="card kpi"><div className="k">Material + forn.</div><div className="v">{BRL(tmat + tforn)}</div><div className="dsc">insumos</div></div>
        <div className="card kpi"><div className="k">Margem atual</div><div className="v" style={{ color: margem >= 0 ? 'var(--ok)' : 'var(--crit)' }}>{margem}%</div><div className="dsc">{BRL(lucro)} de folga</div></div>
      </div>

      <SecaoMO itens={porCat('mao_obra')} etapas={obra.etapas} onAdd={add} onDel={del} />
      <SecaoMaterial itens={porCat('material')} onAdd={add} onDel={del} />
      <SecaoForn itens={porCat('fornecedor')} fornecedores={forns} onAdd={add} onDel={del} />

      <div className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div className="muted" style={{ fontSize: 12 }}>Custo total realizado</div><div className="mono" style={{ fontSize: 24, fontWeight: 600 }}>{BRL(custo)}</div></div>
        <div style={{ textAlign: 'right' }}><div className="muted" style={{ fontSize: 12 }}>Lucro projetado</div><div className="mono" style={{ fontSize: 24, fontWeight: 600, color: lucro >= 0 ? 'var(--ok)' : 'var(--crit)' }}>{BRL(lucro)}</div></div>
      </div>
    </div>
  )
}
