import { User } from 'lucide-react'

interface AvatarProps {
  src?: string
  /** Tailwind size classes, e.g. "size-9" */
  className?: string
}

export function Avatar({ src, className = 'size-9' }: AvatarProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-[#eebd88] via-[#c8967a] to-[#5b6177] ring-2 ring-white/80 ${className}`}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <User aria-hidden strokeWidth={1.5} className="size-1/2 text-white/80" />
      )}
    </span>
  )
}
