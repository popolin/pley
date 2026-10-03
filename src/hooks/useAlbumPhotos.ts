import { useEffect, useState } from 'react'
import { fetchApprovedPhotos } from '../data/photos'
import type { Photo } from '../types'

export function useAlbumPhotos(homeOnly = false) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchApprovedPhotos(homeOnly).then((result) => {
      if (cancelled) return
      setPhotos(result)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [homeOnly])

  return { photos, loading }
}
