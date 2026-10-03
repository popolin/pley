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
