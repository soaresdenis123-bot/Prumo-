import { useMemo, useState } from 'react'
import { salvarLeadProjeto } from '../lib/data'
import PlumbMark from '../components/PlumbMark'

/* =========================================================================
 *  MONTE SUA CASA — página pública de captação (sem login, sem custos)
 *  O cliente filtra, escolhe um modelo e deixa o contato. Salva em
 *  leads_projeto (RPC pública). A equipe vê depois no Prumo.
 *
 *  >> Fotos: cada modelo aponta para /modelos/mXX.jpg (pasta public/modelos).
 *     Para trocar/adicionar, é só substituir o arquivo ou editar MODELOS.
 * ======================================================================= */
const M = (id, tipo, telhado, estilo, nome) => ({
  id, tipo, telhado, estilo, nome,
  padrao: tipo === 'sobrado' ? 'alto' : 'medio',
  img: `/modelos/${id}.jpg`,
})
const MODELOS = [
  M('m01', 'terrea', 'aparente', 'Farm House', 'Farm House 01'),
  M('m02', 'terrea', 'aparente', 'Farm House', 'Farm House 02'),
  M('m03', 'terrea', 'aparente', 'Farm House', 'Farm House 03'),
  M('m04', 'terrea', 'aparente', 'Farm House', 'Farm House 04'),
  M('m05', 'terrea', 'platibanda', 'Moderna', 'Moderna 01'),
  M('m06', 'terrea', 'platibanda', 'Moderna', 'Moderna 02'),
  M('m07', 'terrea', 'platibanda', 'Moderna', 'Moderna 03'),
  M('m08', 'terrea', 'platibanda', 'Moderna', 'Moderna 04'),
  M('m09', 'sobrado', 'aparente', 'Sobrado', 'Sobrado 01'),
  M('m10', 'sobrado', 'aparente', 'Sobrado', 'Sobrado 02'),
  M('m11', 'sobrado', 'platibanda', 'Sobrado', 'Sobrado 03'),
  M('m12', 'sobrado', 'platibanda', 'Sobrado', 'Sobrado 04'),
  M('m13', 'sobrado', 'aparente', 'Alto Padrão', 'Alto Padrão 01'),
  M('m14', 'sobrado', 'aparente', 'Alto Padrão', 'Alto Padrão 02'),
  M('m15', 'sobrado', 'platibanda', 'Alto Padrão', 'Alto Padrão 03'),
  M('m16', 'sobrado', 'platibanda', 'Alto Padrão', 'Alto Padrão 04'),
]
const TELHADO_LABEL = { aparente: 'Telhado aparente', platibanda: 'Platibanda' }
const COMODOS = ['Quartos', 'Suítes', 'Banheiros', 'Lavabo', 'Cozinha', 'Sala de estar', 'Sala de jantar', 'Garagem (vagas)', 'Área de serviço', 'Escritório', 'Varanda']
const EXTRAS = ['Piscina', 'Área gourmet / churrasqueira', 'Lareira']
const inp = { width: '100%', padding: '11px 13px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface,#fff)', color: 'var(--ink)', fontSize: 14 }

