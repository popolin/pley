import { useEffect, useState, type FormEvent } from 'react'
import { editAudio, listAudios, setAudioStatus, type AdminAudio } from './audioApi'
import type { Status } from './store'
const button = 'cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
const field = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm'
const labels: Record<Status, string> = { pending: 'Pendentes', approved: 'Aprovados', rejected: 'Reprovados' }
export function AdminAudios({ onPendingChanged }: { onPendingChanged: () => Promise<void> }) {
  const [rows, setRows] = useState<AdminAudio[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [status, setStatus] = useState<Status>('pending')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<AdminAudio | null>(null)
  useEffect(() => {
    let active = true
    listAudios().then((data) => { if (active) setRows(data) }).catch((e) => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  async function reload() {
    setLoading(true); setError(''); setSelected([])
    try { setRows(await listAudios()); void onPendingChanged() } catch (e) { setRows([]); setError(e instanceof Error ? e.message : 'Falha ao carregar.') }
    finally { setLoading(false) }
  }
  async function moderate(ids: string[], next: Status) {
    if (busy || !ids.length) return
    setBusy(true); setError(''); setNotice('')
    try {
      await setAudioStatus(ids, next)
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
    const caption = String(fields.get('caption')).trim()
    setBusy(true); setError(''); setNotice('')
    try {
      await editAudio(editing.id, author, caption)
      setRows((previous) => previous.map((row) => row.id === editing.id ? { ...row, contributor_name: author, caption } : row))
      setEditing(null); setNotice('Áudio atualizado.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.') }
    finally { setBusy(false) }
  }
  const visible = rows.filter((row) => row.status === status && `${row.contributor_name ?? ''} ${row.caption ?? ''}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
  return <section>
    <fieldset disabled={busy || loading} className="mb-4 flex flex-wrap gap-2">{(Object.keys(labels) as Status[]).map((value) => <button key={value} aria-pressed={status === value} className={`${button} ${status === value ? 'ring-2 ring-slate-500' : ''}`} onClick={() => { setStatus(value); setSelected([]); setEditing(null) }}>{labels[value]} <span className="ml-2 tabular-nums">{rows.filter((row) => row.status === value).length}</span></button>)}</fieldset>
    <div className="mb-5 flex items-end gap-3"><label className="flex-1 text-sm">Buscar<input className={field} value={search} disabled={busy || loading} placeholder="Nome ou legenda" onChange={(e) => { setSearch(e.target.value); setSelected([]) }} /></label><button className={button} disabled={busy || loading || !!editing} onClick={() => void reload()}>Atualizar</button></div>
    {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}<p role="status" className="mb-3 text-sm text-green-800">{notice}</p>
    {editing && <form onSubmit={save} className="mb-5 rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-3 font-semibold">Editar áudio</h2><fieldset disabled={busy} className="grid gap-4"><label className="text-sm">Nome do autor<input autoFocus key={editing.id + '-author'} name="author" className={field} defaultValue={editing.contributor_name ?? ''} maxLength={80} /></label><label className="text-sm">Legenda<textarea key={editing.id + '-caption'} name="caption" className={field} defaultValue={editing.caption ?? ''} rows={3} maxLength={300} /></label><div className="flex gap-2"><button className={button}>{busy ? 'Salvando…' : 'Salvar alterações'}</button><button type="button" className={button} onClick={() => setEditing(null)}>Cancelar</button></div></fieldset></form>}
    {loading ? <p role="status">Carregando áudios…</p> : <fieldset disabled={busy} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4"><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" disabled={!visible.length || busy} checked={visible.length > 0 && selected.length === visible.length} ref={(node) => { if (node) node.indeterminate = selected.length > 0 && selected.length < visible.length }} onChange={(e) => setSelected(e.target.checked ? visible.map((row) => row.id) : [])} />{selected.length ? `${selected.length} selecionado(s)` : `${visible.length} áudio(s)`}</label>{selected.length > 0 && <div className="flex flex-wrap gap-2">{(Object.keys(labels) as Status[]).filter((value) => value !== status).map((value) => <button key={value} className={button} onClick={() => void moderate(selected, value)}>{value === 'approved' ? 'Aprovar' : value === 'rejected' ? 'Reprovar' : 'Voltar para pendentes'} selecionados</button>)}</div>}</div>
      <ul className="divide-y divide-slate-200">{visible.map((row) => <li key={row.id} className="flex items-start gap-3 p-4"><input type="checkbox" className="mt-1 cursor-pointer" aria-label={`Selecionar áudio de ${row.contributor_name || 'autor não informado'}`} checked={selected.includes(row.id)} onChange={(e) => setSelected((ids) => e.target.checked ? [...ids, row.id] : ids.filter((id) => id !== row.id))} /><div className="min-w-0 flex-1"><p className="font-medium">{row.contributor_name || 'Autor não informado'}</p><p className="text-xs text-slate-500">{new Date(row.created_at).toLocaleDateString('pt-BR')} · {Number(row.play_count ?? 0).toLocaleString('pt-BR')} reproduções</p><p className="my-2 whitespace-pre-wrap break-words text-sm text-slate-600">{row.caption || 'Sem legenda'}</p><audio controls preload="none" src={row.src} aria-label={`Ouvir áudio de ${row.contributor_name || 'autor não informado'}`} className="max-w-full" /><div className="mt-3 flex flex-wrap gap-2"><button className={button} onClick={() => { setEditing(row); setNotice('') }}>Editar</button>{(Object.keys(labels) as Status[]).filter((value) => value !== row.status).map((value) => <button key={value} className={button} onClick={() => void moderate([row.id], value)}>{value === 'approved' ? 'Aprovar' : value === 'rejected' ? 'Reprovar' : 'Voltar para pendentes'}</button>)}</div></div></li>)}</ul>
      {!visible.length && <p className="p-8 text-center text-sm text-slate-500">Nenhum áudio encontrado.</p>}
    </fieldset>}
  </section>
}
