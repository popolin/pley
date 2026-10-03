import { albumBucket, supabase } from '../lib/supabase'
import type { Status } from './store'
export interface AdminPhoto {
  featured?: boolean
  id: string
  contributor_name: string | null
  caption: string | null
  storage_path: string
  status: Status
  alt: string | null
  album_id: string | null
  thumb_path: string | null
  thumbSrc: string
  created_at: string
  src: string
}
function client() {
  if (!supabase) throw new Error('Supabase não configurado.')
  return supabase
}
export interface PhotoPage {
  rows: AdminPhoto[]
  total: number
  statusCounts: Partial<Record<Status, number>>
  albumCounts: Record<string, number>
  albumTotals: Record<string, number>
}
export async function listPhotos(page = 0, status: Status = 'pending', album = 'all', search = '', featured: boolean | null = null): Promise<PhotoPage> {
  const db = client()
  const { data, error } = await db.rpc('admin_photo_page', {
    page_number: page, filter_status: status, filter_album: album, search_text: search, filter_featured: featured,
  })
  if (error) throw new Error(`Não foi possível carregar as fotos: ${error.message}`)
  const result = data as PhotoPage
  return { ...result, statusCounts: result.statusCounts ?? {}, albumCounts: result.albumCounts ?? {}, albumTotals: result.albumTotals ?? {}, rows: result.rows.map((row) => ({ ...row, thumbSrc: db.storage.from(albumBucket).getPublicUrl(row.thumb_path || row.storage_path).data.publicUrl, src: db.storage.from(albumBucket).getPublicUrl(row.storage_path).data.publicUrl })) }
}
export async function editPhoto(id: string, author: string, caption: string, alt: string, albumId: string) {
  const { error } = await client().rpc('admin_edit_photo', { photo_id: id, author_name: author.trim(), photo_caption: caption.trim(), photo_alt: alt.trim(), selected_album: albumId || null })
  if (error) throw new Error(error.message)
}
export async function setPhotoStatus(ids: string[], status: Status) {
  const { error } = await client().rpc('admin_set_photo_status', { photo_ids: ids, new_status: status })
  if (error) throw new Error(error.message)
}

export async function pendingPhotoCount(): Promise<number> {
  const { data, error } = await client().rpc('admin_pending_photo_count')
  if (error) throw new Error('Não foi possível carregar as pendências de foto.')
  return Number(data)
}

export interface PhotoAlbum { id: string; title: string }
export async function listPhotoAlbums(): Promise<PhotoAlbum[]> {
  const rows: PhotoAlbum[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client().from('albums').select('id, title').order('title').order('id').range(offset, offset + 499)
    if (error) throw new Error('Não foi possível carregar os álbuns.')
    rows.push(...data)
    if (data.length < 500) return rows
  }
}
export async function createPhotoAlbum(title: string): Promise<PhotoAlbum> {
  const { data, error } = await client().rpc('admin_create_album', { album_title: title.trim() })
  if (error) throw new Error(error.message)
  return data as PhotoAlbum
}

export async function renamePhotoAlbum(id: string, title: string) {
  const { error } = await client().rpc('admin_rename_album', { album_id: id, album_title: title.trim() })
  if (error) throw new Error(error.message)
}
export async function deleteEmptyPhotoAlbum(id: string) {
  const { error } = await client().rpc('admin_delete_empty_album', { target_album: id })
  if (error) throw new Error(error.message)
}
export async function movePhotos(ids: string[], albumId: string) {
  const { error } = await client().rpc('admin_move_photos', { photo_ids: ids, target_album: albumId || null })
  if (error) throw new Error(error.message)
}

export async function featurePhotos(ids: string[], show: boolean) {
  const { error } = await client().rpc('admin_feature_photos', { photo_ids: ids, show_on_home: show })
  if (error) throw new Error(error.message)
}
