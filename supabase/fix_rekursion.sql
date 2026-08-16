-- Terrassenlobby – Behebt "infinite recursion detected in policy for relation parties".
-- Im Supabase SQL Editor ausführen.
--
-- Ursache:
--   Die Regel "Beteiligte sehen ihre Party" (aus korrekturen.sql) fragt in
--   join_requests nach. Die Regeln auf join_requests fragen ihrerseits in
--   parties nach ("Host sieht Anfragen zu eigenen Partys"). Postgres prüft
--   also parties -> join_requests -> parties -> … und bricht mit einem
--   Rekursionsfehler ab. Sichtbar wurde das beim Anlegen einer Party, weil
--   dabei die eingefügte Zeile wieder gelesen wird.
--
-- Lösung:
--   Die Prüfungen wandern in kleine "security definer"-Funktionen. Die laufen
--   mit den Rechten ihres Eigentümers und lösen deshalb keine weitere
--   Regelprüfung aus – die Kette ist unterbrochen. Inhaltlich ändert sich
--   nichts: Es gelten dieselben Bedingungen wie vorher.

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------------

-- Bin ich Host dieser Party?
create or replace function public.is_party_host(p_party_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from parties p
    where p.id = p_party_id and p.host_id = auth.uid()
  );
$$;

-- Habe ich bei dieser Party angefragt (egal mit welchem Ergebnis)?
create or replace function public.is_party_participant(p_party_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from join_requests jr
    where jr.party_id = p_party_id and jr.guest_id = auth.uid()
  );
$$;

-- Wurde meine Anfrage angenommen?
create or replace function public.is_accepted_guest(p_party_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from join_requests jr
    where jr.party_id = p_party_id
      and jr.guest_id = auth.uid()
      and jr.status = 'accepted'
  );
$$;

-- Darf ich diese Party überhaupt sehen?
create or replace function public.can_see_party(p_party_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from parties p
    where p.id = p_party_id
      and (
        p.visibility = 'public'
        or p.host_id = auth.uid()
        or exists (
          select 1 from join_requests jr
          where jr.party_id = p.id and jr.guest_id = auth.uid()
        )
      )
  );
$$;

grant execute on function
  public.is_party_host(uuid),
  public.is_party_participant(uuid),
  public.is_accepted_guest(uuid),
  public.can_see_party(uuid)
to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Regeln auf die Funktionen umstellen
-- ---------------------------------------------------------------------------

-- parties: die rekursive Regel ersetzen
drop policy if exists "Beteiligte sehen ihre Party" on parties;
create policy "Beteiligte sehen ihre Party" on parties
  for select using (public.is_party_participant(id));

-- party_tags
drop policy if exists "Party-Tags sind lesbar" on party_tags;
create policy "Party-Tags sind lesbar" on party_tags
  for select using (public.can_see_party(party_id));

drop policy if exists "Host verknuepft Tags" on party_tags;
create policy "Host verknuepft Tags" on party_tags
  for insert with check (public.is_party_host(party_id));

drop policy if exists "Host entfernt Tags" on party_tags;
create policy "Host entfernt Tags" on party_tags
  for delete using (public.is_party_host(party_id));

-- party_addresses
drop policy if exists "Host sieht eigene Party-Adresse" on party_addresses;
create policy "Host sieht eigene Party-Adresse" on party_addresses
  for select using (public.is_party_host(party_id));

drop policy if exists "Akzeptierter Gast sieht Party-Adresse" on party_addresses;
create policy "Akzeptierter Gast sieht Party-Adresse" on party_addresses
  for select using (public.is_accepted_guest(party_id));

drop policy if exists "Host legt eigene Party-Adresse an" on party_addresses;
create policy "Host legt eigene Party-Adresse an" on party_addresses
  for insert with check (public.is_party_host(party_id));

drop policy if exists "Host aktualisiert eigene Party-Adresse" on party_addresses;
create policy "Host aktualisiert eigene Party-Adresse" on party_addresses
  for update using (public.is_party_host(party_id));

-- join_requests: Host-Zugriff ebenfalls ohne Umweg über die parties-Regeln
drop policy if exists "Host sieht Anfragen zu eigenen Partys" on join_requests;
create policy "Host sieht Anfragen zu eigenen Partys" on join_requests
  for select using (public.is_party_host(party_id));

drop policy if exists "Host aktualisiert Anfragen zu eigenen Partys" on join_requests;
create policy "Host aktualisiert Anfragen zu eigenen Partys" on join_requests
  for update using (public.is_party_host(party_id));

-- party_photos
drop policy if exists "Fotos oeffentlicher Partys sind lesbar" on party_photos;
create policy "Fotos oeffentlicher Partys sind lesbar" on party_photos
  for select using (public.can_see_party(party_id));

drop policy if exists "Host fuegt Fotos hinzu" on party_photos;
create policy "Host fuegt Fotos hinzu" on party_photos
  for insert with check (
    auth.uid() = uploaded_by and public.is_party_host(party_id)
  );

drop policy if exists "Host loescht eigene Fotos" on party_photos;
create policy "Host loescht eigene Fotos" on party_photos
  for delete using (public.is_party_host(party_id));
