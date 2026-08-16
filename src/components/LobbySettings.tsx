"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Verwaltung einer eigenen Lobby: Plätze begrenzen, schließen und löschen.
 *
 * Schließen vs. Löschen ist bewusst getrennt:
 *  - Geschlossen  = keine neuen Anfragen mehr, aber alles bleibt erhalten
 *                   (Gäste sehen weiterhin Adresse und Zusage)
 *  - Gelöscht     = Party, Fotos, Adresse und alle Anfragen sind weg
 */
export function LobbySettings({
  partyId,
  title,
  startCapacity,
  currentGuests,
  maxGuests,
  closedAt,
}: {
  partyId: string;
  title: string;
  startCapacity: number;
  currentGuests: number;
  maxGuests: number | null;
  closedAt: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [limit, setLimit] = useState(maxGuests !== null);
  const [value, setValue] = useState(maxGuests ?? Math.max(startCapacity + 10, 20));
  const [savedHint, setSavedHint] = useState(false);

  const closed = Boolean(closedAt);
  const minimum = Math.max(startCapacity + currentGuests, 1);

  async function saveLimit() {
    setBusy(true);
    setErrorMsg(null);

    const next = limit ? value : null;
    if (next !== null && next < minimum) {
      setErrorMsg(
        `Die Obergrenze kann nicht unter ${minimum} liegen – so viele Gäste sind bereits eingeplant.`,
      );
      setBusy(false);
      return;
    }

    const { error } = await supabase
      .from("parties")
      .update({ max_guests: next })
      .eq("id", partyId);

    setBusy(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setSavedHint(true);
    setTimeout(() => setSavedHint(false), 2500);
    router.refresh();
  }

  async function toggleClosed() {
    setBusy(true);
    setErrorMsg(null);

    const { error } = await supabase
      .from("parties")
      .update({ closed_at: closed ? null : new Date().toISOString() })
      .eq("id", partyId);

    setBusy(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    router.refresh();
  }

  async function deleteParty() {
    setBusy(true);
    setErrorMsg(null);

    // Erst die Bilddateien aus dem Speicher räumen – die hängen nicht an den
    // Fremdschlüsseln und würden sonst als Karteileichen liegen bleiben.
    const { data: files } = await supabase.storage
      .from("party-photos")
      .list(partyId);

    if (files && files.length > 0) {
      await supabase.storage
        .from("party-photos")
        .remove(files.map((f) => `${partyId}/${f.name}`));
    }

    // Adresse, Tags, Fotos und Anfragen verschwinden per Fremdschlüssel mit.
    const { error } = await supabase.from("parties").delete().eq("id", partyId);

    if (error) {
      setErrorMsg(error.message);
      setBusy(false);
      return;
    }

    router.push("/host");
    router.refresh();
  }

  return (
    <section className="glass glass-sheen relative space-y-5 p-5">
      <h2 className="text-lg font-bold tracking-tight">Lobby verwalten</h2>

      {errorMsg && (
        <p className="rounded-2xl border border-pink-400/40 bg-pink-500/15 px-4 py-3 text-sm text-pink-100">
          {errorMsg}
        </p>
      )}

      {/* --- Plätze --------------------------------------------------- */}
      <div>
        <button
          type="button"
          onClick={() => setLimit((v) => !v)}
          className="flex w-full items-center gap-3 text-left"
        >
          <span
            className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
              limit ? "bg-lobby-pink" : "bg-white/[0.12]"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full bg-white transition-transform ${
                limit ? "translate-x-5" : ""
              }`}
            />
          </span>
          <span>
            <span className="block text-sm font-medium">Plätze begrenzen</span>
            <span className="block text-xs text-white/40">
              Aktuell eingeplant: {startCapacity + currentGuests} Gäste
            </span>
          </span>
        </button>

        {limit && (
          <div className="mt-4 flex animate-riseIn items-center gap-4">
            <button
              type="button"
              onClick={() => setValue((n) => Math.max(minimum, n - 5))}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] text-lg font-bold text-white/80 transition hover:bg-white/[0.1] active:scale-95"
              aria-label="Weniger"
            >
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-bold tabular-nums">{value}</span>
              <span className="ml-2 text-sm text-white/[0.45]">Plätze gesamt</span>
            </div>
            <button
              type="button"
              onClick={() => setValue((n) => n + 5)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] text-lg font-bold text-white/80 transition hover:bg-white/[0.1] active:scale-95"
              aria-label="Mehr"
            >
              +
            </button>
          </div>
        )}

        <button
          onClick={saveLimit}
          disabled={busy}
          className="btn-ghost mt-4 w-full py-2.5 text-sm"
        >
          {savedHint ? "Gespeichert ✓" : "Plätze speichern"}
        </button>
      </div>

      <div className="divider" />

      {/* --- Schließen ------------------------------------------------- */}
      <div className="flex items-start gap-4">
        <span className="text-xl">{closed ? "🔒" : "🔓"}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {closed ? "Lobby ist geschlossen" : "Lobby ist offen"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-white/40">
            {closed
              ? "Es kommen keine neuen Anfragen herein. Zugesagte Gäste sehen die Party und die Adresse weiterhin."
              : "Schließen beendet nur den Zulauf – alles Bisherige bleibt erhalten und lässt sich wieder öffnen."}
          </p>
        </div>
        <button
          onClick={toggleClosed}
          disabled={busy}
          className="btn-ghost shrink-0 py-2.5 text-sm"
        >
          {closed ? "Öffnen" : "Schließen"}
        </button>
      </div>

      <div className="divider" />

      {/* --- Löschen ---------------------------------------------------- */}
      {confirmDelete ? (
        <div className="space-y-3 rounded-2xl border border-pink-400/40 bg-pink-500/[0.08] p-4">
          <p className="text-sm font-semibold">„{title}“ wirklich löschen?</p>
          <p className="text-xs leading-relaxed text-white/60">
            Party, Fotos, Adresse und alle {currentGuests > 0 ? "bereits zugesagten " : ""}
            Anfragen werden endgültig entfernt. Das lässt sich nicht rückgängig
            machen – zum bloßen Beenden reicht „Schließen“.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={busy}
              className="btn-ghost flex-1 py-2.5 text-sm"
            >
              Abbrechen
            </button>
            <button
              onClick={deleteParty}
              disabled={busy}
              className="flex-1 rounded-2xl bg-lobby-pink py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "Wird gelöscht…" : "Endgültig löschen"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-pink-400/40 bg-pink-500/[0.08] py-3 text-sm font-semibold text-pink-100 transition hover:border-pink-400/70 hover:bg-pink-500/[0.15]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[1.15rem] w-[1.15rem]"
          >
            <path d="M4 7h16M10 11v6M14 11v6" />
            <path d="M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7" />
            <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
          </svg>
          Lobby endgültig löschen
        </button>
      )}
    </section>
  );
}
