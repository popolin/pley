import { ArrowLeft, Check, ImagePlus, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { validatePhoto } from '../lib/submission'
import { submitPhoto } from '../data/photos'
import { readContributor, rememberContributor } from '../lib/contributor'
import { useAlbums } from '../hooks/useAlbums'

const MAX_FILES = 5

interface PhotoUploadFormProps {
  onBack: () => void
  onClose: () => void
}

export function PhotoUploadForm({ onBack, onClose }: PhotoUploadFormProps) {
  const [fileError, setFileError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [name, setName] = useState(() => readContributor().name)
  const [caption, setCaption] = useState('')
  const [albumId, setAlbumId] = useState('')
  const albums = useAlbums()
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!files.length || state === 'sending') return
    setState('sending')
    try {
      for (let i = 0; i < files.length; i++) {
        if (i > 0) await new Promise((resolve) => setTimeout(resolve, 1600))
        await submitPhoto({ file: files[i], name, caption, albumId })
      }
      rememberContributor(name)
      setState('done')
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Não foi possível enviar agora.')
      console.error('Photo upload failed', error)
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
          Sua {files.length > 1 ? 'fotos foram enviadas' : 'foto foi enviada'} e aparecerá no site depois de
          revisada.
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

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/30 bg-white/60 px-4 py-7 text-center transition hover:border-ink/60 hover:bg-white">
        <ImagePlus aria-hidden strokeWidth={1.5} className="size-7 text-accent" />
        <span className="text-sm font-medium">Escolher fotos</span>
        <span className="text-xs text-ink-muted">Até {MAX_FILES} fotos por envio · até 8 MB cada</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={sending}
          className="sr-only"
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? [])
            setFileError('')
            try {
              if (picked.length > MAX_FILES) throw new Error('Selecione até 5 fotos por envio.')
              picked.forEach(validatePhoto)
              setFiles(picked)
            } catch (error) { setFiles([]); setFileError(error instanceof Error ? error.message : 'Foto inválida.') }
            setState('idle')
          }}
        />
      </label>

      {fileError && <p role="alert" className="mt-3 text-sm text-red-700">{fileError}</p>}
      {previews.length > 0 && (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {previews.map((url, i) => (
            <li key={url} className="relative aspect-square overflow-hidden rounded-xl bg-cream-200">
              <img src={url} alt="" className="size-full object-cover" />
              {!sending && (
                <button
                  type="button"
                  aria-label="Remover foto"
                  onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 inline-flex size-5 items-center justify-center rounded-full bg-ink/70 text-white"
                >
                  <X aria-hidden className="size-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

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
        {albums.length > 0 && (
          <select
            value={albumId}
            disabled={sending}
            onChange={(e) => setAlbumId(e.target.value)}
            className="rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none focus:border-ink"
          >
            <option value="">Álbum (opcional)</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        )}
        <input
          type="text"
          value={caption}
          maxLength={300}
          disabled={sending}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Legenda (opcional)"
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
        disabled={!files.length || sending}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-50"
      >
        {sending && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {sending ? 'Enviando…' : 'Enviar'}
      </button>
    </form>
  )
}
