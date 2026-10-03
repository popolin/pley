import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function load(path, dependencies, extra = {}) {
  const exports = {}
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 } }).outputText
  vm.runInNewContext(code, { exports, require: name => dependencies[name], console, Request, Response, TextDecoder, ...extra })
  return exports
}
function apiMock({ status = 'active', invalidPassword = false, missing = false, failure = false } = {}) {
  let signedOut = false
  const supabase = {
    auth: {
      signInWithPassword: async () => ({ error: invalidPassword ? new Error('invalid') : null }),
      getSession: async () => ({ data: { session: { user: { id: 'admin-id' } } } }),
      signOut: async () => { signedOut = true; return {} },
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: missing ? null : { id: 'admin-id', status }, error: failure ? new Error('network') : null }) }) }) }),
  }
  return { api: load('src/admin/api.ts', { '../lib/supabase': { supabase } }), signedOut: () => signedOut }
}
test('active admin can authenticate', async () => {
  const { api } = apiMock()
  assert.equal((await api.login('admin@example.com', 'password')).id, 'admin-id')
})
for (const scenario of [{ status: 'inactive' }, { missing: true }, { failure: true }]) {
  test(`denies access and clears local session: ${JSON.stringify(scenario)}`, async () => {
    const { api, signedOut } = apiMock(scenario)
    await assert.rejects(api.login('admin@example.com', 'password'))
    assert.equal(signedOut(), true)
  })
}
test('incorrect password fails', async () => {
  await assert.rejects(apiMock({ invalidPassword: true }).api.login('a@b.com', 'wrong'))
})
function edgeMock({ active = true, validToken = true, insertFails = false } = {}) {
  let handler
  const calls = []
  const service = {
    rpc: async () => ({}),
    auth: {
      getUser: async () => ({ data: { user: validToken ? { id: 'caller' } : null } }),
      admin: {
        createUser: async values => { calls.push(['create', values]); return { data: { user: { id: 'new-id' } } } },
        deleteUser: async id => { calls.push(['rollback', id]); return {} },
        updateUserById: async (id, values) => { calls.push(['update', id, values]); return {} },
      },
    },
    from: () => ({
      select: () => ({ eq: (_key, id) => ({ maybeSingle: async () => ({ data: id === 'caller' ? { status: active ? 'active' : 'inactive' } : { id, email: 'admin@example.com' } }) }) }),
      insert: async values => { calls.push(['insert', values]); return { error: insertFails ? new Error('DB') : null } },
    }),
  }
  load('supabase/functions/manage-admin/index.ts', { 'npm:@supabase/supabase-js@2': { createClient: () => service } }, { Deno: { env: { get: () => 'test' }, serve: fn => { handler = fn } } })
  return { calls, run: (body, token = 'valid') => handler(new Request('https://example.com', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify(body) })) }
}
const create = { action: 'create', name: 'Admin', email: 'ADMIN@EXAMPLE.COM', password: 'password123' }
test('server rejects absent/invalid token and inactive admins without mutations', async () => {
  for (const [config, token, expected] of [[{}, '', 401], [{ validToken: false }, 'invalid', 401], [{ active: false }, 'valid', 403]]) {
    const edge = edgeMock(config)
    assert.equal((await edge.run(create, token)).status, expected)
    assert.equal(edge.calls.length, 0)
  }
})
test('create validates input and writes no password into admins', async () => {
  const edge = edgeMock()
  assert.equal((await edge.run({ ...create, password: 'short' })).status, 400)
  assert.equal(edge.calls.length, 0)
  assert.equal((await edge.run(create)).status, 201)
  const profile = edge.calls.find(([action]) => action === 'insert')[1]
  assert.equal(profile.email, 'admin@example.com')
  assert.equal(profile.status, 'active')
  assert.equal('password' in profile, false)
})
test('failed profile creation rolls back only the newly created Auth user', async () => {
  const edge = edgeMock({ insertFails: true })
  assert.equal((await edge.run(create)).status, 500)
  assert.equal(edge.calls.find(([action]) => action === 'rollback')[1], 'new-id')
})
test('editing identity cannot change status through user metadata', async () => {
  const edge = edgeMock()
  assert.equal((await edge.run({ ...create, action: 'update', id: 'existing', status: 'active' })).status, 200)
  const [, id, values] = edge.calls.find(([action]) => action === 'update')
  assert.equal(id, 'existing')
  assert.deepEqual(Object.keys(values.user_metadata), ['admin_name'])
})

