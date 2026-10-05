-- Run after schema.sql, admins.sql, rate-limits.sql and admin-home-photos.sql.
-- Page size is fixed on the server. Counts never require downloading photo records.
create index if not exists photos_album_status_created_idx on public.photos (album_id, status, created_at desc, id);
create index if not exists photos_capture_order_idx on public.photos ((coalesce(taken_at, created_at)) desc, id) where status = 'approved';

create or replace function public.admin_photo_page(page_number integer default 0, filter_status text default 'pending', filter_album text default 'all', search_text text default '', filter_featured boolean default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if not public.is_active_admin() then raise exception 'Acesso administrativo negado.' using errcode = '42501'; end if;
  perform private.consume_limit('admin-rpc:' || auth.uid()::text, 120, 60);
  if page_number is null or page_number < 0 or page_number > 1000000 then raise exception 'Página inválida.'; end if;
  if filter_status is null or filter_status not in ('pending','approved','rejected') then raise exception 'Status inválido.'; end if;
  if char_length(coalesce(search_text,'')) > 300 then raise exception 'Busca acima do limite.'; end if;
  with filtered as materialized (
    select p.* from public.photos p where p.status = filter_status
      and (filter_album = 'all' or coalesce(p.album_id::text,'') = filter_album)
      and (filter_featured is null or p.featured = filter_featured)
      and (coalesce(search_text,'') = '' or strpos(lower(coalesce(p.contributor_name,'') || ' ' || coalesce(p.caption,'')), lower(search_text)) > 0)
  ), page as (
    select * from filtered order by created_at desc, id limit 24 offset (page_number::bigint * 24)
  ) select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(to_jsonb(p) order by created_at desc, id) from page p),'[]'::jsonb),
    'total', (select count(*) from filtered),
    'statusCounts', (select jsonb_object_agg(status,n) from (select status,count(*) n from public.photos group by status) s),
    'albumCounts', (select jsonb_object_agg(album,n) from (select coalesce(album_id::text,'') album,count(*) n from public.photos where status=filter_status group by album_id) s),
    'albumTotals', (select jsonb_object_agg(album,n) from (select coalesce(album_id::text,'') album,count(*) n from public.photos group by album_id) s)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_photo_page(integer,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.admin_photo_page(integer,text,text,text,boolean) to authenticated;

create or replace function public.gallery_photo_page(album_key text, page_number integer default 0, capture_year integer default null, search_text text default '', oldest_first boolean default false)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with album_photos as materialized (
    select p.* from public.photos p where status='approved' and coalesce(album_id::text,'outras')=album_key
  ), filtered as materialized (
    select * from album_photos where (capture_year is null or extract(year from taken_at at time zone 'UTC')=capture_year)
      and (coalesce(search_text,'')='' or strpos(lower(coalesce(caption,'') || ' ' || coalesce(alt,'')), lower(left(search_text,300))) > 0)
  ), page as (
    select * from filtered
    order by case when oldest_first then coalesce(taken_at,created_at) end asc,
      case when not oldest_first then coalesce(taken_at,created_at) end desc, id
    limit 24 offset (least(greatest(coalesce(page_number,0),0),1000000)::bigint*24)
  ) select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(to_jsonb(p) order by case when oldest_first then coalesce(taken_at,created_at) end asc, case when not oldest_first then coalesce(taken_at,created_at) end desc,id) from page p),'[]'::jsonb),
    'total', (select count(*) from filtered),
    'years', coalesce((select jsonb_agg(y order by y desc) from (select distinct extract(year from taken_at at time zone 'UTC')::integer y from album_photos where taken_at is not null) years),'[]'::jsonb),
    'title', case when album_key='outras' then 'Outras fotos' else (select title from public.albums where id::text=album_key) end,
    'description', (select description from public.albums where id::text=album_key)
  );
$$;
revoke all on function public.gallery_photo_page(text,integer,integer,text,boolean) from public;
grant execute on function public.gallery_photo_page(text,integer,integer,text,boolean) to anon,authenticated;

create or replace function public.gallery_album_page(page_number integer default 0, search_text text default '')
returns jsonb language sql stable security invoker set search_path = '' as $$
  with groups as materialized (
    select coalesce(p.album_id::text,'outras') id, coalesce(a.title,'Outras fotos') title, a.description,
      count(*) total, max(p.created_at) latest
    from public.photos p left join public.albums a on a.id=p.album_id
    where p.status='approved' and (coalesce(search_text,'')='' or strpos(lower(coalesce(a.title,'Outras fotos')), lower(left(search_text,100))) > 0)
    group by p.album_id,a.title,a.description
  ), page as (
    select * from groups order by latest desc,id limit 24 offset (least(greatest(coalesce(page_number,0),0),1000000)::bigint*24)
  ) select jsonb_build_object('total',(select count(*) from groups),'rows',coalesce((
    select jsonb_agg(to_jsonb(g) || jsonb_build_object('photos',(
      select coalesce(jsonb_agg(to_jsonb(cover)),'[]'::jsonb) from (
        select p.id,p.alt,p.caption,p.storage_path,p.thumb_path from public.photos p
        where p.status='approved' and coalesce(p.album_id::text,'outras')=g.id
        order by coalesce(p.taken_at,p.created_at) desc,p.id limit 3
      ) cover
    )) order by g.latest desc,g.id) from page g
  ),'[]'::jsonb));
$$;
revoke all on function public.gallery_album_page(integer,text) from public;
grant execute on function public.gallery_album_page(integer,text) to anon,authenticated;
