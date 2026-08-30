import { useEffect, useState } from 'react'
import { listCustos, addCusto, deleteCusto, setCustoStatus, setOrcado, setMetaCusto, listFornecedores, BRL } from '../lib/data'

const inp = { width: '100%', padding: '7px 9px', border: '1px solid var(--line)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink)', fontSize: 12.5 }
const num = { ...inp, textAlign: 'right', fontFamily: 'IBM Plex Mono' }
const fld = { width: 130, padding: '7px 9px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', textAlign: 'right', fontFamily: 'IBM Plex Mono', fontSize: 13 }

function StatusPill({ status, onToggle }) {
  const pago = status === 'pago'
  return (
    <button onClick={onToggle} title="Marcar como pago / pendente"
      className={'pill ' + (pago ? 'ok' : 'pend')}
      style={{ border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 11 }}>
      <span className="d" />{pago ? 'Pago' : 'Pendente'}
    </button>
  )
}

// ---- Mão de obra: etapa · descrição · valor ----
function SecaoMO({ itens, etapas, onAdd, onDel, onToggle }) {
  const [ref, setRef] = useState(''); const [desc, setDesc] = useState(''); const [valor, setValor] = useState('')
  const total = itens.reduce((t, i) => t + Number(i.valor || 0), 0)
  async function add() {
    if (!ref && !desc) return
    await onAdd('mao_obra', { etapa_nome: ref, descricao: desc, quantidade: 1, valor_unit: Number(valor) || 0, valor: Number(valor) || 0, status: 'pendente' })
    setRef(''); setDesc(''); setValor('')
  }
  return (
    <Bloco titulo="Mão de obra" total={total} cols={['Etapa', 'Descrição', 'Status', 'Valor', '']}>
      {itens.map((i) => (
        <tr key={i.id}>
          <td style={{ ...cell, fontWeight: 600, fontSize: 13, width: '30%' }}>{i.etapa_nome || '—'}</td>
          <td style={{ ...cell, color: 'var(--ink2)', fontSize: 13 }}>{i.descricao || '—'}</td>
          <td style={{ ...cell, width: 96 }}><StatusPill status={i.status} onToggle={() => onToggle(i)} /></td>
          <td className="mono" style={{ ...cell, textAlign: 'right', fontSize: 13, whiteSpace: 'nowrap' }}>{BRL(i.valor)}</td>
          <td style={{ ...cell, width: 30 }}><button className="muted" onClick={() => onDel(i.id)} style={{ fontSize: 15 }}>×</button></td>
        </tr>
      ))}
      <tr>
        <td style={cell}><select value={ref} onChange={(e) => setRef(e.target.value)} style={inp}><option value="">Etapa…</option>{etapas.map((e) => <option key={e.id} value={e.nome}>{e.nome}</option>)}</select></td>
        <td style={cell}><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição" style={inp} /></td>
        <td style={cell} />
        <td style={cell}><input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor" style={num} /></td>
        <td style={cell}><AddBtn onClick={add} /></td>
      </tr>
    </Bloco>
  )
}

// ---- Material: item · descrição · qtd · valor unit · total ----
function SecaoMaterial({ itens, onAdd, onDel, onToggle }) {
  const [item, setItem] = useState(''); const [desc, setDesc] = useState(''); const [qtd, setQtd] = useState(1); const [vu, setVu] = useState('')
  const total = itens.reduce((t, i) => t + Number(i.valor || 0), 0)
  async function add() {
    if (!item) return
    const q = Number(qtd) || 1, u = Number(vu) || 0
    await onAdd('material', { etapa_nome: item, descricao: desc, quantidade: q, valor_unit: u, valor: q * u, status: 'pendente' })
    setItem(''); setDesc(''); setQtd(1); setVu('')
  }
  return (
    <Bloco titulo="Material" total={total} cols={['Item', 'Descrição', 'Qtd', 'Valor un.', 'Status', 'Total', '']}>
      {itens.map((i) => <LinhaQ key={i.id} i={i} onDel={() => onDel(i.id)} onToggle={() => onToggle(i)} />)}
      <tr>
        <td style={cell}><input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Item" style={inp} /></td>
        <td style={cell}><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição" style={inp} /></td>
        <td style={{ ...cell, width: 64 }}><input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} style={num} /></td>
        <td style={{ ...cell, width: 100 }}><input type="number" value={vu} onChange={(e) => setVu(e.target.value)} placeholder="Un." style={num} /></td>
        <td style={cell} />
        <td style={{ ...cell, width: 100, textAlign: 'right', fontFamily: 'IBM Plex Mono', fontSize: 12.5, color: 'var(--ink3)' }}>{BRL((Number(qtd) || 0) * (Number(vu) || 0))}</td>
        <td style={cell}><AddBtn onClick={add} /></td>
      </tr>
    </Bloco>
  )
}

