import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchApprovedAudios } from '../data/audios'
import { supabase } from '../lib/supabase'
import { voiceMemories } from '../data/mock'
import type { VoiceMemory } from '../types'

export function useVoiceMemories() {
  const [memories, setMemories] = useState<VoiceMemory[]>([])
  const queue = useRef<VoiceMemory[]>([])
  const recent = useRef<string[]>([])
  const mounted = useRef(false)
  const inFlight = useRef(false)

  const refill = useCallback(async () => {
    if (!mounted.current || inFlight.current || queue.current.length > 3) return
    inFlight.current = true
    try {
      const batch = supabase
        ? await fetchApprovedAudios(queue.current.map((audio) => audio.id), recent.current)
        : voiceMemories
      if (!mounted.current) return
      const merged = new Map(queue.current.map((audio) => [audio.id, audio]))
      for (const audio of batch) merged.set(audio.id, audio)
      queue.current = [...merged.values()].slice(0, 15)
      setMemories(queue.current)
    } catch (error) {
      console.warn('Voice queue refill failed', error)
    } finally {
      inFlight.current = false
    }
  }, [])

  const consume = useCallback((id: string) => {
    recent.current = [id, ...recent.current.filter((value) => value !== id)].slice(0, 30)
    queue.current = queue.current.filter((audio) => audio.id !== id)
    setMemories(queue.current)
    void refill()
  }, [refill])

  useEffect(() => {
    mounted.current = true
    void refill()
    // Retry transient failures without tight loops or overlapping requests.
    const retry = window.setInterval(() => { void refill() }, 30000)
    return () => { mounted.current = false; window.clearInterval(retry) }
  }, [refill])

  return { memories, consume }
}
