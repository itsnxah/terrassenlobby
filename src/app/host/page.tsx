import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { partyTheme } from "@/lib/categories";
import { PARTY_SELECT_QUERY, rowToParty } from "@/lib/parties";
import { AutoRefresh } from "@/components/AutoRefresh";
import { DeleteAllParties } from "@/components/DeleteAllParties";

export const dynamic = "force-dynamic";

function Tabs({ active }: { active: "host" | "gast" }) {
  return (
    <div className="segment">
      <Link
        href="/host"
        data-active={active === "host"}
        className="segment-item text-center"
      >
        🎪 Ich hoste
      </Link>
      <Link
        href="/host?tab=gast"
        data-active={active === "gast"}
        className="segment-item text-center"
      >
        🎟️ Ich bin Gast
      </Link>
    </div>
  );
}

export default async function HostDashboard({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tab = searchParams.tab === "gast" ? "gast" : "host";

  if (!user) {
    return (
      <div className="glass glass-sheen relative flex flex-col items-center gap-4 p-10 text-center">
        <span className="animate-floaty text-5xl">🎪</span>
        <div>
          <p className="text-lg font-bold">Deine Lobbys</p>
          <p className="mt-1 text-sm text-white/50">
            Melde dich an, um deine Partys und Anfragen zu verwalten.
          </p>
        </div>
        <Link href="/login?next=/host" className="btn-primary">
          Einloggen
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AutoRefresh />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight">
            Deine{" "}
            <span className="bg-gradient-to-r from-lobby-pink via-lobby-violet to-lobby-blue bg-clip-text text-transparent">
              Lobbys
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-white/50">
            {tab === "host"
              ? "Anfragen annehmen, ablehnen und den Überblick behalten."
              : "Partys, bei denen du angefragt hast oder dabei bist."}
          </p>
        </div>
        {tab === "host" && (
          <Link href="/host/create" className="btn-ghost shrink-0">
            + Neu
          </Link>
        )}
      </div>

      <Tabs active={tab} />

      {tab === "host" ? <HostedList userId={user.id} /> : <GuestList userId={user.id} />}
    </div>
  );
}

/* ---------------------------------------------------------------- Host --- */

async function HostedList({ userId }: { userId: string }) {
  const supabase = createClient();

  const { data } = await supabase
    .from("parties")
    .select(PARTY_SELECT_QUERY)
    .eq("host_id", userId)
    .order("created_at", { ascending: false });

  const parties = (data ?? []).map((row) => ({
    party: rowToParty(row),
    // rowToParty zählt nur akzeptierte Gäste – offene Anfragen separat auszählen
    pending: (row.join_requests ?? []).filter(
      (r: { status: string }) => r.status === "pending",
    ).length,
  }));

  if (parties.length === 0) {
    return (
      <div className="glass glass-sheen relative flex flex-col items-center gap-4 p-10 text-center">
        <span className="animate-floaty text-5xl">✨</span>
        <p className="text-sm text-white/[0.55]">
          Du hast noch keine Party erstellt.
        </p>
        <Link href="/host/create" className="btn-primary">
          Erste Lobby öffnen
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {parties.map(({ party, pending }) => {
        const theme = partyTheme(party);
        return (
          <Link
            key={party.id}
            href={`/host/${party.id}`}
            className="glass glass-sheen relative flex items-center gap-4 p-5 transition hover:border-white/20"
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl ${theme.gradient}`}
            >
              {theme.emoji}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{party.title}</p>
              <p className="mt-0.5 text-xs text-white/45">
                {party.startCapacity} zum Start · {party.joinedGuestsCount} beigetreten
                {party.status === "live" ? " · läuft gerade" : ""}
              </p>
            </div>

            {pending > 0 ? (
              <span className="shrink-0 rounded-full bg-gradient-to-br from-lobby-pink to-lobby-violet px-3 py-1.5 text-2xs font-bold">
                {pending} offen
              </span>
            ) : (
              <span className="shrink-0 text-2xs text-white/30">keine offenen</span>
            )}
          </Link>
        );
      })}

      <DeleteAllParties count={parties.length} />
    </div>
  );
}

/* ---------------------------------------------------------------- Gast --- */

async function GuestList({ userId }: { userId: string }) {
  const supabase = createClient();

  const { data } = await supabase
    .from("join_requests")
    .select(
      "id, party_size, status, host_response_message, created_at, party:parties ( id, title, status, starts_at, age_rating )",
    )
    .eq("guest_id", userId)
    .order("created_at", { ascending: false });

  const requests = (data ?? []) as any[];

  if (requests.length === 0) {
    return (
      <div className="glass glass-sheen relative flex flex-col items-center gap-4 p-10 text-center">
        <span className="animate-floaty text-5xl">🎟️</span>
        <div>
          <p className="font-semibold">Noch nirgends angefragt.</p>
          <p className="mt-1 text-sm text-white/50">
            Stöbere im Feed und schick deine erste Anfrage.
          </p>
        </div>
        <Link href="/" className="btn-primary">
          Partys ansehen
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {requests.map((r) => (
        <Link
          key={r.id}
          href={`/party/${r.party?.id}`}
          className="glass glass-sheen relative flex items-center gap-4 p-5 transition hover:border-white/20"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-xl">
            {r.status === "accepted" ? "🎉" : r.status === "declined" ? "🙁" : "⏳"}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{r.party?.title ?? "Party"}</p>
            <p className="mt-0.5 text-xs text-white/45">
              {r.status === "accepted"
                ? "Du bist dabei – Adresse freigeschaltet"
                : r.status === "declined"
                  ? "Anfrage abgelehnt"
                  : "Wartet auf Antwort"}
              {" · "}
              {r.party_size === 1 ? "allein" : `${r.party_size} Personen`}
            </p>
            {r.host_response_message && (
              <p className="mt-1.5 line-clamp-1 text-xs text-white/60">
                „{r.host_response_message}“
              </p>
            )}
          </div>

          {r.status === "accepted" ? (
            <span className="chip shrink-0 border-blue-300/30 bg-blue-400/15 text-blue-100">
              dabei
            </span>
          ) : r.status === "pending" ? (
            <span className="chip shrink-0 border-lobby-pink/40 bg-lobby-pink/15 text-pink-100">
              offen
            </span>
          ) : (
            <span className="chip shrink-0 border-white/[0.12] bg-white/[0.05] text-white/45">
              abgelehnt
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
