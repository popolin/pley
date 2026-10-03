import { useEffect, useState } from 'react'
import { fetchApprovedAudios } from '../data/audios'
import { voiceMemories } from '../data/mock'
import type { VoiceMemory } from '../types'

// Falls back to the mock memories until real audios are approved.
export function useVoiceMemories() {
  const [memories, setMemories] = useState<VoiceMemory[]>([])

  useEffect(() => {
    let cancelled = false
    fetchApprovedAudios().then((audios) => {
      if (!cancelled) setMemories(audios.length ? audios : voiceMemories)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return memories
}
