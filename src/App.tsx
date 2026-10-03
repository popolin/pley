import { lazy, Suspense, useState } from 'react'
import { ContributeModal } from './components/ContributeModal'
import { Header } from './components/Header'
import { usePath } from './lib/router'
import { Gallery } from './pages/Gallery'
import { Home } from './pages/Home'
const AdminModule = lazy(() => import('./admin/AdminModule').then((module) => ({ default: module.AdminModule })))

export default function App() {
  const [contributeOpen, setContributeOpen] = useState(false)
  const path = usePath()
  const isGallery = path === '/fotos' || path.startsWith('/fotos/')

  if (path === '/login' || path === '/admin' || path.startsWith('/admin/')) {
    return <Suspense fallback={<p role="status" className="container-page py-20">Carregando…</p>}><AdminModule path={path} /></Suspense>
  }

  return (
    <>
      <Header isHome={!isGallery} onContribute={() => setContributeOpen(true)} />
      {isGallery ? <Gallery path={path} /> : <Home />}
      <ContributeModal open={contributeOpen} onClose={() => setContributeOpen(false)} />
    </>
  )
}
