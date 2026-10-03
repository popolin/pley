import { MoreHorizontal, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { renamePhotoAlbum, deleteEmptyPhotoAlbum, movePhotos, createPhotoAlbum, listPhotoAlbums, type PhotoAlbum, editPhoto, listPhotos, setPhotoStatus, type AdminPhoto } from './photoApi'
import type { Status } from './store'
const button = 'cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
const primaryButton = 'cursor-pointer rounded-lg border border-blue-700 bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50'
const field = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm'
const labels: Record<Status, string> = { pending: 'Pendentes', approved: 'Aprovadas', rejected: 'Reprovadas' }
export function AdminPhotos({ onPendingChanged }: { onPendingChanged: () => Promise<void> }) {
  const [albums, setAlbums] = useState<PhotoAlbum[]>([])
  const albumOptions = [...albums].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' }))
  const [albumMenu, setAlbumMenu] = useState<string | null>(null)
  const [albumFilter, setAlbumFilter] = useState('all')
  const [renaming, setRenaming] = useState(false)
  const [renameTitle, setRenameTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [moving, setMoving] = useState(false)
  const [destination, setDestination] = useState('')
  const [albumId, setAlbumId] = useState('')
  const [creatingAlbum, setCreatingAlbum] = useState(false)
  const [albumTitle, setAlbumTitle] = useState('')
  const [rows, setRows] = useState<AdminPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [status, setStatus] = useState<Status>('pending')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<AdminPhoto | null>(null)
  const editDialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (!editing) return
    const dialog = editDialog.current
    if (!dialog) return
    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [editing])
  function closeEditor() {
    if (busy) return
    setEditing(null)
    setCreatingAlbum(false)
  }

  useEffect(() => {
    let active = true
    Promise.allSettled([listPhotos(), listPhotoAlbums()]).then(([photos, loadedAlbums]) => {
      if (!active) return
      if (photos.status === 'fulfilled') setRows(photos.value)
      if (loadedAlbums.status === 'fulfilled') setAlbums(loadedAlbums.value)
      setError([photos, loadedAlbums].filter((result) => result.status === 'rejected').map((result) => result.reason.message).join(' '))
      setLoading(false)
    })
    return () => { active = false }
  }, [])
  async function reload() {
    setLoading(true); setError(''); setSelected([])
    const [photos, loadedAlbums] = await Promise.allSettled([listPhotos(), listPhotoAlbums()])
    setRows(photos.status === 'fulfilled' ? photos.value : [])
    if (loadedAlbums.status === 'fulfilled') setAlbums(loadedAlbums.value)
    setError([photos, loadedAlbums].filter((result) => result.status === 'rejected').map((result) => result.reason.message).join(' '))
    void onPendingChanged()
    setLoading(false)
  }
  async function moderate(ids: string[], next: Status) {
    if (busy || !ids.length) return
    setBusy(true); setError(''); setNotice('')
    try {
      await setPhotoStatus(ids, next)
      setRows((previous) => previous.map((row) => ids.includes(row.id) ? { ...row, status: next } : row))
      setSelected([]); setEditing(null); setNotice('Status atualizado.'); void onPendingChanged()
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível atualizar.') }
    finally { setBusy(false) }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing || busy) return
    const fields = new FormData(event.currentTarget)
    const author = String(fields.get('author')).trim()
    const alt = String(fields.get('alt')).trim()
    const caption = String(fields.get('caption')).trim()
    setBusy(true); setError(''); setNotice('')
    try {
      await editPhoto(editing.id, author, caption, alt, albumId)
      setRows((previous) => previous.map((row) => row.id === editing.id ? { ...row, contributor_name: author, caption, alt, album_id: albumId || null } : row))
      setEditing(null); setNotice('Foto atualizada.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.') }
    finally { setBusy(false) }
  }
  async function addAlbum() {
    if (busy || !albumTitle.trim()) return
    setBusy(true); setError('')
    try {
      const album = await createPhotoAlbum(albumTitle)
      setAlbums((previous) => [...previous, album]); setAlbumId(album.id)
      setCreatingAlbum(false); setAlbumTitle(''); setNotice('Álbum criado. Salve a foto para vinculá-la.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível criar o álbum.') }
    finally { setBusy(false) }
  }
  const activeAlbum = albums.find((album) => album.id === albumFilter)
  function clearSelection() { setSelected([]); setMoving(false); setEditing(null) }
  async function renameAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeAlbum || busy || !renameTitle.trim()) return
    setBusy(true); setError('')
    try {
      await renamePhotoAlbum(activeAlbum.id, renameTitle)
      setAlbums((previous) => previous.map((album) => album.id === activeAlbum.id ? { ...album, title: renameTitle.trim() } : album))
      setRenaming(false); setNotice('Álbum renomeado.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível renomear.') }
    finally { setBusy(false) }
  }
  async function removeAlbum() {
    if (!activeAlbum || busy) return
    setBusy(true); setError('')
    try {
      await deleteEmptyPhotoAlbum(activeAlbum.id)
      setAlbums((previous) => previous.filter((album) => album.id !== activeAlbum.id))
      setAlbumFilter('all'); setConfirmDelete(false); clearSelection(); setNotice('Álbum vazio excluído.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível excluir.') }
    finally { setBusy(false) }
  }
  async function moveSelected() {
    if (busy || !selected.length) return
    setBusy(true); setError('')
    try {
      await movePhotos(selected, destination)
      setRows((previous) => previous.map((row) => selected.includes(row.id) ? { ...row, album_id: destination || null } : row))
      clearSelection(); setNotice('Fotos movidas com sucesso.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível mover.') }
    finally { setBusy(false) }
  }
  const visible = rows.filter((row) => row.status === status && (albumFilter === 'all' || (row.album_id ?? '') === albumFilter) && `${row.contributor_name ?? ''} ${row.caption ?? ''}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
  return <section>
    <fieldset disabled={busy || loading} className="mb-4 flex flex-wrap gap-2">{(Object.keys(labels) as Status[]).map((value) => <button key={value} aria-pressed={status === value} className={`${button} ${status === value ? 'ring-2 ring-slate-500' : ''}`} onClick={() => { setStatus(value); clearSelection() }}>{labels[value]} <span className="ml-2 tabular-nums">{rows.filter((row) => row.status === value).length}</span></button>)}</fieldset>
    <fieldset disabled={busy || loading} className="mb-5">
      <legend className="mb-2 text-xs font-medium text-slate-500">Álbuns</legend>
      <div className="flex flex-wrap gap-2">{[{ id: 'all', title: 'Todos os álbuns' }, { id: '', title: 'Sem álbum' }, ...albums].map((album) => {
        const realAlbum = album.id !== 'all' && album.id !== ''
        const hasPhotos = rows.some((row) => row.album_id === album.id)
        return <div key={album.id} className={`relative flex items-center rounded-lg border ${albumFilter === album.id ? 'border-slate-500 bg-slate-200/60 text-ink' : 'border-slate-200 bg-white text-slate-600'}`} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setAlbumMenu(null) }} onKeyDown={(e) => { if (e.key === 'Escape') { setAlbumMenu(null); e.currentTarget.querySelector<HTMLButtonElement>('[aria-expanded]')?.focus() } }}>
          <button className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100" aria-pressed={albumFilter === album.id} onClick={() => { setAlbumFilter(album.id); setAlbumMenu(null); clearSelection(); setRenaming(false); setConfirmDelete(false) }}>{album.title} <span className="ml-1 text-xs tabular-nums">{rows.filter((row) => row.status === status && (album.id === 'all' || (row.album_id ?? '') === album.id)).length}</span></button>
          {realAlbum && <>
            <button type="button" aria-label={`Opções do álbum ${album.title}`} title="Opções do álbum" aria-expanded={albumMenu === album.id} aria-controls={`album-actions-${album.id}`} className="mr-1 inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-ink" onClick={() => setAlbumMenu(albumMenu === album.id ? null : album.id)}><MoreHorizontal aria-hidden className="size-4" /></button>
            {albumMenu === album.id && <div id={`album-actions-${album.id}`} className="absolute top-full left-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
              <button className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100" onClick={() => { setAlbumMenu(null); setAlbumFilter(album.id); clearSelection(); setRenameTitle(album.title); setRenaming(true); setConfirmDelete(false) }}>Renomear</button>
              <button className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400" disabled={hasPhotos} onClick={() => { setAlbumMenu(null); setAlbumFilter(album.id); clearSelection(); setConfirmDelete(true); setRenaming(false) }}>Remover</button>
              {hasPhotos && <p className="px-3 pb-2 text-xs text-slate-500">Para remover, mova primeiro todas as fotos deste álbum.</p>}
            </div>}
          </>}
        </div>
      })}</div>
      {renaming && activeAlbum && <form onSubmit={renameAlbum} className="mt-3 flex flex-wrap items-end gap-2"><label className="text-sm">Novo nome<input autoFocus className={field} value={renameTitle} onChange={(e) => setRenameTitle(e.target.value)} required maxLength={100} /></label><button className={button} disabled={!renameTitle.trim()}>Salvar nome</button><button type="button" className={button} onClick={() => setRenaming(false)}>Cancelar</button></form>}
      {confirmDelete && activeAlbum && <div className="mt-3 rounded-lg bg-slate-50 p-3"><p className="mb-2 text-sm">Excluir o álbum “{activeAlbum.title}”?</p><button className={button} onClick={() => void removeAlbum()}>Confirmar exclusão</button> <button className={button} onClick={() => setConfirmDelete(false)}>Cancelar</button></div>}
    </fieldset>
    <div className="mb-5 flex items-end gap-3"><label className="flex-1 text-sm">Buscar<input className={field} value={search} disabled={busy || loading} placeholder="Nome ou legenda" onChange={(e) => { setSearch(e.target.value); clearSelection() }} /></label><button className={button} disabled={busy || loading || !!editing} onClick={() => void reload()}>Atualizar</button></div>
    {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}<p role="status" className="mb-3 text-sm text-green-800">{notice}</p>
    {editing && <dialog ref={editDialog} aria-labelledby="photo-edit-title" onClose={closeEditor} onCancel={(event) => { if (busy) event.preventDefault() }} onClick={(event) => { if (event.target === event.currentTarget) closeEditor() }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/55 backdrop:backdrop-blur-sm">
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4"><div><h2 id="photo-edit-title" className="text-lg font-semibold">Editar foto</h2><p className="text-sm text-slate-500">{editing.contributor_name || 'Autor não informado'}</p></div><button type="button" className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Fechar edição" disabled={busy} onClick={closeEditor}><X aria-hidden className="size-5" /></button></div>
        <img src={editing.thumbSrc} alt={editing.alt || editing.caption || 'Foto em edição'} className="mb-4 max-h-52 w-full rounded-lg bg-slate-100 object-contain" />
        {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={save}><fieldset disabled={busy} className="grid gap-4"><label className="text-sm">Nome do autor<input autoFocus key={editing.id + '-author'} name="author" className={field} defaultValue={editing.contributor_name ?? ''} maxLength={80} /></label><label className="text-sm">Legenda<textarea key={editing.id + '-caption'} name="caption" className={field} defaultValue={editing.caption ?? ''} rows={3} maxLength={300} /></label>
          <label className="text-sm">Descrição da imagem<input key={editing.id + '-alt'} name="alt" className={field} defaultValue={editing.alt ?? ''} maxLength={300} /></label>
          <label className="text-sm">Álbum<select className={`${field} cursor-pointer`} value={albumId} onChange={(e) => setAlbumId(e.target.value)}><option value="">Sem álbum</option>{albumOptions.map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}</select></label>
          {creatingAlbum ? <div className="rounded-lg bg-slate-50 p-3"><label className="text-sm">Nome do novo álbum<input className={field} value={albumTitle} maxLength={100} onChange={(e) => setAlbumTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addAlbum() } }} /></label><div className="mt-2 flex gap-2"><button type="button" className={button} disabled={!albumTitle.trim()} onClick={() => void addAlbum()}>Criar e selecionar</button><button type="button" className={button} onClick={() => setCreatingAlbum(false)}>Cancelar criação</button></div></div> : <button type="button" className={`${button} justify-self-start`} onClick={() => { setCreatingAlbum(true); setAlbumTitle('') }}>+ Criar novo álbum</button>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4"><div>{editing.status !== 'pending' && <button type="button" className={`${button} text-amber-800`} onClick={() => void moderate([editing.id], 'pending')}>Tornar pendente</button>}</div><div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={closeEditor}>Cancelar</button><button className={primaryButton}>{busy ? 'Salvando…' : 'Salvar alterações'}</button></div></div>
        </fieldset></form>
      </div>
    </dialog>}
    {loading ? <p role="status">Carregando fotos…</p> : <fieldset disabled={busy} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4"><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" disabled={!visible.length || busy} checked={visible.length > 0 && selected.length === visible.length} ref={(node) => { if (node) node.indeterminate = selected.length > 0 && selected.length < visible.length }} onChange={(e) => setSelected(e.target.checked ? visible.map((row) => row.id) : [])} />{selected.length ? `${selected.length} selecionado(s)` : `${visible.length} foto(s)`}</label>{selected.length > 0 && <div className="flex flex-wrap gap-2"><button className={button} onClick={() => { setMoving(true); setDestination('') }}>Mover selecionadas</button>{(Object.keys(labels) as Status[]).filter((value) => value !== status && value !== 'pending').map((value) => <button key={value} className={button} onClick={() => void moderate(selected, value)}>{value === 'approved' ? 'Aprovar' : 'Reprovar'} selecionados</button>)}</div>}</div>
      {moving && selected.length > 0 && <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 bg-slate-50 p-4"><label className="text-sm">Álbum de destino<select className={`${field} cursor-pointer`} value={destination} onChange={(e) => setDestination(e.target.value)}><option value="">Sem álbum</option>{albumOptions.map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}</select></label><button className={button} disabled={selected.length > 500} onClick={() => void moveSelected()}>Mover {selected.length} foto(s)</button><button className={button} onClick={() => setMoving(false)}>Cancelar</button>{selected.length > 500 && <p className="text-sm">Selecione até 500 fotos por vez.</p>}</div>}
      <ul className="grid grid-cols-1 gap-4 bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map((row) => <li key={row.id} className={`flex min-w-0 flex-col overflow-hidden rounded-xl border bg-white transition-shadow ${selected.includes(row.id) ? 'border-slate-500 ring-2 ring-slate-400' : 'border-slate-200 hover:shadow-md'}`}>
        <div className="relative bg-slate-100">
          <a href={row.src} target="_blank" rel="noreferrer" aria-label={`Abrir foto de ${row.contributor_name || 'autor não informado'}`} className="block aspect-[4/3]">
            <img loading="lazy" onError={(e) => { if (e.currentTarget.getAttribute('src') !== row.src) e.currentTarget.src = row.src }} src={row.thumbSrc} alt={row.alt || row.caption || 'Foto enviada'} className="size-full object-contain" />
          </a>
          <label className="absolute top-2 left-2 flex size-9 cursor-pointer items-center justify-center rounded-lg bg-white/95 shadow-sm">
            <input type="checkbox" className="size-4 cursor-pointer accent-ink" aria-label={`Selecionar foto de ${row.contributor_name || 'autor não informado'}`} checked={selected.includes(row.id)} onChange={(e) => setSelected((ids) => e.target.checked ? [...ids, row.id] : ids.filter((id) => id !== row.id))} />
          </label>
        </div>
        <div className="flex flex-1 flex-col p-3">
          <p className="break-words text-sm font-medium">{row.contributor_name || 'Autor não informado'}</p>
          <p className="mt-1 break-words text-xs text-slate-500">{new Date(row.created_at).toLocaleDateString('pt-BR')} · {albums.find((album) => album.id === row.album_id)?.title || 'Sem álbum'}</p>
          <p className="my-3 whitespace-pre-wrap break-words text-sm text-slate-600">{row.caption || 'Sem legenda'}</p>
          <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <button className={button} onClick={() => { setEditing(row); setAlbumId(row.album_id ?? ''); setCreatingAlbum(false); setError(''); setNotice('') }}>Editar</button>
            {(Object.keys(labels) as Status[]).filter((value) => value !== row.status && value !== 'pending').map((value) => <button key={value} className={button} onClick={() => void moderate([row.id], value)}>{value === 'approved' ? 'Aprovar' : 'Reprovar'}</button>)}
          </div>
        </div>
      </li>)}</ul>
      {!visible.length && <p className="p-8 text-center text-sm text-slate-500">Nenhuma foto encontrada para os filtros selecionados.</p>}
    </fieldset>}
  </section>
}
