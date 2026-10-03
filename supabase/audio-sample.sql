-- Bounded public sample. Only approved recordings are returned.
create or replace function public.sample_approved_audios(excluded_ids uuid[] default '{}', recent_ids uuid[] default '{}')
returns setof public.audios language sql security invoker set search_path = '' as $$
  select a.* from public.audios a
  where a.status = 'approved' and not (a.id = any(coalesce(excluded_ids[1:15], '{}'::uuid[])))
  order by (a.id = any(coalesce(recent_ids[1:30], '{}'::uuid[]))), random()
  limit 15;
$$;
revoke all on function public.sample_approved_audios(uuid[], uuid[]) from public;
grant execute on function public.sample_approved_audios(uuid[], uuid[]) to anon, authenticated;
