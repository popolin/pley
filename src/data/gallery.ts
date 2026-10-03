import { albumBucket, supabase } from '../lib/supabase'
import type { Photo } from '../types'
interface PhotoRow { id: string; storage_path: string; thumb_path?: string; alt?: string; caption?: string; width?: number; height?: number }
function mapPhoto(row: PhotoRow): Photo {
  const storage = supabase!.storage.from(albumBucket)
  return { id: row.id, alt: row.alt || row.caption || 'Foto do Pley', caption: row.caption, tone: 'dawn', width: row.width, height: row.height,
    src: storage.getPublicUrl(row.storage_path).data.publicUrl,
    thumbSrc: storage.getPublicUrl(row.thumb_path || row.storage_path).data.publicUrl }
}
export interface GalleryAlbum { id: string; title: string; description?: string; total: number; photos: Photo[] }
export async function galleryAlbums(page: number, search: string): Promise<{ rows: GalleryAlbum[]; total: number }> {
  if (!supabase) return { rows: [], total: 0 }
  const { data, error } = await supabase.rpc('gallery_album_page', { page_number: page, search_text: search })
  if (error) throw new Error('Não foi possível carregar os álbuns. Tente novamente.')
  return { ...data, rows: data.rows.map((row: Omit<GalleryAlbum, 'photos'> & { photos: PhotoRow[] }) => ({ ...row, photos: row.photos.map(mapPhoto) })) }
}
export interface GalleryPage { rows: Photo[]; total: number; years: number[]; title: string | null; description?: string }
export async function galleryPhotos(album: string, page: number, year: string, search: string, oldest: boolean): Promise<GalleryPage> {
  if (!supabase) return { rows: [], total: 0, years: [], title: null }
  const { data, error } = await supabase.rpc('gallery_photo_page', { album_key: album, page_number: page, capture_year: year ? Number(year) : null, search_text: search, oldest_first: oldest })
  if (error) throw new Error('Não foi possível carregar as fotos. Tente novamente.')
  return { ...data, rows: data.rows.map(mapPhoto) }
}
