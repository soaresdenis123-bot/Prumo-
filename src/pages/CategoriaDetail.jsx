import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  listFornecedoresPorCategoria, listProdutosPorCategoria, listCategoriaArquivos,
  addFornecedor, addProduto, updateProduto, deleteProduto,
  uploadCatalogoImagem, catalogoImagemUrl, uploadCategoriaPortfolio, arquivoUrl, deleteArquivo, BRL,
} from '../lib/data'

const inp = { padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontSize: 13 }
const th = { textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700, padding: '10px 14px', borderBottom: '1px solid var(--line)' }
const TIPO_LBL = { material: 'Material', mao_obra: 'Mão de obra', servico: 'Serviço' }

export default function CategoriaDetail() {
  const { categoria } = useParams()
  const cat = decodeURIComponent(categoria)
  const nav = useNavigate()
  const [forns, setForns] = useState([])
  const [prods, setProds] = useState([])
  const [arqs, setArqs] = useState([])
  const [nf, setNf] = useState({ nome: '', tipo: 'material', contato: '' })
  const [np, setNp] = useState({ produto: '', fornecedor_id: '', valor: '', preco_cliente: '' })
  const pdfRef = useRef()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function load() {
    try {
      setForns(await listFornecedoresPorCategoria(cat))
      setProds(await listProdutosPorCategoria(cat))
      setArqs(await listCategoriaArquivos(cat))
    } catch (e) { setErr(e.message) }
  }
  useEffect(() => { load() }, [cat])

  async function addForn() {
    if (!nf.nome.trim()) return
    await addFornecedor({ ...nf, categoria: cat }); setNf({ nome: '', tipo: nf.tipo, contato: '' }); load()
  }
  async function addItem() {
    if (!np.produto.trim() || !np.fornecedor_id) return
    await addProduto(np.fornecedor_id, { produto: np.produto, categoria: cat, unidade: 'un', valor: Number(np.valor) || 0, preco_cliente: np.preco_cliente === '' ? null : Number(np.preco_cliente), no_catalogo: false })
    setNp({ produto: '', fornecedor_id: np.fornecedor_id, valor: '', preco_cliente: '' }); load()
  }
  async function patchItem(id, f) { await updateProduto(id, f); load() }
  async function delItem(id) { await deleteProduto(id); load() }
  async function upPdf(e) {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try { await uploadCategoriaPortfolio(cat, file); await load() } catch (er) { alert('Falha: ' + er.message) }
    setBusy(false); e.target.value = ''
  }
  async function abrir(a) { const u = await arquivoUrl(a); if (u) window.open(u, '_blank') }
  async function remArq(id) { await deleteArquivo(id); load() }

  if (err) return <div className="content"><div className="center-note">Erro: {err}</div></div>

  return (
    <>
      <div className="topbar"><div className="crumb"><Link to="/fornecedores">Fornecedores</Link> / <b>{cat}</b></div><span className="chip-role">Interno</span></div>
      <div className="content">
        <div className="pg-head"><div><h1 className="pg">{cat}</h1>
          <div className="pg-sub">{forns.length} fornecedores · {prods.length} itens · {arqs.length} portfólio(s) do cliente</div></div></div>

        {/* Portfólio do cliente */}
        <div className="card" style={{ padding: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="sec-title" style={{ margin: 0 }}>Portfólio do cliente (PDF)</div>
            <button className="btn" style={{ marginLeft: 'auto', fontSize: 12.5 }} disabled={busy} onClick={() => pdfRef.current.click()}>{busy ? 'Enviando…' : '+ Inserir portfólio'}</button>
            <input ref={pdfRef} type="file" accept=".pdf,application/pdf" hidden onChange={upPdf} />
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
            Esse PDF fica disponível pro <b>cliente</b> nesta categoria, na personalização — ele clica em “{cat}” e abre pra visualizar. Use um catálogo sem a marca do fornecedor.
          </div>
          {arqs.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {arqs.map((a) => (
                <span key={a.id} className="doc-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12.5 }}>
                  <a onClick={() => abrir(a)} style={{ cursor: 'pointer', color: 'var(--accent2)' }}>📄 {a.nome || 'portfolio.pdf'}</a>
                  <button className="muted" onClick={() => remArq(a.id)} title="Remover" style={{ fontSize: 14 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Fornecedores da categoria */}
        <div className="card" style={{ padding: 16, marginBottom: 18 }}>
          <div className="sec-title" style={{ marginTop: 0 }}>Fornecedores desta categoria</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: forns.length ? 12 : 0 }}>
            <input placeholder="Nome do fornecedor *" value={nf.nome} onChange={(e) => setNf({ ...nf, nome: e.target.value })} style={{ ...inp, flex: 2, minWidth: 150 }} />
            <select value={nf.tipo} onChange={(e) => setNf({ ...nf, tipo: e.target.value })} style={inp}>
              <option value="material">Material</option><option value="mao_obra">Mão de obra</option>
            </select>
            <input placeholder="Contato" value={nf.contato} onChange={(e) => setNf({ ...nf, contato: e.target.value })} style={{ ...inp, flex: 1, minWidth: 120 }} />
            <button className="btn ghost" onClick={addForn}>+ Fornecedor</button>
          </div>
          {forns.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {forns.map((f) => (
                <span key={f.id} onClick={() => nav('/fornecedores/' + f.id)} className="pill" style={{ background: 'var(--surface2)', color: 'var(--accent2)', cursor: 'pointer', fontWeight: 600 }}>
                  {f.nome} <span className="muted" style={{ fontSize: 11 }}>{TIPO_LBL[f.tipo] || 'Material'}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Itens da categoria */}
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div className="sec-title" style={{ marginTop: 0 }}>Itens</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input placeholder="Produto *" value={np.produto} onChange={(e) => setNp({ ...np, produto: e.target.value })} style={{ ...inp, flex: 2, minWidth: 150 }} />
            <select value={np.fornecedor_id} onChange={(e) => setNp({ ...np, fornecedor_id: e.target.value })} style={{ ...inp, minWidth: 140 }}>
              <option value="">Fornecedor…</option>{forns.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            <input type="number" placeholder="Custo" value={np.valor} onChange={(e) => setNp({ ...np, valor: e.target.value })} style={{ ...inp, width: 100, textAlign: 'right', fontFamily: 'IBM Plex Mono' }} />
            <input type="number" placeholder="Preço cliente" value={np.preco_cliente} onChange={(e) => setNp({ ...np, preco_cliente: e.target.value })} style={{ ...inp, width: 120, textAlign: 'right', fontFamily: 'IBM Plex Mono' }} />
            <button className="btn" onClick={addItem} disabled={!np.fornecedor_id}>+ Item</button>
          </div>
          {forns.length === 0 && <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Cadastre um fornecedor nesta categoria primeiro pra poder adicionar itens.</div>}
        </div>

        {prods.length > 0 && (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead><tr>
                <th style={th}>Foto</th><th style={th}>Produto</th><th style={th}>Fornecedor</th>
                <th style={{ ...th, textAlign: 'right' }}>Custo</th><th style={{ ...th, textAlign: 'right' }}>Preço cliente</th>
                <th style={{ ...th, textAlign: 'center' }}>No catálogo</th><th style={th}></th>
              </tr></thead>
              <tbody>{prods.map((x) => <ItemRow key={x.id} x={x} onPatch={patchItem} onDel={delItem} />)}</tbody>
            </table>
          </div>
        )}
        <div className="muted" style={{ fontSize: 11.5, marginTop: 12 }}>
          O <b>custo</b> e o <b>fornecedor</b> são internos. O cliente só vê os itens com <b>“no catálogo”</b> ligado, com o preço de cliente.
        </div>
      </div>
    </>
  )
}

function ItemRow({ x, onPatch, onDel }) {
  const imgRef = useRef()
  const [busy, setBusy] = useState(false)
  const url = catalogoImagemUrl(x.imagem_path)
  async function upImg(e) {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try { const path = await uploadCatalogoImagem(x.fornecedor_id, file); await onPatch(x.id, { imagem_path: path }) }
    catch (err) { alert('Falha: ' + err.message) }
    setBusy(false); e.target.value = ''
  }
  return (
    <tr style={{ borderBottom: '1px solid var(--line2)' }}>
      <td style={{ padding: '8px 14px' }}>
        <button onClick={() => imgRef.current.click()} disabled={busy} title="Enviar foto"
          style={{ width: 44, height: 44, borderRadius: 8, border: '1px dashed var(--line)', background: url ? `center/cover no-repeat url(${url})` : 'var(--surface2)', cursor: 'pointer', color: 'var(--ink3)', fontSize: 17 }}>{url ? '' : (busy ? '…' : '+')}</button>
        <input ref={imgRef} type="file" accept="image/*" hidden onChange={upImg} />
      </td>
      <td style={{ padding: '8px 14px', fontWeight: 600, fontSize: 13 }}>{x.produto}</td>
      <td className="muted" style={{ padding: '8px 14px', fontSize: 12.5 }}>{x.fornecedor || '—'}</td>
      <td className="mono" style={{ padding: '8px 14px', textAlign: 'right', fontSize: 12.5, color: 'var(--ink3)' }}>{BRL(x.valor)}</td>
      <td style={{ padding: '8px 14px', textAlign: 'right' }}>
        <input type="number" defaultValue={x.preco_cliente ?? ''} placeholder="—" onBlur={(e) => onPatch(x.id, { preco_cliente: e.target.value === '' ? null : Number(e.target.value) })}
          style={{ ...inp, width: 90, padding: '5px 8px', textAlign: 'right', fontFamily: 'IBM Plex Mono', fontSize: 12.5 }} />
      </td>
      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
        <input type="checkbox" checked={!!x.no_catalogo} onChange={(e) => onPatch(x.id, { no_catalogo: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }} />
      </td>
      <td style={{ padding: '8px 14px', textAlign: 'right' }}><button className="muted" onClick={() => onDel(x.id)} style={{ fontSize: 15 }}>×</button></td>
    </tr>
  )
}
