import { sendPublication } from '../lib/submission'
import { supabase } from '../lib/supabase'
import type { VoiceMemory } from '../types'

const audioBucket = 'audios'

// Extension decides the content type: browsers often report none for .opus/.m4a.
const contentTypes: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/ogg',
  webm: 'audio/webm',
}

export const MAX_AUDIO_BYTES = 20 * 1024 * 1024
export const audioAccept = ['audio/*', ...Object.keys(contentTypes).map((e) => `.${e}`)].join(',')

const extOf = (file: File) => file.name.split('.').pop()?.toLowerCase() ?? ''

export const audioContentType = (file: File) => contentTypes[extOf(file)]

function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    const finish = (value: number | null) => {
      URL.revokeObjectURL(url)
      resolve(value)
    }
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null)
    audio.onerror = () => finish(null)
    audio.src = url
  })
}

interface SubmitAudioInput {
  file: File
  name?: string
  caption?: string
}

// Uploads the file, then records it as pending until it is approved.
export async function submitAudio({ file, name, caption }: SubmitAudioInput) {
  if (!file.size || file.size > MAX_AUDIO_BYTES) throw new Error('O áudio deve ter até 20 MB e não pode estar vazio.')
  if (!audioContentType(file)) throw new Error('Formato de áudio não suportado.')
  const form = new FormData()
  form.set('kind', 'audio'); form.set('name', name ?? ''); form.set('caption', caption ?? '')
  form.set('file', file); form.set('duration', String(await readDuration(file) ?? ''))
  await sendPublication(form)
}

// A bounded sample; recent recordings are deprioritized by the database.
export async function fetchApprovedAudios(excludedIds: string[] = [], recentIds: string[] = []): Promise<VoiceMemory[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('sample_approved_audios', {
    excluded_ids: excludedIds.slice(0, 15), recent_ids: recentIds.slice(0, 30),
  })
  if (error) throw new Error('Não foi possível carregar os áudios.')
  if (!data) return []

  const storage = supabase.storage.from(audioBucket)
  return data.map((row: { id: string; duration_seconds: number | null; play_count: number | null; contributor_name: string | null; caption: string | null; storage_path: string }) => ({
    id: row.id,
    durationSeconds: row.duration_seconds ?? 0,
    playCount: row.play_count ?? 0,
    contributorName: row.contributor_name ?? undefined,
    caption: row.caption ?? undefined,
    src: storage.getPublicUrl(row.storage_path).data.publicUrl,
  }))
}

// Metrics are best-effort: failure must never interrupt playback.
export async function recordAudioPlay(audioId: string): Promise<void> {
  if (!supabase) return
  try {
    const { error } = await supabase.rpc('record_audio_play', { audio_id: audioId })
    if (error) console.warn('Audio play count could not be recorded', error.code)
  } catch {
    console.warn('Audio play count could not be recorded')
  }
}
