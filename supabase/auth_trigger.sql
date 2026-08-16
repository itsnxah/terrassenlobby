-- Zusatz-Skript zu schema.sql: automatisches Profil bei Registrierung.
-- Im Supabase SQL Editor NACH schema.sql ausführen.
--
-- Wenn sich jemand über supabase.auth.signUp() registriert und dabei
-- options.data = { display_name, birth_date } mitgibt, legt dieser Trigger
-- automatisch die passende Zeile in public.profiles an.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, birth_date)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'birth_date', '')::date
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
