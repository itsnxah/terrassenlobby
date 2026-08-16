-- Terrassenlobby – Zustimmung zu Nutzungsbedingungen und Datenschutzerklärung.
-- Im Supabase SQL Editor ausführen.
--
-- Die DSGVO verlangt, dass eine Einwilligung nachweisbar ist (Art. 7 Abs. 1).
-- Deshalb wird nicht nur "ja" gespeichert, sondern der Zeitpunkt – und die
-- Fassung, der zugestimmt wurde. Ändern sich die Texte, kann man später
-- erkennen, wer noch der alten Fassung zugestimmt hat.

alter table profiles add column if not exists terms_accepted_at timestamptz;
alter table profiles add column if not exists privacy_accepted_at timestamptz;
alter table profiles add column if not exists accepted_version text;

comment on column profiles.accepted_version is
  'Fassung der Rechtstexte, der zugestimmt wurde (z. B. "2026-08-17")';

-- Der Trigger aus auth_trigger.sql übernimmt die Werte jetzt mit.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_accepted timestamptz;
begin
  -- Bei der Registrierung wird der Zeitpunkt der Zustimmung mitgeschickt.
  v_accepted := nullif(new.raw_user_meta_data->>'accepted_at', '')::timestamptz;

  insert into public.profiles (
    id, display_name, birth_date,
    terms_accepted_at, privacy_accepted_at, accepted_version
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'birth_date', '')::date,
    v_accepted,
    v_accepted,
    nullif(new.raw_user_meta_data->>'accepted_version', '')
  );
  return new;
end;
$$;
