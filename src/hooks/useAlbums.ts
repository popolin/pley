import { useEffect, useState } from 'react'
import { fetchAlbums } from '../data/photos'
import type { Album } from '../types'

export function useAlbums() {
  const [albums, setAlbums] = useState<Album[]>([])

  useEffect(() => {
    let cancelled = false
    fetchAlbums().then((result) => {
      if (!cancelled) setAlbums(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return albums
}
