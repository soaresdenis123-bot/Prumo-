import { useState, useEffect, Fragment } from 'react'
import { BRL, saveOrcamento, listProdutosComFornecedor } from '../lib/data'
import PlumbMark from '../components/PlumbMark'

// Template de escopo de uma obra steel frame chave-na-mão (referência de engenharia)
const TEMPLATE_OBRA = [
  ['Projeto & Legalização', 'Projeto arquitetônico', 'vb', ''],
  ['Projeto & Legalização', 'Projeto estrutural + ART/RRT', 'vb', ''],
  ['Projeto & Legalização', 'Aprovação prefeitura / alvará', 'vb', ''],
  ['Serviços preliminares', 'Limpeza do terreno', 'm²', ''],
  ['Serviços preliminares', 'Terraplanagem / nivelamento', 'm²', ''],
  ['Serviços preliminares', 'Canteiro e ligações provisórias', 'vb', ''],
  ['Fundação', 'Radier / sapata', 'm²', ''],
  ['Fundação', 'Concreto', 'm³', ''],
  ['Fundação', 'Ferragem', 'kg', ''],
  ['Fundação', 'Impermeabilização', 'm²', ''],
  ['Estrutura Steel Frame', 'Kit perfis galvanizados', 'kit', ''],
  ['Estrutura Steel Frame', 'Montagem da estrutura (mão de obra)', 'm²', ''],
  ['Estrutura Steel Frame', 'Parafusos e fixações', 'vb', ''],
  ['Estrutura Steel Frame', 'Chumbadores / ancoragem', 'vb', ''],
  ['Fechamento & Isolamento', 'OSB estrutural', 'm²', ''],
  ['Fechamento & Isolamento', 'Placa cimentícia externa', 'm²', 'Externo'],
  ['Fechamento & Isolamento', 'Gesso acartonado interno', 'm²', 'Interno'],
  ['Fechamento & Isolamento', 'Membrana hidrófuga', 'm²', ''],
  ['Fechamento & Isolamento', 'Lã de vidro / rocha (isolamento)', 'm²', ''],
  ['Cobertura', 'Estrutura do telhado', 'm²', ''],
  ['Cobertura', 'Telhas', 'm²', ''],
  ['Cobertura', 'Manta / subcobertura', 'm²', ''],
  ['Cobertura', 'Calhas e rufos', 'm', ''],
  ['Cobertura', 'Forro', 'm²', ''],
  ['Esquadrias', 'Janelas', 'un', ''],
  ['Esquadrias', 'Porta de entrada', 'un', ''],
  ['Esquadrias', 'Portas internas', 'un', ''],
  ['Esquadrias', 'Vidros', 'm²', ''],
  ['Instalações Elétricas', 'Entrada e quadro de distribuição', 'vb', ''],
  ['Instalações Elétricas', 'Cabeamento e eletrodutos', 'vb', ''],
  ['Instalações Elétricas', 'Tomadas e interruptores', 'un', ''],
  ['Instalações Elétricas', 'Luminárias', 'un', ''],
  ['Instalações Hidrossanitárias', 'Tubulação água fria/quente', 'vb', ''],
  ['Instalações Hidrossanitárias', 'Esgoto e ventilação', 'vb', ''],
  ['Instalações Hidrossanitárias', 'Louças (vaso, cuba)', 'un', ''],
  ['Instalações Hidrossanitárias', 'Metais e registros', 'un', ''],
  ['Instalações Hidrossanitárias', 'Aquecedor / boiler', 'un', ''],
  ['Instalações Hidrossanitárias', 'Reservatório / caixa d’água', 'un', ''],
  ['Revestimentos', 'Porcelanato / piso — interno', 'm²', 'Interno'],
  ['Revestimentos', 'Azulejo — áreas molhadas', 'm²', 'Interno'],
  ['Revestimentos', 'Revestimento de fachada — externo', 'm²', 'Externo'],
  ['Revestimentos', 'Soleiras e rodapés', 'm', ''],
  ['Pintura', 'Massa + tinta — interna', 'm²', 'Interno'],
  ['Pintura', 'Pintura / textura — externa', 'm²', 'Externo'],
  ['Marcenaria & Acabamentos', 'Bancadas (pedras)', 'm', ''],
  ['Marcenaria & Acabamentos', 'Marcenaria (cozinha/banheiros)', 'vb', ''],
  ['Marcenaria & Acabamentos', 'Ferragens e acessórios', 'vb', ''],
  ['Áreas externas', 'Calçada / passeio', 'm²', 'Externo'],
  ['Áreas externas', 'Muro / cerca', 'm', 'Externo'],
  ['Áreas externas', 'Paisagismo / grama', 'm²', 'Externo'],
  ['Entrega', 'Limpeza final', 'vb', ''],
].map(([categoria, item, un, local]) => ({ categoria, item, un, local, qtd: 1, valor: 0 }))

