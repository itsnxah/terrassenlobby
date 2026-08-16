-- Terrassenlobby – automatisches Löschen alter Daten.
-- Im Supabase SQL Editor ausführen.
--
-- Setzt um, was in der Datenschutzerklärung steht:
--   * genaue Adressen: spätestens 30 Tage nach der Party
--   * Beitrittsanfragen: spätestens 90 Tage nach der Party
--
-- Als "Ende der Party" wird der Startzeitpunkt verwendet – ein Enddatum
-- speichern wir nicht, und ein Tag Unterschied fällt bei diesen Fristen
-- nicht ins Gewicht.

create or replace function public.cleanup_old_data()
returns table (deleted_addresses int, deleted_requests int)
language plpgsql
security definer
set search_path = public
as $$
declare
  a int;
  r int;
begin
  delete from party_addresses pa
  using parties p
  where pa.party_id = p.id
    and p.starts_at < now() - interval '30 days';
  get diagnostics a = row_count;

  delete from join_requests jr
  using parties p
  where jr.party_id = p.id
    and p.starts_at < now() - interval '90 days';
  get diagnostics r = row_count;

  return query select a, r;
end;
$$;

-- Nur der Datenbank selbst erlauben, das aufzurufen – nicht der App.
revoke all on function public.cleanup_old_data() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Täglich um 03:30 UTC ausführen (pg_cron).
-- Falls pg_cron im Projekt nicht verfügbar ist, bricht das Skript hier nicht
-- ab – dann muss cleanup_old_data() anders angestoßen werden (siehe README).
-- ---------------------------------------------------------------------------
do $$
begin
  create extension if not exists pg_cron;

  -- Alten Job entfernen, damit das Skript mehrfach ausführbar bleibt
  begin
    perform cron.unschedule('terrassenlobby-cleanup');
  exception when others then null;
  end;

  perform cron.schedule(
    'terrassenlobby-cleanup',
    '30 3 * * *',
    $inner$ select public.cleanup_old_data(); $inner$
  );

  raise notice 'Aufräum-Job täglich um 03:30 UTC eingerichtet.';
exception when others then
  raise notice 'pg_cron nicht verfügbar (%). cleanup_old_data() muss anders angestoßen werden.', sqlerrm;
end $$;

-- Zum sofortigen Testen von Hand:
--   select * from public.cleanup_old_data();
