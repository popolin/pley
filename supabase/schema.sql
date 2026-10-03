-- Run once in the Supabase SQL Editor. Safe to re-run.

-- Photos: metadata lives here, files live in the "album" bucket.
create table if not exists public.photos (
  id               uuid primary key default gen_random_uuid(),
  storage_path     text not null unique,
  alt              text,
  caption          text,
  contributor_name text,
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected')),
  created_at       timestamptz not null default now()
);

create index if not exists photos_status_created_idx
  on public.photos (status, created_at desc);

alter table public.photos enable row level security;

-- Visitors only see approved photos.
drop policy if exists "photos: public reads approved" on public.photos;
create policy "photos: public reads approved"
  on public.photos for select
  to anon, authenticated
  using (status = 'approved');

-- Visitors can only submit pending photos under pending/, with bounded text.
drop policy if exists "photos: anyone submits pending" on public.photos;
create policy "photos: anyone submits pending"
  on public.photos for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and storage_path like 'pending/%'
    and char_length(coalesce(caption, '')) <= 300
    and char_length(coalesce(contributor_name, '')) <= 80
  );

-- Public bucket with size and type limits.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('album', 'album', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 8388608,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Visitors can only upload into pending/.
drop policy if exists "album: anyone uploads to pending" on storage.objects;
create policy "album: anyone uploads to pending"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'album' and (storage.foldername(name))[1] = 'pending');

-- Albums: group photos. Create albums in the Table Editor, then set photos.album_id.
create table if not exists public.albums (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.albums enable row level security;

drop policy if exists "albums: public reads" on public.albums;
create policy "albums: public reads"
  on public.albums for select
  to anon, authenticated
  using (true);

alter table public.photos
  add column if not exists album_id uuid references public.albums (id) on delete set null;

create index if not exists photos_album_idx on public.photos (album_id);

-- Thumbnails, dimensions and capture date (read from EXIF at upload).
alter table public.photos
  add column if not exists thumb_path text,
  add column if not exists width      int,
  add column if not exists height     int,
  add column if not exists taken_at   timestamptz;

-- Audios of Pley's voice. Metadata here, files in the "audios" bucket.
create table if not exists public.audios (
  id               uuid primary key default gen_random_uuid(),
  storage_path     text not null unique,
  caption          text,
  contributor_name text,
  duration_seconds int,
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected')),
  created_at       timestamptz not null default now()
);

-- Count actual playback starts; existing recordings begin at zero.
alter table public.audios
  add column if not exists play_count bigint not null default 0 check (play_count >= 0);

-- Atomic increment without granting visitors general UPDATE access.
create or replace function public.record_audio_play(audio_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.audios
  set play_count = play_count + 1
  where id = audio_id and status = 'approved';
$$;

revoke all on function public.record_audio_play(uuid) from public;
grant execute on function public.record_audio_play(uuid) to anon, authenticated;

create index if not exists audios_status_created_idx
  on public.audios (status, created_at desc);

alter table public.audios enable row level security;

drop policy if exists "audios: public reads approved" on public.audios;
create policy "audios: public reads approved"
  on public.audios for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "audios: anyone submits pending" on public.audios;
create policy "audios: anyone submits pending"
  on public.audios for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and play_count = 0
    and storage_path like 'pending/%'
    and char_length(coalesce(caption, '')) <= 300
    and char_length(coalesce(contributor_name, '')) <= 80
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audios', 'audios', true, 20971520,
  array['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/ogg', 'audio/webm']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 20971520,
      allowed_mime_types = array['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/ogg', 'audio/webm'];

drop policy if exists "audios: anyone uploads to pending" on storage.objects;
create policy "audios: anyone uploads to pending"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'audios' and (storage.foldername(name))[1] = 'pending');

-- Messages of affection. Shown only after approval.
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  author_name      text not null,
  relation         text not null,
  body             text not null,
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected')),
  created_at       timestamptz not null default now()
);

create index if not exists messages_status_created_idx
  on public.messages (status, created_at desc);

alter table public.messages enable row level security;

drop policy if exists "messages: public reads approved" on public.messages;
create policy "messages: public reads approved"
  on public.messages for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "messages: anyone submits pending" on public.messages;
create policy "messages: anyone submits pending"
  on public.messages for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and char_length(btrim(author_name)) between 1 and 80
    and char_length(btrim(relation)) between 1 and 40
    and char_length(btrim(body)) between 1 and 600
  );

