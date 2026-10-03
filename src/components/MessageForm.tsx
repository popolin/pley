import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { MAX_MESSAGE_LENGTH, relations, submitMessage } from '../data/messages'
import { readContributor, rememberContributor } from '../lib/contributor'

interface MessageFormProps {
  onBack: () => void
  onClose: () => void
}

const field =
  'rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none focus:border-ink'

export function MessageForm({ onBack, onClose }: MessageFormProps) {
  const [name, setName] = useState(() => readContributor().name)
  const [relation, setRelation] = useState(() => {
    const saved = readContributor().relation
    return relations.some((relation) => relation === saved) ? saved : ''
  })
  const [submitError, setSubmitError] = useState('')
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const valid = name.trim() && relation && text.trim()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!valid || state === 'sending') return
    setState('sending')
    try {
      await submitMessage({ name, relation, text })
      rememberContributor(name, relation)
      setState('done')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível enviar agora.')
      console.error('Message submit failed', error)
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="mt-6 text-center">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-accent-soft/70 text-accent">
          <Check aria-hidden className="size-6" />
        </span>
        <p className="mt-4 font-serif text-xl">Obrigado por compartilhar!</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Sua mensagem foi enviada e aparecerá no site depois de revisada.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition hover:bg-ink/90"
        >
          Fechar
        </button>
      </div>
    )
  }

  const sending = state === 'sending'

  return (
    <form onSubmit={onSubmit} className="mt-5">
      <button
        type="button"
        onClick={onBack}
        disabled={sending}
        className="-ml-1 mb-4 inline-flex items-center gap-1.5 text-sm text-ink-soft transition hover:text-ink disabled:opacity-50"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar
      </button>

      <div className="grid gap-3">
        <input
          type="text"
          value={name}
          required
          maxLength={80}
          disabled={sending}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          aria-label="Seu nome"
          className={field}
        />
        <select
          value={relation}
          required
          disabled={sending}
          onChange={(e) => setRelation(e.target.value)}
          aria-label="Sua relação com o Pley"
          className={`${field} ${relation ? '' : 'text-ink-muted'}`}
        >
          <option value="" disabled>
            Sua relação com o Pley
          </option>
          {relations.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <textarea
          value={text}
          required
          rows={5}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={sending}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva sua mensagem de carinho"
          aria-label="Mensagem"
          className={`${field} resize-none`}
        />
        <p className="-mt-1 text-right text-xs text-ink-muted">
          {text.length}/{MAX_MESSAGE_LENGTH}
        </p>
      </div>

      {state === 'error' && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {submitError || 'Não foi possível enviar agora. Tente novamente em instantes.'}
        </p>
      )}

      <button
        type="submit"
        disabled={!valid || sending}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-50"
      >
        {sending && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {sending ? 'Enviando…' : 'Enviar'}
      </button>
    </form>
  )
}
