import { useState } from 'react'
import { ContributeModal } from '../components/ContributeModal'
import { MessageDialog } from '../components/MessageDialog'
import { PillButton } from '../components/PillButton'
import { useMessages } from '../hooks/useMessages'
import { formatDate } from '../lib/date'
import type { Message } from '../types'

// Roughly what fits in the 4 visible lines of a card.
const isLong = (text: string) => text.length > 150 || text.split('\n').length > 4

export function Messages() {
  const messages = useMessages()
  const [selected, setSelected] = useState<Message | null>(null)
  const [contributeOpen, setContributeOpen] = useState(false)

  return (
    <section id="mensagens" className="bg-cream-100 py-12 sm:py-20">
      <div className="container-page grid gap-8">
        <div>
          <p className="eyebrow">Mensagens</p>
          <h2 className="heading mt-3">Lembranças</h2>
          <div className="mt-4 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <p className="max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
              Um espaço para lembrarmos do que o Pley significou para nós. Toda lembrança é especial.
            </p>
            <PillButton className="shrink-0" onClick={() => setContributeOpen(true)}>
              Deixe sua mensagem
            </PillButton>
          </div>
        </div>

        <ul className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {messages.map((m) => (
            <li key={m.id} className="min-w-0">
              <article className="relative flex h-full min-w-0 flex-col break-words rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgb(27_36_51/0.05),0_8px_24px_-12px_rgb(27_36_51/0.15)] ring-1 ring-inset ring-transparent transition-shadow duration-200 hover:shadow-[0_4px_8px_rgb(27_36_51/0.06),0_12px_28px_-12px_rgb(27_36_51/0.22)] hover:ring-accent/20 focus-within:ring-accent/30">
                <p className="text-sm font-medium">
                  {m.author}
                  <span className="font-normal text-ink-muted">, {m.relation.toLowerCase()}</span>
                </p>
                <time dateTime={m.date} className="text-xs text-ink-muted">
                  {formatDate(m.date)}
                </time>
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed whitespace-pre-line text-ink-soft">
                  {m.text}
                </p>
                {isLong(m.text) && (
                  <button
                    type="button"
                    onClick={() => setSelected(m)}
                    className="mt-2 cursor-pointer self-start text-sm font-medium text-accent after:absolute after:inset-0 after:rounded-2xl hover:underline"
                  >
                    Ler mais
                  </button>
                )}
              </article>
            </li>
          ))}
        </ul>

      </div>
      <MessageDialog message={selected} onClose={() => setSelected(null)} />
      {contributeOpen && (
        <ContributeModal open initialChoice="mensagem" onClose={() => setContributeOpen(false)} />
      )}
    </section>
  )
}
