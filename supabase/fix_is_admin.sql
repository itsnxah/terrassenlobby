-- Terrassenlobby – Fehlerbehebung: "permission denied for function is_admin"
--
-- Ursache
-- -------
-- moderation_ausbau.sql legt auf der Tabelle "parties" die Regel
-- "Moderation sieht alle Partys" an, die public.is_admin() aufruft.
-- Postgres wertet ALLE Select-Regeln einer Tabelle aus, also auch für
-- Besucher, die nicht eingeloggt sind (Rolle "anon"). Die Ausführungsrechte
-- für is_admin() waren aber nur an "authenticated" vergeben – dadurch
-- scheiterte für Ausgeloggte jede einzelne Abfrage auf parties, und die App
-- ist auf die Beispieldaten zurückgefallen.
--
-- Die Funktion selbst ist ungefährlich: Sie läuft mit security definer und
-- liefert für nicht eingeloggte Aufrufe schlicht "false".
--
-- Dieses Skript ist gefahrlos mehrfach ausführbar.

grant execute on function public.is_admin() to anon, authenticated;

-- Gleiche Vorsichtsmaßnahme für die Bewertungs-Hilfsfunktion: Sie steckt in
-- Regeln auf party_ratings und würde bei ausgeloggten Zugriffen sonst
-- denselben Fehler auslösen.
do $$ begin
  grant execute on function public.has_checked_in(uuid) to anon, authenticated;
exception when undefined_function then
  raise notice 'has_checked_in() gibt es noch nicht – bewertungen.sql wurde offenbar noch nicht eingespielt.';
end $$;

-- Kontrolle: Beide Rollen müssen hier "true" liefern.
select
  has_function_privilege('anon',          'public.is_admin()', 'execute') as anon_darf,
  has_function_privilege('authenticated', 'public.is_admin()', 'execute') as user_darf;
