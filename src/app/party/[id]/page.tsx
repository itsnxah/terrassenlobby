import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PARTY_SELECT_QUERY, attachGuestCounts, rowToParty } from "@/lib/parties";
import { mockParties } from "@/data/mockParties";
import { AgeBadge, LiveBadge } from "@/components/AgeBadge";
import { CATEGORY_THEMES, partyTheme } from "@/lib/categories";
import { PartyActions } from "@/components/PartyActions";
import { FriendNotify } from "@/components/FriendNotify";
import { RatingDisplay } from "@/components/StarRating";
import { GuestPartyPanel } from "@/components/GuestPartyPanel";
import { PartyGallery } from "@/components/PartyGallery";
import { JoinPartyForm } from "./JoinPartyForm";

export const dynamic = "force-dynamic";

function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="glass-soft p-4">
      <p className="text-2xs uppercase tracking-[0.09em] text-white/40">{label}</p>
      <p
        className="mt-1.5 text-lg font-bold leading-tight"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-2xs text-white/40">{hint}</p>}
    </div>
  );
}

export default async function PartyDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { token?: string };
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("parties")
    .select(PARTY_SELECT_QUERY)
    .eq("id", params.id)
    .maybeSingle();

  let row = data;

  // Private Party über den Einladungslink: Die normale Abfrage liefert nichts,
  // deshalb hier gezielt über den Token nachfragen (siehe korrekturen.sql).
  if (!row && !error && searchParams.token) {
    const { data: invited } = await supabase.rpc("party_by_invite", {
      p_token: searchParams.token,
    });
    const candidate = Array.isArray(invited) ? invited[0] : invited;
    if (candidate?.id === params.id) row = candidate;
  }

  // Fällt nur auf Beispieldaten zurück, wenn die Verbindung fehlschlägt
  // (nicht wenn die Party wirklich nicht existiert – dann 404).
  let party = error
    ? mockParties.find((p) => p.id === params.id)
    : row
      ? rowToParty(row)
      : undefined;

  if (!party) {
    notFound();
  }

  [party] = await attachGuestCounts(supabase, [party]);

  // RLS in party_addresses.sql erlaubt SELECT nur dem Host und Gästen mit
  // akzeptierter Beitrittsanfrage – für alle anderen kommt hier einfach kein
  // Datensatz zurück (kein Fehler, nur leer).
  const { data: addressRow } = await supabase
    .from("party_addresses")
    .select("exact_address")
    .eq("party_id", party.id)
    .maybeSingle();

  const exactAddress = addressRow?.exact_address ?? null;
  const theme = partyTheme(party);

  // Mit ID statt nur URL geladen – die Galerie hängt daran ihre Kommentare auf.
  const { data: photoRows } = await supabase
    .from("party_photos")
    .select("id, url")
    .eq("party_id", party.id)
    .order("created_at", { ascending: true });

  const photos = (photoRows ?? []) as { id: string; url: string }[];
  const coverPhoto =
    photos.find((p) => p.url === party.coverPhotoUrl) ?? photos[0] ?? null;
  const cover = coverPhoto?.url ?? null;
  const gallery = coverPhoto ? photos.filter((p) => p.id !== coverPhoto.id) : photos;

  const totalGuests = party.startCapacity + party.joinedGuestsCount;
  const freeSpots =
    party.maxGuests !== null ? Math.max(party.maxGuests - totalGuests, 0) : null;

  const startsAt = new Date(party.startsAt);

  // --- Bewertungen und eigener Beitrittsstatus ------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: partyRating }, { data: hostRating }] = await Promise.all([
    supabase
      .from("public_party_ratings")
      .select("avg_rating, rating_count")
      .eq("party_id", party.id)
      .maybeSingle(),
    supabase
      .from("public_host_ratings")
      .select("avg_rating, rating_count")
      .eq("host_id", party.hostId)
      .maybeSingle(),
  ]);

  // Eigene Anfrage (für Ankunftszeit, Check-in und eigene Bewertung)
  let ownRequest: {
    id: string;
    status: string;
    estimated_arrival: string | null;
    checked_in: boolean;
  } | null = null;
  let ownRating: number | null = null;

  if (user && user.id !== party.hostId) {
    const [{ data: reqRow }, { data: ratingRow }] = await Promise.all([
      supabase
        .from("join_requests")
        .select("id, status, estimated_arrival, checked_in")
        .eq("party_id", party.id)
        .eq("guest_id", user.id)
        .maybeSingle(),
      supabase
        .from("party_ratings")
        .select("rating")
        .eq("party_id", party.id)
        .eq("rater_id", user.id)
        .maybeSingle(),
    ]);
    ownRequest = reqRow ?? null;
    ownRating = ratingRow?.rating ?? null;
  }

  // Kommentieren darf nur, wer wirklich da ist – der Host, oder ein Gast,
  // den der Host per "Ich bin da" eingecheckt hat. Nur zugesagt reicht
  // nicht. Die Datenbank prüft das ohnehin nochmal (siehe
  // supabase/fotokommentare.sql), das hier steuert nur die Anzeige.
  const canComment =
    Boolean(user) &&
    (user?.id === party.hostId || (ownRequest?.status === "accepted" && ownRequest?.checked_in === true));

  return (
    <article className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-white/50 transition hover:text-white"
      >
        ← Zurück zum Feed
      </Link>

      {/* --- Cover ---------------------------------------------------- */}
      <div
        className={`relative animate-riseIn overflow-hidden rounded-card border border-white/10 bg-gradient-to-br ${theme.gradient} ${theme.glow}`}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_110%,rgba(255,255,255,0.4),transparent_55%)]" />
            <span className="absolute -bottom-10 right-2 select-none text-[9rem] leading-none opacity-25">
              {theme.emoji}
            </span>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-transparent" />

        <div className="relative flex min-h-[15rem] flex-col justify-end gap-3 p-6">
          <div className="flex flex-wrap gap-2">
            {party.status === "live" ? <LiveBadge /> : null}
            <AgeBadge rating={party.ageRating} />
            <span className="chip border-white/[0.15] bg-black/30 text-white/80">
              {party.visibility === "private" ? "🔗 Privat" : "🌍 Öffentlich"}
            </span>
          </div>

          <h1 className="text-[1.9rem] font-bold leading-tight tracking-tight text-balance">
            {party.title}
          </h1>

          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.15] text-xs font-bold backdrop-blur-md">
              {(party.host?.displayName ?? "?").charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm text-white/70">
                Gehostet von{" "}
                <span className="font-semibold text-white">
                  {party.host?.displayName ?? "Unbekannt"}
                </span>
              </p>
              <div className="mt-0.5">
                <RatingDisplay
                  average={hostRating?.avg_rating ?? null}
                  count={hostRating?.rating_count ?? 0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hinweis, wenn die Moderation eingegriffen hat. Sichtbar nur für
          Host und Beteiligte – für alle anderen ist die Party ohnehin weg. */}
      {party.hiddenAt && (
        <div className="glass-soft border-pink-400/30 bg-pink-500/[0.08] p-5">
          <p className="text-sm font-semibold text-pink-50">
            🚫 Diese Party ist derzeit nicht öffentlich sichtbar
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-pink-100/70">
            {party.hiddenReason ??
              "Sie wurde nach einer Meldung von der Moderation verborgen."}
          </p>
          <p className="mt-2 text-2xs leading-relaxed text-white/40">
            Wenn du das für einen Fehler hältst, melde dich bei uns – wir
            schauen es uns noch einmal an.
          </p>
        </div>
      )}

      {/* --- Beschreibung --------------------------------------------- */}
      <section className="glass glass-sheen relative p-6">
        <p className="whitespace-pre-line leading-relaxed text-white/80">
          {party.description}
        </p>

        {(partyRating?.rating_count ?? 0) > 0 && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3">
            <span className="text-2xs uppercase tracking-[0.09em] text-white/40">
              Bewertung
            </span>
            <RatingDisplay
              average={partyRating?.avg_rating ?? null}
              count={partyRating?.rating_count ?? 0}
              size="lg"
            />
          </div>
        )}

        {party.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {party.tags.map((tag) => {
              const t = CATEGORY_THEMES[tag.category] ?? CATEGORY_THEMES.sonstiges;
              return (
                <span key={tag.id} className={`chip ${t.chip}`}>
                  <span>{t.emoji}</span>
                  {tag.label}
                </span>
              );
            })}
          </div>
        )}
      </section>

      {/* --- Weitere Fotos --------------------------------------------- */}
      {gallery.length > 0 && <PartyGallery photos={gallery} canComment={canComment} />}

      {/* --- Eckdaten -------------------------------------------------- */}
      <section className="grid grid-cols-2 gap-3">
        <StatTile
          label="Zum Start"
          value={`${party.startCapacity} Gäste`}
          hint="Schätzung des Hosts"
        />
        <StatTile
          label={party.maxGuests ? "Belegung" : "Über die App"}
          value={
            party.maxGuests
              ? `${totalGuests} / ${party.maxGuests}`
              : `+${party.joinedGuestsCount} Gäste`
          }
          hint={
            party.maxGuests
              ? freeSpots === 0
                ? "Ausgebucht"
                : `Noch ${freeSpots} Plätze frei`
              : "Beigetreten"
          }
          accent={theme.accent}
        />
        <StatTile
          label={party.status === "live" ? "Status" : "Start"}
          value={
            party.status === "live"
              ? "Läuft gerade"
              : startsAt.toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                })
          }
          hint={
            party.status === "live"
              ? "Spontan dazustoßen"
              : startsAt.toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                }) + " Uhr"
          }
        />
        <StatTile
          label="Alkohol"
          value={party.alcoholStatus === "provided" ? "Vorhanden" : "Selbst mitbringen"}
          hint={party.approvalMode === "manual" ? "Host bestätigt Gäste" : "Offener Beitritt"}
        />
      </section>

      {/* --- Standort --------------------------------------------------- */}
      <section
        className={`glass glass-sheen relative overflow-hidden p-6 ${
          exactAddress ? "border-blue-300/30" : ""
        }`}
      >
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.07] text-lg">
            {exactAddress ? "📍" : "🌫️"}
          </span>
          <div className="min-w-0">
            <p className="text-2xs uppercase tracking-[0.09em] text-white/40">
              Standort
            </p>
            {exactAddress ? (
              <>
                <p className="mt-1 text-lg font-semibold leading-snug">
                  {exactAddress}
                </p>
                <p className="mt-1 text-xs text-blue-200/80">
                  Freigeschaltet – nur für dich sichtbar.
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-lg font-semibold leading-snug text-white/70">
                  Ungefähr {party.approxLocation.radiusMeters} m Umkreis
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/40">
                  Die genaue Adresse wird erst sichtbar, wenn der Host deine
                  Anfrage angenommen hat.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Sicherheitsfunktion – nur sinnvoll, wenn die Adresse schon
          freigeschaltet ist, sonst gäbe es nichts zu teilen. */}
      {exactAddress && (
        <FriendNotify partyTitle={party.title} address={exactAddress} />
      )}

      {/* Angenommene Gäste bekommen den Ankunfts-/Bewertungsbereich,
          alle anderen das normale Anfrageformular. */}
      {ownRequest?.status === "accepted" ? (
        <GuestPartyPanel
          partyId={party.id}
          requestId={ownRequest.id}
          initialArrival={ownRequest.estimated_arrival}
          initialCheckedIn={ownRequest.checked_in}
          initialRating={ownRating}
        />
      ) : (
        <JoinPartyForm
          partyId={party.id}
          approvalMode={party.approvalMode}
          hostId={party.hostId}
          freeSpots={freeSpots}
          closed={Boolean(party.closedAt)}
        />
      )}

      <div className="pt-2">
        <PartyActions
          partyId={party.id}
          hostId={party.hostId}
          hostName={party.host?.displayName ?? "Host"}
        />
      </div>
    </article>
  );
}
