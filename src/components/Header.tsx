import { AudioLines, Menu, Pause, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { site } from '../data/mock'
import { useActiveSection } from '../hooks/useActiveSection'
import { useVoiceMemories } from '../hooks/useVoiceMemories'
import { useVoicePlayer } from '../hooks/useVoicePlayer'
import { Avatar } from './Avatar'
import { Logo } from './Logo'

const links = [
  { id: 'inicio', label: 'Início' },
  { id: 'fotos', label: 'Fotos' },
  { id: 'mensagens', label: 'Mensagens' },
]
const sectionIds = links.map((l) => l.id)

function VoiceButton() {
  const { memories, consume } = useVoiceMemories()
  const { current, playId, playing, needsAttention, progress, toggle } = useVoicePlayer(memories, consume)
  const [hiddenPlayId, setHiddenPlayId] = useState(0)
  const hasInfo = Boolean(current?.contributorName || current?.caption)
  const showToast = hasInfo && hiddenPlayId !== playId

  useEffect(() => {
    if (!showToast) return
    const id = setTimeout(() => setHiddenPlayId(playId), 4500)
    return () => clearTimeout(id)
  }, [showToast, playId])

  if (!memories.length && !current) return null

  return (
    <div className="relative">
      {showToast && (
        <div
          role="status"
          className="fixed top-[4.25rem] right-4 left-4 animate-fade rounded-xl bg-white/20 px-3 py-2 text-xs leading-snug text-white/90 backdrop-blur-md sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-2 sm:w-max sm:max-w-[16rem]"
        >
          {current?.contributorName && <p className="font-medium text-white">{current.contributorName}</p>}
          {current?.caption && <p className="text-white/75">{current.caption}</p>}
        </div>
      )}
      <VoiceButtonBody playing={playing} needsAttention={needsAttention} progress={progress} toggle={toggle} />
    </div>
  )
}

function VoiceButtonBody({
  playing,
  needsAttention,
  progress,
  toggle,
}: {
  playing: boolean
  needsAttention: boolean
  progress: number
  toggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? 'Pausar a voz do Pley' : 'Ouvir a voz do Pley'}
      aria-pressed={playing}
      data-attention={needsAttention || undefined}
      className="voice-player relative flex h-10 cursor-pointer items-center gap-1.5 overflow-hidden rounded-full bg-white/20 pr-3 pl-1 backdrop-blur-sm transition hover:bg-white/30 md:h-11"
    >
      <Avatar src={site.avatar} className="size-8 md:size-10" />
      {playing ? (
        <Pause aria-hidden strokeWidth={1.75} className="size-4 fill-current" />
      ) : (
        <AudioLines aria-hidden strokeWidth={1.75} className="voice-waveform size-4" />
      )}
      <span
        aria-hidden
        style={{ width: `${progress * 100}%` }}
        className="absolute inset-x-0 bottom-0 h-0.5 bg-white/80"
      />
    </button>
  )
}

export function Header({ isHome, onContribute }: { isHome: boolean; onContribute: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const sectionActive = useActiveSection(sectionIds)
  // Section anchors live on the home page; elsewhere they point back to it.
  const active = isHome ? sectionActive : 'fotos'
  const base = isHome ? '' : '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Over the hero the photo shows through; after scrolling the header carries its own copy of it.
  const showPhoto = scrolled || menuOpen || !isHome

  return (
    <header className="fixed inset-x-0 top-0 z-40 text-white">
      <div
        aria-hidden
        style={{ backgroundImage: `url(${site.heroPhoto.src})` }}
        className={`absolute inset-0 -z-10 bg-[length:max(100%,900px)_auto] bg-[position:58%_0%] transition-opacity duration-300 ${
          showPhoto ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" />
      </div>

      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo className="text-white" />

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-9">
            {links.map((l) => (
              <li key={l.id}>
                <a
                  href={`${base}#${l.id}`}
                  aria-current={active === l.id ? 'page' : undefined}
                  className={`relative py-1 text-sm transition-opacity after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-current after:transition-opacity ${
                    active === l.id
                      ? 'font-medium after:opacity-100'
                      : 'opacity-80 after:opacity-0 hover:opacity-100'
                  }`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <VoiceButton />
          <button
            type="button"
            onClick={onContribute}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-cream-100"
          >
            Contribua
            <Plus aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            className="-mr-2 inline-flex size-10 items-center justify-center rounded-full md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="menu-mobile"
          aria-label="Principal"
          className="animate-pop border-t border-white/15 bg-ink/90 backdrop-blur-md md:hidden"
        >
          <ul className="container-page py-3">
            {links.map((l) => (
              <li key={l.id}>
                <a
                  href={`${base}#${l.id}`}
                  onClick={() => setMenuOpen(false)}
                  className={`block border-b border-white/15 py-3.5 font-serif text-xl last:border-0 ${
                    active === l.id ? 'text-white' : 'text-white/70'
                  }`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
