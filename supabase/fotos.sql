-- Terrassenlobby – Fotouploads für eigene Lobbys.
-- Im Supabase SQL Editor ausführen (nach den anderen Skripten).

-- ---------------------------------------------------------------------------
-- 1) Speicher-Bucket für die Bilddateien
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('party-photos', 'party-photos', true)
on conflict (id) do nothing;

-- Öffentlich lesbar (die Dateinamen sind zufällig, die Bilder hängen an
-- öffentlichen Partys). Hochladen und Löschen darf nur der jeweilige Host.
-- Die Ordnerstruktur ist <party_id>/<zufallsname>.<endung> – daraus wird die
-- Berechtigung abgeleitet.
do $$ begin
  create policy "Party-Fotos sind lesbar" on storage.objects
    for select using (bucket_id = 'party-photos');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Host laedt Party-Fotos hoch" on storage.objects
    for insert to authenticated with check (
      bucket_id = 'party-photos'
      and (storage.foldername(name))[1] in (
        select id::text from parties where host_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Host loescht eigene Party-Fotos" on storage.objects
    for delete to authenticated using (
      bucket_id = 'party-photos'
      and (storage.foldername(name))[1] in (
        select id::text from parties where host_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2) Zugriffsregeln für die Tabelle party_photos
--    (die Tabelle gibt es seit schema.sql, ihr fehlten aber die Policies)
-- ---------------------------------------------------------------------------
do $$ begin
  create policy "Fotos oeffentlicher Partys sind lesbar" on party_photos
    for select using (
      exists (
        select 1 from parties p
        where p.id = party_photos.party_id
          and (p.visibility = 'public' or p.host_id = auth.uid())
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Host fuegt Fotos hinzu" on party_photos
    for insert with check (
      auth.uid() = uploaded_by
      and auth.uid() in (select host_id from parties where id = party_id)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Host loescht eigene Fotos" on party_photos
    for delete using (
      auth.uid() in (select host_id from parties where id = party_id)
    );
exception when duplicate_object then null; end $$;

grant select, insert, delete on party_photos to authenticated;
grant select on party_photos to anon;