// ---- Fornecedor: seleção do banco · descrição · qtd · valor unit · total ----
function SecaoForn({ itens, fornecedores, onAdd, onDel, onToggle }) {
  const [nome, setNome] = useState(''); const [desc, setDesc] = useState(''); const [qtd, setQtd] = useState(1); const [vu, setVu] = useState('')
  const total = itens.reduce((t, i) => t + Number(i.valor || 0), 0)
  async function add() {
    if (!nome) return
    const q = Number(qtd) || 1, u = Number(vu) || 0
    const match = fornecedores.find((f) => f.nome.toLowerCase() === nome.trim().toLowerCase())
    await onAdd('fornecedor', { etapa_nome: nome, descricao: desc, quantidade: q, valor_unit: u, valor: q * u, fornecedor_id: match?.id || null, status: 'pendente' })
    setNome(''); setDesc(''); setQtd(1); setVu('')
  }
  return (
    <Bloco titulo="Fornecedores" total={total} cols={['Fornecedor', 'Descrição', 'Qtd', 'Valor un.', 'Status', 'Total', '']}>
      {itens.map((i) => <LinhaQ key={i.id} i={i} onDel={() => onDel(i.id)} onToggle={() => onToggle(i)} />)}
      <tr>
        <td style={cell}>
          <input list="forn-list" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Fornecedor (escolha ou novo)" style={inp} />
          <datalist id="forn-list">{fornecedores.map((f) => <option key={f.id} value={f.nome} />)}</datalist>
        </td>
        <td style={cell}><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Produto / descrição" style={inp} /></td>
        <td style={{ ...cell, width: 64 }}><input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} style={num} /></td>
        <td style={{ ...cell, width: 100 }}><input type="number" value={vu} onChange={(e) => setVu(e.target.value)} placeholder="Un." style={num} /></td>
        <td style={cell} />
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
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: cols ? 620 : 420 }}><tbody>{children}</tbody></table>
      </div>
    </div>
  )
}
function LinhaQ({ i, onDel, onToggle }) {
  const q = Number(i.quantidade ?? 1), u = Number(i.valor_unit ?? i.valor)
  return (
    <tr>
      <td style={{ ...cell, fontWeight: 600, fontSize: 13 }}>{i.etapa_nome || '—'}</td>
      <td style={{ ...cell, color: 'var(--ink2)', fontSize: 13 }}>{i.descricao || '—'}</td>
      <td className="mono" style={{ ...cell, textAlign: 'right', fontSize: 12.5, width: 64 }}>{q}</td>
      <td className="mono" style={{ ...cell, textAlign: 'right', fontSize: 12.5, width: 100 }}>{BRL(u)}</td>
      <td style={{ ...cell, width: 96 }}><StatusPill status={i.status} onToggle={onToggle} /></td>
      <td className="mono" style={{ ...cell, textAlign: 'right', fontSize: 13, fontWeight: 600, width: 100, whiteSpace: 'nowrap' }}>{BRL(i.valor)}</td>
      <td style={{ ...cell, width: 30 }}><button className="muted" onClick={onDel} style={{ fontSize: 15 }}>×</button></td>
    </tr>
  )
}
function AddBtn({ onClick }) {
  return <button className="btn" style={{ padding: '7px 10px', fontSize: 12 }} onClick={onClick}>+</button>
}

