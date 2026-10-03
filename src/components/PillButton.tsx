import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from './Link'

interface PillButtonProps {
  children: ReactNode
  className?: string
  /** In-app path. Without it the button is inert (wired in later steps). */
  href?: string
  onClick?: () => void
}

export function PillButton({ children, className = '', href, onClick }: PillButtonProps) {
  const classes = `inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-ink shadow-[0_1px_2px_rgb(27_36_51/0.06),0_4px_14px_rgb(27_36_51/0.06)] transition hover:shadow-[0_6px_20px_rgb(27_36_51/0.12)] ${className}`
  const content = (
    <>
      {children}
      <ArrowRight aria-hidden className="size-4" />
    </>
  )

  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={`${classes} cursor-pointer`}>
      {content}
    </button>
  )
}
