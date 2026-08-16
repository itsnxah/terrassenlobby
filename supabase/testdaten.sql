-- Terrassenlobby – 10 Testpartys mit unterschiedlichen Konfigurationen.
-- Im Supabase SQL Editor ausführen, NACHDEM du dich einmal in der App
-- registriert hast (es wird das zuerst angelegte Profil als Host benutzt).
--
-- Entfernen lässt sich alles wieder mit supabase/testdaten_entfernen.sql.
--
-- Hinweis zu den Beitrittsanfragen am Ende: Als Gast wird derselbe Account
-- eingetragen wie als Host, weil ohne zweiten registrierten Nutzer kein
-- weiteres Profil existiert. In der Host-Ansicht steht deshalb dein eigener
-- Name bei den Anfragen – zum Testen der Oberfläche reicht das.

do $$
declare
  h uuid;
  p uuid;
begin
  select id into h from profiles order by created_at limit 1;
  if h is null then
    raise exception 'Kein Profil gefunden. Bitte zuerst in der App registrieren.';
  end if;

  -- Fehlende Tags ergänzen (die meisten kommen aus schema.sql)
  insert into tags (category, label) values
    ('sonstiges', 'Rooftop'),
    ('musik', 'Techno'),
    ('aktivitaet', 'Karaoke'),
    ('mottoparty', 'Neon')
  on conflict (label) do nothing;

  ---------------------------------------------------------------------------
  -- 1) Live · öffentlich · 18+ · Drinks da · offener Beitritt · Musik
  ---------------------------------------------------------------------------
  insert into parties (host_id, title, description, visibility, status, age_rating,
    alcohol_status, approval_mode, start_capacity, starts_at,
    approx_lat, approx_lng, approx_radius_meters)
  values (h, 'Dachterrassen-Warmup',
    E'Kleines Vorglühen auf der Dachterrasse, bevor es später in die Stadt geht.\nSonnenuntergang, kalte Getränke, entspannte Leute. Kommt einfach vorbei!',
    'public', 'live', '18+', 'provided', 'automatic', 8, now() - interval '1 hour',
    52.5200, 13.4050, 400)
  returning id into p;
  insert into party_tags (party_id, tag_id) select p, id from tags where label in ('House', 'Rooftop');
  insert into party_addresses (party_id, exact_address) values (p, 'Torstraße 128, 10119 Berlin');

  ---------------------------------------------------------------------------
  -- 2) Live · öffentlich · 16+ · BYO · Host bestätigt · Aktivität
  ---------------------------------------------------------------------------
  insert into parties (host_id, title, description, visibility, status, age_rating,
    alcohol_status, approval_mode, start_capacity, starts_at,
    approx_lat, approx_lng, approx_radius_meters)
  values (h, 'Spieleabend im Hinterhof',
    E'Brettspiele, Lichterketten und eine Runde Werwolf.\nAlkohol ist kein Muss – bringt mit, worauf ihr Lust habt.',
    'public', 'live', '16+', 'byo', 'manual', 6, now() - interval '30 minutes',
    52.4986, 13.4180, 300)
  returning id into p;
  insert into party_tags (party_id, tag_id) select p, id from tags where label in ('Chillen');
  insert into party_addresses (party_id, exact_address) values (p, 'Oranienstraße 45, 10969 Berlin');

  ---------------------------------------------------------------------------
  -- 3) Geplant morgen · öffentlich · 18+ · Drinks da · manuell · Motto + Aktivität
  ---------------------------------------------------------------------------
  insert into parties (host_id, title, description, visibility, status, age_rating,
    alcohol_status, approval_mode, start_capacity, starts_at,
    approx_lat, approx_lng, approx_radius_meters)
  values (h, 'Krimi-Kostümparty',
    E'Kostümparty mit Krimi-Ratespiel – wer ist der Mörder?\nVerkleidung ist Pflicht, Kreativität ausdrücklich erwünscht. Wir starten das Spiel gegen 21 Uhr.',
    'public', 'planned', '18+', 'provided', 'manual', 12, now() + interval '1 day',
    52.5390, 13.4240, 500)
  returning id into p;
  insert into party_tags (party_id, tag_id) select p, id from tags where label in ('Kostümparty', 'Krimi-Ratespiel');
  insert into party_addresses (party_id, exact_address) values (p, 'Kastanienallee 12, 10435 Berlin');

  ---------------------------------------------------------------------------
  -- 4) Geplant in 3 Tagen · öffentlich · 16+ · BYO · automatisch · Musik
  ---------------------------------------------------------------------------
  insert into parties (host_id, title, description, visibility, status, age_rating,
    alcohol_status, approval_mode, start_capacity, starts_at,
    approx_lat, approx_lng, approx_radius_meters)
  values (h, 'HipHop-Kellersession',
    E'Kleiner Keller, große Boxen. Offenes Mikro für alle, die was können (oder es versuchen wollen).',
    'public', 'planned', '16+', 'byo', 'automatic', 15, now() + interval '3 days',
    52.4810, 13.4350, 600)
  returning id into p;
  insert into party_tags (party_id, tag_id) select p, id from tags where label in ('HipHop');
  insert into party_addresses (party_id, exact_address) values (p, 'Weserstraße 190, 12045 Berlin');

  ---------------------------------------------------------------------------
  -- 5) Geplant am Wochenende · öffentlich · 18+ · Drinks da · manuell · Motto
  ---------------------------------------------------------------------------
  insert into parties (host_id, title, description, visibility, status, age_rating,
    alcohol_status, approval_mode, start_capacity, starts_at,
    approx_lat, approx_lng, approx_radius_meters)
  values (h, '80er Neon-Nacht',
    E'Föhnfrisuren, Schulterpolster, Synthesizer.\nWer im schlechtesten Outfit kommt, bekommt den ersten Drink umsonst.',
    'public', 'planned', '18+', 'provided', 'manual', 20, now() + interval '5 days',
    52.5150, 13.4540, 500)
  returning id into p;
  insert into party_tags (party_id, tag_id) select p, id from tags where label in ('80er Jahre', 'Neon');
  insert into party_addresses (party_id, exact_address) values (p, 'Boxhagener Straße 78, 10245 Berlin');

  ---------------------------------------------------------------------------
  -- 6) Live · öffentlich · 18+ · BYO · automatisch · Sonstiges (große Party)
  ---------------------------------------------------------------------------
  insert into parties (host_id, title, description, visibility, status, age_rating,
    alcohol_status, approval_mode, start_capacity, starts_at,
    approx_lat, approx_lng, approx_radius_meters)
  values (h, 'WG-Einweihung',
    E'Neue Bude, alte Freunde, neue Gesichter.\nDie Küche ist die Tanzfläche, der Balkon die Raucherecke. Bringt was zu trinken mit.',
    'public', 'live', '18+', 'byo', 'automatic', 25, now() - interval '2 hours',
    52.5480, 13.3560, 350)
  returning id into p;
  insert into party_tags (party_id, tag_id) select p, id from tags where label in ('WG-Party');
  insert into party_addresses (party_id, exact_address) values (p, 'Malplaquetstraße 22, 13347 Berlin');

  ---------------------------------------------------------------------------
  -- 7) PRIVAT · geplant · 18+ · taucht bewusst NICHT im Feed auf
  ---------------------------------------------------------------------------
  insert into parties (host_id, title, description, visibility, status, age_rating,
    alcohol_status, approval_mode, start_capacity, starts_at,
    approx_lat, approx_lng, approx_radius_meters, private_invite_token)
  values (h, 'Geburtstag (privat)',
    E'Nur für eingeladene Leute – Link nicht weitergeben.',
    'private', 'planned', '18+', 'provided', 'manual', 30, now() + interval '9 days',
    52.5050, 13.3040, 400, gen_random_uuid())
  returning id into p;
  insert into party_tags (party_id, tag_id) select p, id from tags where label in ('House');
  insert into party_addresses (party_id, exact_address) values (p, 'Kantstraße 5, 10623 Berlin');

  ---------------------------------------------------------------------------
  -- 8) Geplant · öffentlich · 16+ · OHNE Tags (testet Standard-Farbwelt)
  ---------------------------------------------------------------------------
  insert into parties (host_id, title, description, visibility, status, age_rating,
    alcohol_status, approval_mode, start_capacity, starts_at,
    approx_lat, approx_lng, approx_radius_meters)
  values (h, 'Gartenparty ohne Motto',
    E'Einfach nur zusammensitzen, Musik läuft nebenbei. Keine große Sache.',
    'public', 'planned', '16+', 'byo', 'manual', 10, now() + interval '2 days',
    53.5511, 9.9937, 800)
  returning id into p;
  insert into party_addresses (party_id, exact_address) values (p, 'Schanzenstraße 40, 20357 Hamburg');

  ---------------------------------------------------------------------------
  -- 9) Live · öffentlich · 18+ · VIELE Tags (testet die "+N"-Anzeige)
  ---------------------------------------------------------------------------
  insert into parties (host_id, title, description, visibility, status, age_rating,
    alcohol_status, approval_mode, start_capacity, starts_at,
    approx_lat, approx_lng, approx_radius_meters)
  values (h, 'Alles-Gleichzeitig-Party',
    E'Karaoke im Wohnzimmer, Techno im Flur, Kostüme optional.\nWir haben uns nicht entscheiden können – ihr müsst es auch nicht.',
    'public', 'live', '18+', 'provided', 'manual', 18, now() - interval '3 hours',
    48.1351, 11.5820, 450)
  returning id into p;
  insert into party_tags (party_id, tag_id) select p, id from tags
    where label in ('Karaoke', 'Techno', 'Kostümparty', 'Neon', 'Chillen');
  insert into party_addresses (party_id, exact_address) values (p, 'Fraunhoferstraße 9, 80469 München');

  ---------------------------------------------------------------------------
  -- 10) Weit in der Zukunft · öffentlich · 18+ · automatisch · Rooftop
  ---------------------------------------------------------------------------
  insert into parties (host_id, title, description, visibility, status, age_rating,
    alcohol_status, approval_mode, start_capacity, starts_at,
    approx_lat, approx_lng, approx_radius_meters)
  values (h, 'Sommer-Rooftop am Rhein',
    E'Sobald es warm genug ist: Dach auf, Anlage an.\nGroße Fläche, viel Platz – meldet euch früh, dann planen wir besser.',
    'public', 'planned', '18+', 'provided', 'automatic', 40, now() + interval '21 days',
    50.9375, 6.9603, 700)
  returning id into p;
  insert into party_tags (party_id, tag_id) select p, id from tags where label in ('Rooftop', 'House');
  insert into party_addresses (party_id, exact_address) values (p, 'Rheinuferstraße 3, 50678 Köln');

  ---------------------------------------------------------------------------
  -- Beitrittsanfragen, damit Gästezahlen und die Host-Ansicht befüllt sind
  ---------------------------------------------------------------------------
  -- angenommen -> erhöht "über die App beigetreten"
  insert into join_requests (party_id, guest_id, party_size, message, status, host_response_message)
  select id, h, 3, 'Hey! Wir wären zu dritt, passt das noch?', 'accepted', 'Klar, kommt vorbei!'
  from parties where host_id = h and title = 'Dachterrassen-Warmup';

  insert into join_requests (party_id, guest_id, party_size, message, status, host_response_message)
  select id, h, 2, 'Zu zweit, bringen Kostüme mit.', 'accepted', 'Perfekt, bis morgen!'
  from parties where host_id = h and title = 'Krimi-Kostümparty';

  insert into join_requests (party_id, guest_id, party_size, message, status)
  select id, h, 5, 'Wir kommen als Gruppe, 5 Leute.', 'accepted'
  from parties where host_id = h and title = '80er Neon-Nacht';

  -- offen -> erscheint in der Host-Ansicht unter "Offene Anfragen"
  insert into join_requests (party_id, guest_id, party_size, message, status)
  select id, h, 1, 'Komme allein, kenne aber Lisa von der Uni. Wäre gern dabei!', 'pending'
  from parties where host_id = h and title = 'Spieleabend im Hinterhof';

  insert into join_requests (party_id, guest_id, party_size, message, status)
  select id, h, 4, 'Wir sind vier und bringen eigene Getränke mit.', 'pending'
  from parties where host_id = h and title = 'Alles-Gleichzeitig-Party';

  raise notice 'Fertig: 10 Testpartys angelegt.';
end $$;
