export type Status = 'pending' | 'approved' | 'rejected'
export type Kind = 'message' | 'photo' | 'audio'
export interface Publication {
  id: string
  kind: Kind
  author: string
  relation?: string
  content: string
  alt?: string
  albumId?: string
  src?: string
  playCount?: number
  status: Status
  date: string
}
export interface Album { id: string; title: string }
export interface AdminData { publications: Publication[]; albums: Album[] }
const initialAlbums = [{ id: 'family', title: 'Em família' }, { id: 'friends', title: 'Entre amigos' }, { id: 'moments', title: 'Momentos especiais' }]
const key = 'pley-admin-demo-v1'
export async function loadData(): Promise<AdminData> {
  const saved = sessionStorage.getItem(key)
  if (saved) {
    const data = JSON.parse(saved) as AdminData
    return { publications: data.publications, albums: data.albums ?? initialAlbums }
  }
  const data: AdminData = {
    albums: initialAlbums,
    publications: [
      { id: 'm1', kind: 'message', author: 'Ana', relation: 'Amigo(a)', content: 'Sua alegria transformava qualquer encontro. Guardo cada conversa com muito carinho.', status: 'pending', date: '2026-10-02' },
      { id: 'p1', kind: 'photo', author: 'Michel', content: 'Um dia para guardar na memória.', alt: 'Pley ao ar livre', src: '/images/main_panel.jpg', status: 'pending', date: '2026-10-01' },
      { id: 'a1', kind: 'audio', playCount: 0, author: 'Mariana', content: 'Aquele recado cheio de carinho.', status: 'pending', date: '2026-09-30' },
      { id: 'm2', kind: 'message', author: 'Ricardo', relation: 'Filho(a)', content: 'Obrigado por tudo, pai. Suas lembranças continuam vivas entre nós.', status: 'approved', date: '2026-09-29' },
      { id: 'p2', kind: 'photo', author: 'Paula', content: 'Nossa homenagem.', alt: 'Homenagem ao Pley', albumId: 'family', src: '/images/tribute-thumbnail.jpg', status: 'approved', date: '2026-09-28' },
      { id: 'm3', kind: 'message', author: 'Carlos', relation: 'Amigo(a)', content: 'Mensagem duplicada de exemplo.', status: 'rejected', date: '2026-09-27' },
    ],
  }
  saveData(data)
  return data
}
export function saveData(data: AdminData) { sessionStorage.setItem(key, JSON.stringify(data)) }
