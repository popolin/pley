-- Run after schema.sql, admins.sql and rate-limits.sql. Re-runnable.
alter table public.photos add column if not exists featured boolean not null default false;
create index if not exists photos_featured_idx on public.photos (created_at desc, id) where featured and status = 'approved';

create or replace function public.admin_feature_photos(photo_ids uuid[], show_on_home boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  if show_on_home is null or coalesce(cardinality(photo_ids), 0) not between 1 and 500 then raise exception 'Selecione entre 1 e 500 fotos.'; end if;
  if exists (select 1 from unnest(photo_ids) as selected(id) where not exists (select 1 from public.photos where id = selected.id)) then raise exception 'Foto não encontrada. Atualize a lista.'; end if;
  update public.photos set featured = show_on_home where id = any(photo_ids);
end;
$$;
revoke all on function public.admin_feature_photos(uuid[], boolean) from public, anon, authenticated;
grant execute on function public.admin_feature_photos(uuid[], boolean) to authenticated;
