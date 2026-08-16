-- Terrassenlobby – Datenbankschema für Supabase (Postgres)
-- Einspielen: Supabase Dashboard -> SQL Editor -> dieses Skript ausführen.
-- Row Level Security (RLS) ist bewusst restriktiv voreingestellt; Policies
-- müssen vor dem produktiven Einsatz noch verfeinert werden (siehe TODOs).

-- Profiles: erweitert auth.users um App-spezifische Felder
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  birth_date date, -- Grundlage für Altersfreigabe-Check (16+/18+)
  created_at timestamptz not null default now()
);

-- Feste Tag-Kategorien (siehe Konzept: "Feste Kategorien" statt freier Eingabe)
create type tag_category as enum ('mottoparty', 'musik', 'aktivitaet', 'sonstiges');

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  category tag_category not null,
  label text not null unique
);

create type party_visibility as enum ('public', 'private');
create type party_status as enum ('planned', 'live');
create type age_rating as enum ('16+', '18+');
create type approval_mode as enum ('manual', 'automatic');
create type alcohol_status as enum ('provided', 'byo');

create table if not exists parties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  description text not null,
  visibility party_visibility not null default 'public',
  status party_status not null default 'planned',
  age_rating age_rating not null default '18+',
  alcohol_status alcohol_status not null default 'provided',
  approval_mode approval_mode not null default 'manual',
  start_capacity int not null default 1,
  starts_at timestamptz not null,
  -- Verschwommener Standort für die Kartenansicht vor Beitritt
  approx_lat double precision not null,
  approx_lng double precision not null,
  approx_radius_meters int not null default 400,
  -- Exakte Adresse, erst nach Beitritt (+ Host-Freigabe) sichtbar
  exact_address text,
  cover_photo_url text,
  private_invite_token uuid, -- gesetzt, wenn visibility = 'private'
  created_at timestamptz not null default now()
);

create table if not exists party_tags (
  party_id uuid references parties (id) on delete cascade,
  tag_id uuid references tags (id) on delete cascade,
  primary key (party_id, tag_id)
);

create table if not exists party_photos (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references parties (id) on delete cascade,
  url text not null,
  uploaded_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists photo_comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references party_photos (id) on delete cascade,
  author_id uuid not null references profiles (id),
  -- Gäste müssen sich zuordnen: Startkapazität oder zusätzlich beigetreten
  author_is_start_guest boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);

create type join_request_status as enum ('pending', 'accepted', 'declined');

create table if not exists join_requests (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references parties (id) on delete cascade,
  guest_id uuid not null references profiles (id) on delete cascade,
  party_size int not null default 1, -- Gruppen-Beitritt: vertretene Personenzahl
  message text,
  status join_request_status not null default 'pending',
  host_response_message text,
  estimated_arrival timestamptz,
  checked_in boolean not null default false, -- "Ich bin da"-Button
  created_at timestamptz not null default now(),
  unique (party_id, guest_id)
);

-- Praktischer View: aktuelle Gästezahl (Startkapazität + akzeptierte Beitritte)
create or replace view party_guest_counts as
select
  p.id as party_id,
  p.start_capacity,
  coalesce(sum(jr.party_size) filter (where jr.status = 'accepted'), 0) as joined_guests_count
from parties p
left join join_requests jr on jr.party_id = p.id
group by p.id, p.start_capacity;

-- Row Level Security aktivieren
alter table profiles enable row level security;
alter table parties enable row level security;
alter table party_tags enable row level security;
alter table party_photos enable row level security;
alter table photo_comments enable row level security;
alter table join_requests enable row level security;

-- Basis-Policies (MVP – vor Produktivbetrieb verfeinern!)
-- TODO: private Partys nur via privatem Token sichtbar machen,
-- TODO: exact_address nur für akzeptierte Gäste + Host freigeben (z. B. via View/Function statt Rohspalte).

create policy "Profiles sind öffentlich lesbar" on profiles
  for select using (true);

create policy "Nutzer pflegen ihr eigenes Profil" on profiles
  for update using (auth.uid() = id);

create policy "Öffentliche Partys sind lesbar" on parties
  for select using (visibility = 'public');

create policy "Host verwaltet eigene Partys" on parties
  for all using (auth.uid() = host_id);

create policy "Gast sieht eigene Anfragen" on join_requests
  for select using (auth.uid() = guest_id);

create policy "Host sieht Anfragen zu eigenen Partys" on join_requests
  for select using (
    auth.uid() in (select host_id from parties where parties.id = party_id)
  );

create policy "Gast erstellt eigene Anfrage" on join_requests
  for insert with check (auth.uid() = guest_id);

create policy "Host aktualisiert Anfragen zu eigenen Partys" on join_requests
  for update using (
    auth.uid() in (select host_id from parties where parties.id = party_id)
  );

-- Beispiel-Tags zum Start (feste Kategorien, siehe Konzept)
insert into tags (category, label) values
  ('mottoparty', 'Kostümparty'),
  ('mottoparty', '80er Jahre'),
  ('musik', 'House'),
  ('musik', 'HipHop'),
  ('aktivitaet', 'Krimi-Ratespiel'),
  ('aktivitaet', 'Chillen'),
  ('sonstiges', 'WG-Party')
on conflict (label) do nothing;
