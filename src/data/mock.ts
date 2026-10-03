// Temporary content. Replace with real data (Supabase) in a later step.
import type { Message, Photo, Tribute, VoiceMemory } from '../types'

export const site = {
  name: 'Pley',
  tagline: 'Uma vida que continua presente nas nossas histórias.',
  life: { from: '11-12-1955', to: '09-10-2023' },
  heroQuote: 'Born to be alive!',
  heroPhoto: {
    id: 'hero',
    alt: 'Foto antiga do Pley ao ar livre, de camiseta branca',
    src: '/images/main_panel.jpg',
    tone: 'dusk',
  } satisfies Photo,
  /** Portrait of Pley (with beard) for the header and voice card. */
  avatar: '/images/pley-audio-avatar.png',
}

export const tribute: Tribute = {
  youtubeId: 'A5QifQL9mdg',
  thumbnail: {
    id: 'tribute',
    alt: 'Imagem de prévia do vídeo de homenagem',
    src: '/images/tribute-thumbnail.jpg',
    tone: 'lake',
  },
}

export const photos: Photo[] = [
  { id: 'p1', alt: 'Foto de exemplo', tone: 'dawn' },
  { id: 'p2', alt: 'Foto de exemplo', tone: 'earth' },
  { id: 'p3', alt: 'Foto de exemplo', tone: 'sage' },
  { id: 'p4', alt: 'Foto de exemplo', tone: 'mist' },
  { id: 'p5', alt: 'Foto de exemplo', tone: 'lake' },
  { id: 'p6', alt: 'Foto de exemplo', tone: 'sand' },
  { id: 'p7', alt: 'Foto de exemplo', tone: 'dusk' },
]

export const totalPhotos = 350

export const voiceMemories: VoiceMemory[] = [
  { id: 'v1', durationSeconds: 18 },
  { id: 'v2', durationSeconds: 32 },
  { id: 'v3', durationSeconds: 24 },
]

export const messages: Message[] = [
  {
    id: 'm1',
    author: 'Ana',
    relation: 'Amiga',
    date: '2024-03-12T12:00:00',
    text: 'Pley, você sempre será lembrado com muito carinho. Obrigada por tantos momentos.',
  },
  {
    id: 'm2',
    author: 'Ricardo',
    relation: 'Filho',
    date: '2024-05-08T12:00:00',
    text: 'Que privilégio ter feito parte da sua história. Suas lembranças continuam vivas entre nós.',
  },
  {
    id: 'm3',
    author: 'Mariana',
    relation: 'Sobrinha',
    date: '2024-06-20T12:00:00',
    text: 'A sua alegria era contagiante. Saudades sempre!',
  },
  {
    id: 'm4',
    author: 'Carlos',
    relation: 'Irmão',
    date: '2024-08-02T12:00:00',
    text: 'Cada vez que lembro de você, vem um sorriso. Obrigado por tudo.',
  },
  {
    id: 'm5',
    author: 'Paula',
    relation: 'Amiga',
    date: '2024-09-15T12:00:00',
    text: 'Obrigada por cada encontro. Sua presença continua com a gente.',
  },
  {
    id: 'm6',
    author: 'João',
    relation: 'Colega de trabalho',
    date: '2024-10-10T12:00:00',
    text: 'Ficam as boas conversas e o carinho que você deixou por onde passou.',
  },
]
