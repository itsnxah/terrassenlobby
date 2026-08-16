-- Zusatz-Skript: Genaue Adresse getrennt & streng geschützt speichern.
-- Im Supabase SQL Editor NACH schema.sql, auth_trigger.sql und grants.sql
-- ausführen.
--
-- Warum eine eigene Tabelle statt einer Spalte in "parties"?
-- Die "parties"-Tabelle ist für öffentliche Partys komplett lesbar (RLS-Policy
-- "Öffentliche Partys sind lesbar"). Würde die exakte Adresse dort als Spalte
-- stehen, könnte jeder sie über die API auslesen, auch ohne Beitritt – die
-- App würde sie zwar nicht anzeigen, aber technisch wäre sie trotzdem
-- abrufbar. Eine eigene Tabelle mit eigenen RLS-Regeln verhindert das auf
-- Datenbankebene, nicht nur in der Oberfläche.
-- (Die alte "exact_address"-Spalte in "parties" bleibt ungenutzt bestehen,
-- wird aber von der App nicht mehr beschrieben oder gelesen.)

create table if not exists party_addresses (
  party_id uuid primary key references parties (id) on delete cascade,
  exact_address text not null,
  updated_at timestamptz not null default now()
);

alter table party_addresses enable row level security;

create policy "Host sieht eigene Party-Adresse" on party_addresses
  for select using (
    auth.uid() in (select host_id from parties where parties.id = party_id)
  );

create policy "Akzeptierter Gast sieht Party-Adresse" on party_addresses
  for select using (
    exists (
      select 1 from join_requests jr
      where jr.party_id = party_addresses.party_id
        and jr.guest_id = auth.uid()
        and jr.status = 'accepted'
    )
  );

create policy "Host legt eigene Party-Adresse an" on party_addresses
  for insert with check (
    auth.uid() in (select host_id from parties where parties.id = party_id)
  );

create policy "Host aktualisiert eigene Party-Adresse" on party_addresses
  for update using (
    auth.uid() in (select host_id from parties where parties.id = party_id)
  );

-- Zugriffsrechte für die App-Rollen (siehe grants.sql-Prinzip)
grant select, insert, update on party_addresses to authenticated;
grant select on party_addresses to anon; -- RLS lässt anon trotzdem nichts sehen (kein auth.uid())
