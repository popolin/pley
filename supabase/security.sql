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
