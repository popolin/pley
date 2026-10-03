import { useState } from 'react'
import { Lightbox } from '../components/Lightbox'
import { Link } from '../components/Link'
import { Photo } from '../components/Photo'
import { PillButton } from '../components/PillButton'
import { useAlbumPhotos } from '../hooks/useAlbumPhotos'

// Per-tile spans. Mobile: 2 columns. md+: 6 columns, two rows.
const layout = [
  'col-span-2',
  'row-span-2 md:row-span-1',
  'md:col-span-2',
  'md:row-span-2',
  '',
  'md:col-span-2',
  '',
]

export function PhotoPreview() {
  const { photos: album } = useAlbumPhotos(true)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const shown = album.slice(0, layout.length)
  const photos = shown

  return (
    <section id="fotos" className="py-12 sm:py-16">
      <div className="container-page grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-12">
        <div className="lg:pt-6">
          <p className="eyebrow">Fotos</p>
          <h2 className="heading mt-3">Momentos que contam uma história</h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
            Viagens, família, amigos, dias comuns e momentos inesquecíveis.
          </p>
          <PillButton href="/fotos" className="mt-6 hidden lg:inline-flex">Ver todas as fotos</PillButton>
        </div>

        <div className="grid auto-rows-[9.5rem] grid-flow-dense grid-cols-2 gap-2.5 sm:auto-rows-[12rem] md:grid-cols-6 md:auto-rows-[10rem] lg:auto-rows-[11.5rem]">
          {photos.map((photo, i) =>
            photo.src ? (
              <button
                key={photo.id}
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label="Ampliar foto"
                className={`overflow-hidden rounded-2xl ${layout[i] ?? ''}`}
              >
                <Photo photo={{ ...photo, src: photo.thumbSrc ?? photo.src }} className="size-full" />
              </button>
            ) : (
              <Photo key={photo.id} photo={photo} className={`rounded-2xl ${layout[i] ?? ''}`} />
            ),
          )}
          {photos.length > 0 && (
            <Link
              href="/fotos"
              aria-label="Ver todas as fotos"
              className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-ink px-2 text-center text-white transition hover:bg-ink/90"
            >
              <span className="font-serif text-3xl">Ver mais</span>
              <span className="text-sm text-white/80">fotos</span>
            </Link>
          )}
        </div>

        <PillButton href="/fotos" className="justify-self-start lg:hidden">Ver todas as fotos</PillButton>
      </div>

      {openIndex !== null && (
        <Lightbox photos={shown} index={openIndex} onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </section>
  )
}
