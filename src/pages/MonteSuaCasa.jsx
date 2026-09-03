import { useMemo, useState } from 'react'
import { salvarLeadProjeto } from '../lib/data'
import { MODELOS } from '../lib/modelos'
import { SUPERFICIES, AMBIENTES_BASE, ACAB_POR_ID, custoSuperficie, vendaItem, esquadUnidades,
  TELHADOS_POR_ID, telhadosDisponiveis, areaTelhado, PAISAGISMOS, PAISAGISMOS_POR_ID } from '../lib/acabamentos'
import { brl } from '../lib/precificacao'
import PlumbMark from '../components/PlumbMark'

const EMAIL_KEY = '7deb7e3c-19dd-4aeb-a043-12d7bfca6b17'
const TELHADO_LABEL = { aparente: 'Telhado aparente', platibanda: 'Platibanda' }
// custo estrutural (fundação + estrutura steel frame + fechamento + instalações), R$/m². Cobertura entra à parte (escolha).
const BASE_ESTRUTURAL = 2780
const SERVICOS_M2 = 225 // projetos (arquitetura, estrutural, fundação, aprovação)
const inp = { width: '100%', padding: '11px 13px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface,#fff)', color: 'var(--ink)', fontSize: 14 }
let AMBID = 1

export default function MonteSuaCasa() {
  const [tipo, setTipo] = useState('terrea')
  const [telhado, setTelhado] = useState('todos')
  const [sel, setSel] = useState(null)
  const [ambientes, setAmbientes] = useState([])
  const [cobertura, setCobertura] = useState(null) // id do telhado
  const [paisagismo, setPaisagismo] = useState(null) // id do paisagismo
  const [picker, setPicker] = useState(null) // { idx, superficie }
  const [form, setForm] = useState({ nome: '', contato: '', cidade: '', obs: '' })
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const padrao = (sel?.padrao === 'alto' || sel?.padrao === 'medio') ? sel.padrao : (tipo === 'sobrado' ? 'alto' : 'medio')
  const lista = useMemo(() => MODELOS.filter((m) => m.tipo === tipo && (telhado === 'todos' || m.telhado === telhado)), [tipo, telhado])

  // ---- ambientes ----
  function addAmbiente(base) {
    setAmbientes((a) => [...a, { id: AMBID++, tipo: base.tipo, area: base.area, sel: {}, done: false }])
  }
  const updAmb = (idx, fn) => setAmbientes((a) => a.map((x, i) => (i === idx ? fn(x) : x)))
  const setArea = (idx, v) => updAmb(idx, (x) => ({ ...x, area: Math.max(1, v) }))
  const removeAmb = (idx) => setAmbientes((a) => a.filter((_, i) => i !== idx))
  const concluir = (idx) => updAmb(idx, (x) => ({ ...x, done: true }))
  const editar = (idx) => updAmb(idx, (x) => ({ ...x, done: false }))
  const escolher = (id) => { updAmb(picker.idx, (x) => ({ ...x, sel: { ...x.sel, [picker.superficie]: id } })); setPicker(null) }

  const custoAmbiente = (amb) => SUPERFICIES.reduce((t, s) => t + custoSuperficie(s.key, ACAB_POR_ID[amb.sel[s.key]], amb.area), 0)

  // cobertura disponível depende do modelo (platibanda restringe)
  const platibanda = sel ? sel.telhado === 'platibanda' : false
  const telhadoOpts = useMemo(() => telhadosDisponiveis(platibanda), [platibanda])
  const cobItem = (cobertura && telhadoOpts.find((t) => t.id === cobertura)) || telhadoOpts[0]

  // ---- estimativa ----
  const est = useMemo(() => {
    const areaTotal = ambientes.reduce((t, a) => t + (Number(a.area) || 0), 0)
    const acab = ambientes.reduce((t, a) => t + custoAmbiente(a), 0)
    const sobrado = (sel?.tipo === 'sobrado') || tipo === 'sobrado'
    const telArea = areaTelhado(areaTotal, sobrado)
    const cobCusto = cobItem ? telArea * vendaItem(cobItem) : 0
    const paisCusto = paisagismo ? (PAISAGISMOS_POR_ID[paisagismo]?.venda || 0) : 0
    const base = areaTotal * BASE_ESTRUTURAL + areaTotal * SERVICOS_M2 + acab + cobCusto + paisCusto
    const round = (n) => Math.round(n / 1000) * 1000
    return { areaTotal, acab, cobCusto, paisCusto, total: base, min: round(base * 0.94), max: round(base * 1.1) }
  }, [ambientes, cobertura, paisagismo, sel, tipo, cobItem])

  function selecoesResumo() {
    // texto legível + bloco JSON para o admin reconstruir
    const linhas = ambientes.map((a) => {
      const parts = SUPERFICIES.filter((s) => a.sel[s.key]).map((s) => `${s.label}: ${ACAB_POR_ID[a.sel[s.key]].nome}`)
      return `${a.tipo} (${a.area} m²)` + (parts.length ? ' · ' + parts.join(' · ') : '')
    })
    const extras = []
    if (cobItem) extras.push('Cobertura: ' + cobItem.nome)
    if (paisagismo) extras.push('Paisagismo: ' + (PAISAGISMOS_POR_ID[paisagismo]?.nome || ''))
    const json = JSON.stringify({
      modelo: sel?.nome || '', tipo, padrao, telhado: sel?.telhado || '',
      cobertura: cobItem?.id || '', paisagismo: paisagismo || '',
      areaTotal: est.areaTotal, estMin: est.min, estMax: est.max,
      ambientes: ambientes.map((a) => ({ tipo: a.tipo, area: a.area, sel: a.sel })),
    })
    return { texto: [...linhas, ...extras].join(' | '), json }
  }

  async function notificar(lead) {
    if (!EMAIL_KEY) return
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: EMAIL_KEY, subject: 'Novo lead — Monte sua casa', from_name: 'Site MS', Nome: lead.nome, Contato: lead.contato, Cidade: lead.cidade, Modelo: lead.modelo, Detalhes: lead.obs }),
      })
    } catch (e) {}
  }

  async function enviar() {
    if (!form.nome || !form.contato) { setErro('Preencha seu nome e um contato (WhatsApp ou e-mail).'); return }
    setSalvando(true); setErro('')
    const r = selecoesResumo()
    const obsFinal = [
      `~${est.areaTotal} m² · ${ambientes.length} ambientes`,
      r.texto && 'Ambientes: ' + r.texto,
      `Estimativa: De ${brl(est.min)} a ${brl(est.max)} (a depender dos materiais)`,
      form.obs && 'Obs: ' + form.obs,
      '[[SEL]]' + r.json + '[[/SEL]]',
    ].filter(Boolean).join(' · ')
    const payload = { ...form, obs: obsFinal, tipo, padrao, telhado: sel?.telhado || '', modelo: sel ? sel.nome : '' }
    try { await salvarLeadProjeto(payload); notificar(payload); setEnviado(true) }
    catch (e) { setErro('Não deu pra enviar agora. Tente de novo ou fale com a gente no WhatsApp.') }
    setSalvando(false)
  }

  const header = (
    <div style={{ borderBottom: '1px solid var(--line)', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <PlumbMark size={26} ink="var(--ink)" />
      <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.3px' }}>MS <span style={{ fontWeight: 500 }}>Construções</span></div>
      <div className="muted" style={{ marginLeft: 'auto', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }}>Steel Frame · Médio e Alto Padrão</div>
    </div>
  )
  const pill = (on) => ({ padding: '9px 16px', borderRadius: 999, border: '1px solid var(--line)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', background: on ? 'var(--accent)' : 'var(--card,#fff)', color: on ? '#fff' : 'var(--ink2,#444)' })
  const chip = (on) => ({ padding: '7px 13px', borderRadius: 999, border: '1px solid var(--line)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', background: on ? 'var(--ink)' : 'transparent', color: on ? 'var(--bg,#fff)' : 'var(--ink3,#666)' })

  if (enviado) return (
    <>{header}
      <div className="content" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 46 }}>🏡</div>
        <h1 className="pg" style={{ marginTop: 8 }}>Recebemos o seu sonho, {form.nome.split(' ')[0]}.</h1>
        <p className="pg-sub" style={{ maxWidth: 470, margin: '10px auto 0' }}>A equipe da MS vai te chamar para a reunião de diagnóstico com a sua casa já esboçada. Fique de olho no seu contato.</p>
        <a className="btn" style={{ marginTop: 26, display: 'inline-flex' }} href="https://msconstrucoesinteligentes.com.br" target="_blank" rel="noopener">Conhecer a MS</a>
      </div>
    </>
  )

  return (
    <>{header}
      <div className="content" style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div className="pg-head" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700 }}>Monte sua casa</div>
          <h1 className="pg" style={{ marginTop: 6 }}>Qual dessas é a sua casa?</h1>
          <div className="pg-sub" style={{ maxWidth: 580, margin: '8px auto 0' }}>Escolha o modelo mais parecido com o que você sonha. Depois monte os ambientes e os acabamentos, vendo cada material.</div>
        </div>

        {/* filtros + galeria */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, margin: '18px 0 6px' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={pill(tipo === 'terrea')} onClick={() => { setTipo('terrea'); setSel(null); setTelhado('todos') }}>Casa térrea</button>
            <button style={pill(tipo === 'sobrado')} onClick={() => { setTipo('sobrado'); setSel(null); setTelhado('todos') }}>2 pavimentos</button>
          </div>
          <div style={{ display: 'flex', gap: 7, marginTop: 2 }}>
            {[['todos', 'Todos'], ['aparente', 'Telhado aparente'], ['platibanda', 'Platibanda']].map(([k, l]) => (
              <button key={k} style={chip(telhado === k)} onClick={() => setTelhado(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16, marginTop: 14 }}>
          {lista.map((m) => {
            const on = sel?.id === m.id
            return (
              <button key={m.id} onClick={() => setSel(m)} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', border: on ? '2px solid var(--accent)' : '1px solid var(--line)' }}>
                <div style={{ aspectRatio: '16/10', background: '#eef2f5', position: 'relative' }}>
                  <img src={m.img} alt={m.nome} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {on && <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--accent)', color: '#fff', borderRadius: 999, width: 26, height: 26, display: 'grid', placeItems: 'center', fontWeight: 800 }}>✓</div>}
                </div>
                <div style={{ padding: '11px 13px' }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{m.nome}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{TELHADO_LABEL[m.telhado]} · {m.padrao === 'alto' ? 'alto' : 'médio'} padrão</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* AMBIENTES */}
        <div className="card" style={{ padding: 20, marginTop: 24 }}>
          <div className="sec-title" style={{ marginTop: 0 }}>Monte os ambientes da sua casa</div>
          <div className="pg-sub" style={{ fontSize: 13, margin: '-2px 0 14px' }}>Adicione cada cômodo, ajuste o tamanho e escolha piso, paredes, teto e esquadrias vendo as imagens. Ao terminar, clique em Concluir.</div>

          {ambientes.length === 0 && <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Comece adicionando um ambiente abaixo (ex.: Quarto, Cozinha, Sala…).</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ambientes.map((amb, idx) => amb.done ? (
              /* ---- card compacto (ambiente concluído) ---- */
              <div key={amb.id} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, minWidth: 120 }}><span style={{ color: 'var(--ok,#55604A)' }}>✓</span> {amb.tipo} <span className="muted" style={{ fontWeight: 400 }}>· {amb.area} m²</span></div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {SUPERFICIES.map((s) => { const it = ACAB_POR_ID[amb.sel[s.key]]; return (
                    <div key={s.key} title={s.label + (it ? ': ' + it.nome : '')} style={{ width: 34, height: 34, borderRadius: 7, overflow: 'hidden', background: '#f0ece4', border: '1px solid var(--line)' }}>
                      {it?.img && <img src={it.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                  ) })}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => editar(idx)} className="muted" style={{ fontSize: 12.5, cursor: 'pointer' }}>✎ editar</button>
                  <button type="button" onClick={() => addAmbiente({ tipo: amb.tipo, area: amb.area })} title={'Adicionar outro ' + amb.tipo} style={{ border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ outro {amb.tipo.toLowerCase()}</button>
                  <button type="button" onClick={() => removeAmb(idx)} className="muted" style={{ fontSize: 17, cursor: 'pointer', color: 'var(--crit,#b23)' }}>×</button>
                </div>
              </div>
            ) : (
              /* ---- card em edição ---- */
              <div key={amb.id} style={{ border: '2px solid var(--accent)', borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{amb.tipo}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="muted" style={{ fontSize: 12.5 }}>Tamanho</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button type="button" onClick={() => setArea(idx, amb.area - 1)} style={{ border: '1px solid var(--line)', borderRadius: 7, width: 26, height: 26, cursor: 'pointer', background: 'transparent', color: 'var(--ink)', fontSize: 16 }}>−</button>
                      <b className="mono" style={{ minWidth: 42, textAlign: 'center' }}>{amb.area} m²</b>
                      <button type="button" onClick={() => setArea(idx, amb.area + 1)} style={{ border: '1px solid var(--line)', borderRadius: 7, width: 26, height: 26, cursor: 'pointer', background: 'transparent', color: 'var(--ink)', fontSize: 16 }}>+</button>
                    </span>
                    <button type="button" onClick={() => removeAmb(idx)} className="muted" style={{ fontSize: 17, cursor: 'pointer', color: 'var(--crit,#b23)' }}>×</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 12 }}>
                  {SUPERFICIES.map((s) => {
                    const chosen = ACAB_POR_ID[amb.sel[s.key]]
                    return (
                      <button key={s.key} type="button" onClick={() => setPicker({ idx, superficie: s.key })} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', border: chosen ? '2px solid var(--accent)' : '1px dashed var(--line)' }}>
                        <div style={{ aspectRatio: '4/3', background: '#f0ece4', position: 'relative', display: 'grid', placeItems: 'center' }}>
                          {chosen?.img ? <img src={chosen.img} alt={chosen.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : chosen ? <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink2)', padding: 8, textAlign: 'center' }}>{chosen.nome}</span>
                              : <span className="muted" style={{ fontSize: 22 }}>+</span>}
                        </div>
                        <div style={{ padding: '7px 9px' }}>
                          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink3)', fontWeight: 700 }}>{s.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 1, lineHeight: 1.15 }}>{chosen ? chosen.nome : 'Escolher'}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button type="button" className="btn" onClick={() => concluir(idx)} style={{ padding: '9px 20px', fontSize: 14 }}>✓ Concluir ambiente</button>
                </div>
              </div>
            ))}
          </div>

          {/* adicionar próximo ambiente */}
          <div style={{ marginTop: ambientes.length ? 18 : 0, borderTop: ambientes.length ? '1px solid var(--line)' : 'none', paddingTop: ambientes.length ? 16 : 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Adicionar {ambientes.length ? 'próximo ' : ''}ambiente</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {AMBIENTES_BASE.map((b) => (
                <button key={b.tipo} type="button" onClick={() => addAmbiente(b)} style={{ border: '1px dashed var(--line)', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'transparent', color: 'var(--ink2,#555)' }}>+ {b.tipo}</button>
              ))}
            </div>
          </div>
        </div>

        {/* COBERTURA & EXTERNOS */}
        <div className="card" style={{ padding: 20, marginTop: 16 }}>
          <div className="sec-title" style={{ marginTop: 0 }}>Cobertura da casa</div>
          <div className="pg-sub" style={{ fontSize: 13, margin: '-2px 0 12px' }}>{platibanda ? 'Modelo com platibanda: cobertura escondida em fibrocimento ou metálica.' : 'Escolha o telhado. O valor considera a área de cobertura da sua casa.'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
            {telhadoOpts.map((t) => {
              const on = cobItem?.id === t.id
              return (
                <button key={t.id} type="button" onClick={() => setCobertura(t.id)} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', border: on ? '2px solid var(--accent)' : '1px solid var(--line)' }}>
                  <div style={{ aspectRatio: '4/3', background: '#eef2f5' }}>{t.img && <img src={t.img} alt={t.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                  <div style={{ padding: '8px 10px' }}><div style={{ fontSize: 12.5, fontWeight: 700 }}>{t.nome}</div><div className="muted" style={{ fontSize: 11 }}>{t.padrao === 'alto' ? 'Alto padrão' : 'Médio padrão'}</div></div>
                </button>
              )
            })}
          </div>

          <div style={{ fontWeight: 700, fontSize: 14, margin: '18px 0 4px' }}>Paisagismo <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>· opcional</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
            <button type="button" onClick={() => setPaisagismo(null)} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', border: !paisagismo ? '2px solid var(--accent)' : '1px solid var(--line)' }}>
              <div style={{ aspectRatio: '4/3', background: '#f0ece4', display: 'grid', placeItems: 'center' }}><span className="muted" style={{ fontSize: 12 }}>Sem paisagismo</span></div>
              <div style={{ padding: '8px 10px' }}><div style={{ fontSize: 12.5, fontWeight: 700 }}>Sem paisagismo</div><div className="muted" style={{ fontSize: 11 }}>por enquanto</div></div>
            </button>
            {PAISAGISMOS.map((p) => {
              const on = paisagismo === p.id
              return (
                <button key={p.id} type="button" onClick={() => setPaisagismo(p.id)} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', border: on ? '2px solid var(--accent)' : '1px solid var(--line)' }}>
                  <div style={{ aspectRatio: '4/3', background: '#eef2f5' }}>{p.img && <img src={p.img} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                  <div style={{ padding: '8px 10px' }}><div style={{ fontSize: 12.5, fontWeight: 700 }}>{p.nome}</div><div className="muted" style={{ fontSize: 11 }}>opcional</div></div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ESTIMATIVA */}
        <div className="card" style={{ padding: 20, marginTop: 16, background: 'var(--ink)', color: 'var(--bg,#fff)', border: 'none' }}>
          <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', opacity: .7, fontWeight: 700 }}>Estimativa de investimento</div>
          <div style={{ fontSize: 'clamp(24px,5vw,34px)', fontWeight: 800, letterSpacing: '-.5px', marginTop: 6 }}>De {brl(est.min)} <span style={{ opacity: .55, fontWeight: 500 }}>a</span> {brl(est.max)}</div>
          <div style={{ fontSize: 12.5, opacity: .78, marginTop: 8, maxWidth: 620 }}>
            {est.areaTotal} m² em {ambientes.length} ambientes, chave na mão. Inclui estrutura, mão de obra e os acabamentos que você escolheu. O valor final é fechado na reunião de diagnóstico.
          </div>
        </div>

        {/* FORM */}
        <div className="card" style={{ padding: 20, marginTop: 16 }}>
          <div className="sec-title" style={{ marginTop: 0 }}>{sel ? <>Gostou do <b style={{ color: 'var(--accent)' }}>{sel.nome}</b>? Deixe seu contato</> : 'Deixe seu contato e a gente começa'}</div>
          <div className="pg-sub" style={{ fontSize: 13, margin: '-2px 0 14px' }}>Sem compromisso e sem custo. O primeiro passo é uma reunião de diagnóstico.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            <div className="field"><label>Seu nome</label><input style={inp} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="field"><label>WhatsApp ou e-mail</label><input style={inp} value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} /></div>
            <div className="field"><label>Cidade da obra</label><input style={inp} value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
            <div className="field"><label>Quero contar um pouco (opcional)</label><input style={inp} value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} placeholder="Ex.: terreno em declive..." /></div>
          </div>
          {erro && <div style={{ color: 'var(--crit,#b23)', fontSize: 13, marginTop: 10 }}>{erro}</div>}
          <button className="btn" style={{ marginTop: 16, padding: '13px 24px', fontSize: 15, opacity: salvando ? .6 : 1 }} disabled={salvando} onClick={enviar}>{salvando ? 'Enviando...' : 'Quero iniciar o planejamento →'}</button>
        </div>

        <div className="center-note" style={{ margin: '22px auto', fontSize: 12 }}>MS Construções Inteligentes · Construindo de família para família</div>
      </div>

      {/* MODAL: escolha visual do material */}
      {picker && (() => {
        const s = SUPERFICIES.find((x) => x.key === picker.superficie)
        const amb = ambientes[picker.idx]
        return (
          <div onClick={() => setPicker(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,.72)', zIndex: 60, display: 'grid', placeItems: 'center', padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} className="card" style={{ padding: 18, width: 'min(860px,100%)', maxHeight: '88vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div className="sec-title" style={{ margin: 0 }}>{s.label} · {amb.tipo}</div>
                <button className="muted" onClick={() => setPicker(null)} style={{ fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>Clique na imagem do acabamento que você quer neste ambiente.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                {s.itens.map((it) => {
                  const on = amb.sel[picker.superficie] === it.id
                  const un = picker.superficie === 'esquadria' ? esquadUnidades(amb.area) + ' un' : Math.round((picker.superficie === 'parede' ? 2.7 : 1) * amb.area) + ' m²'
                  return (
                    <button key={it.id} onClick={() => escolher(it.id)} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', border: on ? '2px solid var(--accent)' : '1px solid var(--line)' }}>
                      <div style={{ aspectRatio: '4/3', background: '#f0ece4', display: 'grid', placeItems: 'center' }}>
                        {it.img ? <img src={it.img} alt={it.nome} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontWeight: 700, color: 'var(--ink2)', textAlign: 'center', padding: 10, fontSize: 13 }}>{it.nome}</span>}
                      </div>
                      <div style={{ padding: '9px 11px' }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{it.nome}</div>
                        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{it.padrao === 'alto' ? 'Alto padrão' : 'Médio padrão'}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
