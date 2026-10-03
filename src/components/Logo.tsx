import { Link } from './Link'

export function Logo({ className = 'text-ink' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Pley — início"
      className={`font-script text-[2.6rem] leading-none transition-colors ${className}`}
    >
      Pley
    </Link>
  )
}
