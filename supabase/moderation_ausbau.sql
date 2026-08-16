-- Terrassenlobby – Moderation: Admin-Rolle, Verbergen von Partys,
-- Rückmeldung an Meldende und automatische Notbremse.
-- Im Supabase SQL Editor ausführen, NACH supabase/fix_rekursion.sql.
--
-- Hintergrund: Nach Art. 16/17 DSA muss eine Meldung nicht nur entgegen-
-- genommen, sondern auch bearbeitet werden – der Meldende ist über das
-- Ergebnis zu informieren, der Betroffene bekommt bei einer Entfernung eine
-- Begründung. Genau das bildet dieses Skript ab.

-- ===========================================================================
-- 1) Admin-Rolle
-- ===========================================================================
alter table profiles add column if not exists is_admin boolean not null default false;

comment on column profiles.is_admin is
  'Darf Meldungen einsehen und bearbeiten. Nur von Hand im Dashboard setzen.';

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
-- Auch "anon" braucht das Ausführungsrecht: Die Funktion steckt weiter unten
-- in einer Select-Regel auf "parties", und Postgres wertet alle Regeln einer
-- Tabelle aus – auch für ausgeloggte Besucher. Ohne dieses Recht scheitert
-- für sie jede Abfrage auf parties. Gefahrlos, weil die Funktion ohne Login
-- immer "false" liefert.
grant execute on function public.is_admin() to anon, authenticated;

-- ===========================================================================
-- 2) Partys können durch Moderation verborgen werden
--    (getrennt vom "Schließen" durch den Host – anderer Anlass, andere Rechte)
-- ===========================================================================
alter table parties add column if not exists hidden_at timestamptz;
alter table parties add column if not exists hidden_reason text;

comment on column parties.hidden_at is
  'Von der Moderation verborgen – nicht mehr öffentlich sichtbar.';

-- Verborgene Partys verschwinden aus der öffentlichen Ansicht
drop policy if exists "Öffentliche Partys sind lesbar" on parties;
create policy "Öffentliche Partys sind lesbar" on parties
  for select using (visibility = 'public' and hidden_at is null);

-- Moderation darf alle Partys sehen und verbergen
do $$ begin
  create policy "Moderation sieht alle Partys" on parties
    for select using (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Moderation verbirgt Partys" on parties
    for update using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- 3) Meldungen: Ergebnis festhalten
-- ===========================================================================
alter table reports add column if not exists resolution text;
alter table reports add column if not exists resolved_at timestamptz;
alter table reports add column if not exists resolved_by uuid references profiles (id);

-- Moderation darf alle Meldungen sehen und bearbeiten
do $$ begin
  create policy "Moderation sieht alle Meldungen" on reports
    for select using (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Moderation bearbeitet Meldungen" on reports
    for update using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

grant update on reports to authenticated;

-- ===========================================================================
-- 4) Notbremse: ab drei unabhängigen Meldungen wird automatisch verborgen
--
--    Bewusst konservativ: Es zählen nur verschiedene meldende Personen und
--    nur noch offene Meldungen. Eine bereits geprüfte und verworfene Meldung
--    löst also nichts mehr aus, und niemand kann eine Party allein durch
--    mehrfaches Melden aus dem Feed schießen.
-- ===========================================================================
create or replace function public.auto_hide_reported_party()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if new.target_type <> 'party' then
    return new;
  end if;

  select count(distinct reporter_id) into v_count
  from reports
  where target_type = 'party'
    and target_id = new.target_id
    and status = 'open';

  if v_count >= 3 then
    update parties
    set hidden_at = now(),
        hidden_reason = 'Automatisch verborgen: mehrere unabhängige Meldungen. Die Party wird geprüft.'
    where id = new.target_id
      and hidden_at is null;
  end if;

  return new;
end;
$$;

drop trigger if exists reports_auto_hide on reports;
create trigger reports_auto_hide
  after insert on reports
  for each row execute function public.auto_hide_reported_party();

-- ===========================================================================
-- 5) Hilfsansicht für die Moderationsseite
--    Liefert Meldungen samt Party-Titel, ohne dass die Moderationsseite
--    quer über alle Tabellen abfragen muss.
-- ===========================================================================
create or replace view moderation_reports as
select
  r.id,
  r.target_type,
  r.target_id,
  r.reason,
  r.note,
  r.status,
  r.resolution,
  r.created_at,
  r.resolved_at,
  p.title as party_title,
  p.host_id,
  p.hidden_at,
  p.visibility,
  reporter.display_name as reporter_name,
  host.display_name as host_name
from reports r
left join parties p on p.id = r.target_id and r.target_type = 'party'
left join profiles reporter on reporter.id = r.reporter_id
left join profiles host on host.id = p.host_id;

-- Die View läuft mit Eigentümerrechten – deshalb hier zusätzlich absichern,
-- dass nur Admins sie überhaupt abfragen dürfen.
create or replace function public.moderation_queue()
returns setof moderation_reports
language sql
security definer
stable
set search_path = public
as $$
  select * from moderation_reports
  where public.is_admin()
  order by (status = 'open') desc, created_at desc;
$$;

revoke all on function public.moderation_queue() from public;
grant execute on function public.moderation_queue() to authenticated;

revoke all on moderation_reports from anon, authenticated;
