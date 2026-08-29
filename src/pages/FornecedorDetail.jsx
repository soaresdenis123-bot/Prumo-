import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getFornecedor, listProdutos, addProduto, deleteProduto, addProdutosBulk, BRL } from '../lib/data'

const inp = { padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontSize: 13 }

function mapRow(obj) {
  const keys = Object.keys(obj)
  const find = (re) => keys.find((k) => re.test(k))
  const kp = find(/produto|item|descri|material|nome/i)
  const ku = find(/unidade|^un$|medida|und/i)
  const kv = find(/valor|pre[çc]o|r\$|custo|unit/i)
  const produto = kp ? String(obj[kp]).trim() : ''
  const valorRaw = kv ? String(obj[kv]).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.') : '0'
  return { produto, unidade: ku ? String(obj[ku]).trim() : 'un', valor: Number(valorRaw) || 0 }
}

export default function FornecedorDetail() {
  const { id } = useParams()
  const fileRef = useRef()
  const [forn, setForn] = useState(null)
  const [prods, setProds] = useState([])
  const [p, setP] = useState({ produto: '', unidade: 'un', valor: '' })
  const [preview, setPreview] = useState(null) // linhas importadas aguardando confirmação
  const [err, setErr] = useState('')

  async function load() {
    try { setForn(await getFornecedor(id)); setProds(await listProdutos(id)) }
    catch (e) { setErr(e.message) }
  }
  useEffect(() => { load() }, [id])

  async function add() {
    if (!p.produto.trim()) return
    await addProduto(id, { produto: p.produto, unidade: p.unidade || 'un', valor: Number(p.valor) || 0 })
    setP({ produto: '', unidade: 'un', valor: '' }); load()
  }
  async function del(pid) { await deleteProduto(pid); load() }

  function onFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const XLSX = await import('xlsx')
        const wb = XLSX.read(ev.target.result, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        const rows = json.map(mapRow).filter((r) => r.produto)
        if (rows.length === 0) { setErr('Não encontrei colunas de produto/valor na planilha.'); return }
        setPreview(rows); setErr('')
      } catch (e2) { setErr('Falha ao ler o arquivo: ' + e2.message) }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }
  async function confirmarImport() {
    await addProdutosBulk(id, preview); setPreview(null); load()
  }

  if (err && !forn) return <div className="content"><div className="center-note">Erro: {err}</div></div>
  if (!forn) return <div className="spin" />

  return (
    <>
      <div className="topbar"><div className="crumb"><Link to="/fornecedores">Fornecedores</Link> / <b>{forn.nome}</b></div><span className="chip-role">Interno</span></div>
      <div className="content">
        <div className="pg-head">
          <div><h1 className="pg">{forn.nome}</h1>
            <div className="pg-sub">{forn.fornece || 'Catálogo de produtos'}{forn.contato ? ' · ' + forn.contato : ''}</div></div>
          <button className="btn ghost" onClick={() => fileRef.current.click()}>
            <svg viewBox="0 0 24 24" width="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
            Importar planilha
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={onFile} />
        </div>

        {err && <div style={{ color: 'var(--crit)', fontSize: 13, marginBottom: 12 }}>{err}</div>}

        {preview && (
          <div className="card" style={{ padding: 18, marginBottom: 18, border: '1px solid var(--accent)' }}>
            <div className="sec-title" style={{ marginTop: 0 }}>Prévia da importação · {preview.length} produtos</div>
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Produto</th><th style={th}>Un.</th><th style={{ ...th, textAlign: 'right' }}>Valor</th></tr></thead>
                <tbody>{preview.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--line2)' }}>
                    <td style={{ padding: '7px 10px', fontSize: 12.5 }}>{r.produto}</td>
                    <td style={{ padding: '7px 10px', fontSize: 12.5 }} className="muted">{r.unidade}</td>
                    <td className="mono" style={{ padding: '7px 10px', textAlign: 'right', fontSize: 12.5 }}>{BRL(r.valor)}</td>
                  </tr>))}</tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn ghost" onClick={() => setPreview(null)}>Cancelar</button>
              <button className="btn" onClick={confirmarImport}>Importar {preview.length} produtos</button>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input placeholder="Produto *" value={p.produto} onChange={(e) => setP({ ...p, produto: e.target.value })} style={{ ...inp, flex: 3, minWidth: 160 }} />
            <input placeholder="Unidade" value={p.unidade} onChange={(e) => setP({ ...p, unidade: e.target.value })} style={{ ...inp, width: 90 }} />
            <input type="number" placeholder="Valor" value={p.valor} onChange={(e) => setP({ ...p, valor: e.target.value })} style={{ ...inp, width: 120, textAlign: 'right', fontFamily: 'IBM Plex Mono' }} />
            <button className="btn" onClick={add}>+ Adicionar</button>
          </div>
        </div>

        {prods.length === 0 ? (
          <div className="center-note">Nenhum produto ainda. Adicione acima ou importe uma planilha (.xlsx / .csv).</div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
              <thead><tr><th style={th}>Produto</th><th style={th}>Unidade</th><th style={{ ...th, textAlign: 'right' }}>Valor</th><th style={th}></th></tr></thead>
              <tbody>{prods.map((x) => (
                <tr key={x.id} style={{ borderBottom: '1px solid var(--line2)' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: 13 }}>{x.produto}</td>
                  <td className="muted" style={{ padding: '11px 14px', fontSize: 13 }}>{x.unidade || '—'}</td>
                  <td className="mono" style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13 }}>{BRL(x.valor)}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right' }}><button className="muted" onClick={() => del(x.id)} style={{ fontSize: 15 }}>×</button></td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
        <div className="muted" style={{ fontSize: 11.5, marginTop: 14 }}>
          Dica: a planilha pode ter colunas “Produto”, “Unidade” e “Valor” (em qualquer ordem). Esses preços aparecem na Calculadora ao puxar do fornecedor.
        </div>
      </div>
    </>
  )
}
const th = { textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700, padding: '11px 14px', borderBottom: '1px solid var(--line)' }
