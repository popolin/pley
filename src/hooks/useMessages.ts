import { useEffect, useState } from 'react'
import { fetchApprovedMessages } from '../data/messages'
import { messages as mockMessages } from '../data/mock'
import type { Message } from '../types'

// Falls back to the mock messages until real ones are approved.
export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    let cancelled = false
    fetchApprovedMessages().then((result) => {
      if (!cancelled) setMessages(result.length ? result : mockMessages)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return messages
}
