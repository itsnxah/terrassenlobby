import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RatingDisplay } from "@/components/StarRating";

export const dynamic = "force-dynamic";

function RoleCard({
  role,
  emoji,
  average,
  count,
  hint,
}: {
  role: string;
  emoji: string;
  average: number | null;
  count: number;
  hint: string;
}) {
  return (
    <div className="glass glass-sheen relative space-y-3 p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.07] text-lg">
          {emoji}
        </span>
        <div>
          <p className="text-sm font-bold">{role}</p>
          <p className="text-2xs text-white/40">{hint}</p>
        </div>
      </div>

      {count > 0 ? (
        <>
          <p className="text-3xl font-bold tabular-nums">{average?.toFixed(1)}</p>
          <RatingDisplay average={average} count={count} />
        </>
      ) : (
        <>
          <p className="text-3xl font-bold text-white/20">–</p>
          <p className="text-2xs text-white/35">Noch keine Bewertungen</p>
        </>
      )}
    </div>
  );
}

export default async function ProfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="glass glass-sheen relative flex flex-col items-center gap-4 p-10 text-center">
        <span className="animate-floaty text-5xl">👤</span>
        <div>
          <p className="text-lg font-bold">Dein Profil</p>
          <p className="mt-1 text-sm text-white/50">
            Melde dich an, um dein Profil und deine Bewertungen zu sehen.
          </p>
        </div>
        <Link href="/login?next=/profil" className="btn-primary">
          Einloggen
        </Link>
      </div>
    );
  }

  const [
    { data: profile },
    { data: hostRating },
    { data: guestRating },
    { data: ownParties },
    { data: attended },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("public_host_ratings")
      .select("avg_rating, rating_count")
      .eq("host_id", user.id)
      .maybeSingle(),
    supabase
      .from("public_guest_ratings")
      .select("avg_rating, rating_count")
      .eq("guest_id", user.id)
      .maybeSingle(),
    supabase
      .from("parties")
      .select("id, title, starts_at, visibility, closed_at")
      .eq("host_id", user.id)
      .order("starts_at", { ascending: false }),
    supabase
      .from("join_requests")
      .select(
        "id, status, checked_in, party:parties ( id, title, starts_at )",
      )
      .eq("guest_id", user.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false }),
  ]);

  // Bewertungen der eigenen Partys nachladen
  const partyIds = (ownParties ?? []).map((p) => p.id);
  const { data: partyRatings } = partyIds.length
    ? await supabase
        .from("public_party_ratings")
        .select("party_id, avg_rating, rating_count")
        .in("party_id", partyIds)
    : { data: [] };

  type PartyRatingRow = {
    party_id: string;
    avg_rating: number;
    rating_count: number;
  };
  const ratingByParty = new Map<string, PartyRatingRow>(
    (partyRatings ?? []).map((r: PartyRatingRow): [string, PartyRatingRow] => [
      r.party_id,
      r,
    ]),
  );

  const attendedList = (attended ?? []) as any[];
  const checkedInCount = attendedList.filter((a) => a.checked_in).length;

  const displayName =
    profile?.display_name ??
    (user.user_metadata?.display_name as string | undefined) ??
    user.email ??
    "Du";

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("de-DE", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-8">
      {/* --- Kopf ----------------------------------------------------- */}
      <section className="glass glass-sheen relative flex animate-riseIn items-center gap-4 overflow-hidden p-6">
        <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-lobby-violet/25 blur-3xl" />

        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lobby-pink to-lobby-blue text-2xl font-bold text-ink-950 ring-1 ring-white/20">
          {displayName.trim().charAt(0).toUpperCase()}
        </span>

        <div className="relative min-w-0">
          <h1 className="truncate text-[1.7rem] font-bold leading-tight tracking-tight">
            {displayName}
          </h1>
          <p className="mt-0.5 text-sm text-white/45">
            {memberSince ? `Dabei seit ${memberSince}` : "Willkommen"}
          </p>
        </div>
      </section>

      {/* --- Die zwei Rollen getrennt --------------------------------- */}
      <section className="space-y-3">
        <div>
          <h2 className="section-title">Deine Bewertungen</h2>
          <p className="mt-1 text-sm text-white/50">
            Als Gastgeber und als Gast wirst du getrennt bewertet – das eine
            beeinflusst das andere nicht.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <RoleCard
            role="Als Host"
            emoji="🎪"
            average={hostRating?.avg_rating ?? null}
            count={hostRating?.rating_count ?? 0}
            hint="Durchschnitt aller deiner Partys"
          />
          <RoleCard
            role="Als Gast"
            emoji="🎟️"
            average={guestRating?.avg_rating ?? null}
            count={guestRating?.rating_count ?? 0}
            hint="Von Gastgebern vergeben"
          />
        </div>
      </section>

      {/* --- Zahlen --------------------------------------------------- */}
      <section className="glass-soft grid grid-cols-3 gap-4 p-5">
        <div>
          <p className="text-xl font-bold">{ownParties?.length ?? 0}</p>
          <p className="text-2xs uppercase tracking-wider text-white/40">
            Partys gehostet
          </p>
        </div>
        <div>
          <p className="text-xl font-bold">{attendedList.length}</p>
          <p className="text-2xs uppercase tracking-wider text-white/40">
            Zusagen erhalten
          </p>
        </div>
        <div>
          <p className="text-xl font-bold">{checkedInCount}</p>
          <p className="text-2xs uppercase tracking-wider text-white/40">
            Wirklich dabei
          </p>
        </div>
      </section>

      {/* --- Eigene Partys mit Einzelbewertung ------------------------ */}
      <section className="space-y-3">
        <h2 className="section-title">Deine Partys als Host</h2>

        {!ownParties || ownParties.length === 0 ? (
          <div className="glass-soft flex flex-col items-center gap-3 p-8 text-center">
            <span className="text-3xl">🎪</span>
            <p className="text-sm text-white/45">
              Du hast noch keine Party gehostet.
            </p>
            <Link href="/host/create" className="btn-primary">
              Erste Lobby öffnen
            </Link>
          </div>
        ) : (
          <div className="grid gap-2">
            {ownParties.map((p) => {
              const r = ratingByParty.get(p.id);
              return (
                <Link
                  key={p.id}
                  href={`/host/${p.id}`}
                  className="glass-soft flex items-center gap-3 p-4 transition hover:border-white/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {p.title}
                      {p.closed_at && (
                        <span className="ml-2 text-2xs font-normal text-white/35">
                          geschlossen
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-2xs text-white/35">
                      {new Date(p.starts_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                      {p.visibility === "private" ? " · privat" : ""}
                    </p>
                  </div>
                  <RatingDisplay
                    average={r?.avg_rating ?? null}
                    count={r?.rating_count ?? 0}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* --- Partys, auf denen du Gast warst -------------------------- */}
      <section className="space-y-3">
        <h2 className="section-title">Partys als Gast</h2>

        {attendedList.length === 0 ? (
          <p className="glass-soft p-5 text-sm text-white/45">
            Du warst noch auf keiner Party als Gast dabei.
          </p>
        ) : (
          <div className="grid gap-2">
            {attendedList.map((a) => (
              <Link
                key={a.id}
                href={`/party/${a.party?.id}`}
                className="glass-soft flex items-center gap-3 p-4 transition hover:border-white/20"
              >
                <span className="text-lg">{a.checked_in ? "📍" : "🎟️"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {a.party?.title ?? "Party"}
                  </p>
                  <p className="mt-0.5 text-2xs text-white/35">
                    {a.party?.starts_at
                      ? new Date(a.party.starts_at).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : ""}
                    {a.checked_in ? " · warst vor Ort" : " · nicht eingecheckt"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs leading-relaxed text-white/30">
        Wer dich wie bewertet hat, ist für niemanden einsehbar – auch für dich
        nicht. Angezeigt werden ausschließlich Durchschnitt und Anzahl.
      </p>
    </div>
  );
}