test('admin email cannot be changed through the management endpoint', async () => {
  const edge = edgeMock()
  assert.equal((await edge.run({ ...create, action: 'update', id: 'existing', email: 'other@example.com' })).status, 400)
  assert.equal(edge.calls.length, 0)
})
test('name edits do not send email changes to Auth', async () => {
  const edge = edgeMock()
  assert.equal((await edge.run({ ...create, action: 'update', id: 'existing' })).status, 200)
  const values = edge.calls.find(([action]) => action === 'update')[2]
  assert.equal('email' in values, false)
  assert.equal('email_confirm' in values, false)
})

test('audio listing paginates and creates playable storage URLs', async () => {
  const offsets = []
  const supabase = {
    rpc: async (_name, args) => {
      offsets.push(args.page_offset)
      return { data: args.page_offset === 0 ? Array.from({ length: 500 }, (_, i) => ({ id: String(i), storage_path: `pending/${i}.mp3` })) : [{ id: 'last', storage_path: 'pending/last.mp3' }] }
    },
    storage: { from: () => ({ getPublicUrl: path => ({ data: { publicUrl: `https://example.com/${path}` } }) }) },
  }
  const api = load('src/admin/audioApi.ts', { '../lib/supabase': { supabase } })
  const rows = await api.listAudios()
  assert.equal(rows.length, 501)
  assert.deepEqual(offsets, [0, 500])
  assert.equal(rows[500].src, 'https://example.com/pending/last.mp3')
})
test('audio editing only sends metadata; bulk moderation sends selected IDs', async () => {
  const calls = []
  const supabase = { rpc: async (name, args) => { calls.push([name, args]); return {} } }
  const api = load('src/admin/audioApi.ts', { '../lib/supabase': { supabase } })
  await api.editAudio('audio-1', ' Michel ', ' Legenda ')
  assert.equal(calls[0][0], 'admin_edit_audio')
  assert.equal(calls[0][1].author_name, 'Michel')
  assert.equal(calls[0][1].audio_caption, 'Legenda')
  assert.equal('play_count' in calls[0][1], false)
  assert.equal('status' in calls[0][1], false)
  await api.setAudioStatus(['audio-1', 'audio-2'], 'rejected')
  assert.equal(calls[1][0], 'admin_set_audio_status')
  assert.deepEqual(calls[1][1].audio_ids, ['audio-1', 'audio-2'])
})
test('audio API propagates denied operations without mock fallback', async () => {
  const api = load('src/admin/audioApi.ts', { '../lib/supabase': { supabase: { rpc: async () => ({ error: { message: 'Acesso negado' } }) } } })
  await assert.rejects(api.listAudios())
  await assert.rejects(api.editAudio('id', '', ''))
  await assert.rejects(api.setAudioStatus(['id'], 'approved'))
})

