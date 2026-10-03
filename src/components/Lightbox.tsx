import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Photo } from '../types'

interface LightboxProps {
  photos: Photo[]
  index: number
  onChange: (index: number) => void
  onClose: () => void
}

export function Lightbox({ photos, index, onChange, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const photo = photos[index]

  useEffect(() => {
    dialogRef.current?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  function go(step: number) {
    setZoomed(false)
    onChange((index + step + photos.length) % photos.length)
  }

  // Zoom shows the image at its natural size, centered, and pannable by scrolling.
  function toggleZoom() {
    const next = !zoomed
    setZoomed(next)
    requestAnimationFrame(() => {
      const area = areaRef.current
      if (!area) return
      area.scrollLeft = next ? (area.scrollWidth - area.clientWidth) / 2 : 0
      area.scrollTop = next ? (area.scrollHeight - area.clientHeight) / 2 : 0
    })
  }

  const iconButton =
    'inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20'

  return (
    <dialog
      ref={dialogRef}
      aria-label="Foto ampliada"
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null || zoomed) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1)
      }}
      className="m-0 h-dvh max-h-none w-dvw max-w-none bg-ink/95 p-0 text-white backdrop:bg-transparent"
    >
      <div
        ref={areaRef}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        className="absolute inset-0 flex overflow-auto px-4 pt-20 pb-24"
      >
        <img
          key={photo.id}
          src={photo.src}
          alt={photo.alt}
          onClick={toggleZoom}
          className={`m-auto animate-pop rounded-lg ${
            zoomed
              ? 'max-h-none max-w-none cursor-zoom-out'
              : 'max-h-full max-w-full cursor-zoom-in object-contain'
          }`}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs tabular-nums backdrop-blur">
          {index + 1} / {photos.length}
        </span>
        <div className="pointer-events-auto flex gap-2">
          <button type="button" onClick={toggleZoom} aria-label={zoomed ? 'Reduzir' : 'Ampliar'} className={iconButton}>
            {zoomed ? <ZoomOut aria-hidden className="size-5" /> : <ZoomIn aria-hidden className="size-5" />}
          </button>
          <button type="button" onClick={onClose} aria-label="Fechar" className={iconButton}>
            <X aria-hidden className="size-5" />
          </button>
        </div>
      </div>

      {photos.length > 1 && !zoomed && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Foto anterior"
            className={`${iconButton} absolute top-1/2 left-3 hidden -translate-y-1/2 sm:inline-flex`}
          >
            <ChevronLeft aria-hidden className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próxima foto"
            className={`${iconButton} absolute top-1/2 right-3 hidden -translate-y-1/2 sm:inline-flex`}
          >
            <ChevronRight aria-hidden className="size-6" />
          </button>
        </>
      )}

      {photo.caption && (
        <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-ink to-transparent px-6 pt-10 pb-6 text-center text-sm text-white/90">
          {photo.caption}
        </p>
      )}
    </dialog>
  )
}