-- Administrator identity and access (also available separately in admins.sql).
-- Run after schema.sql. Re-runnable admin/auth setup.
create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  email text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_active_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins where id = auth.uid() and status = 'active'); $$;
revoke all on function public.is_active_admin() from public, anon, authenticated;
grant execute on function public.is_active_admin() to authenticated;

revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;
grant select, insert, update on public.admins to service_role;
revoke delete on public.admins from service_role;
drop policy if exists "admins: read own or active admin" on public.admins;
drop policy if exists "admins: active admins read" on public.admins;
create policy "admins: active admins read" on public.admins for select to authenticated
using (public.is_active_admin());

-- Keep the profile in sync with Auth's canonical email and editable display name.
-- No privilege/status is taken from user-editable metadata.
create or replace function public.sync_admin_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is distinct from old.email
    and exists (select 1 from public.admins where id = new.id)
  then raise exception 'O e-mail do administrador não pode ser alterado.'; end if;
  update public.admins set
    email = lower(new.email),
    name = coalesce(nullif(btrim(new.raw_user_meta_data->>'admin_name'), ''), name),
    updated_at = now()
  where id = new.id;
  return new;
end;
$$;
revoke all on function public.sync_admin_identity() from public, anon, authenticated;
drop trigger if exists sync_admin_identity on auth.users;
create trigger sync_admin_identity after update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_admin_identity();

