-- Terrassenlobby – Lobby schließen/löschen und maximale Gästezahl.
-- Im Supabase SQL Editor ausführen, NACH supabase/korrekturen.sql.

-- ---------------------------------------------------------------------------
-- Neue Felder
-- ---------------------------------------------------------------------------
alter table parties add column if not exists max_guests int;
alter table parties add column if not exists closed_at timestamptz;

comment on column parties.max_guests is
  'Obergrenze für Startkapazität + über die App beigetretene Gäste. NULL = unbegrenzt.';
comment on column parties.closed_at is
  'Gesetzt, wenn der Host die Lobby geschlossen hat. Dann sind keine neuen Anfragen mehr möglich.';

-- ---------------------------------------------------------------------------
-- Regeln für Beitrittsanfragen erweitern:
--   * keine Anfragen an geschlossene Lobbys
--   * Obergrenze wird in der Datenbank durchgesetzt, nicht nur im Browser
-- (ersetzt die Funktion aus korrekturen.sql, Statusregeln bleiben erhalten)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_join_request_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid;
  v_mode approval_mode;
  v_closed timestamptz;
  v_start int;
  v_max int;
  v_taken int;
begin
  select host_id, approval_mode, closed_at, start_capacity, max_guests
    into v_host, v_mode, v_closed, v_start, v_max
  from parties where id = new.party_id;

  -- ---- Anlegen einer Anfrage ---------------------------------------------
  if tg_op = 'INSERT' then
    if auth.uid() is not null and auth.uid() = new.guest_id then
      if v_closed is not null then
        raise exception 'Diese Lobby ist geschlossen.';
      end if;

      -- Status setzt der Server, nicht der Client
      new.status := case when v_mode = 'automatic' then 'accepted' else 'pending' end;
      new.host_response_message := null;

      if v_max is not null then
        select coalesce(sum(party_size), 0) into v_taken
        from join_requests
        where party_id = new.party_id and status = 'accepted';

        if v_start + v_taken + new.party_size > v_max then
          raise exception 'Die Lobby ist voll.';
        end if;
      end if;
    end if;

    return new;
  end if;

  -- ---- Ändern einer Anfrage ----------------------------------------------
  if tg_op = 'UPDATE' then
    -- Auch der Host darf die Obergrenze nicht überschreiten
    if new.status = 'accepted' and old.status <> 'accepted' and v_max is not null then
      select coalesce(sum(party_size), 0) into v_taken
      from join_requests
      where party_id = new.party_id and status = 'accepted' and id <> new.id;

      if v_start + v_taken + new.party_size > v_max then
        raise exception 'Die Lobby ist voll – so viele Plätze sind nicht mehr frei.';
      end if;
    end if;

    if auth.uid() is null or auth.uid() = v_host then
      return new; -- Host (oder Wartung) darf entscheiden
    end if;

    if auth.uid() = old.guest_id then
      if new.status is distinct from old.status then
        raise exception 'Nur der Host kann über eine Anfrage entscheiden.';
      end if;
      if new.host_response_message is distinct from old.host_response_message then
        raise exception 'Nur der Host kann antworten.';
      end if;
      new.party_id := old.party_id;
      new.guest_id := old.guest_id;
      return new;
    end if;

    return new;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Gästezahl-View um die Obergrenze ergänzen, damit Besucher "12 / 20" sehen
-- ---------------------------------------------------------------------------
create or replace view public_party_guest_counts as
select
  p.id as party_id,
  coalesce(sum(jr.party_size) filter (where jr.status = 'accepted'), 0)::int
    as joined_guests_count
from parties p
left join join_requests jr on jr.party_id = p.id
where p.visibility = 'public'
group by p.id;

grant select on public_party_guest_counts to anon, authenticated;