export default function MonteSuaCasa() {
  const [tipo, setTipo] = useState('terrea')
  const [telhado, setTelhado] = useState('todos')
  const [sel, setSel] = useState(null)
  const [area, setArea] = useState('')
  const [comodos, setComodos] = useState({})
  const [extras, setExtras] = useState({})
  const [form, setForm] = useState({ nome: '', contato: '', cidade: '', obs: '' })
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const lista = useMemo(
    () => MODELOS.filter((m) => m.tipo === tipo && (telhado === 'todos' || m.telhado === telhado)),
    [tipo, telhado]
  )
  const padraoTipo = tipo === 'sobrado' ? 'alto padrão' : 'médio padrão'
  const setComodo = (c, v) => setComodos({ ...comodos, [c]: Math.max(0, v) })

  // monta o texto do programa da casa (cômodos + extras) pra salvar no lead
  function programaTexto() {
    const partes = []
    if (area) partes.push(`~${area} m²`)
    COMODOS.forEach((c) => { const n = Number(comodos[c]) || 0; if (n > 0) partes.push(`${n} ${c.toLowerCase()}`) })
    const ex = EXTRAS.filter((e) => extras[e])
    if (ex.length) partes.push('extras: ' + ex.join(', ').toLowerCase())
    return partes.join(' · ')
  }

  async function enviar() {
    if (!form.nome || !form.contato) { setErro('Preencha seu nome e um contato (WhatsApp ou e-mail).'); return }
    setSalvando(true); setErro('')
    const prog = programaTexto()
    const obsFinal = [prog && 'Programa: ' + prog, form.obs && 'Obs: ' + form.obs].filter(Boolean).join(' · ')
    try {
      await salvarLeadProjeto({ ...form, obs: obsFinal, tipo, padrao: sel?.padrao || padraoTipo, telhado: sel?.telhado || '', modelo: sel ? sel.nome : '' })
      setEnviado(true)
    } catch (e) { setErro('Não deu pra enviar agora. Tente de novo ou fale com a gente no WhatsApp.') }
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
        <p className="pg-sub" style={{ maxWidth: 470, margin: '10px auto 0' }}>
          A equipe da MS vai te chamar para a reunião de diagnóstico e começar a dar forma à sua casa. Fique de olho no seu contato.
        </p>
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
          <div className="pg-sub" style={{ maxWidth: 580, margin: '8px auto 0' }}>
            Escolha o modelo que mais parece com o que você sonha. É só um ponto de partida, a gente desenha a sua do zero, do seu jeito.
          </div>
        </div>

        {/* filtros */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, margin: '18px 0 6px' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={pill(tipo === 'terrea')} onClick={() => { setTipo('terrea'); setSel(null); setTelhado('todos') }}>Casa térrea</button>
            <button style={pill(tipo === 'sobrado')} onClick={() => { setTipo('sobrado'); setSel(null); setTelhado('todos') }}>2 pavimentos</button>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>{tipo === 'terrea' ? 'Casa térrea · médio padrão' : '2 pavimentos · alto padrão'}</div>
          <div style={{ display: 'flex', gap: 7, marginTop: 2 }}>
            {[['todos', 'Todos'], ['aparente', 'Telhado aparente'], ['platibanda', 'Platibanda']].map(([k, l]) => (
              <button key={k} style={chip(telhado === k)} onClick={() => setTelhado(k)}>{l}</button>
            ))}
          </div>
        </div>

        {/* galeria */}
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

        {/* programa da casa — o que o cliente quer ter */}
        <div className="card" style={{ padding: 20, marginTop: 24 }}>
          <div className="sec-title" style={{ marginTop: 0 }}>O que a sua casa vai ter?</div>
          <div className="pg-sub" style={{ fontSize: 13, margin: '-2px 0 14px' }}>Monte o programa da sua casa. Some os cômodos que você quer, é o ponto de partida pro projeto.</div>
          <div className="field" style={{ maxWidth: 220, marginBottom: 14 }}>
            <label>Área desejada (m²) · opcional</label>
            <input style={inp} type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ex.: 180" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 10 }}>
            {COMODOS.map((c) => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button type="button" onClick={() => setComodo(c, (Number(comodos[c]) || 0) - 1)} style={{ border: '1px solid var(--line)', borderRadius: 7, width: 26, height: 26, cursor: 'pointer', background: 'transparent', color: 'var(--ink)', fontSize: 16 }}>−</button>
                  <b style={{ minWidth: 14, textAlign: 'center', fontFamily: 'monospace' }}>{Number(comodos[c]) || 0}</b>
                  <button type="button" onClick={() => setComodo(c, (Number(comodos[c]) || 0) + 1)} style={{ border: '1px solid var(--line)', borderRadius: 7, width: 26, height: 26, cursor: 'pointer', background: 'transparent', color: 'var(--ink)', fontSize: 16 }}>+</button>
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 14 }}>
            {EXTRAS.map((e) => {
              const on = !!extras[e]
              return (
                <button key={e} type="button" onClick={() => setExtras({ ...extras, [e]: !on })} style={{ border: '1px solid var(--line)', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: on ? 'var(--accent)' : 'transparent', color: on ? '#fff' : 'var(--ink2,#555)' }}>
                  {on ? '✓ ' : '+ '}{e}
                </button>
              )
            })}
          </div>
        </div>

        {/* formulário */}
        <div className="card" style={{ padding: 20, marginTop: 16 }}>
          <div className="sec-title" style={{ marginTop: 0 }}>
            {sel ? <>Gostou do <b style={{ color: 'var(--accent)' }}>{sel.nome}</b>? Deixe seu contato</> : 'Deixe seu contato e a gente começa'}
          </div>
          <div className="pg-sub" style={{ fontSize: 13, margin: '-2px 0 14px' }}>Sem compromisso e sem custo. O primeiro passo é uma reunião de diagnóstico pra entender o que você quer.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            <div className="field"><label>Seu nome</label><input style={inp} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="field"><label>WhatsApp ou e-mail</label><input style={inp} value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} /></div>
            <div className="field"><label>Cidade da obra</label><input style={inp} value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
            <div className="field"><label>Quero contar um pouco (opcional)</label><input style={inp} value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} placeholder="Ex.: 3 quartos, terreno em declive..." /></div>
          </div>
          {erro && <div style={{ color: 'var(--crit,#b23)', fontSize: 13, marginTop: 10 }}>{erro}</div>}
          <button className="btn" style={{ marginTop: 16, padding: '13px 24px', fontSize: 15, opacity: salvando ? .6 : 1 }} disabled={salvando} onClick={enviar}>
            {salvando ? 'Enviando...' : 'Quero iniciar o planejamento →'}
          </button>
        </div>

        <div className="center-note" style={{ margin: '22px auto', fontSize: 12 }}>
          MS Construções Inteligentes · Construindo de família para família
        </div>
      </div>
    </>
  )
}
