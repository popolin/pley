import { useCallback, useEffect, useRef, useState } from 'react'
import { recordAudioPlay } from '../data/audios'
import type { VoiceMemory } from '../types'

const playedStorageKey = 'pley-played-voice-memories'
function readPlayedIds(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(playedStorageKey) || '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function pickRandom(pool: VoiceMemory[], excludeId: string | null) {
  const options = pool.length > 1 ? pool.filter((m) => m.id !== excludeId) : pool
  return options[Math.floor(Math.random() * options.length)]
}

// Each play starts a random memory, never the one just played. Without a src (mock data) playback is simulated.
export function useVoicePlayer(memories: VoiceMemory[]) {
  const [current, setCurrent] = useState<VoiceMemory | null>(null)
  const [playId, setPlayId] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [realDuration, setRealDuration] = useState(0)
  const [playedIds, setPlayedIds] = useState(readPlayedIds)
  const markPlayed = useCallback((id: string) => {
    const ids = new Set([...readPlayedIds(), id])
    try { localStorage.setItem(playedStorageKey, JSON.stringify([...ids])) } catch { /* Storage may be unavailable. */ }
    setPlayedIds((previous) => [...new Set([...previous, ...ids])])
  }, [])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const elapsedRef = useRef(0)
  const countedRef = useRef(false)
  const lastIdRef = useRef<string | null>(null)

  const finish = useCallback(() => {
    elapsedRef.current = 0
    setPlaying(false)
    setElapsed(0)
    setCurrent(null)
  }, [])

  useEffect(() => {
    if (!current || current.src || !playing) return
    const id = setInterval(() => {
      elapsedRef.current += 0.1
      if (elapsedRef.current >= current.durationSeconds) finish()
      else setElapsed(elapsedRef.current)
    }, 100)
    return () => clearInterval(id)
  }, [current, playing, finish])

  // Loads and plays the newly picked memory.
  useEffect(() => {
    if (!current?.src) return
    let audio = audioRef.current
    if (!audio) {
      const el = new Audio()
      el.onloadedmetadata = () => setRealDuration(Number.isFinite(el.duration) ? el.duration : 0)
      el.ontimeupdate = () => setElapsed(el.currentTime)
      el.onplay = () => setPlaying(true)
      el.onpause = () => setPlaying(false)
      el.onended = finish
      el.onerror = finish
      audio = audioRef.current = el
    }
    audio.onplaying = () => {
      if (countedRef.current) return
      countedRef.current = true
      markPlayed(current.id)
      void recordAudioPlay(current.id)
    }
    audio.src = current.src
    audio.play().catch(finish)
  }, [current, finish, markPlayed])

  useEffect(
    () => () => {
      audioRef.current?.pause()
      audioRef.current = null
    },
    [],
  )

  const toggle = useCallback(() => {
    if (current) {
      if (!current.src) return setPlaying((p) => !p)
      const audio = audioRef.current
      if (audio?.paused) audio.play().catch(finish)
      else audio?.pause()
      return
    }

    const next = pickRandom(memories, lastIdRef.current)
    if (!next) return
    countedRef.current = false
    lastIdRef.current = next.id
    elapsedRef.current = 0
    setElapsed(0)
    setRealDuration(0)
    setCurrent(next)
    setPlayId((n) => n + 1)
    if (!next.src) {
      markPlayed(next.id)
      setPlaying(true)
    }
  }, [current, memories, finish, markPlayed])

  const total = (current?.src ? realDuration || current.durationSeconds : current?.durationSeconds) || 1
  const needsAttention = !playing && (current
    ? !playedIds.includes(current.id)
    : memories.some((memory) => !playedIds.includes(memory.id)))
  return { current, playId, playing, needsAttention, progress: Math.min(elapsed / total, 1), toggle }
}