export default function Custos({ obra, orcado, meta, onOrcadoChange, onMetaChange }) {
  const [itens, setItens] = useState(null)
  const [forns, setForns] = useState([])
  const [orc, setOrc] = useState(orcado || 0)
  const [metaC, setMetaC] = useState(meta || 0)
  const [saving, setSaving] = useState(false)

  async function load() { setItens(await listCustos(obra.id)) }
  useEffect(() => { load(); listFornecedores().then(setForns).catch(() => {}) }, [obra.id])
  useEffect(() => { setOrc(orcado || 0) }, [orcado])
  useEffect(() => { setMetaC(meta || 0) }, [meta])

  async function add(cat, item) { await addCusto(obra.id, { categoria: cat, ...item }); await load() }
  async function del(id) { await deleteCusto(id); await load() }
  async function toggle(i) { await setCustoStatus(i.id, i.status === 'pago' ? 'pendente' : 'pago'); await load() }
  async function salvar() {
    setSaving(true)
    await setOrcado(obra.id, orc); await setMetaCusto(obra.id, metaC)
    onOrcadoChange?.(Number(orc) || 0); onMetaChange?.(Number(metaC) || 0)
    setSaving(false)
  }

  if (!itens) return <div className="spin" />
  const porCat = (k) => itens.filter((i) => i.categoria === k)
  const tmo = porCat('mao_obra').reduce((t, i) => t + Number(i.valor || 0), 0)
  const tmat = porCat('material').reduce((t, i) => t + Number(i.valor || 0), 0)
  const tforn = porCat('fornecedor').reduce((t, i) => t + Number(i.valor || 0), 0)
  const custo = tmo + tmat + tforn
  const pago = itens.filter((i) => i.status === 'pago').reduce((t, i) => t + Number(i.valor || 0), 0)
  const pendente = custo - pago
  const orcadoN = Number(orc) || 0
  const metaN = Number(metaC) || 0
  const margem = orcadoN ? Math.round((1 - custo / orcadoN) * 100) : 0
  const lucro = orcadoN - custo
  const consumo = metaN ? Math.round((custo / metaN) * 100) : 0
  const estourou = metaN > 0 && custo > metaN
  const corMeta = !metaN ? 'var(--ink3)' : consumo > 100 ? 'var(--crit)' : consumo > 85 ? 'var(--warn)' : 'var(--ok)'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className="pill" style={{ background: 'var(--crit-bg)', color: 'var(--crit)', fontWeight: 700 }}>Interno · invisível para o cliente</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11, color: 'var(--ink3)' }}>Orçado (contrato)<br />
            <input type="number" value={orc} onChange={(e) => setOrc(e.target.value)} style={fld} /></label>
          <label style={{ fontSize: 11, color: 'var(--ink3)' }}>Meta de custo<br />
            <input type="number" value={metaC} onChange={(e) => setMetaC(e.target.value)} style={fld} /></label>
          <button className="btn ghost" style={{ fontSize: 12, padding: '7px 11px' }} onClick={salvar} disabled={saving}>{saving ? '…' : 'Salvar'}</button>
        </div>
      </div>

      <div className="grid-kpi" style={{ marginBottom: 14 }}>
        <div className="card kpi"><div className="k">Orçado (receita)</div><div className="v">{BRL(orcadoN)}</div><div className="dsc">contrato com cliente</div></div>
        <div className="card kpi"><div className="k">Custo realizado</div><div className="v">{BRL(custo)}</div><div className="dsc"><span style={{ color: 'var(--ok)' }}>{BRL(pago)} pago</span> · {BRL(pendente)} pendente</div></div>
        <div className="card kpi"><div className="k">Meta de custo</div><div className="v">{metaN ? BRL(metaN) : '—'}</div><div className="dsc">{metaN ? BRL(metaN - custo) + ' restante' : 'defina a meta'}</div></div>
        <div className="card kpi"><div className="k">Margem</div><div className="v" style={{ color: margem >= 0 ? 'var(--ok)' : 'var(--crit)' }}>{margem}%</div><div className="dsc">{BRL(lucro)} de lucro</div></div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
          <div className="sec-title" style={{ margin: 0 }}>Consumo da meta de custo</div>
          {metaN ? (
            <div style={{ fontSize: 13 }}><b className="mono" style={{ color: corMeta }}>{consumo}%</b> <span className="muted">· {BRL(custo)} de {BRL(metaN)}</span></div>
          ) : (
            <button className="muted" style={{ fontSize: 12, color: 'var(--accent2)' }} onClick={() => setMetaC(Math.round(orcadoN * 0.65))}>Sugerir 65% do contrato ({BRL(Math.round(orcadoN * 0.65))})</button>
          )}
        </div>
        <div className="bar" style={{ height: 10 }}><i style={{ width: Math.min(consumo, 100) + '%', background: corMeta }} /></div>
        {estourou && <div style={{ fontSize: 12, color: 'var(--crit)', fontWeight: 600, marginTop: 8 }}>⚠ Custo passou da meta em {BRL(custo - metaN)}. Margem sob pressão.</div>}
        {metaN > 0 && !estourou && <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>A cada lançamento de mão de obra ou material a barra sobe. Fica no verde enquanto estiver dentro do planejado.</div>}
      </div>

      <SecaoMO itens={porCat('mao_obra')} etapas={obra.etapas} onAdd={add} onDel={del} onToggle={toggle} />
      <SecaoMaterial itens={porCat('material')} onAdd={add} onDel={del} onToggle={toggle} />
      <SecaoForn itens={porCat('fornecedor')} fornecedores={forns} onAdd={add} onDel={del} onToggle={toggle} />

      <div className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div><div className="muted" style={{ fontSize: 12 }}>Custo total realizado</div><div className="mono" style={{ fontSize: 24, fontWeight: 600 }}>{BRL(custo)}</div></div>
        <div style={{ textAlign: 'center' }}><div className="muted" style={{ fontSize: 12 }}>Pendente de pagamento</div><div className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--warn)' }}>{BRL(pendente)}</div></div>
        <div style={{ textAlign: 'right' }}><div className="muted" style={{ fontSize: 12 }}>Lucro projetado</div><div className="mono" style={{ fontSize: 24, fontWeight: 600, color: lucro >= 0 ? 'var(--ok)' : 'var(--crit)' }}>{BRL(lucro)}</div></div>
      </div>
    </div>
  )
}
