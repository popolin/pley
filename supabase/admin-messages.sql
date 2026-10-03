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
