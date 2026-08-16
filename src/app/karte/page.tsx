import { createClient } from "@/lib/supabase/server";
import { PARTY_SELECT_QUERY, rowToParty } from "@/lib/parties";
import { mockParties } from "@/data/mockParties";
import { CATEGORY_ORDER, CATEGORY_THEMES, partyTheme } from "@/lib/categories";
import { MapClient } from "./MapClient";
import type { MapParty } from "@/components/PartyMap";
import type { Party } from "@/types/party";

export const dynamic = "force-dynamic";

function toMapParty(party: Party): MapParty {
  const theme = partyTheme(party);
  return {
    id: party.id,
    title: party.title,
    lat: party.approxLocation.lat,
    lng: party.approxLocation.lng,
    radiusMeters: party.approxLocation.radiusMeters,
    ageRating: party.ageRating,
    status: party.status,
    accent: theme.accent,
    emoji: theme.emoji,
  };
}

export default async function KartePage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("parties")
    .select(PARTY_SELECT_QUERY)
    .eq("visibility", "public")
    .is("closed_at", null)
    .is("hidden_at", null);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let age: number | null = null;
  if (user) {
    const { data: ageResult } = await supabase.rpc("my_age");
    age = typeof ageResult === "number" ? ageResult : null;
  }

  const usingFallback = Boolean(error);
  const allParties: Party[] = usingFallback || !data ? mockParties : data.map(rowToParty);
  // Gleiche Altersfreigabe-Regel wie im Feed
  const source = allParties.filter(
    (p) => age === null || age >= 18 || p.ageRating !== "18+",
  );
  const parties = source.map(toMapParty);
  const liveCount = source.filter((p) => p.status === "live").length;

  return (
    <div className="space-y-5">
      <header className="animate-riseIn">
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight">
          Partys auf der{" "}
          <span className="bg-gradient-to-r from-lobby-blue to-lobby-pink bg-clip-text text-transparent">
            Karte
          </span>
        </h1>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/50">
          Jeder Kreis ist eine Lobby – gefärbt nach Kategorie. Angezeigt wird
          nur der grobe Umkreis, nie die genaue Adresse.
        </p>
      </header>

      {usingFallback && (
        <div className="glass-soft border-fuchsia-300/25 bg-fuchsia-400/[0.08] p-4 text-xs leading-relaxed text-fuchsia-100/90">
          Keine Verbindung zu Supabase – es werden Beispieldaten angezeigt.
          <span className="mt-1 block text-fuchsia-100/50">{error?.message}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="chip border-white/[0.12] bg-white/[0.06] text-white/70">
          🗺️ {parties.length} {parties.length === 1 ? "Lobby" : "Lobbys"}
        </span>
        <span className="chip border-lobby-accent/40 bg-lobby-accent/15 text-white/[0.85]">
          🔴 {liveCount} live
        </span>
      </div>

      {parties.length === 0 ? (
        <div className="glass glass-sheen relative flex flex-col items-center gap-3 p-10 text-center">
          <span className="animate-floaty text-5xl">🗺️</span>
          <p className="font-semibold">Noch keine Lobbys auf der Karte.</p>
          <p className="text-sm text-white/50">
            Sobald jemand eine Party öffnet, taucht sie hier auf.
          </p>
        </div>
      ) : (
        <>
          <div className="glass glass-sheen relative overflow-hidden p-1.5">
            <MapClient parties={parties} />
          </div>

          {/* Legende – macht die Farbcodierung lesbar */}
          <div className="glass-soft flex flex-wrap gap-x-5 gap-y-3 p-4">
            {CATEGORY_ORDER.map((category) => {
              const theme = CATEGORY_THEMES[category];
              return (
                <div key={category} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full ring-2 ring-white/10"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <span className="text-xs text-white/60">
                    {theme.emoji} {theme.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
