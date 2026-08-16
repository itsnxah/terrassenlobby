-- Terrassenlobby – Meldungen, Blockierungen und ergänzende Rechte.
-- Im Supabase SQL Editor NACH schema.sql, auth_trigger.sql, grants.sql und
-- party_addresses.sql ausführen.

-- ---------------------------------------------------------------------------
-- Meldungen (Notice-and-Action, Art. 16 DSA)
-- ---------------------------------------------------------------------------
do $$ begin
  create type report_target as enum ('party', 'profile', 'photo', 'comment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('open', 'reviewed', 'dismissed');
exception when duplicate_object then null; end $$;

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles (id) on delete set null,
  target_type report_target not null,
  target_id uuid not null,
  reason text not null,
  note text,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);

alter table reports enable row level security;

-- Melden darf jede eingeloggte Person; sehen nur die eigenen Meldungen.
-- Die Sichtung übernimmst du vorerst direkt im Supabase-Dashboard
-- (Table Editor -> reports, status auf 'reviewed'/'dismissed' setzen).
create policy "Eingeloggte koennen melden" on reports
  for insert with check (auth.uid() = reporter_id);

create policy "Eigene Meldungen einsehen" on reports
  for select using (auth.uid() = reporter_id);

grant select, insert on reports to authenticated;

-- ---------------------------------------------------------------------------
-- Blockierungen
-- ---------------------------------------------------------------------------
create table if not exists blocks (
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

alter table blocks enable row level security;

create policy "Eigene Blockierungen verwalten" on blocks
  for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

grant select, insert, delete on blocks to authenticated;

-- ---------------------------------------------------------------------------
-- Ergänzung: Gast darf die eigene Beitrittsanfrage aktualisieren
-- (Ankunftszeit, "Ich bin da"-Bestätigung, Zurückziehen)
-- ---------------------------------------------------------------------------
do $$ begin
  create policy "Gast aktualisiert eigene Anfrage" on join_requests
    for update using (auth.uid() = guest_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Gast loescht eigene Anfrage" on join_requests
    for delete using (auth.uid() = guest_id);
exception when duplicate_object then null; end $$;
