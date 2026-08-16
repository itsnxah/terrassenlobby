import type { Party, Tag } from "@/types/party";

/**
 * Absichtlich locker typisiert: Wir brauchen hier nur "from(...)".
 * So passen Browser- und Server-Client gleichermaßen hinein, ohne dass
 * die Generics von supabase-js gegeneinander laufen.
 */
type QueryableClient = { from: (table: string) => any };

/**
 * Übersetzt eine rohe Supabase-Zeile (mit verschachtelten Relationen aus
 * PARTY_SELECT_QUERY) in unseren App-internen Party-Typ.
 */
export function rowToParty(row: any): Party {
  // Nur Host und Gast dürfen join_requests lesen – für alle anderen bleibt
  // das Embed leer. Die belastbare Zahl kommt aus public_party_guest_counts
  // (siehe attachGuestCounts), das hier ist nur ein Startwert.
  const acceptedGuests = (row.join_requests ?? [])
    .filter((jr: any) => jr.status === "accepted")
    .reduce((sum: number, jr: any) => sum + (jr.party_size ?? 0), 0);

  const tags: Tag[] = (row.party_tags ?? [])
    .map((pt: any) => pt.tags)
    .filter(Boolean);

  // Fotos in Uploadreihenfolge – damit ist das erste Bild verlässlich das
  // Titelbild und nicht zufällig ein anderes.
  const photoUrls = (row.party_photos ?? [])
    .slice()
    .sort((a: any, b: any) =>
      String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")),
    )
    .map((p: any) => p.url);

  return {
    id: row.id,
    hostId: row.host_id,
    host: row.host
      ? {
          id: row.host.id,
          displayName: row.host.display_name,
          avatarUrl: row.host.avatar_url,
        }
      : undefined,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    status: row.status,
    ageRating: row.age_rating,
    alcoholStatus: row.alcohol_status,
    approvalMode: row.approval_mode,
    startCapacity: row.start_capacity,
    joinedGuestsCount: acceptedGuests,
    maxGuests: row.max_guests ?? null,
    closedAt: row.closed_at ?? null,
    hiddenAt: row.hidden_at ?? null,
    hiddenReason: row.hidden_reason ?? null,
    avgRating: null,
    ratingCount: 0,
    startsAt: row.starts_at,
    approxLocation: {
      lat: row.approx_lat,
      lng: row.approx_lng,
      radiusMeters: row.approx_radius_meters,
    },
    coverPhotoUrl: row.cover_photo_url ?? "",
    photoUrls,
    tags,
    createdAt: row.created_at,
  };
}

/**
 * Spalten bewusst einzeln aufgezählt statt "*":
 * private_invite_token darf niemals mit ausgeliefert werden.
 */
export const PARTY_SELECT_QUERY = `
  id, host_id, title, description, visibility, status, age_rating,
  alcohol_status, approval_mode, start_capacity, max_guests, closed_at,
  hidden_at, hidden_reason, starts_at,
  approx_lat, approx_lng, approx_radius_meters, cover_photo_url, created_at,
  host:profiles ( id, display_name, avatar_url ),
  party_tags ( tags ( id, category, label ) ),
  join_requests ( party_size, status ),
  party_photos ( url, created_at )
`;

/**
 * Ergänzt die Zahl der über die App beigetretenen Gäste.
 *
 * Nötig, weil die Beitrittsanfragen selbst nur für Host und Gast sichtbar
 * sind: Ohne diesen Schritt stünde bei jedem Besucher "+0".
 */
export async function attachGuestCounts(
  supabase: QueryableClient,
  parties: Party[],
): Promise<Party[]> {
  if (parties.length === 0) return parties;

  const { data, error } = await supabase
    .from("public_party_guest_counts")
    .select("party_id, joined_guests_count")
    .in(
      "party_id",
      parties.map((p) => p.id),
    );

  if (error || !data) return parties;

  type CountRow = { party_id: string; joined_guests_count: number };
  const counts = new Map<string, number>(
    (data as CountRow[]).map((row): [string, number] => [
      row.party_id,
      row.joined_guests_count,
    ]),
  );

  return parties.map((p) =>
    counts.has(p.id) ? { ...p, joinedGuestsCount: counts.get(p.id)! } : p,
  );
}

/**
 * Ergänzt Durchschnittsbewertung und Anzahl.
 * Einzelne Bewertungen sind bewusst nicht lesbar – nur diese Aggregate.
 */
export async function attachRatings(
  supabase: QueryableClient,
  parties: Party[],
): Promise<Party[]> {
  if (parties.length === 0) return parties;

  const { data, error } = await supabase
    .from("public_party_ratings")
    .select("party_id, avg_rating, rating_count")
    .in(
      "party_id",
      parties.map((p) => p.id),
    );

  if (error || !data) return parties;

  type RatingRow = { party_id: string; avg_rating: number; rating_count: number };
  const map = new Map<string, RatingRow>(
    (data as RatingRow[]).map((row): [string, RatingRow] => [row.party_id, row]),
  );

  return parties.map((p) => {
    const r = map.get(p.id);
    return r ? { ...p, avgRating: r.avg_rating, ratingCount: r.rating_count } : p;
  });
}
