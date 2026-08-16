-- Terrassenlobby – ALLE Partys löschen und bei null anfangen.
--
-- ⚠️ Achtung: Das entfernt sämtliche Partys aller Nutzer, inklusive
-- Adressen, Kategorien-Verknüpfungen, Fotos, Beitrittsanfragen und
-- Bewertungen. Accounts und Profile bleiben erhalten.
--
-- Gedacht zum Aufräumen während der Entwicklung. Vor dem Livegang sollte
-- dieses Skript nicht mehr benutzt werden.
--
-- Die Bilddateien im Speicher werden hier NICHT mitgelöscht – dafür in
-- Supabase unter Storage -> party-photos die Ordner entfernen (oder die
-- auskommentierte Zeile am Ende verwenden).

begin;

-- Alles Abhängige verschwindet über die Fremdschlüssel automatisch mit:
-- party_addresses, party_tags, party_photos, photo_comments,
-- join_requests, party_ratings, guest_ratings
delete from parties;

-- Meldungen beziehen sich teils auf gelöschte Partys – ebenfalls leeren
delete from reports;

commit;

-- Kontrolle
select
  (select count(*) from parties) as partys,
  (select count(*) from join_requests) as anfragen,
  (select count(*) from party_ratings) as bewertungen;

-- Optional: auch die Bilddateien entfernen (setzt die storage-Erweiterung
-- voraus und kann bei sehr vielen Dateien etwas dauern):
-- delete from storage.objects where bucket_id = 'party-photos';