function submissionMock({ quotaError = false, insertFails = false } = {}) {
  let handler
  const calls = []
  const db = {
    rpc: async () => { calls.push('quota'); return { error: quotaError ? { code: 'P0001' } : null } },
    from: () => ({ insert: async () => { calls.push('insert'); return { error: insertFails ? new Error('failed') : null } } }),
    storage: { from: () => ({ upload: async () => { calls.push('upload'); return {} }, remove: async () => { calls.push('cleanup'); return {} } }) },
  }
  load('supabase/functions/submit-publication/index.ts', { 'npm:@supabase/supabase-js@2': { createClient: () => db } }, { Blob, File, FormData, crypto, Deno: { env: { get: () => 'test' }, serve: fn => { handler = fn } } })
  return { calls, run: form => handler(new Request('https://example.com', { method: 'POST', body: form })) }
}
function messageForm() {
  const form = new FormData()
  form.set('kind', 'message'); form.set('name', 'Michel'); form.set('relation', 'Filho'); form.set('caption', 'Saudades')
  return form
}
test('server quota denial returns 429 before any write/upload', async () => {
  const endpoint = submissionMock({ quotaError: true })
  assert.equal((await endpoint.run(messageForm())).status, 429)
  assert.deepEqual(endpoint.calls, ['quota'])
})
test('public messages validate required fields and lengths before insertion', async () => {
  const endpoint = submissionMock()
  const form = messageForm(); form.set('caption', 'x'.repeat(601))
  assert.equal((await endpoint.run(form)).status, 400)
  assert.deepEqual(endpoint.calls, [])
  form.set('caption', 'Saudades')
  assert.equal((await endpoint.run(form)).status, 201)
  assert.deepEqual(endpoint.calls, ['quota', 'insert'])
})
test('renaming text as an mp3 is rejected by server signature validation', async () => {
  const endpoint = submissionMock()
  const form = new FormData(); form.set('kind', 'audio'); form.set('file', new File(['not audio'], 'fake.mp3', { type: 'audio/mpeg' }))
  assert.equal((await endpoint.run(form)).status, 415)
  assert.deepEqual(endpoint.calls, [])
})
test('failed metadata write cleans up uploaded files', async () => {
  const endpoint = submissionMock({ insertFails: true })
  const form = new FormData(); form.set('kind', 'audio'); form.set('file', new File(['ID3test'], 'audio.mp3'))
  assert.equal((await endpoint.run(form)).status, 503)
  assert.deepEqual(endpoint.calls, ['quota', 'upload', 'insert', 'cleanup'])
})
test('empty audio file is rejected before upload', async () => {
  const endpoint = submissionMock()
  const form = new FormData(); form.set('kind', 'audio'); form.set('file', new File([], 'audio.mp3'))
  assert.equal((await endpoint.run(form)).status, 413)
  assert.deepEqual(endpoint.calls, [])
})

test('photo list uses thumbnails and falls back to original with configured bucket', async () => {
  const api = load('src/admin/photoApi.ts', { '../lib/supabase': { albumBucket: 'album', supabase: {
    rpc: async () => ({ data: { rows: [{ id: '1', storage_path: 'one.jpg', thumb_path: 'thumb.jpg' }, { id: '2', storage_path: 'two.jpg' }], total: 2 } }),
    storage: { from: bucket => ({ getPublicUrl: path => ({ data: { publicUrl: `${bucket}/${path}` } }) }) },
  } } })
  const { rows } = await api.listPhotos()
  assert.equal(rows[0].thumbSrc, 'album/thumb.jpg')
  assert.equal(rows[0].src, 'album/one.jpg')
  assert.equal(rows[1].thumbSrc, 'album/two.jpg')
})
test('photo edits whitelist metadata and support removing album', async () => {
  const calls = []
  const api = load('src/admin/photoApi.ts', { '../lib/supabase': { supabase: { rpc: async (name, args) => { calls.push([name, args]); return {} } } } })
  await api.editPhoto('id', ' Michel ', ' Legenda ', ' Descrição ', '')
  const [name, args] = calls[0]
  assert.equal(name, 'admin_edit_photo')
  assert.equal(args.author_name, 'Michel')
  assert.equal(args.photo_alt, 'Descrição')
  assert.equal(args.selected_album, null)
  assert.equal('storage_path' in args, false)
  assert.equal('status' in args, false)
  await api.setPhotoStatus(['id'], 'approved')
  assert.equal(calls[1][0], 'admin_set_photo_status')
})
test('album creation returns persistent ID and propagates duplicate/permission errors', async () => {
  let fail = false
  const api = load('src/admin/photoApi.ts', { '../lib/supabase': { supabase: { rpc: async (_name, args) => fail ? { error: { message: 'Já existe um álbum com esse nome.' } } : { data: { id: 'album-id', title: args.album_title } } } } })
  const album = await api.createPhotoAlbum(' Família ')
  assert.equal(album.id, 'album-id'); assert.equal(album.title, 'Família')
  fail = true
  await assert.rejects(api.createPhotoAlbum('Família'))
  await assert.rejects(api.listPhotos())
  await assert.rejects(api.pendingPhotoCount())
})

