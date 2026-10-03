import type { Album, AlbumGroup, Photo } from '../types'

export const UNSORTED_ID = 'outras'

const added = (p: Photo) => Date.parse(p.createdAt ?? '') || 0

// Albums with published photos only, ordered by their most recently added photo.
// Photos without an album go into a catch-all so they stay reachable.
export function groupByAlbum(albums: Album[], photos: Photo[]): AlbumGroup[] {
  const known = new Set(albums.map((a) => a.id))
  const groups: AlbumGroup[] = albums.map((a) => ({
    ...a,
    photos: photos.filter((p) => p.albumId === a.id),
  }))
  groups.push({
    id: UNSORTED_ID,
    title: 'Outras fotos',
    photos: photos.filter((p) => !p.albumId || !known.has(p.albumId)),
  })

  const latest = (g: AlbumGroup) => Math.max(...g.photos.map(added))
  return groups.filter((g) => g.photos.length > 0).sort((a, b) => latest(b) - latest(a))
}
