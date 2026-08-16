import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AutoRefresh } from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  party_size: number;
  message: string | null;
  status: "pending" | "accepted" | "declined";
  host_response_message: string | null;
  created_at: string;
  party: any;
  guest?: any;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.round(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.round(h / 24);
  return d === 1 ? "gestern" : `vor ${d} Tagen`;
}

function StatusChip({ status }: { status: Row["status"] }) {
  if (status === "accepted")
    return (
      <span className="chip border-blue-300/30 bg-blue-400/15 text-blue-100">
        angenommen
      </span>
    );
  if (status === "declined")
    return (
      <span className="chip border-white/[0.12] bg-white/[0.05] text-white/45">
        abgelehnt
      </span>
    );
  return (
    <span className="chip border-lobby-pink/40 bg-lobby-pink/15 text-pink-100">
      offen
    </span>
  );
}

export default async function NachrichtenPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="glass glass-sheen relative flex flex-col items-center gap-4 p-10 text-center">
        <span className="animate-floaty text-5xl">✉️</span>
        <div>
          <p className="text-lg font-bold">Nachrichten</p>
          <p className="mt-1 text-sm text-white/50">
            Melde dich an, um Anfragen und Antworten zu sehen.
          </p>
        </div>
        <Link href="/login?next=/nachrichten" className="btn-primary">
          Einloggen
        </Link>
      </div>
    );
  }

  // Anfragen an meine Partys (ich bin Host)
  const { data: incomingRaw } = await supabase
    .from("join_requests")
    .select(
      "id, party_size, message, status, host_response_message, created_at, party:parties!inner ( id, title, host_id ), guest:profiles ( display_name )",
    )
    .eq("party.host_id", user.id)
    .order("created_at", { ascending: false });

  // Meine eigenen Anfragen (ich bin Gast)
  const { data: outgoingRaw } = await supabase
    .from("join_requests")
    .select(
      "id, party_size, message, status, host_response_message, created_at, party:parties ( id, title )",
    )
    .eq("guest_id", user.id)
    .order("created_at", { ascending: false });

  // Eigene Meldungen samt Ergebnis der Prüfung
  const { data: myReports } = await supabase
    .from("reports")
    .select("id, reason, status, resolution, created_at, resolved_at")
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false });

  const incoming = (incomingRaw ?? []) as unknown as Row[];
  const outgoing = (outgoingRaw ?? []) as unknown as Row[];

  const openIncoming = incoming.filter((r) => r.status === "pending");
  const answeredOutgoing = outgoing.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-8">
      <AutoRefresh />

      <header className="animate-riseIn">
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight">
          Nach<span className="bg-gradient-to-r from-lobby-pink via-lobby-violet to-lobby-blue bg-clip-text text-transparent">richten</span>
        </h1>
        <p className="mt-1.5 text-sm text-white/50">
          Anfragen an deine Partys und Antworten auf deine eigenen.
        </p>
      </header>

      {/* --- Als Host ------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Anfragen an dich</h2>
          {openIncoming.length > 0 && (
            <span className="chip border-lobby-pink/40 bg-lobby-pink/15 text-pink-100">
              {openIncoming.length} offen
            </span>
          )}
        </div>

        {incoming.length === 0 ? (
          <p className="glass-soft p-5 text-sm text-white/45">
            Noch keine Anfragen zu deinen Partys.
          </p>
        ) : (
          <div className="grid gap-2">
            {incoming.slice(0, 20).map((r) => (
              <Link
                key={r.id}
                href={`/host/${r.party?.id}`}
                className="glass-soft flex items-start gap-3 p-4 transition hover:border-white/20"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lobby-violet to-lobby-blue text-xs font-bold text-ink-950">
                  {(r.guest?.display_name ?? "?").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">
                      {r.guest?.display_name ?? "Jemand"}
                    </span>{" "}
                    <span className="text-white/55">
                      möchte zu „{r.party?.title}“ –{" "}
                      {r.party_size === 1
                        ? "allein"
                        : `${r.party_size} Personen insgesamt`}
                    </span>
                  </p>
                  {r.message && (
                    <p className="mt-1 line-clamp-2 text-xs text-white/45">
                      {r.message}
                    </p>
                  )}
                  <p className="mt-1.5 text-2xs text-white/30">
                    {timeAgo(r.created_at)}
                  </p>
                </div>
                <StatusChip status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* --- Als Gast -------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Deine Anfragen</h2>
          {answeredOutgoing.length > 0 && (
            <span className="chip border-white/[0.12] bg-white/[0.06] text-white/60">
              {answeredOutgoing.length} beantwortet
            </span>
          )}
        </div>

        {outgoing.length === 0 ? (
          <p className="glass-soft p-5 text-sm text-white/45">
            Du hast noch keine Beitrittsanfrage gestellt.
          </p>
        ) : (
          <div className="grid gap-2">
            {outgoing.slice(0, 20).map((r) => (
              <Link
                key={r.id}
                href={`/party/${r.party?.id}`}
                className="glass-soft flex items-start gap-3 p-4 transition hover:border-white/20"
              >
                <span className="mt-0.5 text-lg">
                  {r.status === "accepted"
                    ? "🎉"
                    : r.status === "declined"
                      ? "🙁"
                      : "⏳"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{r.party?.title}</span>{" "}
                    <span className="text-white/55">
                      {r.status === "accepted"
                        ? "– du bist dabei! Die Adresse ist freigeschaltet."
                        : r.status === "declined"
                          ? "– die Anfrage wurde abgelehnt."
                          : "– wartet auf Antwort des Hosts."}
                    </span>
                  </p>
                  {r.host_response_message && (
                    <p className="mt-1.5 rounded-xl bg-white/[0.05] px-3 py-2 text-xs leading-relaxed text-white/70">
                      „{r.host_response_message}“
                    </p>
                  )}
                  <p className="mt-1.5 text-2xs text-white/30">
                    {timeAgo(r.created_at)}
                  </p>
                </div>
                <StatusChip status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* --- Eigene Meldungen ------------------------------------------ */}
      {myReports && myReports.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title">Deine Meldungen</h2>
          <div className="grid gap-2">
            {myReports.map((r) => (
              <div key={r.id} className="glass-soft p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{r.reason}</span>
                  <span
                    className={`chip ${
                      r.status === "open"
                        ? "border-lobby-pink/40 bg-lobby-pink/15 text-pink-100"
                        : "border-blue-300/30 bg-blue-400/15 text-blue-100"
                    }`}
                  >
                    {r.status === "open" ? "in Prüfung" : "bearbeitet"}
                  </span>
                </div>
                {r.resolution && (
                  <p className="mt-2 rounded-xl bg-white/[0.05] px-3 py-2 text-xs leading-relaxed text-white/70">
                    {r.resolution}
                  </p>
                )}
                <p className="mt-1.5 text-2xs text-white/30">
                  {timeAgo(r.created_at)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs leading-relaxed text-white/30">
        Push-Benachrichtigungen aufs Handy gibt es noch nicht – diese Seite ist
        vorerst der Ort, an dem du alles nachschaust.
      </p>
    </div>
  );
}
