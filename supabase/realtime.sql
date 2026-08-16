-- Terrassenlobby – Live-Aktualisierung für Beitrittsanfragen.
-- Im Supabase SQL Editor ausführen.
--
-- Damit meldet Supabase Änderungen an join_requests sofort an die App, und
-- neue Anfragen bzw. Antworten erscheinen ohne Neuladen der Seite.
-- Die Zugriffsregeln (RLS) gelten dabei weiterhin: Jede Person bekommt nur
-- die Änderungen zu sehen, die sie ohnehin lesen dürfte.
--
-- Ohne dieses Skript funktioniert die App trotzdem – sie fragt dann alle
-- 20 Sekunden bzw. beim Zurückkehren in den Tab selbst nach.

do $$ begin
  alter publication supabase_realtime add table join_requests;
exception
  when duplicate_object then null;
  when undefined_object then
    raise notice 'Publication supabase_realtime nicht gefunden – Realtime ist in diesem Projekt nicht aktiv.';
end $$;

-- Für vollständige Änderungsdaten (sonst kommen bei UPDATE nur die
-- Primärschlüssel mit).
alter table join_requests replica identity full;
