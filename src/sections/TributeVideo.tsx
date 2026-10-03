import { Play } from 'lucide-react'
import { useState } from 'react'
import { Photo } from '../components/Photo'
import { tribute } from '../data/mock'

export function TributeVideo() {
  const [started, setStarted] = useState(false)

  return (
    <section id="homenagem" className="bg-cream-50 py-8 sm:py-12">
      <div className="container-page">
        <div className="grid overflow-hidden rounded-3xl bg-cream-100 shadow-[0_20px_50px_-20px_rgb(27_36_51/0.25)] lg:grid-cols-[1.75fr_1fr]">
          <div className="relative aspect-video lg:aspect-auto lg:min-h-[22rem]">
            {started && tribute.youtubeId ? (
              <iframe
                className="absolute inset-0 size-full"
                src={`https://www.youtube-nocookie.com/embed/${tribute.youtubeId}?autoplay=1&rel=0`}
                title="Uma homenagem ao Pley"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : (
              <Photo photo={tribute.thumbnail} showIcon={false} className="absolute inset-0">
                <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink/45 to-transparent" />
                <button
                  type="button"
                  onClick={() => setStarted(true)}
                  aria-label="Reproduzir homenagem"
                  className="absolute top-1/2 left-1/2 inline-flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink/85 text-white shadow-2xl ring-8 ring-white/25 backdrop-blur transition hover:scale-105 sm:size-24"
                >
                  <Play aria-hidden className="size-8 translate-x-0.5 fill-current" />
                </button>
                {started && (
                  <p className="absolute inset-x-4 bottom-4 rounded-xl bg-white/90 px-4 py-2.5 text-center text-sm text-ink-soft backdrop-blur">
                    O vídeo da homenagem será publicado em breve.
                  </p>
                )}
              </Photo>
            )}
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-10">
            <p className="eyebrow">Vídeo</p>
            <h2 className="heading mt-3">Uma homenagem ao Pley</h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
              Uma montagem com momentos, fotos e memórias que mostram um pouco de quem ele foi.
            </p>
            <p aria-hidden className="mt-6 font-script text-4xl leading-none text-ink">
              Dá o play e lembra com a gente.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