// Parâmetros da calculadora (defaults calibrados com a referência MS · ago/2026)
const DEF = {
  precoMontante: 135, precoGuia: 129.90, precoCartola: 70,
  precoParaf: 0.35, precoChumb: 1.50,
  qMontante: 1.44, qGuia: 0.42, qCartola: 0.57, qParaf: 40, qChumb: 1.2, // un/m²
  matCompleto: 750,          // R$/m²
  obraMedio: 3000, obraAlto: 3500, // R$/m² obra pronta
  fator2pav: 1.8,            // multiplica a obra pronta no sobrado
  efMat: 2,                  // % por cômodo acima da base (material completo)
  efObra: 0.8,               // % por cômodo acima da base (obra pronta)
  baseAmbientes: 5,
}
const inp = { width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 9, background: 'var(--surface)', color: 'var(--ink)', fontSize: 13.5 }

export default function Calculadora() {
  const [modo, setModo] = useState('est')
  return (
    <>
      <div className="topbar"><div className="crumb"><b>Calculadora de investimento</b></div></div>
      <div className="content">
        <div className="pg-head"><div><h1 className="pg">Calculadora de investimento</h1>
          <div className="pg-sub">Do sonho ao valor — estimativa rápida ou orçamento exato pro cliente</div></div></div>
        <div className="calc-modes">
          <button className={modo === 'est' ? 'on' : ''} onClick={() => setModo('est')}>Estimativa</button>
          <button className={modo === 'exa' ? 'on' : ''} onClick={() => setModo('exa')}>Exatidão</button>
        </div>
        {modo === 'est' ? <Estimativa onRefinar={() => setModo('exa')} /> : <Exatidao />}
      </div>
    </>
  )
}

