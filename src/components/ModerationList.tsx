"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notifyModeration } from "@/lib/notify";

export type ModerationReport = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  note: string | null;
  status: "open" | "reviewed" | "dismissed";
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  party_title: string | null;
  host_id: string | null;
  hidden_at: string | null;
  visibility: string | null;
  reporter_name: string | null;
  host_name: string | null;
};

const HIDE_REASONS = [
  "Die Party existiert nicht (Fake-Eintrag).",
  "Die Party wird für einen anderen Anlass genutzt als angegeben.",
  "Verstoß gegen die Nutzungsbedingungen.",
  "Gefährdung von Minderjährigen bzw. Jugendschutz.",
];

export function ModerationList({
  initialReports,
}: {
  initialReports: ModerationReport[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [reports, setReports] = useState(initialReports);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [hideReason, setHideReason] = useState(HIDE_REASONS[0]);
  const [dismissNote, setDismissNote] = useState("");

  /** Party verbergen + Meldung abschließen + beide Seiten informieren. */
  async function hideParty(report: ModerationReport) {
    if (!report.host_id) return;
    setBusy(true);
    setErrorMsg(null);

    const { error: partyError } = await supabase
      .from("parties")
      .update({ hidden_at: new Date().toISOString(), hidden_reason: hideReason })
      .eq("id", report.target_id);

    if (partyError) {
      setErrorMsg(partyError.message);
      setBusy(false);
      return;
    }

    const resolution = `Die Party wurde nicht mehr öffentlich angezeigt. Begründung: ${hideReason}`;

    const { error } = await supabase
      .from("reports")
      .update({
        status: "reviewed",
        resolution,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    setBusy(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Pflicht laut DSA: Meldenden über das Ergebnis informieren,
    // Betroffenen über die Maßnahme samt Begründung.
    void notifyModeration(report.id, "report_resolved");
    void notifyModeration(report.id, "party_hidden");

    setReports((prev) =>
      prev.map((r) =>
        r.id === report.id
          ? {
              ...r,
              status: "reviewed" as const,
              resolution,
              hidden_at: new Date().toISOString(),
            }
          : r,
      ),
    );
    setOpenId(null);
    router.refresh();
  }

  /** Meldung verwerfen – Party bleibt wie sie ist. */
  async function dismiss(report: ModerationReport) {
    setBusy(true);
    setErrorMsg(null);

    const resolution =
      dismissNote.trim() ||
      "Wir haben die Party geprüft und keinen Verstoß gegen unsere Regeln festgestellt.";

    const { error } = await supabase
      .from("reports")
      .update({
        status: "dismissed",
        resolution,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    setBusy(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }

    void notifyModeration(report.id, "report_resolved");

    setReports((prev) =>
      prev.map((r) =>
        r.id === report.id
          ? { ...r, status: "dismissed" as const, resolution }
          : r,
      ),
    );
    setOpenId(null);
    setDismissNote("");
    router.refresh();
  }

  /** Automatisch verborgene Party wieder freigeben. */
  async function unhide(report: ModerationReport) {
    setBusy(true);
    const { error } = await supabase
      .from("parties")
      .update({ hidden_at: null, hidden_reason: null })
      .eq("id", report.target_id);

    setBusy(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setReports((prev) =>
      prev.map((r) =>
        r.target_id === report.target_id ? { ...r, hidden_at: null } : r,
      ),
    );
    router.refresh();
  }

  if (reports.length === 0) {
    return (
      <div className="glass glass-sheen relative flex flex-col items-center gap-3 p-10 text-center">
        <span className="text-4xl">✅</span>
        <p className="font-semibold">Keine Meldungen</p>
        <p className="text-sm text-white/45">Gerade ist nichts zu prüfen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMsg && (
        <p className="rounded-2xl border border-pink-400/40 bg-pink-500/15 px-4 py-3 text-sm text-pink-100">
          {errorMsg}
        </p>
      )}

      {reports.map((r) => {
        const isOpen = r.status === "open";
        const expanded = openId === r.id;

        return (
          <div
            key={r.id}
            className={`glass glass-sheen relative space-y-3 p-5 ${
              isOpen ? "border-lobby-pink/30" : "opacity-70"
            }`}
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {r.party_title ?? "Gelöschte Party"}
                  </span>
                  {r.hidden_at && (
                    <span className="chip border-white/25 bg-white/[0.08] text-white/70">
                      🚫 verborgen
                    </span>
                  )}
                  <span
                    className={`chip ${
                      isOpen
                        ? "border-lobby-pink/40 bg-lobby-pink/15 text-pink-100"
                        : "border-white/[0.12] bg-white/[0.05] text-white/45"
                    }`}
                  >
                    {isOpen
                      ? "offen"
                      : r.status === "reviewed"
                        ? "bearbeitet"
                        : "verworfen"}
                  </span>
                </div>

                <p className="mt-1.5 text-sm text-white/70">{r.reason}</p>
                {r.note && (
                  <p className="mt-1 rounded-xl bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-white/60">
                    {r.note}
                  </p>
                )}
                <p className="mt-1.5 text-2xs text-white/30">
                  Gemeldet von {r.reporter_name ?? "unbekannt"} ·{" "}
                  {new Date(r.created_at).toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {r.host_name ? ` · Host: ${r.host_name}` : ""}
                </p>

                {r.resolution && (
                  <p className="mt-2 text-2xs leading-relaxed text-white/45">
                    Ergebnis: {r.resolution}
                  </p>
                )}
              </div>

              {r.party_title && (
                <Link
                  href={`/party/${r.target_id}`}
                  target="_blank"
                  className="btn-ghost shrink-0 py-2 text-xs"
                >
                  Ansehen
                </Link>
              )}
            </div>

            {isOpen && !expanded && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setOpenId(r.id)}
                  disabled={busy}
                  className="btn-ghost py-2.5 text-sm"
                >
                  Entscheiden
                </button>
                {r.hidden_at && (
                  <button
                    onClick={() => unhide(r)}
                    disabled={busy}
                    className="text-xs text-white/35 underline-offset-4 hover:text-white/70 hover:underline"
                  >
                    Wieder sichtbar machen
                  </button>
                )}
              </div>
            )}

            {isOpen && expanded && (
              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <label className="label">Begründung beim Verbergen</label>
                  <div className="space-y-2">
                    {HIDE_REASONS.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setHideReason(reason)}
                        className={`w-full rounded-2xl border px-4 py-2.5 text-left text-xs transition ${
                          hideReason === reason
                            ? "border-lobby-pink/60 bg-lobby-pink/15 text-white"
                            : "border-white/10 bg-white/[0.03] text-white/60"
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">
                    Oder: Rückmeldung, wenn nichts zu beanstanden ist
                  </label>
                  <input
                    value={dismissNote}
                    onChange={(e) => setDismissNote(e.target.value)}
                    placeholder="Optional – sonst wird ein Standardtext verschickt"
                    className="field text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => hideParty(r)}
                    disabled={busy || !r.host_id}
                    className="flex-1 rounded-2xl bg-lobby-pink py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                  >
                    Party verbergen
                  </button>
                  <button
                    onClick={() => dismiss(r)}
                    disabled={busy}
                    className="btn-ghost flex-1 py-2.5 text-sm"
                  >
                    Meldung verwerfen
                  </button>
                  <button
                    onClick={() => setOpenId(null)}
                    disabled={busy}
                    className="px-3 text-xs text-white/40 hover:text-white"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
