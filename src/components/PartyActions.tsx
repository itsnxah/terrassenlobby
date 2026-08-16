"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notifyModeration } from "@/lib/notify";

const REASONS = [
  "Die Party gibt es gar nicht (Fake)",
  "Anderer Anlass als angegeben",
  "Belästigung oder Hassrede",
  "Gefährlich oder illegal",
  "Gefährdung von Minderjährigen",
  "Etwas anderes",
];

/**
 * Melden und Blockieren – nach Art. 16 DSA muss es für jeden Inhalt einen
 * einfachen Meldeweg geben, unabhängig von der Größe der Plattform.
 */
export function PartyActions({
  partyId,
  hostId,
  hostName,
}: {
  partyId: string;
  hostId: string;
  hostName: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;
      const { data: block } = await supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", uid)
        .eq("blocked_id", hostId)
        .maybeSingle();
      setBlocked(Boolean(block));
    });
  }, [supabase, hostId]);

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setState("sending");
    setErrorMsg(null);

    const { data: created, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: userId,
        target_type: "party",
        target_id: partyId,
        reason,
        note: note.trim() || null,
      })
      .select("id")
      .single();

    if (error) {
      setErrorMsg(error.message);
      setState("error");
      return;
    }

    // Moderation sofort informieren, statt auf einen Blick ins Dashboard zu hoffen
    if (created?.id) {
      void notifyModeration(created.id, "new_report");
    }

    setState("sent");
  }

  async function toggleBlock() {
    if (!userId || userId === hostId) return;

    if (blocked) {
      await supabase
        .from("blocks")
        .delete()
        .eq("blocker_id", userId)
        .eq("blocked_id", hostId);
      setBlocked(false);
    } else {
      await supabase.from("blocks").insert({ blocker_id: userId, blocked_id: hostId });
      setBlocked(true);
    }
    router.refresh();
  }

  // Nicht eingeloggt oder eigene Party: keine Aktionen anzeigen.
  if (!userId || userId === hostId) return null;

  return (
    <div className="space-y-3">
      {/* Deutlich sichtbar: Wer etwas Verdächtiges bemerkt, soll es sofort
          melden können – nicht erst einen unauffälligen Link suchen. */}
      <button
        onClick={() => {
          setOpen(true);
          setState("idle");
        }}
        className="flex w-full items-center gap-4 rounded-card border border-pink-400/40 bg-pink-500/[0.10] p-5 text-left transition hover:border-pink-400/70 hover:bg-pink-500/[0.16]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-500/25 text-xl">
          ⚠️
        </span>
        <span className="min-w-0">
          <span className="block font-semibold text-pink-50">
            Stimmt hier etwas nicht?
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-pink-100/70">
            Party melden – etwa wenn sie gar nicht existiert oder für einen
            ganz anderen Anlass genutzt wird.
          </span>
        </span>
        <span className="ml-auto shrink-0 text-pink-200/60">→</span>
      </button>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <button
          onClick={toggleBlock}
          className="text-white/35 underline-offset-4 transition hover:text-white/70 hover:underline"
        >
          {blocked ? `${hostName} entblocken` : `${hostName} blockieren`}
        </button>

        {blocked && (
          <span className="chip border-pink-400/30 bg-pink-500/12 text-pink-100">
            blockiert – Partys werden dir nicht mehr angezeigt
          </span>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="glass glass-sheen relative w-full max-w-md p-6">
            {state === "sent" ? (
              <div className="space-y-3 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-400/25 text-xl">
                  ✓
                </span>
                <p className="text-base font-bold">Meldung eingegangen</p>
                <p className="text-sm leading-relaxed text-white/55">
                  Wir schauen uns die Party an und melden uns per E-Mail mit
                  dem Ergebnis. Danke, dass du dir die Zeit genommen hast.
                </p>
                <button onClick={() => setOpen(false)} className="btn-ghost w-full">
                  Schließen
                </button>
              </div>
            ) : (
              <form onSubmit={submitReport} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Party melden</h2>
                  <p className="mt-1 text-sm text-white/50">
                    Was stimmt mit dieser Party nicht?
                  </p>
                </div>

                <div className="space-y-2">
                  {REASONS.map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setReason(r)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        reason === r
                          ? "border-lobby-pink/60 bg-lobby-pink/15 text-white"
                          : "border-white/10 bg-white/[0.03] text-white/60"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Was ist passiert? (optional)"
                  className="field resize-none text-sm"
                />

                <p className="text-2xs leading-relaxed text-white/35">
                  Bei akuter Gefahr wende dich bitte zuerst an die Polizei
                  (110). Deine Meldung hier prüfen wir, sie ersetzt aber
                  keinen Notruf.
                </p>

                {errorMsg && (
                  <p className="rounded-2xl border border-pink-400/40 bg-pink-500/15 px-4 py-3 text-sm text-pink-100">
                    {errorMsg}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="btn-ghost flex-1"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={state === "sending"}
                    className="btn-primary flex-1"
                  >
                    {state === "sending" ? "Wird gesendet…" : "Melden"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