function Estimativa({ onRefinar }) {
  const [area, setArea] = useState(100)
  const [sobrado, setSobrado] = useState(false)
  const [ambientes, setAmbientes] = useState(6)
  const [pad, setPad] = useState('alto')
  const [adv, setAdv] = useState(false)
  const [p, setP] = useState(DEF)
  const setParam = (k) => (e) => setP({ ...p, [k]: Number(e.target.value) })

  const a = Number(area) || 0
  const fPav = sobrado ? p.fator2pav : 1
  const fMat = 1 + (p.efMat / 100) * (ambientes - p.baseAmbientes)
  const fObra = 1 + (p.efObra / 100) * (ambientes - p.baseAmbientes)

  const q = {
    montantes: Math.round(p.qMontante * a),
    guias: Math.round(p.qGuia * a),
    cartola: Math.round(p.qCartola * a),
    parafusos: Math.round(p.qParaf * a),
    chumbadores: Math.round(p.qChumb * a),
  }
  const estrutura = q.montantes * p.precoMontante + q.guias * p.precoGuia + q.cartola * p.precoCartola + q.parafusos * p.precoParaf + q.chumbadores * p.precoChumb
  const completo = a * p.matCompleto * fMat
  const precoObra = pad === 'alto' ? p.obraAlto : p.obraMedio
  const obraPronta = a * precoObra * fPav * fObra

  const toggle = (on) => ({ padding: '11px 14px', borderRadius: 9, border: '1px solid var(--line)', fontWeight: 600, fontSize: 13.5, background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--bg)' : 'var(--ink2)', flex: 1 })

  return (
    <div className="grid2" style={{ gap: 16, gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
      {/* Entradas */}
      <div className="card" style={{ padding: 22 }}>
        <div className="sec-title" style={{ marginTop: 0 }}>Sua casa</div>
        <div className="field"><label>Área construída (m²)</label>
          <input type="number" value={area} onChange={(e) => setArea(e.target.value)} style={inp} /></div>

        <div className="field"><label>Pavimentos</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={toggle(!sobrado)} onClick={() => setSobrado(false)}>Térrea</button>
            <button style={toggle(sobrado)} onClick={() => setSobrado(true)}>Sobrado (2 pav.)</button>
          </div></div>

        <div className="field"><label>Nº de ambientes / cômodos <span className="muted" style={{ fontWeight: 400 }}>(quartos, salas, banheiros…)</span></label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="range" min="1" max="15" value={ambientes} onChange={(e) => setAmbientes(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent)' }} />
            <b className="mono" style={{ fontSize: 16, minWidth: 20 }}>{ambientes}</b>
          </div></div>

        <div className="field"><label>Padrão de acabamento</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={toggle(pad === 'medio')} onClick={() => setPad('medio')}>Médio</button>
            <button style={toggle(pad === 'alto')} onClick={() => setPad('alto')}>Alto</button>
          </div></div>

        <button className="muted" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent2)', marginTop: 4 }} onClick={() => setAdv(!adv)}>
          Ajustes avançados (preços e fatores) {adv ? '▴' : '▾'}
        </button>
        {adv && (
          <div style={{ marginTop: 14, borderTop: '1px solid var(--line2)', paddingTop: 14 }}>
            <div className="grid2">
              {[
                ['precoMontante', 'Montante 90 · barra 6 m (R$)'], ['precoGuia', 'Guia 90 · barra 6 m (R$)'],
                ['precoCartola', 'Perfil cartola · 6 m (R$)'], ['qParaf', 'Parafusos · un/m²'],
                ['precoParaf', 'Parafuso (R$/un)'], ['precoChumb', 'Chumbador (R$/un)'],
                ['matCompleto', 'Material completo (R$/m²)'], ['obraMedio', 'Obra pronta · Médio (R$/m²)'],
                ['obraAlto', 'Obra pronta · Alto (R$/m²)'], ['fator2pav', 'Fator 2 pavimentos'],
                ['efMat', 'Ambientes · efeito material (%/amb.)'], ['efObra', 'Ambientes · efeito obra (%/amb.)'],
              ].map(([k, lbl]) => (
                <div className="field" key={k}><label style={{ fontSize: 11 }}>{lbl}</label>
                  <input type="number" value={p[k]} onChange={setParam(k)} style={{ ...inp, padding: '7px 9px', fontSize: 12.5 }} /></div>
              ))}
            </div>
            <button className="muted" style={{ fontSize: 11.5 }} onClick={() => setP(DEF)}>↺ Restaurar padrões</button>
          </div>
        )}
        <div className="muted" style={{ fontSize: 11, marginTop: 14, lineHeight: 1.6 }}>
          Base: casa térrea de {p.baseAmbientes} cômodos, pé-direito 2,80 m, montantes a cada 40 cm. Referência de engenharia — o valor final vem do projeto e do orçamento.
        </div>
      </div>

      {/* Resultados */}
      <div>
        <div className="card" style={{ padding: '22px 24px', background: 'var(--side)', color: 'var(--side-ink)', border: 'none' }}>
          <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700 }}>Investimento estimado · obra pronta</div>
          <div className="result-big" style={{ margin: '8px 0 2px', color: 'var(--side-ink)' }}>{BRL(obraPronta)}</div>
          <div style={{ fontSize: 13, color: 'var(--side-mut)' }}>{BRL(a ? Math.round(obraPronta / a) : 0)} /m² · padrão {pad}</div>
        </div>

        <div className="grid2" style={{ gap: 12, marginTop: 12 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--accent2)', fontWeight: 700 }}>Material · estrutura de aço</div>
            <div className="mono" style={{ fontSize: 21, fontWeight: 600, margin: '6px 0 2px' }}>{BRL(estrutura)}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>{BRL(a ? Math.round(estrutura / a) : 0)} /m²</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--accent2)', fontWeight: 700 }}>Material completo</div>
            <div className="mono" style={{ fontSize: 21, fontWeight: 600, margin: '6px 0 2px' }}>{BRL(completo)}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>estrutura + fechamento + isolamento</div>
          </div>
        </div>

        <div className="card" style={{ padding: '10px 18px', marginTop: 12 }}>
          <div className="sec-title" style={{ margin: '8px 0 4px' }}>Material principal da estrutura</div>
          {[
            ['Montantes 90', '(barras 6 m)', q.montantes], ['Guias 90', '(barras 6 m)', q.guias],
            ['Perfil cartola / cobertura', '(barras 6 m)', q.cartola], ['Parafusos metal-metal', '(un)', q.parafusos],
            ['Chumbadores de ancoragem', '(un)', q.chumbadores],
          ].map(([nm, un, val]) => (
            <div key={nm} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--line2)' }}>
              <span style={{ fontSize: 13.5 }}>{nm} <span className="muted" style={{ fontSize: 12 }}>{un}</span></span>
              <b className="mono" style={{ fontSize: 15 }}>{val.toLocaleString('pt-BR')}</b>
            </div>
          ))}
          <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={onRefinar}>Montar orçamento detalhado →</button>
        </div>
      </div>
    </div>
  )
}

