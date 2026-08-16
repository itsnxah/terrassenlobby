-- Terrassenlobby – Fotokommentare aktivieren.
-- Im Supabase SQL Editor ausführen, NACH fix_rekursion.sql und bewertungen.sql
-- (braucht deren Hilfsfunktionen can_see_party() und has_checked_in()).
--
-- Regel: Kommentieren darf nur, wer der Host ist oder nachweislich per
-- "Ich bin da" eingecheckt hat – nicht schon, wer nur zugesagt hat. Lesen
-- dürfen alle, die die Party (und damit ihre Fotos) ohnehin sehen dürfen;
-- das ist bislang enger gefasst als bei den Fotos selbst, wir ziehen beide
-- Regeln hier auf denselben Stand (can_see_party) – sonst könnten Gäste
-- einer privaten Party die Fotos in der App zwar sehen, aber die
-- RLS-Regel hätte sie ihnen bislang verweigert.
--
-- Gefahrlos mehrfach ausführbar.

drop policy if exists "Fotos oeffentlicher Partys sind lesbar" on party_photos;
create policy "Fotos oeffentlicher Partys sind lesbar" on party_photos
  for select using (public.can_see_party(party_id));

drop policy if exists "Kommentare sind lesbar" on photo_comments;
create policy "Kommentare sind lesbar" on photo_comments
  for select using (
    exists (
      select 1 from party_photos ph
      where ph.id = photo_comments.photo_id
        and public.can_see_party(ph.party_id)
    )
  );

drop policy if exists "Beteiligte kommentieren" on photo_comments;
create policy "Nur Anwesende kommentieren" on photo_comments
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from party_photos ph
      join parties p on p.id = ph.party_id
      where ph.id = photo_id
        and (p.host_id = auth.uid() or public.has_checked_in(p.id))
    )
  );

-- Löschregel unverändert (aus korrekturen.sql), hier nur sichergestellt,
-- dass sie auch dann existiert, wenn dieses Skript zuerst läuft.
do $$ begin
  create policy "Eigene Kommentare loeschen" on photo_comments
    for delete using (auth.uid() = author_id);
exception when duplicate_object then null; end $$;
