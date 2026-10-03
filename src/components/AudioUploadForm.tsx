import { ArrowLeft, Check, Loader2, Mic } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { MAX_AUDIO_BYTES, audioAccept, audioContentType, submitAudio } from '../data/audios'
import { readContributor, rememberContributor } from '../lib/contributor'

interface AudioUploadFormProps {
  onBack: () => void
  onClose: () => void
}

export function AudioUploadForm({ onBack, onClose }: AudioUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState(() => readContributor().name)
  const [caption, setCaption] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview])

  function onPick(picked: File | undefined) {
    setState('idle')
    setFileError(null)
    setFile(null)
    if (!picked) return
    if (!audioContentType(picked)) return setFileError('Formato não suportado. Use MP3, M4A, WAV, OGG, OPUS ou AAC.')
    if (picked.size > MAX_AUDIO_BYTES) return setFileError('O arquivo é maior que 20 MB.')
    setFile(picked)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file || state === 'sending') return
    setState('sending')
    try {
      await submitAudio({ file, name, caption })
      rememberContributor(name)
      setState('done')
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Não foi possível enviar agora.')
      console.error('Audio upload failed', error)
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
          O áudio foi enviado e aparecerá no site depois de revisado.
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

      <p className="rounded-2xl bg-cream-100 px-4 py-3 text-sm leading-relaxed text-ink-soft">
        Envie apenas áudios com a <strong className="font-medium text-ink">voz do Pley</strong>: recados,
        mensagens de voz, gravações.
      </p>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/30 bg-white/60 px-4 py-7 text-center transition hover:border-ink/60 hover:bg-white">
        <Mic aria-hidden strokeWidth={1.5} className="size-7 text-accent" />
        <span className="text-sm font-medium">{file ? file.name : 'Escolher áudio'}</span>
        <span className="text-xs text-ink-muted">MP3, M4A, WAV, OGG, OPUS ou AAC · até 20 MB</span>
        <input
          type="file"
          accept={audioAccept}
          disabled={sending}
          className="sr-only"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </label>

      {fileError && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {fileError}
        </p>
      )}
      {preview && <audio controls src={preview} className="mt-3 w-full" />}

      <div className="mt-4 grid gap-3">
        <input
          type="text"
          value={name}
          maxLength={80}
          disabled={sending}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome (opcional)"
          className="rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none focus:border-ink"
        />
        <input
          type="text"
          value={caption}
          maxLength={300}
          disabled={sending}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Descrição (opcional)"
          className="rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none focus:border-ink"
        />
      </div>

      {state === 'error' && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          Não foi possível enviar agora. Tente novamente em instantes.
        </p>
      )}

      <button
        type="submit"
        disabled={!file || sending}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-50"
      >
        {sending && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {sending ? 'Enviando…' : 'Enviar'}
      </button>
    </form>
  )
}
