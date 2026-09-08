// =========================================================================
//  Edge Function: gerar-projeto-visual
//  Recebe a seleção já traduzida em prompts (do roomPrompt.js no front) e
//  gera 1 foto por ambiente com a OpenAI (gpt-image-1). Salva no bucket
//  público 'catalogo' em projeto/<leadId>/ e faz cache por hash do prompt.
//
//  Secret necessário (já configurado no Supabase → Edge Functions → Secrets):
//    OPENAI_API_KEY
//  Injetados automaticamente pelo Supabase:
//    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
//  Request  (POST, JSON):
//    { leadId?: string, model?: string, size?: string, quality?: string,
//      items: [{ key: string, prompt: string }] }
//  Response (JSON):
//    { images: [{ key, url, cached }], erros?: [{ key, erro }] }
// =========================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BUCKET = 'catalogo'
const OPENAI_URL = 'https://api.openai.com/v1/images/generations'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function hash8(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).slice(0, 4).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada nos secrets.')

    const body = await req.json()
    const items = Array.isArray(body.items) ? body.items : []
    const leadId = (body.leadId || 'teste').toString().replace(/[^\w-]/g, '')
    const model = body.model || 'gpt-image-1'
    const size = body.size || '1536x1024'
    const quality = body.quality || 'medium'
    if (!items.length) throw new Error('Nenhum item (ambiente) enviado.')

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // arquivos já existentes na pasta do lead (para cache)
    const { data: existentes } = await supabase.storage.from(BUCKET).list(`projeto/${leadId}`)
    const jaTem = new Set((existentes || []).map((f: any) => f.name))

    const images: any[] = []
    const erros: any[] = []

    for (const it of items) {
      const key = String(it.key || '').replace(/[^\w-]/g, '') || 'ambiente'
      const prompt = String(it.prompt || '')
      if (!prompt) { erros.push({ key, erro: 'prompt vazio' }); continue }
      try {
        const h = await hash8(prompt)
        const fname = `${key}-${h}.png`
        const path = `projeto/${leadId}/${fname}`
        const pub = () => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

        if (jaTem.has(fname)) { images.push({ key, url: pub(), cached: true }); continue }

        // gera na OpenAI
        const r = await fetch(OPENAI_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt, size, quality, n: 1 }),
        })
        const j = await r.json()
        if (!r.ok) { erros.push({ key, erro: j?.error?.message || `OpenAI ${r.status}` }); continue }
        const b64 = j?.data?.[0]?.b64_json
        if (!b64) { erros.push({ key, erro: 'sem imagem na resposta' }); continue }

        const bytes = b64ToBytes(b64)
        const { error: upErr } = await supabase.storage.from(BUCKET)
          .upload(path, bytes, { contentType: 'image/png', upsert: true })
        if (upErr) { erros.push({ key, erro: upErr.message }); continue }

        images.push({ key, url: pub(), cached: false })
      } catch (e) {
        erros.push({ key, erro: String(e?.message || e) })
      }
    }

    return new Response(JSON.stringify({ images, erros: erros.length ? erros : undefined }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
