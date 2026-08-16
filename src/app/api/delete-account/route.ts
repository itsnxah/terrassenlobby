import { createClient } from "@supabase/supabase-js";

/**
 * Löscht ein Konto vollständig und endgültig – DSGVO Art. 17 (Recht auf
 * Löschung). Läuft serverseitig, weil das Entfernen eines Auth-Kontos den
 * Service-Role-Key braucht, den kein Browser je zu Gesicht bekommen darf.
 *
 * Profil, Partys, Adressen, Foto-Datenbankeinträge, Beitrittsanfragen,
 * Bewertungen und Blockierungen hängen per "on delete cascade" am
 * Auth-Konto (siehe supabase/schema.sql, supabase/bewertungen.sql,
 * supabase/moderation.sql, supabase/konto_loeschen.sql) und verschwinden
 * automatisch mit. Nur die Bilddateien im Storage-Bucket räumen wir hier
 * gesondert weg, bevor das Konto gelöscht wird – die hängen an keinem
 * Fremdschlüssel und blieben sonst als Karteileichen liegen.
 */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return Response.json(
      {
        error:
          "Die automatische Kontolöschung ist auf diesem Server noch nicht eingerichtet. Schreib uns bitte direkt, dann löschen wir dein Konto von Hand.",
      },
      { status: 503 },
    );
  }

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user: caller },
  } = await admin.auth.getUser(token);

  if (!caller) {
    return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const { data: ownParties } = await admin
    .from("parties")
    .select("id")
    .eq("host_id", caller.id);

  for (const party of ownParties ?? []) {
    const { data: files } = await admin.storage.from("party-photos").list(party.id);
    if (files && files.length > 0) {
      await admin.storage
        .from("party-photos")
        .remove(files.map((f) => `${party.id}/${f.name}`));
    }
  }

  const { error } = await admin.auth.admin.deleteUser(caller.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ deleted: true });
}
