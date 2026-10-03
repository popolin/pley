import { supabase } from './supabase'
let sending = false
let nextAttempt = 0
export async function sendPublication(form: FormData) {
  if (!supabase) throw new Error('Supabase não configurado.')
  if (sending || Date.now() < nextAttempt) throw new Error('Aguarde alguns segundos antes de enviar novamente.')
  sending = true
  try {
    const { error } = await supabase.functions.invoke('submit-publication', { body: form })
    if (error) {
      let message = 'Não foi possível enviar agora. Aguarde e tente novamente.'
      try { const body = await error.context?.json(); if (body?.message) message = body.message } catch { /* Network error. */ }
      throw new Error(message)
    }
  } finally { sending = false; nextAttempt = Date.now() + 1500 }
}
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024
export function validatePhoto(file: File) {
  if (!file.size || file.size > MAX_PHOTO_BYTES) throw new Error('Cada foto deve ter até 8 MB e não pode estar vazia.')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use fotos JPG, PNG ou WebP.')
}