function FornecedorPicker({ onPick, onClose }) {
  const [prods, setProds] = useState(null)
  const [q, setQ] = useState('')
  useEffect(() => { listProdutosComFornecedor().then(setProds).catch(() => setProds([])) }, [])
  const filtered = (prods || []).filter((p) => (p.produto + ' ' + (p.fornecedor || '')).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="card" style={{ padding: 14, marginTop: 10, border: '1px solid var(--accent)' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <input autoFocus placeholder="Buscar produto ou fornecedor…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inp, flex: 1 }} />
        <button className="muted" onClick={onClose} style={{ fontSize: 13 }}>Fechar</button>
      </div>
      {prods === null ? <div className="muted" style={{ fontSize: 12.5 }}>Carregando…</div>
        : filtered.length === 0 ? <div className="muted" style={{ fontSize: 12.5 }}>Nenhum produto. Cadastre em Fornecedores → abra um fornecedor → adicione/importe produtos.</div>
          : (
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {filtered.map((p) => (
                <div key={p.id} onClick={() => onPick(p)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 6px', borderBottom: '1px solid var(--line2)', cursor: 'pointer' }}>
                  <span style={{ fontSize: 13 }}><b>{p.produto}</b> <span className="muted" style={{ fontSize: 12 }}>· {p.fornecedor || 'fornecedor'} · {p.unidade}</span></span>
                  <b className="mono" style={{ fontSize: 13 }}>{BRL(p.valor)}</b>
                </div>
              ))}
            </div>
          )}
    </div>
  )
}

function Exatidao() {
  const [rows, setRows] = useState(() => TEMPLATE_OBRA.map((r) => ({ ...r })))
  const [meta, setMeta] = useState({ cliente: '', obra: '', cidade: '', validade: 15 })
  const [showPrint, setShowPrint] = useState(false)
  const [picker, setPicker] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [numero] = useState(() => 'MS-' + new Date().getFullYear() + '-' + String(Math.floor(100 + Math.random() * 899)))

  const total = rows.reduce((t, r) => t + (Number(r.qtd) || 0) * (Number(r.valor) || 0), 0)
  const set = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  const addRow = () => setRows([...rows, { categoria: 'Manual', item: 'Novo item', qtd: 1, un: 'un', valor: 0, local: '' }])
  const delRow = (i) => setRows(rows.filter((_, j) => j !== i))
  const carregarTemplate = () => setRows(TEMPLATE_OBRA.map((r) => ({ ...r })))
  const limpar = () => setRows([])
  function puxarFornecedor(p) {
    setRows([...rows, { categoria: p.fornecedor || 'Material', item: p.produto, qtd: 1, un: p.unidade || 'un', valor: Number(p.valor) || 0, local: '' }])
    setPicker(false)
  }

  async function salvar() {
    try { await saveOrcamento({ ...meta, numero }, rows.filter((r) => (Number(r.qtd) || 0) * (Number(r.valor) || 0) > 0)); setSaveMsg('Orçamento salvo no sistema ✓') }
    catch (e) { setSaveMsg('Erro ao salvar: ' + e.message) }
    setTimeout(() => setSaveMsg(''), 2600)
  }

  const cell = { border: 'none', background: 'none', width: '100%', color: 'var(--ink)', fontSize: 13 }
  const usados = rows.filter((r) => (Number(r.qtd) || 0) * (Number(r.valor) || 0) > 0).length
  return (
    <>
      <div className="pg-sub" style={{ margin: '-8px 0 14px' }}>Todas as categorias de uma obra steel frame já vêm listadas — ajuste <b>quantidade</b> e <b>valor</b>, adicione manual ou puxe preços dos fornecedores.</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn ghost" onClick={addRow}>+ Item manual</button>
        <button className="btn ghost" onClick={() => setPicker(!picker)}>Puxar do fornecedor</button>
        <button className="btn ghost" onClick={carregarTemplate}>↺ Recarregar template</button>
        <button className="btn ghost" onClick={limpar} style={{ color: 'var(--crit)' }}>Limpar</button>
      </div>
      {picker && <FornecedorPicker onPick={puxarFornecedor} onClose={() => setPicker(false)} />}

      <div className="card" style={{ padding: 0, overflowX: 'auto', marginTop: picker ? 12 : 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead><tr>{['Categoria', 'Item', 'Local', 'Qtd', 'Un.', 'Valor un.', 'Subtotal', ''].map((h) => (
            <th key={h} style={{ textAlign: ['Qtd', 'Valor un.', 'Subtotal'].includes(h) ? 'right' : 'left', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 700, padding: '10px 12px', borderBottom: '1px solid var(--line)' }}>{h}</th>
          ))}</tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const novaCat = i === 0 || rows[i - 1].categoria !== r.categoria
              return (
                <Fragment key={i}>
                  {novaCat && <tr><td colSpan="8" style={{ padding: '9px 12px 4px', fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--accent2)', fontWeight: 700, background: 'var(--surface2)' }}>{r.categoria}</td></tr>}
                  <tr style={{ borderBottom: '1px solid var(--line2)' }}>
                    <td style={{ padding: '6px 12px', width: 150 }}><input value={r.categoria} onChange={(e) => set(i, 'categoria', e.target.value)} style={{ ...cell, fontSize: 11.5, color: 'var(--ink3)' }} /></td>
                    <td style={{ padding: '6px 12px' }}><input value={r.item} onChange={(e) => set(i, 'item', e.target.value)} style={cell} /></td>
                    <td style={{ padding: '6px 12px', width: 88 }}>
                      <select value={r.local || ''} onChange={(e) => set(i, 'local', e.target.value)} style={{ ...cell, fontSize: 12 }}>
                        <option value="">—</option><option>Interno</option><option>Externo</option>
                      </select></td>
                    <td style={{ padding: '6px 12px', width: 58 }}><input type="number" value={r.qtd} onChange={(e) => set(i, 'qtd', e.target.value)} style={{ ...cell, textAlign: 'right', fontFamily: 'IBM Plex Mono' }} /></td>
                    <td style={{ padding: '6px 12px', width: 50 }}><input value={r.un} onChange={(e) => set(i, 'un', e.target.value)} style={cell} /></td>
                    <td style={{ padding: '6px 12px', width: 104 }}><input type="number" value={r.valor} onChange={(e) => set(i, 'valor', e.target.value)} style={{ ...cell, textAlign: 'right', fontFamily: 'IBM Plex Mono' }} /></td>
                    <td className="mono" style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{BRL((Number(r.qtd) || 0) * (Number(r.valor) || 0))}</td>
                    <td style={{ padding: '6px 8px', width: 26 }}><button className="muted" onClick={() => delRow(i)} style={{ fontSize: 15 }}>×</button></td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>{usados} de {rows.length} itens com valor. Só os itens com valor entram no orçamento salvo.</div>

      <div className="card" style={{ padding: 18, marginTop: 18 }}>
        <div className="sec-title" style={{ marginTop: 0 }}>Dados pro orçamento</div>
        <div className="grid2">
          <div className="field"><label>Cliente</label><input value={meta.cliente} onChange={(e) => setMeta({ ...meta, cliente: e.target.value })} placeholder="Nome do cliente" style={inp} /></div>
          <div className="field"><label>Obra / descrição</label><input value={meta.obra} onChange={(e) => setMeta({ ...meta, obra: e.target.value })} placeholder="Residência 148 m²" style={inp} /></div>
          <div className="field"><label>Local</label><input value={meta.cidade} onChange={(e) => setMeta({ ...meta, cidade: e.target.value })} placeholder="Santa Rosa/RS" style={inp} /></div>
          <div className="field"><label>Validade (dias)</label><input type="number" value={meta.validade} onChange={(e) => setMeta({ ...meta, validade: e.target.value })} style={inp} /></div>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div><div className="muted" style={{ fontSize: 12 }}>Total do orçamento</div><div className="result-big">{BRL(total)}</div></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saveMsg && <span style={{ fontSize: 12.5, color: 'var(--ok)' }}>{saveMsg}</span>}
          <button className="btn ghost" onClick={salvar}>Salvar no sistema</button>
          <button className="btn" onClick={() => setShowPrint(true)}>Exportar orçamento (PDF)</button>
        </div>
      </div>

      {showPrint && <OrcamentoPDF rows={rows} meta={{ ...meta, numero }} total={total} onClose={() => setShowPrint(false)} />}
    </>
  )
}

function OrcamentoPDF({ rows, meta, total, onClose }) {
  const hoje = new Date().toLocaleDateString('pt-BR')
  return (
    <div className="pd-overlay">
      <div className="pd-bar">
        <button className="btn ghost" onClick={onClose}>✕ Fechar</button>
        <button className="btn" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
      </div>
      <div className="sheet">
        <div className="pd-head">
          <div className="pd-brand">
            <PlumbMark size={40} ink="#14171D" accent="#2D63E0" />
            <div><div className="nm">Prumo<span style={{ color: '#2D63E0' }}>.</span></div><div className="kick">Grupo MS · Construções Inteligentes</div></div>
          </div>
          <div className="pd-doctag"><b>Orçamento</b>Nº {meta.numero}<br />Emitido em {hoje}</div>
        </div>
        <div className="pd-title">Proposta de investimento</div>
        <div className="pd-sub">{meta.obra || 'Construção em steel frame'} — chave na mão</div>
        <div className="pd-grid">
          <div className="pd-kv"><span>Cliente</span><b>{meta.cliente || '—'}</b></div>
          <div className="pd-kv"><span>Local</span><b>{meta.cidade || '—'}</b></div>
          <div className="pd-kv"><span>Validade</span><b>{meta.validade} dias</b></div>
          <div className="pd-kv"><span>Data</span><b>{hoje}</b></div>
        </div>
        <div className="pd-sec">Composição do orçamento</div>
        <table className="pd-tbl">
          <thead><tr><th>Categoria</th><th>Item</th><th className="num">Qtd</th><th className="num">Valor un.</th><th className="num">Subtotal</th></tr></thead>
          <tbody>
            {rows.filter((r) => (Number(r.qtd) || 0) * (Number(r.valor) || 0) > 0).map((r, i) => (
              <tr key={i}><td><b>{r.categoria}</b></td><td>{r.item}{r.local ? ' · ' + r.local : ''}</td>
                <td className="num">{r.qtd} {r.un}</td><td className="num">{BRL(r.valor)}</td>
                <td className="num"><b>{BRL((Number(r.qtd) || 0) * (Number(r.valor) || 0))}</b></td></tr>
            ))}
          </tbody>
        </table>
        <div className="pd-total"><div className="tl">Investimento total</div><div className="tv">{BRL(total)}</div></div>
        <div className="pd-terms">
          Proposta válida por {meta.validade} dias a partir da emissão. Valores incluem material, mão de obra e gestão de obra pela
          MS Construções Inteligentes. Condições de pagamento e cronograma físico-financeiro detalhados em contrato.
          Prazo de execução definido após aprovação do projeto executivo.
        </div>
        <div className="pd-foot"><span>MS Construções Inteligentes · Nº {meta.numero}</span><span>Construindo de família para família</span></div>
      </div>
    </div>
  )
}