-- Serialize status changes, including concurrent attempts to disable the last admin.
create or replace function public.set_admin_status(target_id uuid, new_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(73921504);
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  if new_status not in ('active', 'inactive') or new_status is null then raise exception 'Status inválido.'; end if;
  if not exists (select 1 from public.admins where id = target_id) then raise exception 'Administrador não encontrado.'; end if;
  if new_status = 'inactive'
    and exists (select 1 from public.admins where id = target_id and status = 'active')
    and (select count(*) from public.admins where status = 'active') <= 1
  then raise exception 'Não é possível desativar o último administrador ativo.'; end if;
  update public.admins set status = new_status, updated_at = now() where id = target_id;
end;
$$;
revoke all on function public.set_admin_status(uuid, text) from public, anon, authenticated;
grant execute on function public.set_admin_status(uuid, text) to authenticated;

-- Run after schema.sql and admins.sql. Admin-only audio operations.
create or replace function public.admin_list_audios(page_offset integer default 0)
returns setof public.audios language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  return query select * from public.audios order by created_at desc, id limit 500 offset greatest(page_offset, 0);
end;
$$;
create or replace function public.admin_edit_audio(audio_id uuid, author_name text, audio_caption text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  if char_length(coalesce(author_name, '')) > 80 or char_length(coalesce(audio_caption, '')) > 300 then raise exception 'Texto acima do limite permitido.'; end if;
  update public.audios set contributor_name = nullif(btrim(author_name), ''), caption = nullif(btrim(audio_caption), '') where id = audio_id;
  if not found then raise exception 'Áudio não encontrado.'; end if;
end;
$$;
create or replace function public.admin_set_audio_status(audio_ids uuid[], new_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  if new_status is null or new_status not in ('pending', 'approved', 'rejected') then raise exception 'Status inválido.'; end if;
  if coalesce(cardinality(audio_ids), 0) = 0 then raise exception 'Selecione ao menos um áudio.'; end if;
  if exists (select 1 from unnest(audio_ids) as selected(id) where not exists (select 1 from public.audios a where a.id = selected.id)) then raise exception 'Áudio não encontrado. Atualize a lista.'; end if;
  update public.audios set status = new_status where id = any(audio_ids);
end;
$$;
revoke all on function public.admin_list_audios(integer) from public, anon, authenticated;
revoke all on function public.admin_edit_audio(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_audio_status(uuid[], text) from public, anon, authenticated;
grant execute on function public.admin_list_audios(integer) to authenticated;
grant execute on function public.admin_edit_audio(uuid, text, text) to authenticated;
grant execute on function public.admin_set_audio_status(uuid[], text) to authenticated;

-- Apply AFTER schema.sql, admins.sql and admin-audios.sql.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.request_limits (
  bucket text primary key,
  window_start timestamptz not null,
  attempts integer not null
);
revoke all on private.request_limits from public, anon, authenticated;

create or replace function private.consume_limit(bucket_key text, max_requests integer, window_seconds integer)
returns void language plpgsql security definer set search_path = '' as $$
declare current_count integer;
begin
  insert into private.request_limits as limits (bucket, window_start, attempts)
  values (bucket_key, clock_timestamp(), 1)
  on conflict (bucket) do update set
    attempts = case when limits.window_start <= clock_timestamp() - make_interval(secs => window_seconds) then 1 else limits.attempts + 1 end,
    window_start = case when limits.window_start <= clock_timestamp() - make_interval(secs => window_seconds) then clock_timestamp() else limits.window_start end
  returning attempts into current_count;
  if current_count > max_requests then
    raise sqlstate 'P0001' using message = 'Limite de envios atingido. Aguarde e tente novamente.';
  end if;
end;
$$;
revoke all on function private.consume_limit(text, integer, integer) from public, anon, authenticated;

-- Only the trusted Edge Function can reserve a submission. Failed uploads still count.
create or replace function public.reserve_publication(kind text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if kind not in ('photo', 'audio', 'message') or kind is null then raise exception 'Tipo inválido.'; end if;
  perform private.consume_limit('submit:' || kind || ':minute', case kind when 'photo' then 10 else 5 end, 60);
  perform private.consume_limit('submit:' || kind || ':day', case kind when 'photo' then 100 when 'audio' then 20 else 100 end, 86400);
end;
$$;
revoke all on function public.reserve_publication(text) from public, anon, authenticated;
grant execute on function public.reserve_publication(text) to service_role;

-- No bypass via REST or Storage: all public submissions go through the function.
drop policy if exists "photos: anyone submits pending" on public.photos;
drop policy if exists "audios: anyone submits pending" on public.audios;
drop policy if exists "messages: anyone submits pending" on public.messages;
drop policy if exists "album: anyone uploads to pending" on storage.objects;
drop policy if exists "audios: anyone uploads to pending" on storage.objects;
revoke insert on public.photos, public.audios, public.messages from anon, authenticated;
update storage.buckets set file_size_limit = 8388608,
 allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'] where id = 'album';
update storage.buckets set file_size_limit = 20971520,
 allowed_mime_types = array['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/ogg', 'audio/webm'] where id = 'audios';

create or replace function public.record_audio_play(audio_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.audios where id = audio_id and status = 'approved') then return; end if;
  perform private.consume_limit('audio-plays:minute', 120, 60);
  update public.audios set play_count = play_count + 1 where id = audio_id and status = 'approved';
end;
$$;
revoke all on function public.record_audio_play(uuid) from public, anon, authenticated;
grant execute on function public.record_audio_play(uuid) to anon, authenticated;

-- Shared write/read budget for authenticated administrative RPCs.
-- Run after schema.sql and admins.sql. Admin-only audio operations.
create or replace function public.admin_list_audios(page_offset integer default 0)
returns setof public.audios language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  return query select * from public.audios order by created_at desc, id limit 500 offset greatest(page_offset, 0);
end;
$$;
create or replace function public.admin_edit_audio(audio_id uuid, author_name text, audio_caption text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  if char_length(coalesce(author_name, '')) > 80 or char_length(coalesce(audio_caption, '')) > 300 then raise exception 'Texto acima do limite permitido.'; end if;
  update public.audios set contributor_name = nullif(btrim(author_name), ''), caption = nullif(btrim(audio_caption), '') where id = audio_id;
  if not found then raise exception 'Áudio não encontrado.'; end if;
end;
$$;
create or replace function public.admin_set_audio_status(audio_ids uuid[], new_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  if new_status is null or new_status not in ('pending', 'approved', 'rejected') then raise exception 'Status inválido.'; end if;
  if coalesce(cardinality(audio_ids), 0) = 0 then raise exception 'Selecione ao menos um áudio.'; end if;
  if exists (select 1 from unnest(audio_ids) as selected(id) where not exists (select 1 from public.audios a where a.id = selected.id)) then raise exception 'Áudio não encontrado. Atualize a lista.'; end if;
  update public.audios set status = new_status where id = any(audio_ids);
end;
$$;
revoke all on function public.admin_list_audios(integer) from public, anon, authenticated;
revoke all on function public.admin_edit_audio(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_audio_status(uuid[], text) from public, anon, authenticated;
grant execute on function public.admin_list_audios(integer) to authenticated;
grant execute on function public.admin_edit_audio(uuid, text, text) to authenticated;
grant execute on function public.admin_set_audio_status(uuid[], text) to authenticated;

create or replace function public.reserve_admin_request(admin_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.admins where id = admin_id and status = 'active') then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-accounts:' || admin_id::text, 20, 60);
end;
$$;
revoke all on function public.reserve_admin_request(uuid) from public, anon, authenticated;
grant execute on function public.reserve_admin_request(uuid) to service_role;

create or replace function public.set_admin_status(target_id uuid, new_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(73921504);
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  if new_status not in ('active', 'inactive') or new_status is null then raise exception 'Status inválido.'; end if;
  if not exists (select 1 from public.admins where id = target_id) then raise exception 'Administrador não encontrado.'; end if;
  if new_status = 'inactive'
    and exists (select 1 from public.admins where id = target_id and status = 'active')
    and (select count(*) from public.admins where status = 'active') <= 1
  then raise exception 'Não é possível desativar o último administrador ativo.'; end if;
  update public.admins set status = new_status, updated_at = now() where id = target_id;
end;
$$;
revoke all on function public.set_admin_status(uuid, text) from public, anon, authenticated;
grant execute on function public.set_admin_status(uuid, text) to authenticated;

-- Admin-only pending count for the navigation badge.
create or replace function public.admin_pending_audio_count()
returns bigint language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then
    raise exception 'Acesso administrativo negado.' using errcode = '42501';
  end if;
  return (select count(*) from public.audios where status = 'pending');
end;
$$;
revoke all on function public.admin_pending_audio_count() from public, anon, authenticated;
grant execute on function public.admin_pending_audio_count() to authenticated;

-- Run after security.sql (requires private.consume_limit). Admin-only photo operations.
create or replace function public.admin_list_photos(page_offset integer default 0)
returns setof public.photos language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  return query select * from public.photos order by created_at desc, id limit 500 offset greatest(page_offset, 0);
end;
$$;
create or replace function public.admin_edit_photo(photo_id uuid, author_name text, photo_caption text, photo_alt text, selected_album uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  if char_length(coalesce(photo_alt, '')) > 300 then raise exception 'Descrição acima do limite.'; end if;
  if selected_album is not null and not exists (select 1 from public.albums where id = selected_album) then raise exception 'Álbum não encontrado.'; end if;
  if char_length(coalesce(author_name, '')) > 80 or char_length(coalesce(photo_caption, '')) > 300 then raise exception 'Texto acima do limite permitido.'; end if;
  update public.photos set contributor_name = nullif(btrim(author_name), ''), caption = nullif(btrim(photo_caption), ''), alt = nullif(btrim(photo_alt), ''), album_id = selected_album where id = photo_id;
  if not found then raise exception 'Foto não encontrada.'; end if;
end;
$$;
create or replace function public.admin_set_photo_status(photo_ids uuid[], new_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  if cardinality(photo_ids) > 500 then raise exception 'Selecione até 500 fotos por vez.'; end if;
  if new_status is null or new_status not in ('pending', 'approved', 'rejected') then raise exception 'Status inválido.'; end if;
  if coalesce(cardinality(photo_ids), 0) = 0 then raise exception 'Selecione ao menos uma foto.'; end if;
  if exists (select 1 from unnest(photo_ids) as selected(id) where not exists (select 1 from public.photos a where a.id = selected.id)) then raise exception 'Foto não encontrada. Atualize a lista.'; end if;
  update public.photos set status = new_status where id = any(photo_ids);
end;
$$;
revoke all on function public.admin_list_photos(integer) from public, anon, authenticated;
revoke all on function public.admin_edit_photo(uuid, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.admin_set_photo_status(uuid[], text) from public, anon, authenticated;
grant execute on function public.admin_list_photos(integer) to authenticated;
grant execute on function public.admin_edit_photo(uuid, text, text, text, uuid) to authenticated;
grant execute on function public.admin_set_photo_status(uuid[], text) to authenticated;

-- Admin-only pending count for the navigation badge.
create or replace function public.admin_pending_photo_count()
returns bigint language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then
    raise exception 'Acesso administrativo negado.' using errcode = '42501';
  end if;
  return (select count(*) from public.photos where status = 'pending');
end;
$$;
revoke all on function public.admin_pending_photo_count() from public, anon, authenticated;
grant execute on function public.admin_pending_photo_count() to authenticated;

create or replace function public.admin_create_album(album_title text)
returns public.albums language plpgsql security definer set search_path = '' as $$
declare result public.albums;
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  if album_title is null or char_length(btrim(album_title)) not between 1 and 100 then raise exception 'Informe um nome de álbum de até 100 caracteres.'; end if;
  perform pg_advisory_xact_lock(73921505);
  if exists (select 1 from public.albums where lower(btrim(title)) = lower(btrim(album_title))) then raise exception 'Já existe um álbum com esse nome.'; end if;
  insert into public.albums(title) values (btrim(album_title)) returning * into result;
  return result;
end;
$$;
revoke all on function public.admin_create_album(text) from public, anon, authenticated;
grant execute on function public.admin_create_album(text) to authenticated;

-- Run after admin-photos.sql and rate-limits.sql. Re-runnable.
create or replace function public.admin_rename_album(album_id uuid, album_title text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  if album_title is null or char_length(btrim(album_title)) not between 1 and 100 then raise exception 'Informe um nome de álbum de até 100 caracteres.'; end if;
  perform pg_advisory_xact_lock(73921505);
  if exists (select 1 from public.albums where id <> album_id and lower(btrim(title)) = lower(btrim(album_title))) then raise exception 'Já existe um álbum com esse nome.'; end if;
  update public.albums set title = btrim(album_title) where id = album_id;
  if not found then raise exception 'Álbum não encontrado.'; end if;
end;
$$;
create or replace function public.admin_delete_empty_album(target_album uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  -- Block concurrent photo assignments before checking emptiness (all statuses).
  lock table public.photos in share row exclusive mode;
  if exists (select 1 from public.photos where album_id = target_album) then raise exception 'O álbum contém fotos e não pode ser excluído.'; end if;
  delete from public.albums where id = target_album;
  if not found then raise exception 'Álbum não encontrado.'; end if;
end;
$$;
create or replace function public.admin_move_photos(photo_ids uuid[], target_album uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  if coalesce(cardinality(photo_ids), 0) not between 1 and 500 then raise exception 'Selecione entre 1 e 500 fotos.'; end if;
  if target_album is not null and not exists (select 1 from public.albums where id = target_album) then raise exception 'Álbum não encontrado.'; end if;
  if exists (select 1 from unnest(photo_ids) as selected(id) where not exists (select 1 from public.photos where id = selected.id)) then raise exception 'Foto não encontrada. Atualize a lista.'; end if;
  update public.photos set album_id = target_album where id = any(photo_ids);
end;
$$;
revoke all on function public.admin_rename_album(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_delete_empty_album(uuid) from public, anon, authenticated;
revoke all on function public.admin_move_photos(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.admin_rename_album(uuid, text) to authenticated;
grant execute on function public.admin_delete_empty_album(uuid) to authenticated;
grant execute on function public.admin_move_photos(uuid[], uuid) to authenticated;

-- Run after admins.sql and rate-limits.sql. Re-runnable admin-only message operations.
create or replace function public.admin_list_messages(page_offset integer default 0)
returns setof public.messages language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  return query select * from public.messages order by created_at desc, id limit 500 offset greatest(page_offset, 0);
end;
$$;
create or replace function public.admin_edit_message(message_id uuid, new_author text, new_relation text, new_body text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  if new_author is null or char_length(btrim(new_author)) not between 1 and 80
    or new_relation is null or char_length(btrim(new_relation)) not between 1 and 40
    or new_body is null or char_length(btrim(new_body)) not between 1 and 600
  then raise exception 'Preencha nome, relação e mensagem dentro dos limites permitidos.'; end if;
  update public.messages set author_name = btrim(new_author), relation = btrim(new_relation), body = btrim(new_body) where id = message_id;
  if not found then raise exception 'Mensagem não encontrada.'; end if;
end;
$$;
create or replace function public.admin_set_message_status(message_ids uuid[], new_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  if coalesce(cardinality(message_ids), 0) not between 1 and 500 then raise exception 'Selecione entre 1 e 500 mensagens.'; end if;
  if new_status is null or new_status not in ('pending', 'approved', 'rejected') then raise exception 'Status inválido.'; end if;
  if exists (select 1 from unnest(message_ids) as selected(id) where not exists (select 1 from public.messages where id = selected.id)) then raise exception 'Mensagem não encontrada. Atualize a lista.'; end if;
  update public.messages set status = new_status where id = any(message_ids);
end;
$$;
create or replace function public.admin_pending_message_count()
returns bigint language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  return (select count(*) from public.messages where status = 'pending');
end;
$$;
revoke all on function public.admin_list_messages(integer) from public, anon, authenticated;
revoke all on function public.admin_edit_message(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_message_status(uuid[], text) from public, anon, authenticated;
revoke all on function public.admin_pending_message_count() from public, anon, authenticated;
grant execute on function public.admin_list_messages(integer) to authenticated;
grant execute on function public.admin_edit_message(uuid, text, text, text) to authenticated;
grant execute on function public.admin_set_message_status(uuid[], text) to authenticated;
grant execute on function public.admin_pending_message_count() to authenticated;
