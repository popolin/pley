import { X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { editMessage, listMessages, setMessageStatus, type AdminMessage } from './messageApi'
import type { Status } from './store'
const button = 'cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
const primary = 'cursor-pointer rounded-lg border border-blue-700 bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50'
const field = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm'
const labels: Record<Status, string> = { pending: 'Pendentes', approved: 'Aprovadas', rejected: 'Reprovadas' }

export function AdminMessages({ onPendingChanged }: { onPendingChanged: () => Promise<void> }) {
  const [rows, setRows] = useState<AdminMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [status, setStatus] = useState<Status>('pending')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<AdminMessage | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    let active = true
    listMessages().then((data) => { if (active) setRows(data) }).catch((e) => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!editing) return
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = previousOverflow }
  }, [editing])
  function closeEditor() { if (!busy) setEditing(null) }
  async function reload() {
    setLoading(true); setError(''); setSelected([])
    try { setRows(await listMessages()); void onPendingChanged() }
    catch (e) { setRows([]); setError(e instanceof Error ? e.message : 'Falha ao carregar.') }
    finally { setLoading(false) }
  }
  async function moderate(ids: string[], next: Status) {
    if (busy || !ids.length) return
    setBusy(true); setError(''); setNotice('')
    try {
      await setMessageStatus(ids, next)
      setRows((previous) => previous.map((row) => ids.includes(row.id) ? { ...row, status: next } : row))
      setSelected([]); setEditing(null); setNotice('Status atualizado.'); void onPendingChanged()
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível atualizar.') }
    finally { setBusy(false) }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing || busy) return
    const form = new FormData(event.currentTarget)
    const author = String(form.get('author')).trim()
    const relation = String(form.get('relation')).trim()
    const body = String(form.get('body')).trim()
    setBusy(true); setError(''); setNotice('')
    try {
      await editMessage(editing.id, author, relation, body)
      setRows((previous) => previous.map((row) => row.id === editing.id ? { ...row, author_name: author, relation, body } : row))
      setEditing(null); setNotice('Mensagem atualizada.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.') }
    finally { setBusy(false) }
  }
  const visible = rows.filter((row) => row.status === status && `${row.author_name} ${row.relation} ${row.body}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
  return <section>
    <fieldset disabled={busy || loading} className="mb-4 flex flex-wrap gap-2">{(Object.keys(labels) as Status[]).map((value) => <button key={value} aria-pressed={status === value} className={`${button} ${status === value ? 'ring-2 ring-slate-500' : ''}`} onClick={() => { setStatus(value); setSelected([]); setEditing(null) }}>{labels[value]} <span className="ml-2 tabular-nums">{rows.filter((row) => row.status === value).length}</span></button>)}</fieldset>
    <div className="mb-5 flex items-end gap-3"><label className="flex-1 text-sm">Buscar<input className={field} value={search} disabled={busy || loading} placeholder="Nome ou texto" onChange={(e) => { setSearch(e.target.value); setSelected([]) }} /></label><button className={button} disabled={busy || loading || !!editing} onClick={() => void reload()}>Atualizar</button></div>
    {error && !editing && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}<p role="status" className="mb-3 text-sm text-green-800">{notice}</p>
    {editing && <dialog ref={dialogRef} aria-labelledby="message-edit-title" onClose={closeEditor} onCancel={(event) => { if (busy) event.preventDefault() }} onClick={(event) => { if (event.target === event.currentTarget) closeEditor() }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/55 backdrop:backdrop-blur-sm">
      <div className="p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><h2 id="message-edit-title" className="text-lg font-semibold">Editar mensagem</h2><button type="button" className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Fechar edição" disabled={busy} onClick={closeEditor}><X aria-hidden className="size-5" /></button></div>
        {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={save}><fieldset disabled={busy} className="grid gap-4">
          <label className="text-sm">Nome do autor<input autoFocus name="author" className={field} defaultValue={editing.author_name} required maxLength={80} /></label>
          <label className="text-sm">Relação com o Pley<input name="relation" className={field} defaultValue={editing.relation} required maxLength={40} /></label>
          <label className="text-sm">Mensagem<textarea name="body" className={field} defaultValue={editing.body} rows={6} required maxLength={600} /></label>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4"><div>{editing.status !== 'pending' && <button type="button" className={`${button} text-amber-800`} onClick={() => void moderate([editing.id], 'pending')}>Tornar pendente</button>}</div><div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={closeEditor}>Cancelar</button><button className={primary}>{busy ? 'Salvando…' : 'Salvar alterações'}</button></div></div>
        </fieldset></form>
      </div>
    </dialog>}
    {loading ? <p role="status">Carregando mensagens…</p> : <fieldset disabled={busy} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4"><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" disabled={!visible.length || busy} checked={visible.length > 0 && selected.length === visible.length} ref={(node) => { if (node) node.indeterminate = selected.length > 0 && selected.length < visible.length }} onChange={(e) => setSelected(e.target.checked ? visible.map((row) => row.id) : [])} />{selected.length ? `${selected.length} selecionada(s)` : `${visible.length} mensagem(ns)`}</label>{selected.length > 0 && <div className="flex flex-wrap gap-2">{(Object.keys(labels) as Status[]).filter((value) => value !== status && value !== 'pending').map((value) => <button key={value} className={button} onClick={() => void moderate(selected, value)}>{value === 'approved' ? 'Aprovar' : 'Reprovar'} selecionadas</button>)}</div>}</div>
      <ul className="divide-y divide-slate-200">{visible.map((row) => <li key={row.id} className="flex items-start gap-3 p-4"><input type="checkbox" className="mt-1 cursor-pointer" aria-label={`Selecionar mensagem de ${row.author_name}`} checked={selected.includes(row.id)} onChange={(e) => setSelected((ids) => e.target.checked ? [...ids, row.id] : ids.filter((id) => id !== row.id))} /><div className="min-w-0 flex-1"><p className="font-medium">{row.author_name} <span className="font-normal text-slate-500">· {row.relation}</span></p><p className="mt-1 text-xs text-slate-500">{new Date(row.created_at).toLocaleDateString('pt-BR')}</p><p className="my-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{row.body}</p><div className="flex flex-wrap gap-2"><button className={button} onClick={() => { setEditing(row); setError(''); setNotice('') }}>Editar</button>{(Object.keys(labels) as Status[]).filter((value) => value !== row.status && value !== 'pending').map((value) => <button key={value} className={button} onClick={() => void moderate([row.id], value)}>{value === 'approved' ? 'Aprovar' : 'Reprovar'}</button>)}</div></div></li>)}</ul>
      {!visible.length && <p className="p-8 text-center text-sm text-slate-500">Nenhuma mensagem encontrada para este filtro.</p>}
    </fieldset>}
  </section>
}
