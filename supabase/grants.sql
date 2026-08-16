-- Zusatz-Skript: Basis-Zugriffsrechte für die App-Rollen (anon/authenticated).
-- Im Supabase SQL Editor NACH schema.sql und auth_trigger.sql ausführen.
--
-- Ohne das hier bekommt die App "permission denied for table ..." – das ist
-- eine andere Ebene als die Row-Level-Security-Policies aus schema.sql.
-- RLS entscheidet WELCHE Zeilen sichtbar/änderbar sind, dieses Skript
-- entscheidet, ob die Tabelle für die App-Rollen grundsätzlich erreichbar
-- ist. Beides zusammen ergibt die tatsächliche Sicherheit.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public
  to anon, authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;
