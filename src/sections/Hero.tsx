import { Heart, Play } from 'lucide-react'
import { Photo } from '../components/Photo'
import { site } from '../data/mock'

export function Hero() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden bg-ink text-white">
      <Photo photo={site.heroPhoto} showIcon={false} className="hero-photo absolute -z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-ink/90 via-ink/30 to-transparent md:bg-linear-to-r md:from-ink md:via-ink/40 md:via-45% md:to-transparent xl:from-ink/80 xl:via-ink/25 xl:via-50%" />

      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-32 bg-linear-to-b from-ink/60 to-transparent" />

      <div className="container-page relative flex min-h-[88svh] flex-col justify-end pt-28 pb-14 md:min-h-[44rem] md:justify-center md:pb-20 xl:min-h-[clamp(32rem,40vw,44rem)] xl:pt-24 xl:pb-12">
        <div className="max-w-xl animate-rise">
          <h1 className="font-serif text-7xl leading-none font-normal tracking-tight sm:text-8xl">
            {site.name}
          </h1>
          <p className="mt-8 origin-left -rotate-2 font-script text-6xl leading-none [text-shadow:0_2px_14px_rgb(0_0_0/0.5)] sm:text-7xl">
            “{site.heroQuote}”
          </p>
          <span aria-hidden className="mt-8 block h-px w-12 bg-white/60" />
          <p className="mt-5 flex items-center gap-2.5 text-sm font-medium tracking-[0.18em] text-white/85">
            <Heart aria-hidden strokeWidth={1.5} className="size-5 text-white/70" />
            <span>{site.life.from}</span>
            <span aria-hidden>—</span>
            <span>{site.life.to}</span>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#fotos"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-medium text-ink shadow-lg transition hover:bg-cream-100"
            >
              Ver lembranças
            </a>
            <a
              href="#homenagem"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-ink/50 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-ink/70"
            >
              <Play aria-hidden className="size-4 fill-current" />
              Assistir homenagem
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
