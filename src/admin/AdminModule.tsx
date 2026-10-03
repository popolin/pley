import { pendingMessageCount } from './messageApi'
import { AdminMessages } from './AdminMessages'
import { pendingPhotoCount } from './photoApi'
import { AdminPhotos } from './AdminPhotos'
import { pendingAudioCount } from './audioApi'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { currentAdmin, login, logout, type Admin } from './api'
import { AdminAudios } from './AdminAudios'
import { AdminUsers } from './AdminUsers'
import { supabase } from '../lib/supabase'
import { Link } from '../components/Link'
import { navigate } from '../lib/router'

const input = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm'
const button = 'cursor-pointer rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50'
const secondary = 'cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm transition hover:bg-slate-100'
const kinds = { message: 'Mensagem', photo: 'Foto', audio: 'Áudio' }

export function AdminModule({ path }: { path: string }) {
  const [user, setUser] = useState<Admin | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const refreshUser = useCallback(async () => {
    try { setUser(await currentAdmin()); setError('') }
    catch (e) { setUser(null); setError(e instanceof Error ? e.message : 'Não foi possível verificar o acesso.') }
    finally { setChecking(false) }
  }, [])
  useEffect(() => {
    let disposed = false
    let generation = 0
    const check = async () => {
      const version = ++generation
      try { const admin = await currentAdmin(); if (!disposed && version === generation) { setUser(admin); setError('') } }
      catch (e) { if (!disposed && version === generation) { setUser(null); setError(e instanceof Error ? e.message : 'Falha ao verificar acesso.') } }
      finally { if (!disposed && version === generation) setChecking(false) }
    }
    void check()
    const subscription = supabase?.auth.onAuthStateChange(() => { setTimeout(() => { if (!disposed) void check() }, 0) }).data.subscription
    const interval = window.setInterval(() => void check(), 60000)
    window.addEventListener('focus', check)
    return () => { disposed = true; subscription?.unsubscribe(); clearInterval(interval); window.removeEventListener('focus', check) }
  }, [])
  useEffect(() => {
    if (checking) return
    if (!user && path !== '/login') navigate('/login')
    if (user && path === '/login') navigate('/admin')
  }, [checking, user, path])
  if (checking) return <main className="container-page py-20"><p role="status">{error || 'Carregando…'}</p></main>
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="font-serif text-2xl font-semibold">Pley <span className="ml-2 font-sans text-xs font-normal text-ink-muted">Administração</span></Link>
          <div className="flex items-center gap-4 text-sm"><Link href="/" className="hover:underline">Ver site</Link>{user && <button className={secondary} onClick={() => { void logout().then(() => { setUser(null); navigate('/login') }).catch((e) => setError(e.message)) }}>Sair</button>}</div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8">
        {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
        {!user ? <Login onLogin={setUser} /> : <Dashboard key={user.id} user={user} onAdminChanged={refreshUser} />}
      </main>
    </div>
  )
}

