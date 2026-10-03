import { ImageIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Photo as PhotoData, PhotoTone } from '../types'

const tones: Record<PhotoTone, string> = {
  dawn: 'bg-linear-to-br from-[#f1cfa3] via-[#d8a27a] to-[#7a7088]',
  lake: 'bg-linear-to-b from-[#b4c9d6] via-[#86a3b6] to-[#4a6a80]',
  earth: 'bg-linear-to-br from-[#dcc7a6] via-[#b3906a] to-[#6f553b]',
  sand: 'bg-linear-to-br from-[#f0e4cf] via-[#dcc8a8] to-[#bfa27b]',
  sage: 'bg-linear-to-br from-[#cdd5ba] via-[#9aa886] to-[#5f6e54]',
  dusk: 'bg-linear-to-br from-[#eebd88] via-[#a2736c] to-[#27304a]',
  mist: 'bg-linear-to-b from-[#e8e4de] via-[#c6c7c9] to-[#8f97a3]',
}

interface PhotoProps {
  photo: PhotoData
  /** Sizing/layout classes. The photo always fills its box. */
  className?: string
  showIcon?: boolean
  children?: ReactNode
}

export function Photo({ photo, className = '', showIcon = true, children }: PhotoProps) {
  return (
    <div
      className={`group overflow-hidden ${className.includes('absolute') ? '' : 'relative'} ${className}`}
    >
      {photo.src ? (
        <img
          src={photo.src}
          alt={photo.alt}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <div
          role="img"
          aria-label={photo.alt}
          className={`absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03] ${tones[photo.tone]}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgb(255_255_255/0.35),transparent_60%)]" />
          {showIcon && (
            <ImageIcon
              aria-hidden
              strokeWidth={1.25}
              className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-white/60"
            />
          )}
        </div>
      )}
      {children}
    </div>
  )
}