test('album management uses restricted RPCs and moves only selected photo IDs', async () => {
  const calls = []
  const api = load('src/admin/photoApi.ts', { '../lib/supabase': { supabase: { rpc: async (name, args) => { calls.push([name, args]); return {} } } } })
  await api.renamePhotoAlbum('album-1', ' Família ')
  assert.equal(calls[0][0], 'admin_rename_album')
  assert.equal(calls[0][1].album_title, 'Família')
  await api.deleteEmptyPhotoAlbum('album-1')
  assert.equal(calls[1][0], 'admin_delete_empty_album')
  await api.movePhotos(['photo-1', 'photo-2'], 'album-2')
  assert.equal(calls[2][0], 'admin_move_photos')
  assert.deepEqual(calls[2][1].photo_ids, ['photo-1', 'photo-2'])
  assert.equal(calls[2][1].target_album, 'album-2')
  await api.movePhotos(['photo-1'], '')
  assert.equal(calls[3][1].target_album, null)
})
test('album deletion and rename failures are surfaced to the administrator', async () => {
  const api = load('src/admin/photoApi.ts', { '../lib/supabase': { supabase: { rpc: async () => ({ error: { message: 'Operação negada.' } }) } } })
  await assert.rejects(api.deleteEmptyPhotoAlbum('album-1'), /Operação negada/)
  await assert.rejects(api.renamePhotoAlbum('album-1', 'Nome'), /Operação negada/)
  await assert.rejects(api.movePhotos(['photo-1'], 'album-1'), /Operação negada/)
})

test('audio badge returns zero when pending count RPC is not deployed and list has no pending items', async () => {
  const api = load('src/admin/audioApi.ts', { '../lib/supabase': { supabase: {
    rpc: async name => name === 'admin_pending_audio_count' ? { error: { code: 'PGRST202' } } : { data: [{ status: 'approved', storage_path: 'a.mp3' }] },
    storage: { from: () => ({ getPublicUrl: path => ({ data: { publicUrl: path } }) }) },
  } } })
  assert.equal(await api.pendingAudioCount(), 0)
})
test('audio badge does not disguise access failures as zero', async () => {
  const api = load('src/admin/audioApi.ts', { '../lib/supabase': { supabase: {
    rpc: async () => ({ error: { code: '42501' } }),
  } } })
  await assert.rejects(api.pendingAudioCount())
})

test('message administration lists all statuses with pagination', async () => {
  const offsets = []
  const api = load('src/admin/messageApi.ts', { '../lib/supabase': { supabase: {
    rpc: async (_name, args) => { offsets.push(args.page_offset); return { data: args.page_offset === 0 ? Array.from({ length: 500 }, (_, i) => ({ id: String(i), status: 'pending' })) : [{ id: 'last', status: 'rejected' }] } },
  } } })
  const messages = await api.listMessages()
  assert.equal(messages.length, 501)
  assert.equal(messages[500].status, 'rejected')
  assert.deepEqual(offsets, [0, 500])
})
test('message editing sends only editable fields and moderation sends selected IDs', async () => {
  const calls = []
  const api = load('src/admin/messageApi.ts', { '../lib/supabase': { supabase: { rpc: async (name, args) => { calls.push([name, args]); return {} } } } })
  await api.editMessage('id', ' Michel ', ' Filho ', ' Saudade ')
  assert.deepEqual(Object.keys(calls[0][1]).sort(), ['message_id', 'new_author', 'new_body', 'new_relation'])
  assert.equal(calls[0][1].new_body, 'Saudade')
  await api.setMessageStatus(['id-1', 'id-2'], 'approved')
  assert.equal(calls[1][0], 'admin_set_message_status')
  assert.deepEqual(calls[1][1].message_ids, ['id-1', 'id-2'])
})
test('message administration surfaces authorization failures', async () => {
  const api = load('src/admin/messageApi.ts', { '../lib/supabase': { supabase: { rpc: async () => ({ error: { message: 'Acesso negado.' } }) } } })
  await assert.rejects(api.listMessages(), /Acesso negado/)
  await assert.rejects(api.editMessage('id', 'a', 'b', 'c'))
  await assert.rejects(api.setMessageStatus(['id'], 'rejected'))
  await assert.rejects(api.pendingMessageCount())
})