function Login({ onLogin }: { onLogin: (admin: Admin) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    setBusy(true); setError('')
    try {
      onLogin(await login(String(fields.get('email')), String(fields.get('password'))))
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível entrar. Tente novamente.') }
    finally { setBusy(false) }
  }
  return <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
    <p className="eyebrow">Área administrativa</p><h1 className="heading mt-3">Boas-vindas</h1><p className="mt-3 text-sm text-ink-soft">Entre para cuidar das lembranças compartilhadas.</p>
    <form onSubmit={submit} className="mt-6 grid gap-4">
      <label className="text-sm">E-mail<input className={input} name="email" type="email" autoComplete="username" required disabled={busy} /></label>
      <label className="text-sm">Senha<input className={input} name="password" type="password" autoComplete="current-password" required disabled={busy} /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button className={button} disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
    </form>
  </section>
}

function Dashboard({ user, onAdminChanged }: { user: Admin; onAdminChanged: () => Promise<void> }) {
  const [audioPending, setAudioPending] = useState<number | null | undefined>(undefined)
  const countRequest = useRef(0)
  const refreshAudioPending = useCallback(async () => {
    const request = ++countRequest.current
    try {
      const count = await pendingAudioCount()
      if (request === countRequest.current) setAudioPending(count)
    } catch { if (request === countRequest.current) setAudioPending(null) }
  }, [])
  useEffect(() => {
    const counter = countRequest
    const initial = window.setTimeout(() => void refreshAudioPending(), 0)
    const timer = window.setInterval(() => void refreshAudioPending(), 60000)
    window.addEventListener('focus', refreshAudioPending)
    return () => { ++counter.current; clearTimeout(initial); clearInterval(timer); window.removeEventListener('focus', refreshAudioPending) }
  }, [refreshAudioPending])
  const [photoPending, setPhotoPending] = useState<number | null | undefined>(undefined)
  const photoCountRequest = useRef(0)
  const refreshPhotoPending = useCallback(async () => {
    const request = ++photoCountRequest.current
    try {
      const count = await pendingPhotoCount()
      if (request === photoCountRequest.current) setPhotoPending(count)
    } catch { if (request === photoCountRequest.current) setPhotoPending(null) }
  }, [])
  useEffect(() => {
    const counter = photoCountRequest
    const initial = window.setTimeout(() => void refreshPhotoPending(), 0)
    const timer = window.setInterval(() => void refreshPhotoPending(), 60000)
    window.addEventListener('focus', refreshPhotoPending)
    return () => { ++counter.current; clearTimeout(initial); clearInterval(timer); window.removeEventListener('focus', refreshPhotoPending) }
  }, [refreshPhotoPending])
  const [messagePending, setMessagePending] = useState<number | null | undefined>(undefined)
  const messageCountRequest = useRef(0)
  const refreshMessagePending = useCallback(async () => {
    const request = ++messageCountRequest.current
    try {
      const count = await pendingMessageCount()
      if (request === messageCountRequest.current) setMessagePending(count)
    } catch { if (request === messageCountRequest.current) setMessagePending(null) }
  }, [])
  useEffect(() => {
    const counter = messageCountRequest
    const initial = window.setTimeout(() => void refreshMessagePending(), 0)
    const timer = window.setInterval(() => void refreshMessagePending(), 60000)
    window.addEventListener('focus', refreshMessagePending)
    return () => { ++counter.current; clearTimeout(initial); clearInterval(timer); window.removeEventListener('focus', refreshMessagePending) }
  }, [refreshMessagePending])
  const [tab, setTab] = useState<'publications' | 'admins'>('admins')
  const [kind, setKind] = useState('message')
  return <div className="grid items-start gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
    <aside className="lg:sticky lg:top-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Gerenciamento</p>
      <nav aria-label="Seções administrativas" className="flex flex-wrap gap-2 lg:flex-col">
        {Object.entries(kinds).map(([value, label]) => <button key={value} aria-pressed={tab === 'publications' && kind === value} className={`${tab === 'publications' && kind === value ? button : secondary} flex items-center justify-between gap-3 text-left`} onClick={() => { setKind(value); setTab('publications') }}><span>{label}</span><span aria-live="polite" title={(value === 'audio' ? audioPending : value === 'photo' ? photoPending : messagePending) === null ? 'Não foi possível consultar as pendências. Atualize a página para tentar novamente.' : 'Pendentes de avaliação'} className="rounded bg-slate-500/15 px-2 py-0.5 text-xs tabular-nums">{value === 'audio' ? (audioPending === undefined ? '…' : audioPending ?? '!') : value === 'photo' ? (photoPending === undefined ? '…' : photoPending ?? '!') : (messagePending === undefined ? '…' : messagePending ?? '!')}</span></button>)}
        <button aria-pressed={tab === 'admins'} className={`${tab === 'admins' ? button : secondary} text-left`} onClick={() => { setTab('admins') }}>Administradores</button>
      </nav>
      <p className="mt-3 hidden text-xs leading-relaxed text-slate-500 lg:block">Os números indicam itens aguardando revisão.</p>
    </aside>
    <div className="min-w-0">
      <div className="mb-6"><p className="text-xs text-slate-500">Administração / {tab === 'admins' ? 'Acessos' : 'Publicações'}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{tab === 'admins' ? 'Administradores' : kind === 'message' ? 'Mensagens' : kind === 'photo' ? 'Fotos' : 'Áudios'}</h1><p className="mt-1 text-sm text-slate-500">{tab === 'admins' ? 'Gerencie quem pode acessar o painel.' : `Olá, ${user.name}. Revise e organize as contribuições recebidas.`}</p></div>
    {tab === 'publications' ? kind === 'audio' ? <AdminAudios onPendingChanged={refreshAudioPending} /> : kind === 'photo' ? <AdminPhotos onPendingChanged={refreshPhotoPending} /> : <AdminMessages onPendingChanged={refreshMessagePending} /> : <AdminUsers currentId={user.id} onChanged={onAdminChanged} />}
    </div>
  </div>
}

