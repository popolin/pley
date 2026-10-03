import { supabase } from '../lib/supabase'
import type { Status } from './store'

export interface AdminMessage {
  id: string
  author_name: string
  relation: string
  body: string
  status: Status
  created_at: string
}
function client() {
  if (!supabase) throw new Error('Supabase não configurado.')
  return supabase
}
export async function listMessages(): Promise<AdminMessage[]> {
  const rows: AdminMessage[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client().rpc('admin_list_messages', { page_offset: offset })
    if (error) throw new Error(`Não foi possível carregar as mensagens: ${error.message}`)
    const page = data as AdminMessage[]
    rows.push(...page)
    if (page.length < 500) return rows
  }
}
export async function editMessage(id: string, author: string, relation: string, body: string) {
  const { error } = await client().rpc('admin_edit_message', {
    message_id: id, new_author: author.trim(), new_relation: relation.trim(), new_body: body.trim(),
  })
  if (error) throw new Error(error.message)
}
export async function setMessageStatus(ids: string[], status: Status) {
  const { error } = await client().rpc('admin_set_message_status', { message_ids: ids, new_status: status })
  if (error) throw new Error(error.message)
}
export async function pendingMessageCount(): Promise<number> {
  const { data, error } = await client().rpc('admin_pending_message_count')
  if (error) throw new Error('Não foi possível consultar as mensagens pendentes.')
  return Number(data)
}
