-- Terrassenlobby – Korrekturen nach dem Sicherheits- und Funktionsaudit.
-- Im Supabase SQL Editor ausführen, NACH allen anderen Skripten.
-- Das Skript ist mehrfach ausführbar.

-- ===========================================================================
-- 1) KRITISCH: Gäste konnten sich selbst annehmen
--
-- Die Insert-Policy prüfte nur, wer anfragt – nicht mit welchem Status.
-- Und die Update-Policy hatte kein "with check", wodurch ein Gast den Status
-- seiner eigenen Anfrage direkt über die API auf 'accepted' setzen konnte.
-- Damit war die genaue Adresse ohne Zustimmung des Hosts lesbar.
--
-- Lösung: Ein Trigger entscheidet über den Status, nicht der Client.
-- ===========================================================================

create or replace function public.enforce_join_request_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid;
  v_mode approval_mode;
begin
  select host_id, approval_mode into v_host, v_mode
  from parties where id = new.party_id;

  if tg_op = 'INSERT' then
    -- Anfragen aus der App: Status wird serverseitig gesetzt.
    -- (auth.uid() ist null, wenn im SQL-Editor gearbeitet wird – dann
    --  bleiben die Werte unverändert, damit Testdaten funktionieren.)
    if auth.uid() is not null and auth.uid() = new.guest_id then
      new.status := case when v_mode = 'automatic' then 'accepted' else 'pending' end;
      new.host_response_message := null;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if auth.uid() is null or auth.uid() = v_host then
      return new; -- Host (oder Wartung) darf alles
    end if;

    if auth.uid() = old.guest_id then
      if new.status is distinct from old.status then
        raise exception 'Nur der Host kann über eine Anfrage entscheiden.';
      end if;
      if new.host_response_message is distinct from old.host_response_message then
        raise exception 'Nur der Host kann antworten.';
      end if;
      -- Zuordnung darf nicht umgehängt werden
      new.party_id := old.party_id;
      new.guest_id := old.guest_id;
      return new;
    end if;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists join_requests_rules on join_requests;
create trigger join_requests_rules
  before insert or update on join_requests
  for each row execute function public.enforce_join_request_rules();

-- Update-Policy mit "with check" nachziehen
drop policy if exists "Gast aktualisiert eigene Anfrage" on join_requests;
create policy "Gast aktualisiert eigene Anfrage" on join_requests
  for update to authenticated
  using (auth.uid() = guest_id)
  with check (auth.uid() = guest_id);

-- ===========================================================================
-- 2) KRITISCH: tags stand ohne RLS offen (jeder konnte umbenennen/löschen)
-- ===========================================================================
alter table tags enable row level security;

do $$ begin
  create policy "Tags sind lesbar" on tags for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Angemeldete legen Tags an" on tags
    for insert to authenticated with check (true);
exception when duplicate_object then null; end $$;

revoke update, delete on tags from anon, authenticated;
revoke insert on tags from anon;

-- ===========================================================================
-- 3) FEHLTE KOMPLETT: party_tags hatte RLS an, aber keine einzige Policy
--    -> Kategorien wurden nie geladen und beim Erstellen still verworfen
-- ===========================================================================
do $$ begin
  create policy "Party-Tags sind lesbar" on party_tags
    for select using (
      exists (
        select 1 from parties p
        where p.id = party_tags.party_id
          and (
            p.visibility = 'public'
            or p.host_id = auth.uid()
            or exists (
              select 1 from join_requests jr
              where jr.party_id = p.id and jr.guest_id = auth.uid()
            )
          )
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Host verknuepft Tags" on party_tags
    for insert with check (
      auth.uid() in (select host_id from parties where id = party_id)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Host entfernt Tags" on party_tags
    for delete using (
      auth.uid() in (select host_id from parties where id = party_id)
    );
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- 4) photo_comments: RLS war an, Policies fehlten (Funktion noch ungenutzt)
-- ===========================================================================
do $$ begin
  create policy "Kommentare sind lesbar" on photo_comments
    for select using (
      exists (
        select 1 from party_photos ph
        join parties p on p.id = ph.party_id
        where ph.id = photo_comments.photo_id
          and (p.visibility = 'public' or p.host_id = auth.uid())
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Beteiligte kommentieren" on photo_comments
    for insert with check (
      auth.uid() = author_id
      and exists (
        select 1 from party_photos ph
        join parties p on p.id = ph.party_id
        where ph.id = photo_id
          and (
            p.host_id = auth.uid()
            or exists (
              select 1 from join_requests jr
              where jr.party_id = p.id
                and jr.guest_id = auth.uid()
                and jr.status = 'accepted'
            )
          )
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Eigene Kommentare loeschen" on photo_comments
    for delete using (auth.uid() = author_id);
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- 5) Gästezahl war für Besucher immer 0
--
-- join_requests darf niemand außer Host und Gast lesen – dadurch kam die
-- Zahl der beigetretenen Gäste nie beim Besucher an. Diese View liefert nur
-- die aggregierte Zahl, und nur für öffentliche Partys.
-- Die alte View party_guest_counts umging RLS für ALLE Partys und fliegt raus.
-- ===========================================================================
drop view if exists party_guest_counts;

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

-- ===========================================================================
-- 6) Private Partys waren für Eingeladene nicht lesbar
-- ===========================================================================
do $$ begin
  create policy "Beteiligte sehen ihre Party" on parties
    for select using (
      exists (
        select 1 from join_requests jr
        where jr.party_id = parties.id and jr.guest_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- Einladungslink: liefert genau die Party zum Token, sonst nichts.
create or replace function public.party_by_invite(p_token uuid)
returns setof parties
language sql
security definer
stable
set search_path = public
as $$
  select * from parties where private_invite_token = p_token limit 1;
$$;

revoke all on function public.party_by_invite(uuid) from public;
grant execute on function public.party_by_invite(uuid) to anon, authenticated;

-- ===========================================================================
-- 7) Geburtsdatum war für alle lesbar – jetzt nur noch abgeleitet
-- ===========================================================================
revoke select (birth_date) on profiles from anon, authenticated;

create or replace function public.my_age()
returns int
language sql
security definer
stable
set search_path = public
as $$
  select case
           when birth_date is null then null
           else extract(year from age(birth_date))::int
         end
  from profiles where id = auth.uid();
$$;

revoke all on function public.my_age() from public;
grant execute on function public.my_age() to authenticated;

-- ===========================================================================
-- 8) Aufräum-Funktion war trotz revoke für alle aufrufbar
--    (Postgres vergibt EXECUTE standardmäßig an PUBLIC)
-- ===========================================================================
do $$ begin
  revoke all on function public.cleanup_old_data() from public, anon, authenticated;
exception when undefined_function then
  raise notice 'cleanup_old_data() existiert noch nicht – supabase/aufraeumen.sql zuerst ausführen.';
end $$;

-- ===========================================================================
-- 9) Alte, ungenutzte Adress-Spalte in parties entfernen
--    (die genaue Adresse liegt in party_addresses; die Restspalte war über
--     die "Öffentliche Partys sind lesbar"-Policy für alle lesbar)
-- ===========================================================================
alter table parties drop column if exists exact_address;
