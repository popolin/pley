-- Shared rate-limit infrastructure. Safe to re-run; does not change upload policies.
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

