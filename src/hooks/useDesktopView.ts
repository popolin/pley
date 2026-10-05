import { useEffect, useState } from 'react'

const desktopWidth = 1280

// Changes the mobile layout viewport so existing desktop breakpoints apply.
export function useDesktopView() {
  const [desktopView, setDesktopView] = useState(false)
  const [buttonScale, setButtonScale] = useState(1)

  useEffect(() => {
    if (!desktopView) return
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
    if (!viewport) return
    const original = viewport.content
    const scale = Math.min(1, window.innerWidth / desktopWidth)
    viewport.content = `width=${desktopWidth}, initial-scale=${scale}`
    const updateScale = () => setButtonScale(1 / (window.visualViewport?.scale || scale))
    updateScale()
    window.visualViewport?.addEventListener('resize', updateScale)
    return () => {
      viewport.content = original
      window.visualViewport?.removeEventListener('resize', updateScale)
    }
  }, [desktopView])

  return { desktopView, setDesktopView, buttonScale }
}
