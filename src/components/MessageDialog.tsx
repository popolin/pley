import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { formatDate } from '../lib/date'
import type { Message } from '../types'

interface MessageDialogProps {
  message: Message | null
  onClose: () => void
}

export function MessageDialog({ message, onClose }: MessageDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const open = message !== null

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
      aria-labelledby="message-author"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="m-auto max-h-[85svh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl bg-cream-50 p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm open:animate-pop"
    >
      {message && (
        <div className="relative p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full text-ink-soft transition hover:bg-cream-200"
          >
            <X className="size-5" />
          </button>
          <p id="message-author" className="pr-8 font-medium">
            {message.author}
            <span className="font-normal text-ink-muted">, {message.relation.toLowerCase()}</span>
          </p>
          <time dateTime={message.date} className="text-xs text-ink-muted">
            {formatDate(message.date)}
          </time>
          <p className="mt-4 leading-relaxed whitespace-pre-line text-ink-soft">{message.text}</p>
        </div>
      )}
    </dialog>
  )
}
