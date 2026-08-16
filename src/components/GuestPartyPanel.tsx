"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RatingDisplay, StarInput } from "./StarRating";

/**
 * Bereich für Gäste mit angenommener Anfrage:
 *  1. Ankunftszeit angeben (der Host sieht, wann mit wem zu rechnen ist)
 *  2. "Ich bin da" bestätigen
 *  3. Danach: Party mit 1–5 Sternen bewerten
 *
 * Punkt 3 hängt bewusst an Punkt 2: Nur wer eingecheckt hat, darf bewerten.
 * Die Datenbank prüft das ebenfalls – hier geht es nur um die Bedienung.
 */
export function GuestPartyPanel({
  partyId,
  requestId,
  initialArrival,
  initialCheckedIn,
  initialRating,
}: {
  partyId: string;
  requestId: string;
  initialArrival: string | null;
  initialCheckedIn: boolean;
  initialRating: number | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [arrival, setArrival] = useState(
    initialArrival
      ? new Date(initialArrival).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
  );
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [rating, setRating] = useState(initialRating ?? 0);

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedHint, setSavedHint] = useState<string | null>(null);

  useEffect(() => {
    setCheckedIn(initialCheckedIn);
    setRating(initialRating ?? 0);
  }, [initialCheckedIn, initialRating]);

  function flash(text: string) {
    setSavedHint(text);
    setTimeout(() => setSavedHint(null), 2500);
  }

  async function saveArrival() {
    if (!arrival) return;
    setBusy(true);
    setErrorMsg(null);

    // Uhrzeit auf den heutigen Tag beziehen
    const [h, m] = arrival.split(":").map(Number);
    const when = new Date();
    when.setHours(h, m, 0, 0);

    const { error } = await supabase
      .from("join_requests")
      .update({ estimated_arrival: when.toISOString() })
      .eq("id", requestId);

    setBusy(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    flash("Ankunftszeit gespeichert");
    router.refresh();
  }

  async function checkIn() {
    setBusy(true);
    setErrorMsg(null);

    const { error } = await supabase
      .from("join_requests")
      .update({ checked_in: true })
      .eq("id", requestId);

    setBusy(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setCheckedIn(true);
    router.refresh();
  }

  async function saveRating(value: number) {
    setBusy(true);
    setErrorMsg(null);
    setRating(value);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("party_ratings")
      .upsert(
        { party_id: partyId, rater_id: user.id, rating: value },
        { onConflict: "party_id,rater_id" },
      );

    setBusy(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    flash("Bewertung gespeichert");
    router.refresh();
  }

  return (
    <section className="glass glass-sheen relative space-y-5 p-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Du bist dabei 🎉</h2>
        <p className="mt-1 text-sm text-white/50">
          {checkedIn
            ? "Schön, dass du da bist. Wie war es?"
            : "Sag dem Host, wann du kommst – und melde dich, sobald du da bist."}
        </p>
      </div>

      {errorMsg && (
        <p className="rounded-2xl border border-pink-400/40 bg-pink-500/15 px-4 py-3 text-sm text-pink-100">
          {errorMsg}
        </p>
      )}
      {savedHint && (
        <p className="rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          {savedHint}
        </p>
      )}

      {!checkedIn && (
        <>
          <div>
            <label className="label">Wann kommst du ungefähr an?</label>
            <div className="flex gap-2">
              <input
                type="time"
                value={arrival}
                onChange={(e) => setArrival(e.target.value)}
                className="field [color-scheme:dark] w-36"
              />
              <button
                onClick={saveArrival}
                disabled={busy || !arrival}
                className="btn-ghost py-2.5 text-sm"
              >
                Speichern
              </button>
            </div>
            <p className="hint">
              Der Host sieht dann, wann er mit euch rechnen kann.
            </p>
          </div>

          <button onClick={checkIn} disabled={busy} className="btn-primary w-full">
            📍 Ich bin da
          </button>
        </>
      )}

      {checkedIn && (
        <div className="space-y-3">
          <div className="chip border-blue-300/30 bg-blue-400/15 text-blue-100">
            📍 Als anwesend bestätigt
          </div>

          <div className="divider" />

          <div>
            <label className="label">Wie war die Party?</label>
            <StarInput value={rating} onChange={saveRating} disabled={busy} />
            <p className="hint">
              {rating > 0
                ? "Du kannst deine Bewertung jederzeit ändern."
                : "Nur Gäste, die vor Ort waren, können bewerten. Es werden ausschließlich Durchschnitt und Anzahl angezeigt."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/** Kompakte Sterne-Anzeige für Host-Profile im Kopfbereich. */
export function HostRating({
  average,
  count,
}: {
  average: number | null;
  count: number;
}) {
  return <RatingDisplay average={average} count={count} />;
}
