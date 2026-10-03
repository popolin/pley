import { sendPublication } from '../lib/submission'
import { supabase } from '../lib/supabase'
import type { Message } from '../types'

export const MAX_MESSAGE_LENGTH = 600

export const relations = [
  'Filho(a)',
  'Esposa',
  'Irmão(ã)',
  'Neto(a)',
  'Sobrinho(a)',
  'Primo(a)',
  'Familiar',
  'Amigo(a)',
  'Colega de trabalho',
  'Outro',
]

interface SubmitMessageInput {
  name: string
  relation: string
  text: string
}

// Recorded as pending until it is approved.
export async function submitMessage({ name, relation, text }: SubmitMessageInput) {
  const form = new FormData()
  form.set('kind', 'message'); form.set('name', name); form.set('relation', relation); form.set('caption', text)
  await sendPublication(form)
}

// Approved messages only (enforced by RLS). Returns [] on any failure.
export async function fetchApprovedMessages(limit = 6): Promise<Message[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    author: row.author_name,
    relation: row.relation,
    date: row.created_at,
    text: row.body,
  }))
}
