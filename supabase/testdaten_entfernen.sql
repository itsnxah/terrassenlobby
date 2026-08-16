-- Entfernt die Testpartys aus supabase/testdaten.sql wieder.
-- Adressen, Tags-Verknüpfungen und Beitrittsanfragen verschwinden automatisch
-- mit (die Fremdschlüssel sind auf "on delete cascade" gesetzt).
--
-- Die zusätzlich angelegten Tags (Rooftop, Techno, Karaoke, Neon) bleiben
-- bestehen – sie stören nicht und lassen sich weiterverwenden.

delete from parties where title in (
  'Dachterrassen-Warmup',
  'Spieleabend im Hinterhof',
  'Krimi-Kostümparty',
  'HipHop-Kellersession',
  '80er Neon-Nacht',
  'WG-Einweihung',
  'Geburtstag (privat)',
  'Gartenparty ohne Motto',
  'Alles-Gleichzeitig-Party',
  'Sommer-Rooftop am Rhein'
);
