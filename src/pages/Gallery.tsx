import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link } from '../components/Link'
import { Lightbox } from '../components/Lightbox'
import { groupByAlbum } from '../data/albums'
import { useAlbumPhotos } from '../hooks/useAlbumPhotos'
import { useAlbums } from '../hooks/useAlbums'
import { Footer } from '../sections/Footer'
import type { AlbumGroup, Photo } from '../types'

const thumb = (p: Photo) => p.thumbSrc ?? p.src

// Classes per photo, front first. Up to three prints scattered like a pile on a table.
const scatter: Record<number, string[]> = {
  1: ['left-[20%] top-[10%] w-[60%] -rotate-2 z-10 group-hover:rotate-0'],
  2: [
    'right-[8%] bottom-[7%] w-[60%] rotate-3 z-20 group-hover:-translate-y-1 group-hover:rotate-1',
    'left-[6%] top-[7%] w-[56%] -rotate-6 z-10 group-hover:-translate-x-1.5 group-hover:-rotate-8',
  ],
  3: [
    'left-[21%] bottom-[5%] w-[58%] -rotate-1 z-30 group-hover:-translate-y-1 group-hover:rotate-0',
    'right-[4%] top-[6%] w-[52%] rotate-6 z-20 group-hover:translate-x-1.5 group-hover:rotate-8',
    'left-[4%] top-[8%] w-[52%] -rotate-6 z-10 group-hover:-translate-x-1.5 group-hover:-rotate-8',
  ],
}

function AlbumCover({ photos }: { photos: Photo[] }) {
  const shown = photos.slice(0, 3)
  const slots = scatter[shown.length]

  return (
    <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-cream-100">
      {shown.map((p, i) => (
        <div
          key={p.id}
          className={`absolute rounded-[2px] bg-white px-1.5 pt-1.5 pb-6 shadow-[0_6px_18px_-6px_rgb(27_36_51/0.45)] transition-transform duration-500 ${slots[i]}`}
        >
          <div className="aspect-square overflow-hidden bg-cream-200">
            <img src={thumb(p)} alt="" loading="lazy" className="size-full object-cover" />
          </div>
        </div>
      ))}
    </div>
  )
}

function AlbumList({ groups, loading }: { groups: AlbumGroup[]; loading: boolean }) {
  if (loading) {
    return (
      <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <li key={i} className="aspect-[5/4] animate-pulse rounded-2xl bg-cream-200" />
        ))}
      </ul>
    )
  }
  if (groups.length === 0) return <p className="mt-10 text-ink-soft">Ainda não há álbuns.</p>

  return (
    <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => (
        <li key={g.id}>
          <Link href={`/fotos/${g.id}`} className="group block">
            <AlbumCover photos={g.photos} />
            <h2 className="mt-3 font-serif text-lg leading-snug font-semibold">{g.title}</h2>
            <p className="text-sm text-ink-muted">
              {g.photos.length} {g.photos.length === 1 ? 'foto' : 'fotos'}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function AlbumDetail({ group }: { group: AlbumGroup }) {
  const [year, setYear] = useState<number | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const yearOf = (iso?: string) => (iso ? new Date(iso).getFullYear() : null)
  const years = [...new Set(group.photos.map((p) => yearOf(p.takenAt)).filter((y) => y !== null))].sort(
    (a, b) => b - a,
  )
  const visible = group.photos.filter((p) => !year || yearOf(p.takenAt) === year)
  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm transition ${
      active ? 'bg-ink text-white' : 'bg-white text-ink-soft shadow-sm hover:text-ink'
    }`

  return (
    <>
      <h1 className="heading mt-3">{group.title}</h1>
      {group.description && <p className="mt-3 max-w-xl text-ink-soft">{group.description}</p>}

      {years.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" aria-pressed={!year} onClick={() => setYear(null)} className={chip(!year)}>
            Todos os anos
          </button>
          {years.map((y) => (
            <button key={y} type="button" aria-pressed={year === y} onClick={() => setYear(y)} className={chip(year === y)}>
              {y}
            </button>
          ))}
        </div>
      )}

      <ul className="mt-8 columns-2 gap-2.5 md:columns-3 lg:columns-4">
        {visible.map((photo, i) => (
          <li key={photo.id} className="mb-2.5 break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`Ampliar foto${photo.caption ? `: ${photo.caption}` : ''}`}
              className="group block w-full overflow-hidden rounded-2xl bg-cream-200"
            >
              <img
                src={thumb(photo)}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <Lightbox photos={visible} index={openIndex} onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </>
  )
}

export function Gallery({ path }: { path: string }) {
  const { photos, loading } = useAlbumPhotos()
  const albums = useAlbums()
  const groups = groupByAlbum(albums, photos)

  // /fotos lists albums; /fotos/<id> shows one.
  const albumId = path.split('/')[2]
  const group = albumId ? groups.find((g) => g.id === albumId) : undefined

  return (
    <>
      <main className="container-page min-h-[70vh] pt-28 pb-16 sm:pt-32">
        {albumId ? (
          <>
            <Link href="/fotos" className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition hover:text-ink">
              <ArrowLeft aria-hidden className="size-4" />
              Álbuns
            </Link>
            {group ? (
              <AlbumDetail key={group.id} group={group} />
            ) : (
              !loading && <p className="mt-8 text-ink-soft">Álbum não encontrado.</p>
            )}
          </>
        ) : (
          <>
            <p className="eyebrow">Fotos</p>
            <h1 className="heading mt-3">Momentos que contam uma história</h1>
            <AlbumList groups={groups} loading={loading} />
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
