// =========================================================================
//  Edge Function: admin-users
//  Gestão de usuários da equipe pelo admin da Prumo.
//  Só quem tem papel 'admin' no profiles pode usar.
//
//  Injetados automaticamente pelo Supabase (não precisa configurar nada):
//    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
//
//  Request (POST, JSON): { action, ...dados }
//    action = "criar"   -> { email, senha, nome, papel }
//    action = "senha"   -> { id, senha }           (resetar senha)
//    action = "remover" -> { id }                  (excluir usuário)
//  Response (JSON): { ok: true, ... } ou { error: "mensagem" } com status 4xx
// =========================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PAPEIS = ['admin', 'gestor', 'execucao', 'cliente']
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } })

    // 1) quem está chamando? (precisa do token do usuário logado)
    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.replace(/^Bearer\s+/i, '')
    if (!jwt) return json({ error: 'Sem autenticação.' }, 401)
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
    if (userErr || !userData?.user) return json({ error: 'Sessão inválida.' }, 401)

    // 2) o chamador é admin?
    const { data: perfil } = await admin
      .from('profiles').select('papel').eq('id', userData.user.id).single()
    if (perfil?.papel !== 'admin') return json({ error: 'Só o administrador pode gerenciar usuários.' }, 403)

    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '')

    // -------------------------------------------------------------------
    if (action === 'criar') {
      const email = String(body.email || '').trim().toLowerCase()
      const senha = String(body.senha || '')
      const nome = String(body.nome || '').trim()
      const papel = String(body.papel || 'execucao')
      if (!email || !senha) return json({ error: 'Informe e-mail e senha.' }, 400)
      if (senha.length < 6) return json({ error: 'A senha precisa de ao menos 6 caracteres.' }, 400)
      if (!PAPEIS.includes(papel)) return json({ error: 'Papel inválido.' }, 400)

      const { data: novo, error: createErr } = await admin.auth.admin.createUser({
        email, password: senha, email_confirm: true, user_metadata: { nome },
      })
      if (createErr) {
        const m = /already been registered|already exists/i.test(createErr.message)
          ? 'Esse e-mail já tem conta.' : createErr.message
        return json({ error: m }, 400)
      }
      // o trigger cria o profile como 'cliente'; ajustamos nome + papel
      const { error: upErr } = await admin
        .from('profiles').update({ nome: nome || null, papel }).eq('id', novo.user.id)
      if (upErr) return json({ error: 'Usuário criado, mas falhou ao definir o papel: ' + upErr.message }, 500)
      return json({ ok: true, id: novo.user.id })
    }

    // -------------------------------------------------------------------
    if (action === 'senha') {
      const id = String(body.id || '')
      const senha = String(body.senha || '')
      if (!id) return json({ error: 'Usuário não informado.' }, 400)
      if (senha.length < 6) return json({ error: 'A senha precisa de ao menos 6 caracteres.' }, 400)
      const { error } = await admin.auth.admin.updateUserById(id, { password: senha })
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true })
    }

    // -------------------------------------------------------------------
    if (action === 'remover') {
      const id = String(body.id || '')
      if (!id) return json({ error: 'Usuário não informado.' }, 400)
      if (id === userData.user.id) return json({ error: 'Você não pode excluir a própria conta.' }, 400)
      const { error } = await admin.auth.admin.deleteUser(id)
      if (error) return json({ error: error.message }, 400)
      // profiles tem FK on delete cascade -> some junto
      return json({ ok: true })
    }

    return json({ error: 'Ação desconhecida.' }, 400)
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
