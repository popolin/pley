-- Run after admins.sql and rate-limits.sql (or security.sql). Admin-only photo operations.
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
