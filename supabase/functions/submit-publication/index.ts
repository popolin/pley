import { createClient } from 'npm:@supabase/supabase-js@2'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const response = (status: number, message: string) => new Response(JSON.stringify({ message }), { status, headers: { ...cors, 'Content-Type': 'application/json', ...(status === 429 ? { 'Retry-After': '60' } : {}) } })
const MB = 1024 * 1024
// Read with a hard cap even when Content-Length is absent or forged.
async function limitedBody(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) throw new Error('body')
  const chunks: Uint8Array[] = []; let size = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.length
    if (size > 22 * MB) { await reader.cancel(); throw new Error('size') }
    chunks.push(value)
  }
  return new Blob(chunks as BlobPart[])
}
function text(form: FormData, key: string, max: number, required = false) {
  const raw = form.get(key)
  if (raw !== null && typeof raw !== 'string') throw new Error('fields')
  const value = (raw ?? '').trim()
  if (value.length > max || (required && !value)) throw new Error('fields')
  return value
}
async function signature(file: File) {
  const b = new Uint8Array(await file.slice(0, 32).arrayBuffer())
  const ascii = (start: number, end: number) => String.fromCharCode(...b.slice(start, end))
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return 'image/jpeg'
  if (ascii(0, 3) === 'ID3' || (b[0] === 255 && (b[1] & 0xe0) === 0xe0 && (b[1] & 6) !== 0)) return 'audio/mpeg'
  if (b[0] === 255 && (b[1] & 0xf6) === 0xf0) return 'audio/aac'
  if (ascii(4, 8) === 'ftyp') return 'audio/mp4'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') return 'audio/wav'
  if (ascii(0, 4) === 'OggS') return 'audio/ogg'
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'audio/webm'
  return ''
}
Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (request.method !== 'POST') return response(405, 'Método não permitido.')
  const type = request.headers.get('content-type') ?? ''
  if (!type.startsWith('multipart/form-data;')) return response(415, 'Formato de envio inválido.')
  if (Number(request.headers.get('content-length')) > 22 * MB) return response(413, 'Arquivo acima do limite.')
  try {
    const form = await new Response(await limitedBody(request), { headers: { 'Content-Type': type } }).formData()
    const kind = text(form, 'kind', 10, true)
    if (!['message', 'photo', 'audio'].includes(kind)) return response(400, 'Tipo inválido.')
    const name = text(form, 'name', 80, kind === 'message')
    const caption = text(form, 'caption', kind === 'message' ? 600 : 300, kind === 'message')
    const relation = text(form, 'relation', 40, kind === 'message')
    const file = form.get('file'); const thumb = form.get('thumb')
    const album = text(form, 'albumId', 36)
    if (album && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(album)) return response(400, 'Álbum inválido.')
    let mime = ''
    if (kind !== 'message') {
      if (!(file instanceof File) || !file.size || file.size > (kind === 'photo' ? 8 : 20) * MB) return response(413, 'Arquivo vazio ou acima do limite.')
      mime = await signature(file)
      if (kind === 'photo' ? mime !== 'image/jpeg' : !mime.startsWith('audio/')) return response(415, 'Conteúdo do arquivo não suportado.')
      if (kind === 'photo' && (!(thumb instanceof File) || !thumb.size || thumb.size > MB || await signature(thumb) !== 'image/jpeg')) return response(415, 'Miniatura inválida.')
    }
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
    const quota = await db.rpc('reserve_publication', { kind })
    if (quota.error) return response(quota.error.code === 'P0001' ? 429 : 503, 'Não foi possível receber o envio agora. Aguarde e tente novamente.')
    if (kind === 'message') {
      const { error } = await db.from('messages').insert({ author_name: name, relation, body: caption, status: 'pending' })
      return response(error ? 503 : 201, error ? 'Falha ao salvar mensagem.' : 'Enviado.')
    }
    const bucket = db.storage.from(kind === 'photo' ? 'album' : 'audios')
    const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/aac': 'aac', 'audio/wav': 'wav', 'audio/ogg': 'ogg', 'audio/webm': 'webm' }
    const id = crypto.randomUUID(); const path = `pending/${id}.${extensions[mime]}`; const thumbPath = `pending/${id}_thumb.jpg`
    const uploaded: string[] = []
    try {
      const upload = await bucket.upload(path, file as File, { contentType: mime })
      if (upload.error) throw upload.error
      uploaded.push(path)
      if (kind === 'photo') {
        const uploadThumb = await bucket.upload(thumbPath, thumb as File, { contentType: 'image/jpeg' })
        if (uploadThumb.error) throw uploadThumb.error
        uploaded.push(thumbPath)
      }
      const takenAt = text(form, 'takenAt', 40)
      const dimension = (key: string) => { const n = Number(form.get(key)); return Number.isInteger(n) && n > 0 && n <= 2000 ? n : null }
      const duration = Number(form.get('duration'))
      const metadata = kind === 'photo' ? { thumb_path: thumbPath, album_id: album || null, width: dimension('width'), height: dimension('height'), taken_at: takenAt && !Number.isNaN(Date.parse(takenAt)) ? takenAt : null } : { duration_seconds: Number.isInteger(duration) && duration >= 0 && duration < 86400 ? duration : null }
      const result = await db.from(kind === 'photo' ? 'photos' : 'audios').insert({ storage_path: path, contributor_name: name || null, caption: caption || null, status: 'pending', ...metadata })
      if (result.error) throw result.error
      return response(201, 'Enviado.')
    } catch {
      if (uploaded.length) await bucket.remove(uploaded)
      return response(503, 'Não foi possível salvar o envio.')
    }
  } catch (error) { return response(error instanceof Error && error.message === 'size' ? 413 : 400, 'Envio inválido. Confira os campos e o tamanho dos arquivos.') }
})
