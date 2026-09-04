// =========================================================================
//  TEMPLATE da apresentação cinematográfica por cliente.
//  montarApresHTML(cfg) devolve um HTML standalone (renderizado num iframe
//  isolado). As imagens fixas ficam em /apres, os modelos em /modelos e as
//  amostras de acabamento em /acab — tudo servido pela própria app.
//  As partes fixas (marca, câmera, portal Prumo, cronograma) são iguais para
//  todos; só mudam nome, modelo/render, specs, preço e acabamentos escolhidos.
// =========================================================================

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// amostras de acabamento para a esteira de "cores e materiais"
const MAT_TILES = [
  'piso-porcelanato-marmorizado', 'par-marmore-natural', 'piso-madeira-engenheirada',
  'par-microcimento', 'par-pedra-natural', 'par-painel-ripado', 'par-quartzito',
  'par-travertino', 'teto-gesso-sanca', 'esq-aluminio-premium', 'piso-porcelanato-acetinado',
  'telha-shingle',
]
const MODELOS_IDS = Array.from({ length: 16 }, (_, i) => 'm' + String(i + 1).padStart(2, '0'))

export function montarApresHTML(cfg = {}) {
  const {
    familia = 'Proposta exclusiva',
    primeiroNome = '', modeloNome = 'a sua casa', renderSrc = '', provisorio = true,
    specTipo = '', specPadrao = '', specPrograma = '', specExtras = '', specArea = '',
    precoLabel = '', pickPiso = '', pickCobertura = '', pickEsquadria = '', cidade = 'Montenegro/RS',
  } = cfg

  const nomeHero = primeiroNome ? esc(primeiroNome) + ',' : 'A sua casa,'
  const galRow = (ids) => ids.map((id) => `<figure><img src="/modelos/${id}.jpg" alt="Modelo MS" loading="lazy"></figure>`).join('')
  const matRow = (ids) => ids.map((id) => `<figure><img src="/acab/${id}.jpg" alt="Amostra de acabamento" loading="lazy"></figure>`).join('')
  const row1 = MODELOS_IDS.slice(0, 8), row2 = MODELOS_IDS.slice(8)
  const mat1 = MAT_TILES.slice(0, 6), mat2 = MAT_TILES.slice(6)
  const dup = (fn, arr) => fn(arr) + fn(arr) // duplica pra marquee contínuo

  const specRows = [
    specTipo && `<div class="r"><span class="k">Tipo</span><span class="v">${esc(specTipo)}</span></div>`,
    specPadrao && `<div class="r"><span class="k">Padrão</span><span class="v">${esc(specPadrao)}</span></div>`,
    specPrograma && `<div class="r"><span class="k">Programa</span><span class="v">${esc(specPrograma)}</span></div>`,
    specExtras && `<div class="r"><span class="k">Extras</span><span class="v">${esc(specExtras)}</span></div>`,
    specArea && `<div class="r"><span class="k">Área estimada</span><span class="v">${esc(specArea)}</span></div>`,
  ].filter(Boolean).join('')

  const picks = [
    pickPiso && `<div class="p"><b>Piso</b><span>${esc(pickPiso)}</span></div>`,
    pickCobertura && `<div class="p"><b>Cobertura</b><span>${esc(pickCobertura)}</span></div>`,
    pickEsquadria && `<div class="p"><b>Esquadrias</b><span>${esc(pickEsquadria)}</span></div>`,
  ].filter(Boolean).join('')

  // bloco da imagem: selo + faixa só quando é projeção provisória (modelo referência)
  const badge = provisorio ? '<span class="bdg">Modelo de referência</span>' : ''
  const overlay = provisorio
    ? '<div class="ov"><b>Imagem provisória.</b> Ilustra o estilo e o padrão da sua casa; o projeto final, no seu terreno, pode ter fachada e proporções diferentes.</div>'
    : ''
  const srcNote = provisorio
    ? '<p class="src rv">Projeção provisória com base no modelo escolhido. O projeto arquitetônico personalizado, próximo passo, desenha a sua casa do zero, no seu terreno.</p>'
    : '<p class="src rv">Projeto da sua casa, desenhado no seu terreno.</p>'

  const precoBlock = precoLabel ? `<div class="price">
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-weight:700">Estimativa de investimento</div>
      <div class="n" style="margin-top:8px">${esc(precoLabel)}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:8px">Chave na mão. O valor final depende dos acabamentos e revestimentos que você escolher.</div>
    </div>` : ''

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${esc(primeiroNome || 'Cliente')} · A sua casa em movimento · MS</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,500;1,9..144,600&family=Inter:wght@400;500;600;700;800&display=swap">
<style>
:root{
  --bg:#0E0B08; --bg2:#17100A; --panel:#1C140C; --ink:#F3ECDF; --muted:#AE9F87;
  --amber:#E3A857; --amber2:#F4D08C; --argila:#C56A44;
  --line:rgba(243,236,223,.13); --card:rgba(255,255,255,.045);
  --shadow:0 30px 80px rgba(0,0,0,.55);
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font-family:'Inter',system-ui,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.serif{font-family:'Fraunces','Georgia',serif}
h1,h2,h3{font-family:'Fraunces','Georgia',serif;font-weight:600;line-height:1.0;letter-spacing:-.02em;text-wrap:balance}
h1{font-size:clamp(44px,9vw,120px);font-weight:600}
h2{font-size:clamp(30px,5.4vw,64px)}
.eyebrow{font-weight:700;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--amber)}
.lead{font-size:clamp(16px,1.7vw,20px);color:var(--muted);max-width:56ch}
.amber{color:var(--amber)}
section{position:relative;padding:120px 26px;overflow:hidden}
.wrap{max-width:1120px;margin:0 auto;position:relative;z-index:2}
.grain{position:fixed;inset:0;z-index:100;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.prog{position:fixed;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--amber),var(--amber2));width:0;z-index:120;transition:width .12s linear;box-shadow:0 0 14px var(--amber)}
.brand{position:fixed;left:20px;top:16px;z-index:110;display:flex;align-items:center;gap:10px;font-weight:700;font-size:12.5px;letter-spacing:.02em;color:var(--ink);mix-blend-mode:difference}
.brand img{width:30px;height:30px;border-radius:50%;display:block}
.cue{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:110;font-size:10.5px;letter-spacing:.3em;text-transform:uppercase;color:var(--muted);display:flex;gap:9px;align-items:center}
.cue .c{animation:bob 1.7s infinite}@keyframes bob{50%{transform:translateY(5px)}}
.rv{opacity:0;transform:translateY(42px) scale(.985);filter:blur(7px);transition:opacity 1s cubic-bezier(.16,1,.3,1),transform 1s cubic-bezier(.16,1,.3,1),filter 1s}
.rv.in{opacity:1;transform:none;filter:none}
.d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}.d4{transition-delay:.4s}.d5{transition-delay:.5s}
@media(prefers-reduced-motion:reduce){.rv{opacity:1!important;transform:none!important;filter:none!important}*{animation:none!important}}
.kin{display:block}
.kin .ln{display:block;overflow:hidden;padding-bottom:.06em}
.kin .ln i{display:block;transform:translateY(115%);transition:transform 1.05s cubic-bezier(.16,1,.3,1)}
.kin.in .ln:nth-child(1) i{transition-delay:.15s}.kin.in .ln:nth-child(2) i{transition-delay:.3s}.kin.in .ln:nth-child(3) i{transition-delay:.45s}
.kin.in .ln i{transform:none}
.hero{min-height:100svh;display:flex;align-items:flex-end;padding-bottom:96px}
.hero .bg{position:absolute;inset:-8% 0;z-index:0;background-size:cover;background-position:center;
  animation:kb 22s ease-in-out infinite alternate;will-change:transform}
