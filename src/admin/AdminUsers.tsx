import { useEffect, useState, type FormEvent } from 'react'
import { changeAdminStatus, listAdmins, saveAdmin, type Admin } from './api'
const field = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
const button = 'cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
export function AdminUsers({ currentId, onChanged }: { currentId: string; onChanged: () => Promise<void> }) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Admin | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function refresh() { setAdmins(await listAdmins()) }
  useEffect(() => { let active = true; listAdmins().then((rows) => { if (active) setAdmins(rows) }).catch((e) => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const fields = new FormData(event.currentTarget)
    setBusy(true); setError(''); setNotice('')
    try {
      await saveAdmin({ id: editing && editing !== 'new' ? editing.id : undefined, name: String(fields.get('name')).trim(), email: String(fields.get('email')).trim(), ...(editing === 'new' ? { password: String(fields.get('password')) } : {}) })
      setEditing(null); setNotice('Administrador salvo.'); await refresh(); await onChanged()
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.') }
    finally { setBusy(false) }
  }
  async function toggle(admin: Admin) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      await changeAdminStatus(admin.id, admin.status === 'active' ? 'inactive' : 'active')
      setNotice('Status atualizado.'); await onChanged(); await refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível alterar o status.') }
    finally { setBusy(false) }
  }
  return <section>
    <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm text-slate-500">{admins.length} administrador(es)</p><button className={button} disabled={busy} onClick={() => { setEditing('new'); setError(''); setNotice('') }}>Adicionar administrador</button></div>
    {error && <p role="alert" className="mb-4 text-sm text-red-700">{error} <button className="cursor-pointer underline" onClick={() => { setError(''); void refresh().catch((e) => setError(e.message)) }}>Recarregar lista</button></p>}
    <p role="status" className="mb-3 text-sm text-green-800">{notice}</p>
    {editing && <form key={typeof editing === 'string' ? editing : editing.id} onSubmit={submit} className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">{editing === 'new' ? 'Novo administrador' : 'Editar administrador'}</h2>
      <fieldset disabled={busy} className="grid gap-4">
        <label className="text-sm">Nome<input autoFocus name="name" className={field} defaultValue={editing === 'new' ? '' : editing.name} required maxLength={80} pattern=".*\S.*" /></label>
        <label className="text-sm">E-mail<input name="email" type="email" className={field} defaultValue={editing === 'new' ? '' : editing.email} readOnly={editing !== 'new'} aria-readonly={editing !== 'new'} required maxLength={254} />{editing !== 'new' && <span className="mt-1 block text-xs text-slate-500">O e-mail não pode ser alterado.</span>}</label>
        {editing === 'new' && <label className="text-sm">Senha inicial<input name="password" type="password" autoComplete="new-password" className={field} required minLength={8} maxLength={128} /><span className="mt-1 block text-xs text-slate-500">Entre 8 e 128 caracteres.</span></label>}
        <div className="flex gap-2"><button className={button}>{busy ? 'Salvando…' : 'Salvar'}</button><button type="button" className={button} onClick={() => setEditing(null)}>Cancelar</button></div>
      </fieldset>
    </form>}
    {loading ? <p role="status">Carregando administradores…</p> : <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">{admins.map((admin) => <li key={admin.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="min-w-0"><p className="font-medium">{admin.name}{admin.id === currentId ? ' (você)' : ''}</p><p className="break-all text-sm text-slate-500">{admin.email}</p><span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs ${admin.status === 'active' ? 'bg-green-50 text-green-800' : 'bg-slate-100 text-slate-600'}`}>{admin.status === 'active' ? 'Ativo' : 'Inativo'}</span></div>
      <div className="flex gap-2"><button className={button} disabled={busy} onClick={() => { setEditing(admin); setError('') }}>Editar</button><button className={button} disabled={busy || (admin.status === 'active' && admins.filter((a) => a.status === 'active').length === 1)} onClick={() => void toggle(admin)}>{admin.status === 'active' ? 'Desativar' : 'Reativar'}</button></div>
    </li>)}</ul>}
    <p className="mt-3 text-xs text-slate-500">Administradores inativos permanecem no histórico e não podem acessar o painel. O último administrador ativo não pode ser desativado.</p>
  </section>
}
