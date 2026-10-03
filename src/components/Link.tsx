import type { AnchorHTMLAttributes } from 'react'
import { navigate } from '../lib/router'

// In-app navigation without a reload. Hash links and modified clicks use the browser default.
export function Link({ href = '', onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      {...props}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
        if (!href.startsWith('/') || href.includes('#')) return
        e.preventDefault()
        navigate(href)
      }}
    />
  )
}
