export type PhotoTone = 'dawn' | 'lake' | 'earth' | 'sand' | 'sage' | 'dusk' | 'mist'

export interface Photo {
  id: string
  alt: string
  /** Real image URL. When absent, a neutral placeholder is rendered. */
  src?: string
  tone: PhotoTone
  /** Smaller version for grids. Falls back to src. */
  thumbSrc?: string
  width?: number
  height?: number
  /** ISO date the photo was taken, when known. */
  takenAt?: string
  /** ISO date the photo was added. */
  createdAt?: string
  caption?: string
  albumId?: string | null
}

export interface Album {
  id: string
  title: string
  description?: string | null
}

/** An album that has at least one published photo. */
export interface AlbumGroup extends Album {
  photos: Photo[]
}

export interface Message {
  id: string
  author: string
  /** Relationship to Pley (friend, son, ...). */
  relation: string
  /** ISO date */
  date: string
  text: string
}

export interface VoiceMemory {
  playCount?: number
  id: string
  durationSeconds: number
  contributorName?: string
  caption?: string
  /** Audio file URL. Unused until audio is connected. */
  src?: string
}

export interface Tribute {
  /** YouTube video id. When absent, a "coming soon" state is shown. */
  youtubeId?: string
  thumbnail: Photo
}
