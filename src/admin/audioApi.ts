import { supabase } from '../lib/supabase'
import type { Status } from './store'
export interface AdminAudio {
  id: string
  contributor_name: string | null
  caption: string | null
  storage_path: string
  status: Status
  play_count: number
  created_at: string
  src: string
}
function client() {
  if (!supabase) throw new Error('Supabase não configurado.')
  return supabase
}
export async function listAudios(): Promise<AdminAudio[]> {
  const db = client()
  const rows: AdminAudio[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.rpc('admin_list_audios', { page_offset: offset })
    if (error) throw new Error('Não foi possível carregar os áudios. Verifique seu acesso e a configuração do banco.')
    const page = data as AdminAudio[]
    rows.push(...page.map((row) => ({ ...row, src: db.storage.from('audios').getPublicUrl(row.storage_path).data.publicUrl })))
    if (page.length < 500) return rows
  }
}
export async function editAudio(id: string, author: string, caption: string) {
  const { error } = await client().rpc('admin_edit_audio', { audio_id: id, author_name: author.trim(), audio_caption: caption.trim() })
  if (error) throw new Error(error.message)
}
export async function setAudioStatus(ids: string[], status: Status) {
  const { error } = await client().rpc('admin_set_audio_status', { audio_ids: ids, new_status: status })
  if (error) throw new Error(error.message)
}

export async function pendingAudioCount(): Promise<number> {
  const { data, error } = await client().rpc('admin_pending_audio_count')
  // Older deployments may have listing RPCs but not the newer badge RPC yet.
  if (error?.code === 'PGRST202' || error?.code === '42883') {
    return (await listAudios()).filter((audio) => audio.status === 'pending').length
  }
  if (error) throw new Error('Não foi possível carregar as pendências de áudio.')
  return Number(data)
}
