import { sendPublication, validatePhoto } from '../lib/submission'
import { processImage } from '../lib/image'
import { albumBucket, supabase } from '../lib/supabase'
import type { Album, Photo, PhotoTone } from '../types'

const tones: PhotoTone[] = ['dawn', 'earth', 'sage', 'mist', 'lake', 'sand', 'dusk']

// Approved photos only (enforced by RLS), newest first. Returns [] on any failure.
export async function fetchApprovedPhotos(): Promise<Photo[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error || !data) return []

  const storage = supabase.storage.from(albumBucket)
  const url = (path: string) => storage.getPublicUrl(path).data.publicUrl
  const when = (row: { taken_at?: string | null; created_at: string }) =>
    Date.parse(row.taken_at ?? row.created_at)

  return [...data]
    .sort((a, b) => when(b) - when(a))
    .map((row, i) => ({
      id: row.id,
      alt: row.alt ?? row.caption ?? 'Foto do Pley',
      src: url(row.storage_path),
      thumbSrc: row.thumb_path ? url(row.thumb_path) : undefined,
      width: row.width ?? undefined,
      height: row.height ?? undefined,
      takenAt: row.taken_at ?? undefined,
      createdAt: row.created_at,
      tone: tones[i % tones.length],
      caption: row.caption ?? undefined,
      albumId: row.album_id ?? null,
    }))
}

export async function fetchAlbums(): Promise<Album[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('albums')
    .select('id, title, description')
    .order('sort_order')
    .order('created_at')
  return error || !data ? [] : data
}

interface SubmitPhotoInput {
  file: File
  name?: string
  caption?: string
  albumId?: string
}

async function readTakenAt(file: File): Promise<Date | null> {
  try {
    const { parse } = await import('exifr')
    const tags = await parse(file, ['DateTimeOriginal'])
    const date = tags?.DateTimeOriginal
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null
  } catch {
    return null
  }
}

// Uploads full size and thumbnail, then records the photo as pending until approved.
export async function submitPhoto({ file, name, caption, albumId }: SubmitPhotoInput) {
  validatePhoto(file)

  const [{ full, thumb, width, height }, takenAt] = await Promise.all([
    processImage(file),
    readTakenAt(file),
  ])
  const form = new FormData()
  form.set('kind', 'photo'); form.set('name', name ?? ''); form.set('caption', caption ?? '')
  form.set('albumId', albumId ?? ''); form.set('width', String(width)); form.set('height', String(height))
  form.set('takenAt', takenAt?.toISOString() ?? '')
  form.set('file', full, 'photo.jpg'); form.set('thumb', thumb, 'thumb.jpg')
  await sendPublication(form)
}
