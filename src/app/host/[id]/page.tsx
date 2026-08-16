import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RequestManager, type HostRequest } from "@/components/RequestManager";
import { PhotoManager, type PartyPhoto } from "@/components/PhotoManager";
import { AutoRefresh } from "@/components/AutoRefresh";
import { InviteLink } from "@/components/InviteLink";
import { LobbySettings } from "@/components/LobbySettings";

export const dynamic = "force-dynamic";

export default async function HostPartyPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="glass glass-sheen relative flex flex-col items-center gap-4 p-10 text-center">
        <p className="text-sm text-white/60">Bitte zuerst einloggen.</p>
        <Link href={`/login?next=/host/${params.id}`} className="btn-primary">
          Einloggen
        </Link>
      </div>
    );
  }

  const { data: party } = await supabase
    .from("parties")
    .select(
      "id, title, host_id, start_capacity, status, visibility, private_invite_token, max_guests, closed_at",
    )
    .eq("id", params.id)
    .maybeSingle();

  // Nur der Host sieht diese Seite.
  if (!party || party.host_id !== user.id) {
    notFound();
  }

  const { data: requestRows } = await supabase
    .from("join_requests")
    .select(
      "id, party_size, message, status, host_response_message, estimated_arrival, checked_in, created_at, guest:profiles ( id, display_name )",
    )
    .eq("party_id", party.id)
    .order("created_at", { ascending: false });

  // Bereits vergebene Gast-Bewertungen dieser Party
  const { data: guestRatingRows } = await supabase
    .from("guest_ratings")
    .select("guest_id, rating")
    .eq("party_id", party.id);

  const guestRatings = new Map<string, number>(
    (guestRatingRows ?? []).map(
      (g: { guest_id: string; rating: number }): [string, number] => [
        g.guest_id,
        g.rating,
      ],
    ),
  );

  const requests: HostRequest[] = (requestRows ?? []).map((r: any) => ({
    id: r.id,
    partySize: r.party_size,
    message: r.message,
    status: r.status,
    hostResponseMessage: r.host_response_message,
    estimatedArrival: r.estimated_arrival,
    checkedIn: r.checked_in,
    createdAt: r.created_at,
    guestName: r.guest?.display_name ?? "Unbekannt",
    guestId: r.guest?.id ?? "",
    guestRating: guestRatings.get(r.guest?.id ?? "") ?? null,
  }));

  const accepted = requests
    .filter((r) => r.status === "accepted")
    .reduce((sum, r) => sum + r.partySize, 0);

  const { data: photoRows } = await supabase
    .from("party_photos")
    .select("id, url")
    .eq("party_id", party.id)
    .order("created_at", { ascending: true });

  const photos = (photoRows ?? []) as PartyPhoto[];

  return (
    <div className="space-y-6">
      <AutoRefresh />

      <Link
        href="/host"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-white/50 transition hover:text-white"
      >
        ← Alle Lobbys
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[1.7rem] font-bold leading-tight tracking-tight">
            {party.title}
          </h1>
          {party.closed_at && (
            <span className="chip border-white/25 bg-white/[0.08] text-white/70">
              🔒 geschlossen
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-white/50">
          {party.start_capacity} zum Start · {accepted} über die App dabei
          {party.max_guests
            ? ` · ${party.start_capacity + accepted} / ${party.max_guests} Plätze`
            : ""}
        </p>
      </div>

      {party.visibility === "private" && party.private_invite_token && (
        <InviteLink partyId={party.id} token={party.private_invite_token} />
      )}

      <PhotoManager partyId={party.id} initialPhotos={photos} />

      <RequestManager partyId={party.id} initialRequests={requests} />

      <LobbySettings
        partyId={party.id}
        title={party.title}
        startCapacity={party.start_capacity}
        currentGuests={accepted}
        maxGuests={party.max_guests}
        closedAt={party.closed_at}
      />
    </div>
  );
}
