import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  PARTY_SELECT_QUERY,
  attachGuestCounts,
  attachRatings,
  rowToParty,
} from "@/lib/parties";
import { mockParties } from "@/data/mockParties";
import { PartyCard } from "@/components/PartyCard";
import { CATEGORY_ORDER, CATEGORY_THEMES } from "@/lib/categories";
import type { TagCategory } from "@/types/party";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: { kategorie?: string; status?: string };
}) {
  const supabase = createClient();

  // Nur bekannte Kategorien akzeptieren – alles andere wird ignoriert.
  const activeCategory = CATEGORY_ORDER.includes(
    searchParams.kategorie as TagCategory,
  )
    ? (searchParams.kategorie as TagCategory)
    : null;

  const liveOnly = searchParams.status === "live";

  const { data, error } = await supabase
    .from("parties")
    .select(PARTY_SELECT_QUERY)
    .eq("visibility", "public")
    .is("closed_at", null)
    .is("hidden_at", null)
    .order("created_at", { ascending: false });

  const usingFallback = Boolean(error);
  const rawParties = usingFallback || !data ? mockParties : data.map(rowToParty);
  const withCounts = await attachGuestCounts(supabase, rawParties);
  const allParties = await attachRatings(supabase, withCounts);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Partys von blockierten Hosts ausblenden.
  let blockedIds: string[] = [];
  // Altersfreigabe: Wer noch keine 18 ist, bekommt keine 18+-Partys zu sehen.
  let age: number | null = null;

  if (user) {
    const [{ data: blocks }, { data: ageResult }] = await Promise.all([
      supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
      supabase.rpc("my_age"),
    ]);
    blockedIds = (blocks ?? []).map((b) => b.blocked_id);
    age = typeof ageResult === "number" ? ageResult : null;
  }

  // Sichtbarer Gesamtbestand (ohne blockierte Hosts) – Basis für Zähler.
  const visibleParties = allParties
    .filter((p) => !blockedIds.includes(p.hostId))
    .filter((p) => age === null || age >= 18 || p.ageRating !== "18+");

  // Darauf wird gefiltert, was der Nutzer ausgewählt hat.
  const parties = visibleParties
    .filter(
      (p) => !activeCategory || p.tags.some((t) => t.category === activeCategory),
    )
    .filter((p) => !liveOnly || p.status === "live");

  const liveCount = visibleParties.filter((p) => p.status === "live").length;
  const guestCount = visibleParties.reduce(
    (sum, p) => sum + p.startCapacity + p.joinedGuestsCount,
    0,
  );

  const filterActive = Boolean(activeCategory) || liveOnly;

  return (
    <div className="space-y-8">
      {/* --- Hero ---------------------------------------------------- */}
      <section className="glass glass-sheen relative animate-riseIn overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-lobby-accent/25 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-lobby-violet/25 blur-3xl" />

        <div className="relative">
          <Link
            href={(() => {
              // Kategoriefilter beim Umschalten nicht verlieren
              const params = new URLSearchParams();
              if (activeCategory) params.set("kategorie", activeCategory);
              if (!liveOnly) params.set("status", "live");
              return params.toString() ? `/?${params.toString()}` : "/";
            })()}
            className={`chip transition ${
              liveOnly
                ? "border-lobby-pink/60 bg-lobby-pink/20 text-white"
                : "border-white/[0.12] bg-white/[0.06] text-white/70 hover:border-white/25"
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-lobby-accent" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lobby-accent" />
            </span>
            {liveCount > 0
              ? `${liveCount} Lobby${liveCount === 1 ? "" : "s"} live`
              : "Noch nichts live"}
            {liveOnly && <span className="ml-0.5 opacity-60">✕</span>}
          </Link>

          <h1 className="mt-4 text-[2.1rem] font-bold leading-[1.08] tracking-tight text-balance sm:text-[2.6rem]">
            Finde die Party,
            <br />
            <span className="bg-gradient-to-r from-lobby-pink via-lobby-violet to-lobby-blue bg-clip-text text-transparent">
              der du beitreten willst.
            </span>
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/[0.55]">
            Partys in deiner Nähe – trete den Party-Servern in Reallife bei.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/karte" className="btn-primary">
              Karte öffnen
            </Link>
            <Link href="/host/create" className="btn-ghost">
              Eigene Party starten
            </Link>
          </div>

          <div className="mt-7 flex gap-6 border-t border-white/10 pt-5">
            <div>
              <p className="text-xl font-bold">{visibleParties.length}</p>
              <p className="text-2xs uppercase tracking-wider text-white/40">
                Lobbys
              </p>
            </div>
            <div>
              <p className="text-xl font-bold">{liveCount}</p>
              <p className="text-2xs uppercase tracking-wider text-white/40">
                Gerade live
              </p>
            </div>
            <div>
              <p className="text-xl font-bold">{guestCount}</p>
              <p className="text-2xs uppercase tracking-wider text-white/40">
                Plätze gesamt
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Kategorien als Filter ------------------------------------ */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="section-title">Stöbern nach Stimmung</h2>
          {filterActive && (
            <Link
              href="/"
              className="shrink-0 text-sm font-medium text-white/50 transition hover:text-white"
            >
              Filter zurücksetzen
            </Link>
          )}
        </div>

        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORY_ORDER.map((category, i) => {
            const theme = CATEGORY_THEMES[category];
            // Zähler immer auf dem Gesamtbestand, damit die Zahlen beim
            // Filtern nicht auf 0 zusammenfallen.
            const count = visibleParties.filter((p) =>
              p.tags.some((t) => t.category === category),
            ).length;
            const active = activeCategory === category;

            // Live-Filter beim Kategoriewechsel beibehalten.
            const params = new URLSearchParams();
            if (!active) params.set("kategorie", category);
            if (liveOnly) params.set("status", "live");
            const href = params.toString() ? `/?${params.toString()}` : "/";

            return (
              <Link
                key={category}
                href={href}
                scroll={false}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`relative w-40 shrink-0 snap-start animate-riseIn overflow-hidden rounded-xl2 border bg-gradient-to-br p-4 transition duration-300 ${theme.gradient} ${
                  active
                    ? `border-white/70 ${theme.glow} scale-[1.02]`
                    : "border-white/10 hover:border-white/35"
                }`}
              >
                <div
                  className={`absolute inset-0 transition ${
                    active ? "bg-ink-950/15" : "bg-ink-950/45"
                  }`}
                />
                <span className="absolute -bottom-3 -right-2 select-none text-5xl opacity-30">
                  {theme.emoji}
                </span>
                <div className="relative">
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    {theme.label}
                    {active && <span className="text-2xs opacity-70">✕</span>}
                  </p>
                  <p className="mt-0.5 text-2xs text-white/70">
                    {count} {count === 1 ? "Lobby" : "Lobbys"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* --- Feed ----------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="section-title">
            {activeCategory
              ? CATEGORY_THEMES[activeCategory].label
              : liveOnly
                ? "Läuft gerade"
                : "In deiner Nähe"}
            {filterActive && (
              <span className="ml-2 text-sm font-medium text-white/40">
                {parties.length}
              </span>
            )}
          </h2>
          <Link
            href="/karte"
            className="shrink-0 text-sm font-medium text-white/50 transition hover:text-white"
          >
            Auf Karte →
          </Link>
        </div>

        {usingFallback && (
          <div className="glass-soft border-fuchsia-300/25 bg-fuchsia-400/[0.08] p-4 text-xs leading-relaxed text-fuchsia-100/90">
            Keine Verbindung zu Supabase – es werden Beispieldaten angezeigt.
            <span className="mt-1 block text-fuchsia-100/50">{error?.message}</span>
          </div>
        )}

        {parties.length === 0 ? (
          <div className="glass glass-sheen relative flex flex-col items-center gap-4 p-10 text-center">
            <span className="animate-floaty text-5xl">
              {filterActive ? "🔍" : "🪩"}
            </span>
            <div>
              <p className="font-semibold">
                {filterActive
                  ? "Hier ist gerade nichts los."
                  : "Noch ist es still hier."}
              </p>
              <p className="mt-1 text-sm text-white/50">
                {filterActive
                  ? "In dieser Auswahl gibt es keine Lobby – schau dir die anderen an."
                  : "Sei die erste Person, die eine Lobby aufmacht."}
              </p>
            </div>
            {filterActive ? (
              <Link href="/" className="btn-ghost">
                Alle Lobbys zeigen
              </Link>
            ) : (
              <Link href="/host/create" className="btn-primary">
                Party erstellen
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {parties.map((party, i) => (
              <PartyCard key={party.id} party={party} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
