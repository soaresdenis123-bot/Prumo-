import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getFornecedor, listProdutos, addProduto, updateProduto, deleteProduto, addProdutosBulk,
  uploadCatalogoImagem, catalogoImagemUrl, listArquivos, uploadPortfolioArquivo, arquivoUrl, deleteArquivo, BRL,
} from '../lib/data'

const inp = { padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontSize: 13 }
export const CATS_PRODUTO = ['Elétrica', 'Luminárias', 'Revestimentos', 'Acabamentos', 'Louças / Metais', 'Jardinagem', 'Esquadrias', 'Hidráulica', 'Marcenaria', 'Outros']

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
  const [p, setP] = useState({ produto: '', categoria: '', unidade: 'un', valor: '', preco_cliente: '' })
  const [preview, setPreview] = useState(null)
  const [err, setErr] = useState('')

  async function load() {
    try { setForn(await getFornecedor(id)); setProds(await listProdutos(id)) }
    catch (e) { setErr(e.message) }
  }
  useEffect(() => { load() }, [id])

  async function add() {
    if (!p.produto.trim()) return
    await addProduto(id, {
      produto: p.produto, categoria: p.categoria || forn.categoria || '', unidade: p.unidade || 'un',
      valor: Number(p.valor) || 0, preco_cliente: p.preco_cliente === '' ? null : Number(p.preco_cliente),
    })
    setP({ produto: '', categoria: p.categoria, unidade: 'un', valor: '', preco_cliente: '' }); load()
  }
  async function del(pid) { await deleteProduto(pid); load() }
  async function patch(pid, fields) { await updateProduto(pid, fields); load() }

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
  async function confirmarImport() { await addProdutosBulk(id, preview); setPreview(null); load() }

  if (err && !forn) return <div className="content"><div className="center-note">Erro: {err}</div></div>
  if (!forn) return <div className="spin" />

  const noCat = prods.filter((x) => x.no_catalogo).length

  return (
    <>
      <div className="topbar"><div className="crumb"><Link to="/fornecedores">Fornecedores</Link> / <b>{forn.nome}</b></div><span className="chip-role">Interno</span></div>
      <div className="content">
        <div className="pg-head">
          <div><h1 className="pg">{forn.nome}</h1>
            <div className="pg-sub">{forn.categoria ? forn.categoria + ' · ' : ''}Portfólio · {prods.length} produtos · <b>{noCat}</b> no catálogo do cliente</div></div>
          <button className="btn ghost" onClick={() => fileRef.current.click()}>
            <svg viewBox="0 0 24 24" width="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
            Importar planilha
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={onFile} />
        </div>

        <div className="card" style={{ padding: '12px 16px', marginBottom: 16, background: 'var(--surface2)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <div style={{ fontSize: 12.5, color: 'var(--ink2)' }}>
            O <b>custo</b> e o nome do fornecedor são internos. O cliente só vê o que estiver com <b>“no catálogo”</b> ligado — por categoria, com a imagem e o <b>preço de cliente</b> (sua margem). Ele nunca sabe de quem veio.
          </div>
        </div>

        <PortfolioPdf fornId={id} />

        {err && <div style={{ color: 'var(--crit)', fontSize: 13, marginBottom: 12 }}>{err}</div>}

        {preview && (
          <div className="card" style={{ padding: 18, marginBottom: 18, border: '1px solid var(--accent)' }}>
            <div className="sec-title" style={{ marginTop: 0 }}>Prévia da importação · {preview.length} produtos</div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Produto</th><th style={th}>Un.</th><th style={{ ...th, textAlign: 'right' }}>Custo</th></tr></thead>
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
            <input placeholder="Produto *" value={p.produto} onChange={(e) => setP({ ...p, produto: e.target.value })} style={{ ...inp, flex: 3, minWidth: 150 }} />
            <select value={p.categoria} onChange={(e) => setP({ ...p, categoria: e.target.value })} style={{ ...inp, flex: 2, minWidth: 130 }}>
              <option value="">Categoria…</option>{CATS_PRODUTO.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Un." value={p.unidade} onChange={(e) => setP({ ...p, unidade: e.target.value })} style={{ ...inp, width: 70 }} />
            <input type="number" placeholder="Custo" value={p.valor} onChange={(e) => setP({ ...p, valor: e.target.value })} style={{ ...inp, width: 100, textAlign: 'right', fontFamily: 'IBM Plex Mono' }} />
            <input type="number" placeholder="Preço cliente" value={p.preco_cliente} onChange={(e) => setP({ ...p, preco_cliente: e.target.value })} style={{ ...inp, width: 120, textAlign: 'right', fontFamily: 'IBM Plex Mono' }} />
            <button className="btn" onClick={add}>+ Adicionar</button>
          </div>
        </div>

        {prods.length === 0 ? (
          <div className="center-note">Nenhum produto ainda. Adicione acima ou importe uma planilha (.xlsx / .csv).</div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead><tr>
                <th style={th}>Foto</th><th style={th}>Produto</th><th style={th}>Categoria</th>
                <th style={{ ...th, textAlign: 'right' }}>Custo</th><th style={{ ...th, textAlign: 'right' }}>Preço cliente</th>
                <th style={{ ...th, textAlign: 'center' }}>No catálogo</th><th style={th}></th>
              </tr></thead>
              <tbody>{prods.map((x) => <ProdRow key={x.id} x={x} fornId={id} onPatch={patch} onDel={del} />)}</tbody>
            </table>
          </div>
        )}
        <div className="muted" style={{ fontSize: 11.5, marginTop: 14 }}>
          Dica: a planilha pode ter colunas “Produto”, “Unidade” e “Valor”. O custo aparece no Orçamento ao puxar do fornecedor; o <b>preço de cliente</b> é o que o cliente vê na personalização.
        </div>
      </div>
    </>
  )
}

function ProdRow({ x, fornId, onPatch, onDel }) {
  const imgRef = useRef()
  const [busy, setBusy] = useState(false)
  const url = catalogoImagemUrl(x.imagem_path)
  async function upImg(e) {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try { const path = await uploadCatalogoImagem(fornId, file); await onPatch(x.id, { imagem_path: path }) }
    catch (err) { alert('Falha na imagem: ' + err.message) }
    setBusy(false); e.target.value = ''
  }
  return (
    <tr style={{ borderBottom: '1px solid var(--line2)' }}>
      <td style={{ padding: '8px 14px' }}>
        <button onClick={() => imgRef.current.click()} title="Enviar foto" disabled={busy}
          style={{ width: 46, height: 46, borderRadius: 8, border: '1px dashed var(--line)', background: url ? `center/cover no-repeat url(${url})` : 'var(--surface2)', cursor: 'pointer', color: 'var(--ink3)', fontSize: 18 }}>
          {url ? '' : (busy ? '…' : '+')}
        </button>
        <input ref={imgRef} type="file" accept="image/*" hidden onChange={upImg} />
      </td>
      <td style={{ padding: '8px 14px', fontWeight: 600, fontSize: 13 }}>{x.produto}</td>
      <td style={{ padding: '8px 14px' }}>
        <select value={x.categoria || ''} onChange={(e) => onPatch(x.id, { categoria: e.target.value })}
          style={{ ...inp, padding: '5px 8px', fontSize: 12 }}>
          <option value="">—</option>{CATS_PRODUTO.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="mono" style={{ padding: '8px 14px', textAlign: 'right', fontSize: 12.5, color: 'var(--ink3)' }}>{BRL(x.valor)}</td>
      <td style={{ padding: '8px 14px', textAlign: 'right' }}>
        <input type="number" defaultValue={x.preco_cliente ?? ''} placeholder="—" onBlur={(e) => onPatch(x.id, { preco_cliente: e.target.value === '' ? null : Number(e.target.value) })}
          style={{ ...inp, width: 90, padding: '5px 8px', textAlign: 'right', fontFamily: 'IBM Plex Mono', fontSize: 12.5 }} />
      </td>
      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
        <input type="checkbox" checked={!!x.no_catalogo} onChange={(e) => onPatch(x.id, { no_catalogo: e.target.checked })}
          style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }} />
      </td>
      <td style={{ padding: '8px 14px', textAlign: 'right' }}><button className="muted" onClick={() => onDel(x.id)} style={{ fontSize: 15 }}>×</button></td>
    </tr>
  )
}
const th = { textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700, padding: '11px 14px', borderBottom: '1px solid var(--line)' }

function PortfolioPdf({ fornId }) {
  const pdfRef = useRef()
  const [arqs, setArqs] = useState([])
  const [busy, setBusy] = useState(false)
  async function load() { try { setArqs(await listArquivos(fornId)) } catch { /* noop */ } }
  useEffect(() => { load() }, [fornId])
  async function up(e) {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try { await uploadPortfolioArquivo(fornId, file); await load() } catch (err) { alert('Falha: ' + err.message) }
    setBusy(false); e.target.value = ''
  }
  async function abrir(path) { const u = await arquivoUrl(path); if (u) window.open(u, '_blank') }
  async function rem(id) { await deleteArquivo(id); load() }
  return (
    <div className="card" style={{ padding: 16, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div className="sec-title" style={{ margin: 0 }}>Portfólio em PDF <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>· catálogos, tabelas, apresentações (interno)</span></div>
        <button className="btn ghost" style={{ marginLeft: 'auto', fontSize: 12.5 }} disabled={busy} onClick={() => pdfRef.current.click()}>{busy ? 'Enviando…' : '+ Anexar PDF'}</button>
        <input ref={pdfRef} type="file" accept=".pdf,application/pdf" hidden onChange={up} />
      </div>
      {arqs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {arqs.map((a) => (
            <span key={a.id} className="doc-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12.5 }}>
              <a onClick={() => abrir(a.path)} style={{ cursor: 'pointer', color: 'var(--accent2)' }}>📄 {a.nome || 'portfolio.pdf'}</a>
              <button className="muted" onClick={() => rem(a.id)} title="Remover" style={{ fontSize: 14 }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
