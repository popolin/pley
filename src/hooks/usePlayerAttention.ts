import { useEffect, useRef } from 'react'

const REMINDER_INTERVAL_MS = 15000

export function usePlayerAttention(enabled: boolean) {
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const button = ref.current
    if (!button || !enabled) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer: ReturnType<typeof setTimeout> | undefined
    let hovering = false
    let pressed = false
    const cancel = () => {
      clearTimeout(timer)
      delete button.dataset.animating
    }
    const schedule = () => {
      cancel()
      if (motion.matches || document.hidden || hovering || pressed || button.matches(':focus-within')) return
      timer = setTimeout(() => { button.dataset.animating = 'true' }, REMINDER_INTERVAL_MS)
    }
    const enter = (event: PointerEvent) => { if (event.pointerType !== 'touch') { hovering = true; cancel() } }
    const leave = () => { hovering = false; schedule() }
    const down = () => { pressed = true; cancel() }
    const up = () => { pressed = false; schedule() }
    const end = (event: AnimationEvent) => { if (event.target === button) schedule() }
    button.addEventListener('pointerenter', enter)
    button.addEventListener('pointerleave', leave)
    button.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    button.addEventListener('focus', cancel)
    button.addEventListener('blur', schedule)
    button.addEventListener('animationend', end)
    motion.addEventListener('change', schedule)
    document.addEventListener('visibilitychange', schedule)
    hovering = button.matches(':hover')
    schedule()
    return () => {
      cancel()
      button.removeEventListener('pointerenter', enter)
      button.removeEventListener('pointerleave', leave)
      button.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      button.removeEventListener('focus', cancel)
      button.removeEventListener('blur', schedule)
      button.removeEventListener('animationend', end)
      motion.removeEventListener('change', schedule)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [enabled])

  return ref
}
