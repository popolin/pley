import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const reply = (status: number, body: object) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
})

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (request.method !== 'POST') return reply(405, { error: 'Método não permitido.' })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } })
    const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1]
    if (!token) return reply(401, { error: 'Faça login novamente.' })
    const { data: identity, error: authError } = await service.auth.getUser(token)
    if (authError || !identity.user) return reply(401, { error: 'Sessão inválida.' })
    const { data: caller, error: callerError } = await service.from('admins').select('status').eq('id', identity.user.id).maybeSingle()
    if (callerError || caller?.status !== 'active') return reply(403, { error: 'Acesso administrativo negado.' })
    if (Number(request.headers.get('content-length')) > 4096) return reply(413, { error: 'Envio acima do limite.' })
    const quota = await service.rpc('reserve_admin_request', { admin_id: identity.user.id })
    if (quota.error) return reply(quota.error.code === 'P0001' ? 429 : 503, { error: 'Aguarde antes de tentar novamente.' })
    const reader = request.body?.getReader()
    if (!reader) return reply(400, { error: 'Envio inválido.' })
    const chunks: Uint8Array[] = []; let size = 0
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.length
      if (size > 4096) { await reader.cancel(); return reply(413, { error: 'Envio acima do limite.' }) }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size); let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
    const body = JSON.parse(new TextDecoder().decode(bytes))
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!name || name.length > 80 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { error: 'Informe um nome e um e-mail válidos.' })
    if (body.action === 'create') {
      if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) return reply(400, { error: 'A senha deve ter entre 8 e 128 caracteres.' })
      const { data, error } = await service.auth.admin.createUser({ email, password: body.password, email_confirm: true, user_metadata: { admin_name: name } })
      if (error || !data.user) return reply(400, { error: 'Não foi possível criar o acesso. Verifique se o e-mail já está cadastrado e se a senha atende às regras.' })
      const { error: insertError } = await service.from('admins').insert({ id: data.user.id, email, name, status: 'active' })
      if (insertError) {
        // Roll back only the newly created Auth account; no admin record is deleted.
        const { error: cleanupError } = await service.auth.admin.deleteUser(data.user.id)
        if (cleanupError) console.error('Failed to roll back unlinked Auth account', data.user.id)
        return reply(500, { error: 'Não foi possível cadastrar o perfil administrativo.' })
      }
      return reply(201, { ok: true })
    }
    if (body.action === 'update' && typeof body.id === 'string') {
      const { data: target, error } = await service.from('admins').select('id, email').eq('id', body.id).maybeSingle()
      if (error || !target) return reply(404, { error: 'Administrador não encontrado.' })
      if (email !== target.email.toLowerCase()) return reply(400, { error: 'O e-mail do administrador não pode ser alterado.' })
      // Only the display name is editable; Auth email is never sent in updates.
      const { error: updateError } = await service.auth.admin.updateUserById(target.id, { user_metadata: { admin_name: name } })
      if (updateError) return reply(400, { error: 'Não foi possível salvar o nome do administrador.' })
      return reply(200, { ok: true })
    }
    return reply(400, { error: 'Operação inválida.' })
  } catch {
    return reply(500, { error: 'Não foi possível concluir a operação.' })
  }
})
