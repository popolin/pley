import { Camera, CircleAlert, Mic, PenLine, Video, X, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AudioUploadForm } from './AudioUploadForm'
import { MessageForm } from './MessageForm'
import { PhotoUploadForm } from './PhotoUploadForm'

const options: { id: string; label: string; hint: string; icon: LucideIcon }[] = [
  { id: 'foto', label: 'Foto', hint: 'Um momento registrado', icon: Camera },
  { id: 'video', label: 'Vídeo', hint: 'Imagens em movimento', icon: Video },
  { id: 'audio', label: 'Áudio', hint: 'Áudio com a voz do Pley', icon: Mic },
  { id: 'mensagem', label: 'Mensagem', hint: 'Uma mensagem de carinho', icon: PenLine },
]

interface ContributeModalProps {
  open: boolean
  onClose: () => void
  initialChoice?: 'mensagem'
}

export function ContributeModal({ open, onClose, initialChoice }: ContributeModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [choice, setChoice] = useState<string | null>(initialChoice ?? null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      document.body.style.overflow = 'hidden'
    } else if (!open && dialog.open) {
      dialog.close()
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="contribute-title"
      onClose={() => {
        setChoice(null)
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="m-0 mt-auto max-h-[92svh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-cream-50 p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm open:animate-sheet sm:m-auto sm:max-w-lg sm:rounded-3xl sm:open:animate-pop"
    >
      <div className="relative px-6 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-9">
        <div aria-hidden className="mx-auto mb-5 h-1 w-10 rounded-full bg-cream-300 sm:hidden" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-full text-ink-soft transition hover:bg-cream-200"
        >
          <X className="size-5" />
        </button>

        <p className="eyebrow">Contribua</p>
        <h2
          id="contribute-title"
          className="mt-2 pr-8 font-serif text-2xl leading-snug font-medium sm:text-[1.7rem]"
        >
          Tem alguma lembrança do Pley que gostaria de compartilhar?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Sua contribuição ajuda a manter a memória dele viva e a compartilhá-la com amigos e
          familiares.
        </p>
        {choice === 'foto' ? (
          <PhotoUploadForm onBack={() => setChoice(null)} onClose={onClose} />
        ) : choice === 'audio' ? (
          <AudioUploadForm onBack={() => setChoice(null)} onClose={onClose} />
        ) : choice === 'mensagem' ? (
          <MessageForm onBack={() => setChoice(null)} onClose={onClose} />
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3">
          {options.map(({ id, label, hint, icon: Icon }) => {
            const isSelected = choice === id
            return (
              <button
                key={id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setChoice(id)}
                className={`flex min-h-32 flex-col items-start justify-between rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-ink bg-white shadow-md'
                    : 'border-cream-300 bg-white/60 hover:border-ink/40 hover:bg-white'
                }`}
              >
                <span
                  className={`inline-flex size-10 items-center justify-center rounded-full ${
                    isSelected ? 'bg-ink text-white' : 'bg-accent-soft/70 text-accent'
                  }`}
                >
                  <Icon aria-hidden strokeWidth={1.75} className="size-5" />
                </span>
                <span>
                  <span className="block font-medium">{label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-muted">{hint}</span>
                </span>
              </button>
            )
          })}
        </div>

            <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>
                Este é um espaço de carinho e respeito. Por favor, não envie conteúdo para fazer baderna
                ou prejudicar outras pessoas.
              </span>
            </p>
          </>
        )}
      </div>
    </dialog>
  )
}