test('public audio sampling makes one bounded RPC and surfaces failure', async () => {
  const calls = []
  let fail = false
  const supabase = {
    rpc: async (name, args) => {
      calls.push({ name, args })
      return { data: [{ id: 'audio', storage_path: 'approved/test.mp3', duration_seconds: 12 }], error: fail ? new Error('network') : null }
    },
    storage: { from: () => ({ getPublicUrl: (path) => ({ data: { publicUrl: `https://storage/${path}` } }) }) },
  }
  const api = load('src/data/audios.ts', { '../lib/supabase': { supabase }, '../lib/submission': {} })
  const result = await api.fetchApprovedAudios(Array.from({ length: 100 }, (_, i) => String(i)), Array.from({ length: 100 }, (_, i) => String(i)))
  assert.equal(calls.length, 1)
  assert.equal(calls[0].name, 'sample_approved_audios')
  assert.equal(calls[0].args.excluded_ids.length, 15)
  assert.equal(calls[0].args.recent_ids.length, 30)
  assert.equal(result[0].src, 'https://storage/approved/test.mp3')
  fail = true
  await assert.rejects(api.fetchApprovedAudios())
})


test('admin photo pagination issues one request with server filters and preserves totals', async () => {
  const calls = []
  const api = load('src/admin/photoApi.ts', { '../lib/supabase': { supabase: {
    rpc: async (name, args) => { calls.push({ name, args }); return { data: { rows: [], total: 10000, statusCounts: { approved: 10000 }, albumCounts: {}, albumTotals: {} } } },
  } } })
  const result = await api.listPhotos(4, 'approved', 'album-id', 'Michel', true)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].name, 'admin_photo_page')
  assert.equal(calls[0].args.page_number, 4)
  assert.equal(calls[0].args.filter_album, 'album-id')
  assert.equal(calls[0].args.search_text, 'Michel')
  assert.equal(calls[0].args.filter_featured, true)
  assert.equal(result.total, 10000)
})
test('public gallery sends album year search and order to database', async () => {
  const calls = []
  const api = load('src/data/gallery.ts', { '../lib/supabase': { supabase: {
    rpc: async (name, args) => { calls.push({ name, args }); return { data: { rows: [], total: 100, years: [2000], title: 'Família' } } },
  } } })
  const result = await api.galleryPhotos('album-id', 3, '2000', 'viagem', true)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].name, 'gallery_photo_page')
  assert.equal(calls[0].args.capture_year, 2000)
  assert.equal(calls[0].args.page_number, 3)
  assert.equal(calls[0].args.oldest_first, true)
  assert.equal(result.total, 100)
  await api.galleryAlbums(2, 'Família')
  assert.equal(calls[1].name, 'gallery_album_page')
  assert.equal(calls[1].args.page_number, 2)
})
test('photo pagination propagates errors rather than displaying partial data', async () => {
  const dependency = { '../lib/supabase': { supabase: { rpc: async () => ({ error: { message: 'denied' } }) } } }
  await assert.rejects(load('src/admin/photoApi.ts', dependency).listPhotos())
  await assert.rejects(load('src/data/gallery.ts', dependency).galleryPhotos('id', 0, '', '', false))
})
