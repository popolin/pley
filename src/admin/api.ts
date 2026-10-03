import { supabase } from '../lib/supabase'
export interface Admin { id: string; name: string; email: string; status: 'active' | 'inactive'; created_at: string }
function client() {
  if (!supabase) throw new Error('Configure o Supabase para acessar a administração.')
  return supabase
}
export async function currentAdmin(): Promise<Admin | null> {
  const db = client()
  const { data: { session }, error } = await db.auth.getSession()
  if (error) throw error
  if (!session) return null
  const { data, error: profileError } = await db.from('admins').select('*').eq('id', session.user.id).maybeSingle()
  if (profileError) throw new Error('Não foi possível verificar o acesso administrativo.')
  return data?.status === 'active' ? data as Admin : null
}
export async function login(email: string, password: string) {
  const { error } = await client().auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error) throw new Error('E-mail ou senha inválidos, ou acesso indisponível.')
  try {
    const admin = await currentAdmin()
    if (!admin) throw new Error('Este usuário não possui acesso administrativo ativo.')
    return admin
  } catch (error) {
    await client().auth.signOut({ scope: 'local' })
    throw error
  }
}
export async function logout() {
  const { error } = await client().auth.signOut({ scope: 'local' })
  if (error) throw new Error('Não foi possível sair. Tente novamente.')
}
export async function listAdmins(): Promise<Admin[]> {
  const { data, error } = await client().from('admins').select('*').order('created_at')
  if (error) throw new Error('Não foi possível carregar os administradores.')
  return data as Admin[]
}
export async function saveAdmin(values: { id?: string; name: string; email: string; password?: string }) {
  const { error } = await client().functions.invoke('manage-admin', { body: { ...values, action: values.id ? 'update' : 'create' } })
  if (error) {
    let message = 'Não foi possível salvar o administrador.'
    try { const body = await error.context?.json(); if (body?.error) message = body.error } catch { /* Network/gateway error. */ }
    throw new Error(message)
  }
}
export async function changeAdminStatus(id: string, status: Admin['status']) {
  const { error } = await client().rpc('set_admin_status', { target_id: id, new_status: status })
  if (error) throw new Error(error.message || 'Não foi possível alterar o status.')
}