@keyframes kb{0%{transform:scale(1.05)}100%{transform:scale(1.18) translateY(-2%)}}
.hero .veil{position:absolute;inset:0;z-index:1;background:
  radial-gradient(120% 90% at 20% 100%,rgba(14,11,8,.92),rgba(14,11,8,.35) 55%,rgba(14,11,8,.15)),
  linear-gradient(180deg,rgba(14,11,8,.55),rgba(14,11,8,.1) 30%,rgba(14,11,8,.9))}
.hero .sweep{position:absolute;inset:0;z-index:1;background:linear-gradient(115deg,transparent 40%,rgba(227,168,87,.14) 50%,transparent 60%);
  transform:translateX(-30%);animation:sweep 7s ease-in-out 1.2s infinite}
@keyframes sweep{0%{transform:translateX(-60%)}55%,100%{transform:translateX(60%)}}
.hero h1{color:#fff}
.tagfam{display:inline-flex;align-items:center;gap:10px;font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:var(--amber);font-weight:700}
.tagfam::before{content:"";width:34px;height:1px;background:var(--amber)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:20px;margin-top:38px}
.stat .n{font-family:'Fraunces',serif;font-weight:600;font-size:clamp(38px,5.5vw,62px);color:var(--amber);line-height:.9;font-variant-numeric:tabular-nums}
.stat .l{font-size:13px;color:var(--muted);margin-top:12px;max-width:22ch}
.gal{background:var(--bg2)}
.mrow{display:flex;gap:16px;width:max-content;animation:scrollx 46s linear infinite}
.mrow.rev{animation-duration:54s;animation-direction:reverse;margin-top:16px}
.gal:hover .mrow{animation-play-state:paused}
@keyframes scrollx{to{transform:translateX(-50%)}}
.mrow figure{position:relative;flex:0 0 auto;border-radius:14px;overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow)}
.mrow img{height:220px;width:auto;display:block;object-fit:cover;filter:saturate(1.05) contrast(1.03)}
.mrow figure::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 60%,rgba(14,11,8,.5))}
@media(max-width:640px){.mrow img{height:150px}}
.casa{background:linear-gradient(180deg,var(--bg),var(--bg2))}
.two{display:grid;grid-template-columns:1.15fr .85fr;gap:46px;align-items:center}
@media(max-width:860px){.two{grid-template-columns:1fr;gap:28px}}
.frame{position:relative;border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow);aspect-ratio:16/11}
.frame img{width:100%;height:100%;object-fit:cover;transform:scale(1.02);animation:kb2 20s ease-in-out infinite alternate}
@keyframes kb2{100%{transform:scale(1.12)}}
.frame .bdg{position:absolute;left:14px;top:14px;z-index:2;background:rgba(14,11,8,.72);color:var(--amber2);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:7px 13px;border-radius:999px;border:1px solid rgba(227,168,87,.5);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.frame .ov{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:16px 16px 14px;background:linear-gradient(to top,rgba(10,7,4,.92),rgba(10,7,4,0));font-size:12px;color:#E8Dcc6;line-height:1.35}
.frame .ov b{color:var(--amber2)}
.spec .r{display:flex;justify-content:space-between;gap:14px;padding:13px 0;border-bottom:1px solid var(--line);font-size:14.5px}
.spec .r:last-child{border-bottom:none}.spec .k{color:var(--muted)}.spec .v{font-weight:600;text-align:right}
.price{margin-top:20px;border:1px solid rgba(227,168,87,.3);border-radius:16px;padding:20px;background:radial-gradient(120% 140% at 100% 0,rgba(227,168,87,.14),transparent 60%)}
.price .n{font-family:'Fraunces',serif;font-weight:600;font-size:clamp(26px,3.4vw,38px);color:var(--amber2);line-height:1}
.tl{position:relative;margin-top:40px;padding-left:8px}
.tl .line{position:absolute;left:20px;top:8px;bottom:8px;width:2px;background:var(--line)}
.tl .line i{position:absolute;inset:0 0 auto 0;height:0;width:100%;background:linear-gradient(var(--amber),var(--amber2));transition:height 1.6s ease;box-shadow:0 0 12px rgba(227,168,87,.5)}
.tl.in .line i{height:100%}
.step{position:relative;padding:0 0 30px 62px;min-height:46px}
.step .dot{position:absolute;left:10px;top:0;width:22px;height:22px;border-radius:50%;background:var(--bg);border:2px solid var(--amber);display:grid;place-items:center;font-size:11px;font-weight:800;color:var(--amber);box-shadow:0 0 0 6px rgba(227,168,87,.08)}
.step .t{font-weight:700;font-size:17px;font-family:'Fraunces',serif}
.step .d{font-size:13.5px;color:var(--muted);margin-top:3px}
.step .dur{float:right;font-family:'Fraunces',serif;font-weight:600;color:var(--amber);font-size:15px;margin-left:12px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px;backdrop-filter:blur(4px);transition:transform .4s,border-color .4s}
.card:hover{transform:translateY(-5px);border-color:rgba(227,168,87,.4)}
.card .h{font-weight:700;font-size:15.5px}
.card p{color:var(--muted);font-size:13.5px;margin-top:8px}
.incl{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--line);border-radius:18px;overflow:hidden}
@media(max-width:640px){.incl{grid-template-columns:1fr}}
.incl .col{padding:10px 0}
.incl .hd{padding:18px 22px;font-weight:700;font-size:14px;letter-spacing:.04em;border-bottom:1px solid var(--line)}
.incl .a .hd{background:rgba(227,168,87,.12);color:var(--amber2)}
.incl .a{background:rgba(227,168,87,.04)}
.incl .row{display:flex;gap:11px;padding:13px 22px;font-size:14px;border-bottom:1px solid var(--line)}
.incl .row:last-child{border:none}.incl .b{color:var(--muted)}
.camreal{position:relative;border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow)}
.camreal img{width:100%;display:block;object-fit:cover;max-height:520px}
.live{display:flex;align-items:center;gap:7px;background:rgba(14,11,8,.6);color:#fff;font-size:11px;font-weight:800;letter-spacing:.1em;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.14)}
.live .d{width:8px;height:8px;border-radius:50%;background:#ff5238;box-shadow:0 0 10px #ff5238;animation:blink 1.3s infinite}@keyframes blink{50%{opacity:.3}}
.browserframe{border-radius:14px;overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow);background:#0f0f12}
.browserframe .bar{display:flex;align-items:center;gap:6px;padding:9px 12px;background:rgba(255,255,255,.06);border-bottom:1px solid var(--line)}
.browserframe .bar i{width:9px;height:9px;border-radius:50%;background:#e05a4d;display:inline-block}
.browserframe .bar i:nth-child(2){background:#e8b53a}.browserframe .bar i:nth-child(3){background:#4caf6a}
.browserframe .bar span{margin-left:8px;font-size:11px;color:var(--muted)}
.browserframe img{width:100%;display:block}
.mmrow{display:flex;gap:14px;width:max-content;animation:scrollx 50s linear infinite}
.mmrow.rev{animation-duration:58s;animation-direction:reverse;margin-top:14px}
.gal:hover .mmrow{animation-play-state:paused}
.mmrow figure{flex:0 0 auto;border-radius:12px;overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow);background:#15110b}
.mmrow img{height:158px;width:auto;display:block}
@media(max-width:640px){.mmrow img{height:120px}}
.picks{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.picks .p{display:flex;align-items:center;gap:8px;border:1px solid rgba(227,168,87,.3);background:rgba(227,168,87,.06);border-radius:999px;padding:8px 14px;font-size:12.5px}
.picks .p b{color:var(--amber2)}.picks .p span{color:var(--muted)}
.cta{min-height:100svh;display:flex;align-items:center;text-align:center;background:radial-gradient(120% 100% at 50% 0,rgba(227,168,87,.16),transparent 55%),var(--bg)}
.cta .wrap{max-width:900px}
.glow{position:absolute;left:50%;top:38%;width:70vw;height:70vw;transform:translate(-50%,-50%);z-index:0;background:radial-gradient(circle,rgba(227,168,87,.16),transparent 60%);filter:blur(30px);animation:pulse 6s ease-in-out infinite}
@keyframes pulse{50%{opacity:.55;transform:translate(-50%,-50%) scale(1.1)}}
.big-quote{font-family:'Fraunces',serif;font-weight:600;font-size:clamp(30px,6vw,72px);line-height:1.02;color:#fff;text-wrap:balance}
.src{font-size:11px;color:var(--muted);margin-top:14px;opacity:.85}
.foot{margin-top:30px;font-size:12px;letter-spacing:.05em;color:var(--muted)}
</style>

<div class="grain"></div>
<div class="prog" id="prog"></div>
<div class="brand"><img src="/apres/logo.png" alt="MS"><span>MS&nbsp;CONSTRUÇÕES&nbsp;INTELIGENTES</span></div>
<div class="cue"><span>Role</span><span class="c">↓</span></div>

<section class="hero" id="s1">
  <div class="bg" data-par="0.25" style="background-image:url('/apres/cover.jpg')"></div>
  <div class="veil"></div><div class="sweep"></div>
  <div class="wrap">
    <div class="tagfam rv">${esc(familia)}</div>
    <h1 class="kin" style="margin-top:22px">
      <span class="ln"><i>${nomeHero}</i></span>
      <span class="ln"><i>a sua casa</i></span>
      <span class="ln"><i style="color:var(--amber2)">em movimento.</i></span>
    </h1>
    <p class="lead rv d3" style="margin-top:26px;color:#E7DECB">Você escolheu construir. A partir daqui, cada linha, cada material e cada data são seus. Role e veja a sua casa deixar de ser sonho e virar projeto.</p>
  </div>
</section>

<section id="s2">
  <div class="wrap">
    <div class="eyebrow rv">Quem assina a sua obra</div>
    <h2 class="rv d1" style="margin-top:16px;max-width:16ch">O sonho é seu.<br><span class="amber">A engenharia é nossa.</span></h2>
    <p class="lead rv d2" style="margin-top:20px">A MS é uma construtora familiar que, após anos na construção no sistema convencional, optou por usar no seu portfólio o sistema construtivo mais moderno e tecnológico que está sendo usado no mundo. O sistema Light Steel Frame traz rapidez e redução de perdas e desperdício na obra: uma construção que agrega conforto, tecnologia e sustentabilidade. À frente, uma equipe técnica capacitada e o responsável técnico, com mais de 25 anos de experiência em obras de pequeno, médio e grande porte, com atuação na construção residencial, industrial e de shopping centers. Engenharia industrializada, dentro da NBR 16970, com ART, prazo definido e custos que se adaptam à sua necessidade. Assessoria para facilitar a sua vida e agilizar a liberação do seu financiamento.</p>
    <div class="stats">
      <div class="stat rv d1"><div class="n" data-to="60" data-suf="%">0</div><div class="l">mais rápida que a obra convencional</div></div>
      <div class="stat rv d2"><div class="n" data-to="25" data-suf="+">0</div><div class="l">anos do engenheiro responsável na obra</div></div>
      <div class="stat rv d3"><div class="n" data-to="80" data-suf="%">0</div><div class="l">menos desperdício, com precisão de fábrica</div></div>
      <div class="stat rv d4"><div class="n" data-to="24" data-suf="h">0</div><div class="l">acompanhamento por câmera na obra</div></div>
    </div>
  </div>
</section>

<section class="gal" id="s3">
  <div class="wrap" style="max-width:1120px">
    <div class="eyebrow rv">O padrão MS</div>
    <h2 class="rv d1" style="margin-top:14px;max-width:20ch">Casas construídas no padrão do <span class="amber">seu sonho</span>.</h2>
  </div>
  <div style="margin-top:40px">
    <div class="mrow">${dup(galRow, row1)}</div>
    <div class="mrow rev">${dup(galRow, row2)}</div>
  </div>
  <div class="wrap" style="margin-top:26px"><p class="lead rv">Do básico ao alto padrão. Da casa de campo à arquitetura moderna. Engenharia com tecnologia, para realizar o seu sonho.</p></div>
</section>

<section class="casa" id="s4">
  <div class="wrap">
    <div class="eyebrow rv">A casa que você escolheu no pré-projeto</div>
    <h2 class="rv d1" style="margin-top:14px">A sua <span class="amber">${esc(modeloNome)}</span>.</h2>
    <div class="two" style="margin-top:38px">
      <div class="frame rv d1">${badge}<img src="${esc(renderSrc)}" alt="${esc(modeloNome)}">${overlay}</div>
      <div class="rv d2">
        <div class="spec">${specRows}</div>
        ${precoBlock}
      </div>
    </div>
    ${srcNote}
  </div>
</section>

<section id="s5">
  <div class="wrap">
    <div class="eyebrow rv">Do papel à chave, com data</div>
    <h2 class="rv d1" style="margin-top:14px">O caminho da sua casa.</h2>
    <p class="lead rv d2" style="margin-top:16px">Antes de erguer a obra, cada etapa de projeto e aprovação tem prazo definido. É assim que você sabe onde a sua casa está, o tempo todo.</p>
    <div class="eyebrow rv" style="margin-top:34px;color:var(--muted)">Etapas antes de iniciar a construção</div>
    <div class="tl" id="tl">
      <div class="line"><i></i></div>
      <div class="step rv"><div class="dot">1</div><span class="dur">2 dias</span><div class="t">Entrevista e levantamento de necessidades</div><div class="d">Entendemos o seu sonho, a rotina e o terreno.</div></div>
      <div class="step rv"><div class="dot">2</div><span class="dur">7 dias</span><div class="t">Projeto básico / conceitual</div><div class="d">A ideia da casa ganha forma: plantas e volumes.</div></div>
      <div class="step rv"><div class="dot">3</div><span class="dur">5 dias</span><div class="t">Aprovação e ajuste do projeto</div><div class="d">Refinamos junto até ficar do seu jeito.</div></div>
      <div class="step rv"><div class="dot">4</div><span class="dur">14 dias</span><div class="t">Projeto arquitetônico e complementares</div><div class="d">Arquitetura detalhada com os projetos complementares.</div></div>
      <div class="step rv"><div class="dot">5</div><span class="dur">3 dias</span><div class="t">Aprovação do cliente e/ou condomínio</div><div class="d">O seu aval (e o do condomínio, quando houver).</div></div>
      <div class="step rv"><div class="dot">6</div><span class="dur">30 dias</span><div class="t">Aprovação na Prefeitura</div><div class="d">Entrada e liberação do projeto no município.</div></div>
      <div class="step rv"><div class="dot">7</div><span class="dur">14 dias</span><div class="t">Projeto de estrutura steel frame</div><div class="d">Dimensionamento da estrutura com responsável técnico.</div></div>
      <div class="step rv"><div class="dot">8</div><span class="dur">14 dias</span><div class="t">Projeto de fundação</div><div class="d">Fundação calculada para o seu terreno.</div></div>
      <div class="step rv"><div class="dot">9</div><span class="dur">30 dias</span><div class="t">Aprovação do crédito / financiamento</div><div class="d">Encaminhamento do financiamento. Steel frame é financiável (NBR 16970).</div></div>
    </div>
    <div class="price rv" style="margin-top:6px;display:inline-block">
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-weight:700">Total pré-obra</div>
      <div class="n" style="margin-top:6px">≈ 120 dias</div>
      <div style="font-size:12px;color:var(--muted);margin-top:6px">As etapas correm em paralelo sempre que possível.</div>
    </div>
    <div class="eyebrow rv" style="margin-top:40px;color:var(--muted)">E então, a construção</div>
    <div class="tl">
      <div class="line"><i style="height:100%"></i></div>
      <div class="step rv in"><div class="dot">10</div><span class="dur">3 a 5 meses</span><div class="t">Execução da obra</div><div class="d">Fundação, estrutura, fechamento e acabamentos, com você acompanhando ao vivo.</div></div>
    </div>
  </div>
</section>

<section class="casa" id="s6">
  <div class="wrap">
    <div class="eyebrow rv">O que esperar da MS</div>
    <h2 class="rv d1" style="margin-top:14px">Chave na mão. <span class="amber">Pronta pra morar.</span></h2>
    <div class="incl rv d2" style="margin-top:32px">
      <div class="col a"><div class="hd">✓ Incluso</div>
        <div class="row">Casa completa — finalizada conforme os projetos aprovados</div>
        <div class="row">Revestimentos — pisos, paredes e forros conforme você escolheu</div>
        <div class="row">Louças e metais — instalados conforme você escolheu</div>
        <div class="row">Iluminação — luminárias instaladas conforme você escolheu</div>
        <div class="row">Book de entrega — projetos aprovados, ART, garantias e manual de uso e manutenção</div>
      </div>
      <div class="col b"><div class="hd">Por sua conta</div>
        <div class="row">Mobília</div>
        <div class="row">Decoração</div>
        <div class="row" style="color:var(--muted)">Você chega com o caminhão de mudança, a casa já está pronta</div>
      </div>
    </div>
    <div class="cards" style="margin-top:20px">
      <div class="card rv d1"><div class="h">📃 Preço e prazo fechados</div><p>Você sabe quanto custa e quando fica pronta antes de começar.</p></div>
      <div class="card rv d2"><div class="h">🌡️ Conforto de série</div><p>Isolamento térmico e acústico do steel frame: casa fresca e silenciosa.</p></div>
      <div class="card rv d3"><div class="h">🏗️ Engenharia responsável</div><p>Cada etapa com responsável técnico, CREA e ART.</p></div>
    </div>
  </div>
</section>

<section id="s7">
  <div class="wrap">
    <div class="eyebrow rv">Você vê a sua casa crescer, todo dia</div>
    <h2 class="rv d1" style="margin-top:14px">Transparência total,<br>do canteiro à sua <span class="amber">tela</span>.</h2>
    <div class="two" style="margin-top:36px">
      <div class="rv d1">
        <div class="camreal">
          <span class="live" style="position:absolute;left:13px;top:13px;z-index:3"><span class="d"></span>AO VIVO</span>
          <img src="/apres/camera.jpg" alt="Câmera solar instalada na obra">
        </div>
        <p class="src" style="text-align:center">Câmera solar na obra, transmitindo ao vivo 24 horas por dia.</p>
      </div>
      <div class="rv d2">
        <div class="browserframe"><div class="bar"><i></i><i></i><i></i><span>prumo · acompanhamento da sua obra</span></div><img src="/apres/prumo1.jpg" alt="Painel Prumo do cliente"></div>
        <p class="src" style="text-align:center">Você recebe um link e vê o percentual e a sua casa tomando forma.</p>
      </div>
    </div>
    <div class="rv d3" style="margin-top:22px">
      <div class="browserframe"><div class="bar"><i></i><i></i><i></i><span>prumo · linha do tempo</span></div><img src="/apres/prumo2.jpg" alt="Linha do tempo das etapas da obra"></div>
      <p class="src" style="text-align:center">A cada etapa concluída (fundação, estrutura, cobertura...), ela acende no seu acompanhamento.</p>
    </div>
  </div>
</section>

<section class="gal" id="s8">
  <div class="wrap">
    <div class="eyebrow rv">A parte mais gostosa: escolher</div>
    <h2 class="rv d1" style="margin-top:14px">Cores e acabamentos <span class="amber">do seu jeito</span>.</h2>
    <p class="lead rv d2" style="margin-top:16px">Cada superfície é uma escolha sua, com opções de médio e alto padrão da nossa rede de parceiros.</p>
    ${picks ? `<div class="picks rv d2">${picks}</div>` : ''}
  </div>
  <div style="margin-top:28px">
    <div class="mmrow">${dup(matRow, mat1)}</div>
    <div class="mmrow rev">${dup(matRow, mat2)}</div>
  </div>
  <div class="wrap" style="margin-top:22px"><p class="lead rv">Este é só um recorte. O portfólio completo de acabamentos tem dezenas de padrões pra você escolher cada detalhe.</p></div>
</section>

<section class="cta" id="s9">
  <div class="glow"></div>
  <div class="wrap">
    <img src="/apres/logo.png" class="rv" style="width:72px;margin:0 auto 18px;display:block">
    <div class="eyebrow rv d1" style="text-align:center">A sua casa já pode ter uma data pra começar</div>
    <div class="big-quote rv d2" style="margin-top:20px">${primeiroNome ? esc(primeiroNome) + ', vamos construir' : 'Vamos construir'}<br>o sonho da <span class="amber">sua casa</span>?</div>
    <p class="lead rv d3" style="margin:24px auto 0;text-align:center">Tudo o que você viu começa com um passo: a assinatura do contrato. A partir dele, o seu sonho começa a se tornar realidade e a casa que você imaginou começa a criar forma. Iniciamos o seu projeto e em poucos dias você vê ele em 3D. E logo o seu lar estará pronto para morar com a sua família.</p>
    <div class="foot rv d4" style="margin-top:40px">Construímos de família para família · Grupo MS · ${esc(cidade || 'Montenegro/RS')}</div>
  </div>
</section>

<script>
const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');if(e.target.id==='tl')e.target.querySelectorAll('.step').forEach((s,i)=>setTimeout(()=>s.classList.add('in'),i*140));io.unobserve(e.target)}})},{threshold:.2});
document.querySelectorAll('.rv,.kin,#tl').forEach(el=>io.observe(el));
function cu(el){const to=+el.dataset.to,su=el.dataset.suf||'';let s=null;function t(n){if(!s)s=n;const p=Math.min((n-s)/1200,1),e=1-Math.pow(1-p,3);el.textContent=Math.round(to*e)+su;if(p<1)requestAnimationFrame(t)}requestAnimationFrame(t)}
const io2=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){cu(e.target);io2.unobserve(e.target)}})},{threshold:.6});
document.querySelectorAll('.n[data-to]').forEach(el=>io2.observe(el));
const pars=[...document.querySelectorAll('[data-par]')];
addEventListener('scroll',()=>{const h=document.documentElement,y=h.scrollTop;
  document.getElementById('prog').style.width=(y/(h.scrollHeight-h.clientHeight)*100)+'%';
  pars.forEach(p=>{const r=p.parentElement.getBoundingClientRect();p.style.transform='translateY('+(r.top*-0.18)+'px)'});
},{passive:true});
const sec=[...document.querySelectorAll('section')];
function cur(){const y=scrollY+innerHeight/2;let i=0;sec.forEach((s,j)=>{if(s.offsetTop<=y)i=j});return i}
addEventListener('keydown',(e)=>{if(['ArrowDown','ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();sec[Math.min(cur()+1,sec.length-1)].scrollIntoView({behavior:'smooth'})}if(['ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();sec[Math.max(cur()-1,0)].scrollIntoView({behavior:'smooth'})}});
</script>
</body></html>`
}
