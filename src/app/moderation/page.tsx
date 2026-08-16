import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ModerationList, type ModerationReport } from "@/components/ModerationList";
import { RatingDisplay } from "@/components/StarRating";

export const dynamic = "force-dynamic";

function Tabs({ active, openCount }: { active: "meldungen" | "nutzer"; openCount: number }) {
  return (
    <div className="segment">
      <Link
        href="/moderation"
        data-active={active === "meldungen"}
        className="segment-item text-center"
      >
        🚩 Meldungen{openCount > 0 ? ` (${openCount})` : ""}
      </Link>
      <Link
        href="/moderation?tab=nutzer"
        data-active={active === "nutzer"}
        className="segment-item text-center"
      >
        👥 Nutzer
      </Link>
    </div>
  );
}

type UserRow = {
  id: string;
  display_name: string | null;
  created_at: string;
  is_admin: boolean;
};

type RatingRow = { host_id?: string; guest_id?: string; avg_rating: number; rating_count: number };

/** Genügt hier: wir brauchen nur "from(...)", siehe QueryableClient in lib/parties.ts. */
type QueryableClient = { from: (table: string) => any; rpc: (fn: string) => any };

async function UserDirectory({ supabase }: { supabase: QueryableClient }) {
  // "Profiles sind öffentlich lesbar" (siehe supabase/schema.sql) – das gilt
  // für alle eingeloggten Nutzer, nicht nur für Moderation. Hier zählt: wer
  // überhaupt ein Konto hat, taucht in dieser Liste auf.
  const [{ data: users }, { data: hostRatings }, { data: guestRatings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, created_at, is_admin")
      .order("created_at", { ascending: false }),
    supabase.from("public_host_ratings").select("host_id, avg_rating, rating_count"),
    supabase.from("public_guest_ratings").select("guest_id, avg_rating, rating_count"),
  ]);

  const hostMap = new Map<string, RatingRow>(
    ((hostRatings ?? []) as RatingRow[]).map((r) => [r.host_id as string, r]),
  );
  const guestMap = new Map<string, RatingRow>(
    ((guestRatings ?? []) as RatingRow[]).map((r) => [r.guest_id as string, r]),
  );

  const rows = (users ?? []) as UserRow[];

  if (rows.length === 0) {
    return (
      <div className="glass glass-sheen relative flex flex-col items-center gap-3 p-10 text-center">
        <span className="text-4xl">👥</span>
        <p className="font-semibold">Noch keine registrierten Konten</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-white/40">{rows.length} registrierte Konten insgesamt</p>
      {rows.map((u) => {
        const hostRating = hostMap.get(u.id);
        const guestRating = guestMap.get(u.id);
        return (
          <div
            key={u.id}
            className="glass-soft flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">
                  {u.display_name ?? "Ohne Namen"}
                </span>
                {u.is_admin && (
                  <span className="chip border-lobby-pink/40 bg-lobby-pink/15 text-pink-100">
                    🛡️ Moderation
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-2xs text-white/35">
                Dabei seit{" "}
                {new Date(u.created_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex shrink-0 gap-4 text-right">
              <div>
                <p className="text-2xs uppercase tracking-wider text-white/30">Als Host</p>
                <RatingDisplay
                  average={hostRating?.avg_rating ?? null}
                  count={hostRating?.rating_count ?? 0}
                />
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wider text-white/30">Als Gast</p>
                <RatingDisplay
                  average={guestRating?.avg_rating ?? null}
                  count={guestRating?.rating_count ?? 0}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="glass glass-sheen relative flex flex-col items-center gap-4 p-10 text-center">
        <span className="text-5xl">🛡️</span>
        <p className="text-lg font-bold">Moderation</p>
        <Link href="/login?next=/moderation" className="btn-primary">
          Einloggen
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return (
      <div className="glass glass-sheen relative flex flex-col items-center gap-3 p-10 text-center">
        <span className="text-5xl">🛡️</span>
        <p className="text-lg font-bold">Kein Zugriff</p>
        <p className="max-w-sm text-sm leading-relaxed text-white/50">
          Diese Seite ist der Moderation vorbehalten. Falls das dein Konto sein
          soll: In Supabase unter Table Editor → profiles das Feld
          <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 text-xs">
            is_admin
          </code>
          auf true setzen.
        </p>
        <Link href="/" className="btn-ghost">
          Zurück
        </Link>
      </div>
    );
  }

  const tab = searchParams.tab === "nutzer" ? "nutzer" : "meldungen";

  const { data } = await supabase.rpc("moderation_queue");
  const reports = (data ?? []) as ModerationReport[];
  const open = reports.filter((r) => r.status === "open");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight">
          Mode<span className="bg-gradient-to-r from-lobby-pink via-lobby-violet to-lobby-blue bg-clip-text text-transparent">ration</span>
        </h1>
        <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/50">
          Gemeldete Inhalte prüfen und einen Überblick über alle registrierten
          Konten behalten.
        </p>
      </header>

      <Tabs active={tab} openCount={open.length} />

      {tab === "meldungen" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="chip border-lobby-pink/40 bg-lobby-pink/15 text-pink-100">
              {open.length} offen
            </span>
            <span className="chip border-white/[0.12] bg-white/[0.06] text-white/60">
              {reports.length} insgesamt
            </span>
          </div>
          <ModerationList initialReports={reports} />
        </div>
      ) : (
        <UserDirectory supabase={supabase} />
      )}
    </div>
  );
}
