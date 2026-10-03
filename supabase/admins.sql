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
