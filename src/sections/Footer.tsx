import { Mail } from 'lucide-react'
import { Logo } from '../components/Logo'
import { site } from '../data/mock'

export function Footer() {
  return (
    <footer className="bg-cream-50 py-6 sm:py-7">
      <div className="container-page flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:gap-8 md:text-left">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:text-left">
          <img
            src="/images/pley-illustration.png"
            alt="Ilustração do Pley sorrindo"
            width={88}
            height={88}
            loading="lazy"
            className="size-20 shrink-0 object-contain sm:size-[88px]"
          />
          <div>
            <Logo />
            <p className="mt-1 max-w-xs font-serif text-sm text-ink-soft">{site.tagline}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2 md:items-start">
          <a
          href="mailto:micpopolin@gmail.com"
          className="inline-flex shrink-0 items-center gap-2 text-sm text-ink-soft underline-offset-4 hover:underline"
        >
          <Mail size={17} aria-hidden="true" />
          micpopolin@gmail.com
          </a>
          <a
            href="mailto:marcilio.jrmendes@gmail.com"
            className="inline-flex items-center gap-2 text-sm text-ink-soft underline-offset-4 hover:underline"
          >
            <Mail size={17} aria-hidden="true" />
            marcilio.jrmendes@gmail.com
          </a>
        </div>
      </div>
    </footer>
  )
}
