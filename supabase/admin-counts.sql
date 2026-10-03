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
