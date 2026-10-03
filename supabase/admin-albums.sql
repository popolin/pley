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
