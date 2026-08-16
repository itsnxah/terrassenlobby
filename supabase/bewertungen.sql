-- Terrassenlobby – Bewertungen (1–5 Sterne) und die Grundlage dafür.
-- Im Supabase SQL Editor ausführen, NACH supabase/fix_rekursion.sql.
--
-- Grundregel: Bewerten darf nur, wer per "Ich bin da" bestätigt hat, wirklich
-- vor Ort gewesen zu sein. Diese Prüfung passiert in der Datenbank, nicht im
-- Browser – sonst könnte sie jeder umgehen.

-- ===========================================================================
-- 1) Hilfsfunktion: War diese Person bei der Party eingecheckt?
-- ===========================================================================
create or replace function public.has_checked_in(p_party_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from join_requests jr
    where jr.party_id = p_party_id
      and jr.guest_id = auth.uid()
      and jr.status = 'accepted'
      and jr.checked_in = true
  );
$$;

grant execute on function public.has_checked_in(uuid) to authenticated;

-- ===========================================================================
-- 2) Bewertung einer Party durch einen Gast
-- ===========================================================================
create table if not exists party_ratings (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references parties (id) on delete cascade,
  rater_id uuid not null references profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (party_id, rater_id)
);

alter table party_ratings enable row level security;

-- Nur die eigene Bewertung ist einsehbar. Alle anderen sehen ausschließlich
-- den Durchschnitt über die Views weiter unten – niemand kann nachvollziehen,
-- wer wie bewertet hat.
do $$ begin
  create policy "Eigene Party-Bewertung lesen" on party_ratings
    for select using (auth.uid() = rater_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Eingecheckte Gaeste bewerten" on party_ratings
    for insert with check (
      auth.uid() = rater_id and public.has_checked_in(party_id)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Eigene Party-Bewertung aendern" on party_ratings
    for update using (auth.uid() = rater_id)
    with check (auth.uid() = rater_id and public.has_checked_in(party_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Eigene Party-Bewertung loeschen" on party_ratings
    for delete using (auth.uid() = rater_id);
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on party_ratings to authenticated;

-- ===========================================================================
-- 3) Bewertung eines Gastes durch den Host
-- ===========================================================================
create table if not exists guest_ratings (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references parties (id) on delete cascade,
  guest_id uuid not null references profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (party_id, guest_id)
);

alter table guest_ratings enable row level security;

-- Der Host sieht, was er selbst vergeben hat; der Gast sieht seine eigenen
-- Bewertungen ebenfalls (Auskunftsrecht), sonst nur Durchschnitte.
do $$ begin
  create policy "Beteiligte sehen Gast-Bewertung" on guest_ratings
    for select using (
      auth.uid() = guest_id or public.is_party_host(party_id)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Host bewertet eingecheckte Gaeste" on guest_ratings
    for insert with check (
      public.is_party_host(party_id)
      and exists (
        select 1 from join_requests jr
        where jr.party_id = guest_ratings.party_id
          and jr.guest_id = guest_ratings.guest_id
          and jr.status = 'accepted'
          and jr.checked_in = true
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Host aendert eigene Gast-Bewertung" on guest_ratings
    for update using (public.is_party_host(party_id))
    with check (public.is_party_host(party_id));
exception when duplicate_object then null; end $$;

grant select, insert, update on guest_ratings to authenticated;

-- ===========================================================================
-- 4) Öffentliche Durchschnitte
--    Views laufen mit den Rechten ihres Eigentümers und liefern deshalb nur
--    aggregierte Werte – nie einzelne Bewertungen oder deren Urheber.
-- ===========================================================================

-- Durchschnitt je Party
create or replace view public_party_ratings as
select
  r.party_id,
  round(avg(r.rating)::numeric, 1)::float8 as avg_rating,
  count(*)::int as rating_count
from party_ratings r
group by r.party_id;

-- Durchschnitt je Host, gebildet aus allen Bewertungen seiner Partys
create or replace view public_host_ratings as
select
  p.host_id,
  round(avg(r.rating)::numeric, 1)::float8 as avg_rating,
  count(*)::int as rating_count
from party_ratings r
join parties p on p.id = r.party_id
group by p.host_id;

-- Durchschnitt je Gast (vergeben von Hosts)
create or replace view public_guest_ratings as
select
  g.guest_id,
  round(avg(g.rating)::numeric, 1)::float8 as avg_rating,
  count(*)::int as rating_count
from guest_ratings g
group by g.guest_id;

grant select on public_party_ratings to anon, authenticated;
grant select on public_host_ratings to anon, authenticated;
grant select on public_guest_ratings to anon, authenticated;

-- ===========================================================================
-- 5) Zeitstempel bei Änderungen mitführen
-- ===========================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists party_ratings_touch on party_ratings;
create trigger party_ratings_touch before update on party_ratings
  for each row execute function public.touch_updated_at();

drop trigger if exists guest_ratings_touch on guest_ratings;
create trigger guest_ratings_touch before update on guest_ratings
  for each row execute function public.touch_updated_at();
