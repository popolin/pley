import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from '../components/Link'
import { Lightbox } from '../components/Lightbox'
import { galleryAlbums, galleryPhotos, type GalleryAlbum, type GalleryPage } from '../data/gallery'
import { Footer } from '../sections/Footer'
import type { Photo } from '../types'

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

function AlbumList({ groups, loading }: { groups: GalleryAlbum[]; loading: boolean }) {
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
              {g.total} {g.total === 1 ? 'foto' : 'fotos'}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}

const control = 'cursor-pointer rounded-lg border border-cream-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50'

function GalleryContent({ albumId }: { albumId?: string }) {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('')
  const [oldest, setOldest] = useState(false)
  const [groups, setGroups] = useState<GalleryAlbum[]>([])
  const [detail, setDetail] = useState<GalleryPage>({ rows: [], total: 0, years: [], title: null })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const size = albumId ? 24 : 12
  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      const request = albumId
        ? galleryPhotos(albumId, page, year, search.trim(), oldest).then((result) => { if (active) { setDetail(result); setTotal(result.total); if (page > 0 && page * size >= result.total) setPage(Math.max(0, Math.ceil(result.total / size) - 1)) } })
        : galleryAlbums(page, search.trim()).then((result) => { if (active) { setGroups(result.rows); setTotal(result.total); if (page > 0 && page * size >= result.total) setPage(Math.max(0, Math.ceil(result.total / size) - 1)) } })
      request.catch((e) => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    }, 300)
    return () => { active = false; window.clearTimeout(timer) }
  }, [albumId, page, year, search, oldest, retry, size])
  function reset() { setPage(0); setLoading(true); setError(''); setOpenIndex(null) }
  function navigate(next: number) { setPage(next); setLoading(true); setError(''); setOpenIndex(null) }
  return <>
    {albumId ? <Link href="/fotos" className="inline-flex items-center gap-1.5 text-sm text-ink-soft"><ArrowLeft className="size-4" />Álbuns</Link> : <p className="eyebrow">Fotos</p>}
    <h1 className="heading mt-3">{albumId ? (detail.title || 'Fotos do álbum') : 'Momentos que contam uma história'}</h1>
    {albumId && detail.description && <p className="mt-3 text-ink-soft">{detail.description}</p>}
    <div className="mt-6 flex flex-wrap items-end gap-3">
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">{albumId ? 'Buscar foto' : 'Buscar álbum'}<input className={control} maxLength={albumId ? 300 : 100} value={search} placeholder={albumId ? 'Legenda ou descrição' : 'Nome do álbum'} onChange={(e) => { setSearch(e.target.value); reset() }} /></label>
      {albumId && <>
        <label className="flex flex-col gap-1 text-sm">Ano<select className={control} value={year} onChange={(e) => { setYear(e.target.value); reset() }}><option value="">Todos os anos</option>{detail.years.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-sm">Ordenação<select className={control} value={oldest ? 'old' : 'new'} onChange={(e) => { setOldest(e.target.value === 'old'); reset() }}><option value="new">Mais recentes</option><option value="old">Mais antigas</option></select></label>
      </>}
    </div>
    {error ? <div role="alert" className="mt-8"><p>{error}</p><button className={`${control} mt-3`} onClick={() => { setError(''); setLoading(true); setRetry(retry + 1) }}>Tentar novamente</button></div> : loading ? <p role="status" className="mt-8">Carregando…</p> : albumId ? <>
      <p className="mt-5 text-sm text-ink-muted">{total} foto(s)</p>
      {!total && <p className="mt-8">Nenhuma foto encontrada para os filtros selecionados.</p>}
      <ul className="mt-8 columns-2 gap-2.5 md:columns-3 lg:columns-4">{detail.rows.map((photo, i) => <li key={photo.id} className="mb-2.5 break-inside-avoid"><button type="button" onClick={() => setOpenIndex(i)} aria-label={`Ampliar foto: ${photo.alt}`} className="group block w-full cursor-pointer overflow-hidden rounded-2xl bg-cream-200"><img src={thumb(photo)} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]" /></button></li>)}</ul>
    </> : <AlbumList groups={groups} loading={false} />}
    <nav aria-label="Paginação de fotos" className="mt-8 flex items-center justify-between gap-3">
      <button className={control} disabled={loading || !!error || page === 0} onClick={() => navigate(page - 1)}>Anterior</button>
      <span className="text-sm">Página {page + 1} de {Math.max(1, Math.ceil(total / size))}</span>
      <button className={control} disabled={loading || !!error || (page + 1) * size >= total} onClick={() => navigate(page + 1)}>Próxima</button>
    </nav>
    {openIndex !== null && <Lightbox photos={detail.rows} index={openIndex} onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />}
  </>
}

export function Gallery({ path }: { path: string }) {
  const albumId = path.split('/')[2]
  return <><main className="container-page min-h-[70vh] pt-28 pb-16 sm:pt-32"><GalleryContent key={albumId || 'all'} albumId={albumId} /></main><Footer /></>
}
