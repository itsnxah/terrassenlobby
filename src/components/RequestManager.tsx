"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notifyByEmail } from "@/lib/notify";
import { StarInput } from "./StarRating";

export type HostRequest = {
  id: string;
  partySize: number;
  message: string | null;
  status: "pending" | "accepted" | "declined";
  hostResponseMessage: string | null;
  estimatedArrival: string | null;
  checkedIn: boolean;
  createdAt: string;
  guestName: string;
  guestId: string;
  /** Bewertung, die der Host diesem Gast für diese Party gegeben hat */
  guestRating: number | null;
};

export function RequestManager({
  partyId,
  initialRequests,
}: {
  partyId: string;
  initialRequests: HostRequest[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [requests, setRequests] = useState(initialRequests);

  // Wenn die Seite im Hintergrund neu geladen wurde (siehe AutoRefresh),
  // liefert der Server eine frische Liste – die übernehmen wir hier.
  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);
  const [selected, setSelected] = useState<string[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pending = requests.filter((r) => r.status === "pending");
  const accepted = requests.filter((r) => r.status === "accepted");
  const declined = requests.filter((r) => r.status === "declined");

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function decide(ids: string[], status: "accepted" | "declined") {
    if (ids.length === 0) return;
    setBusy(true);
    setErrorMsg(null);

    // Antwortnachrichten können pro Anfrage unterschiedlich sein,
    // deshalb einzeln aktualisieren statt in einem Rutsch.
    for (const id of ids) {
      const { error } = await supabase
        .from("join_requests")
        .update({
          status,
          host_response_message: replies[id]?.trim() || null,
        })
        .eq("id", id);

      if (error) {
        setErrorMsg(error.message);
        setBusy(false);
        return;
      }

      // Gast per E-Mail über die Entscheidung informieren
      void notifyByEmail(id, "decision");
    }

    setRequests((prev) =>
      prev.map((r) =>
        ids.includes(r.id)
          ? { ...r, status, hostResponseMessage: replies[r.id]?.trim() || null }
          : r,
      ),
    );
    setSelected((prev) => prev.filter((id) => !ids.includes(id)));
    setBusy(false);
    router.refresh();
  }

  async function rateGuest(guestId: string, value: number) {
    setBusy(true);
    setErrorMsg(null);

    const { error } = await supabase
      .from("guest_ratings")
      .upsert(
        { party_id: partyId, guest_id: guestId, rating: value },
        { onConflict: "party_id,guest_id" },
      );

    setBusy(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setRequests((prev) =>
      prev.map((r) => (r.guestId === guestId ? { ...r, guestRating: value } : r)),
    );
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <p className="rounded-2xl border border-pink-400/40 bg-pink-500/15 px-4 py-3 text-sm text-pink-100">
          {errorMsg}
        </p>
      )}

      {/* ---- Offene Anfragen ---- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Offene Anfragen</h2>
          {pending.length > 0 && (
            <span className="chip border-white/[0.12] bg-white/[0.06] text-white/70">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <p className="glass-soft p-5 text-sm text-white/45">
            Gerade keine offenen Anfragen.
          </p>
        ) : (
          <>
            {selected.length > 1 && (
              <div className="glass-soft flex items-center gap-3 p-3">
                <span className="text-xs text-white/60">
                  {selected.length} ausgewählt
                </span>
                <button
                  onClick={() => decide(selected, "accepted")}
                  disabled={busy}
                  className="btn-primary ml-auto px-4 py-2 text-xs"
                >
                  Alle annehmen
                </button>
                <button
                  onClick={() => decide(selected, "declined")}
                  disabled={busy}
                  className="btn-ghost px-4 py-2 text-xs"
                >
                  Alle ablehnen
                </button>
              </div>
            )}

            <div className="grid gap-3">
              {pending.map((r) => (
                <div key={r.id} className="glass glass-sheen relative space-y-3 p-5">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleSelect(r.id)}
                      aria-label="Auswählen"
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-2xs transition ${
                        selected.includes(r.id)
                          ? "border-transparent bg-gradient-to-br from-lobby-pink to-lobby-violet text-white"
                          : "border-white/20"
                      }`}
                    >
                      {selected.includes(r.id) ? "✓" : ""}
                    </button>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lobby-violet to-lobby-blue text-xs font-bold text-ink-950">
                      {r.guestName.charAt(0).toUpperCase()}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {r.guestName}
                        <span className="ml-2 text-xs font-normal text-white/45">
                          {r.partySize === 1
                            ? "kommt allein"
                            : `kommt mit ${r.partySize} Leuten insgesamt`}
                        </span>
                      </p>
                      {r.message && (
                        <p className="mt-2 whitespace-pre-line rounded-2xl bg-white/[0.04] p-3 text-sm leading-relaxed text-white/75">
                          {r.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <input
                    value={replies[r.id] ?? ""}
                    onChange={(e) =>
                      setReplies((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                    placeholder="Antwort an den Gast (optional)"
                    className="field text-sm"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => decide([r.id], "accepted")}
                      disabled={busy}
                      className="btn-primary flex-1 py-2.5 text-sm"
                    >
                      Annehmen
                    </button>
                    <button
                      onClick={() => decide([r.id], "declined")}
                      disabled={busy}
                      className="btn-ghost flex-1 py-2.5 text-sm"
                    >
                      Ablehnen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ---- Zugesagt ---- */}
      {accepted.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title">Dabei</h2>
          <div className="grid gap-2">
            {accepted.map((r) => (
              <div key={r.id} className="glass-soft space-y-3 p-4 text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lobby-violet to-lobby-blue text-2xs font-bold text-ink-950">
                    {r.guestName.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium">{r.guestName}</span>
                  <span className="text-white/40">
                    {r.partySize === 1 ? "1 Person" : `${r.partySize} Personen`}
                  </span>
                  <span className="ml-auto text-2xs">
                    {r.checkedIn ? (
                      <span className="text-blue-200">📍 vor Ort</span>
                    ) : r.estimatedArrival ? (
                      <span className="text-white/45">
                        kommt ca.{" "}
                        {new Date(r.estimatedArrival).toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : (
                      <span className="text-white/30">noch keine Zeit</span>
                    )}
                  </span>
                </div>

                {/* Bewerten darf der Host erst, wenn der Gast auch wirklich
                    da war – gleiche Regel wie umgekehrt. */}
                {r.checkedIn && (
                  <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-3">
                    <span className="text-2xs text-white/40">
                      {r.guestRating ? "Deine Bewertung" : "Gast bewerten"}
                    </span>
                    <div className="scale-90 origin-left">
                      <StarInput
                        value={r.guestRating ?? 0}
                        onChange={(value) => rateGuest(r.guestId, value)}
                        disabled={busy}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Abgelehnt ---- */}
      {declined.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-white/40">Abgelehnt</h2>
          <div className="grid gap-2">
            {declined.map((r) => (
              <div key={r.id} className="glass-soft p-3 text-xs text-white/35">
                {r.guestName} · {r.partySize === 1 ? "1 Person" : `${r.partySize} Personen`}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
