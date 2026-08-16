-- Terrassenlobby – Vorbereitung für die Selbstbedienung "Konto löschen".
--
-- Löscht man ein Konto (auth.users), verschwinden Profil, Partys, Adressen,
-- Foto-Einträge, Beitrittsanfragen, Bewertungen und Blockierungen bereits
-- automatisch mit – die Fremdschlüssel stehen auf "on delete cascade"
-- (siehe schema.sql, bewertungen.sql, moderation.sql).
--
-- Drei Ausnahmen hatten das noch nicht gesetzt und hätten eine Löschung im
-- falschen Moment mit einem Fremdschlüssel-Fehler blockiert:
--
--   reports.resolved_by      – wer eine Meldung bearbeitet hat. Löschen wir
--                               das Konto der Moderation, soll die Meldung
--                               samt Entscheidung erhalten bleiben – nur der
--                               Verweis auf die Person wird geleert.
--   photo_comments.author_id – ein Kommentar zu einem fremden Foto. Löschen
--                               wir das Konto der kommentierenden Person,
--                               darf der Kommentar mit verschwinden.
--   party_photos.uploaded_by – in der Praxis lädt nur der Host Fotos zu
--                               seinen eigenen Partys hoch, dann greift
--                               ohnehin schon die Kaskade über die Party.
--                               Sicherheitshalber trotzdem abgesichert.
--
-- Gefahrlos mehrfach ausführbar.

alter table reports
  drop constraint if exists reports_resolved_by_fkey,
  add constraint reports_resolved_by_fkey
    foreign key (resolved_by) references profiles (id) on delete set null;

alter table photo_comments
  drop constraint if exists photo_comments_author_id_fkey,
  add constraint photo_comments_author_id_fkey
    foreign key (author_id) references profiles (id) on delete cascade;

alter table party_photos
  drop constraint if exists party_photos_uploaded_by_fkey,
  add constraint party_photos_uploaded_by_fkey
    foreign key (uploaded_by) references profiles (id) on delete cascade;
