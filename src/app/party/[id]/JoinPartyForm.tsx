"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notifyByEmail } from "@/lib/notify";
import type { ApprovalMode } from "@/types/party";

type ExistingStatus = "pending" | "accepted" | "declined";

export function JoinPartyForm({
  partyId,
  approvalMode,
  hostId,
  freeSpots,
  closed,
}: {
  partyId: string;
  approvalMode: ApprovalMode;
  hostId: string;
  /** Freie Plätze, null = keine Obergrenze gesetzt */
  freeSpots: number | null;
  closed: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [existing, setExisting] = useState<ExistingStatus | null>(null);

  const [message, setMessage] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [sentStatus, setSentStatus] = useState<ExistingStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      setUserId(user?.id ?? null);

      if (user) {
        // Schon angefragt? Sonst läuft man in den Unique-Index der Datenbank.
        const { data } = await supabase
          .from("join_requests")
          .select("status")
          .eq("party_id", partyId)
          .eq("guest_id", user.id)
          .maybeSingle();

        if (active && data) setExisting(data.status as ExistingStatus);
      }

      if (active) setCheckingAuth(false);
    })();

    return () => {
      active = false;
    };
  }, [supabase, partyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("Bitte zuerst einloggen.");
      setSubmitting(false);
      return;
    }

    // Der endgültige Status wird in der Datenbank gesetzt (Trigger), damit
    // niemand sich selbst annehmen kann – wir lesen ihn danach zurück.
    const { data: created, error } = await supabase
      .from("join_requests")
      .insert({
        party_id: partyId,
        guest_id: user.id,
        party_size: partySize,
        message,
        status: "pending",
      })
      .select("id, status")
      .single();

    setSubmitting(false);

    if (error) {
      setErrorMsg(
        error.code === "23505"
          ? "Du hast für diese Party schon eine Anfrage gestellt."
          : error.message,
      );
      return;
    }

    if (created?.id) {
      void notifyByEmail(created.id, "new_request");
    }

    setSentStatus((created?.status as ExistingStatus) ?? "pending");
    router.refresh();
  }

  if (checkingAuth) {
    return <div className="h-40 animate-pulse rounded-card bg-white/[0.04]" />;
  }

  // Für die eigene Party gibt es nichts anzufragen.
  if (userId && userId === hostId) {
    return (
      <div className="glass glass-sheen relative flex items-center gap-4 p-6">
        <span className="text-2xl">🎪</span>
        <div className="min-w-0">
          <p className="font-semibold">Das ist deine Party</p>
          <p className="mt-0.5 text-sm text-white/50">
            Anfragen verwaltest du in deiner Lobby-Ansicht.
          </p>
        </div>
        <Link href={`/host/${partyId}`} className="btn-ghost ml-auto shrink-0 py-2.5 text-sm">
          Öffnen
        </Link>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="glass glass-sheen relative flex flex-col items-center gap-4 p-8 text-center">
        <span className="text-4xl">🎟️</span>
        <div>
          <p className="font-semibold">Nur mit Account dabei</p>
          <p className="mt-1 text-sm text-white/50">
            Melde dich an, um dem Host eine Anfrage zu schicken.
          </p>
        </div>
        <Link href={`/login?next=/party/${partyId}`} className="btn-primary">
          Einloggen
        </Link>
      </div>
    );
  }

  const status = sentStatus ?? existing;

  // Geschlossen oder ausgebucht – nur anzeigen, wenn noch keine eigene
  // Anfrage existiert (die soll man weiterhin sehen können).
  if (!status && (closed || (freeSpots !== null && freeSpots <= 0))) {
    return (
      <div className="glass glass-sheen relative flex flex-col items-center gap-3 p-8 text-center">
        <span className="text-4xl">{closed ? "🔒" : "🈵"}</span>
        <p className="text-lg font-bold">
          {closed ? "Lobby geschlossen" : "Lobby ist voll"}
        </p>
        <p className="max-w-xs text-sm leading-relaxed text-white/[0.55]">
          {closed
            ? "Der Host nimmt keine Anfragen mehr an."
            : "Alle Plätze sind vergeben. Schau gern nach anderen Lobbys."}
        </p>
        <Link href="/" className="btn-ghost mt-1">
          Andere Partys ansehen
        </Link>
      </div>
    );
  }

  if (status) {
    const view = {
      pending: {
        icon: "⏳",
        title: "Anfrage läuft",
        text: "Der Host meldet sich bei dir. Sobald du angenommen bist, erscheint hier die genaue Adresse.",
        tone: "border-white/[0.12]",
      },
      accepted: {
        icon: "🎉",
        title: "Du bist dabei!",
        text: "Die genaue Adresse ist für dich freigeschaltet.",
        tone: "border-blue-300/30",
      },
      declined: {
        icon: "🙁",
        title: "Anfrage abgelehnt",
        text: "Diesmal hat es nicht geklappt. Schau dich gern nach anderen Lobbys um.",
        tone: "border-white/[0.12]",
      },
    }[status];

    return (
      <div
        className={`glass glass-sheen relative flex flex-col items-center gap-3 p-8 text-center ${view.tone}`}
      >
        <span className="text-4xl">{view.icon}</span>
        <p className="text-lg font-bold">{view.title}</p>
        <p className="max-w-xs text-sm leading-relaxed text-white/[0.55]">{view.text}</p>
        <button onClick={() => router.refresh()} className="btn-ghost mt-1">
          Aktualisieren
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass glass-sheen relative space-y-5 p-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Beitreten anfragen</h2>
        <p className="mt-1 text-sm text-white/50">
          {approvalMode === "manual"
            ? "Der Host entscheidet über deine Anfrage."
            : "Offene Lobby – du bist sofort dabei."}
        </p>
      </div>

      <div>
        <label className="label">Wie viele seid ihr insgesamt?</label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPartySize((n) => Math.max(1, n - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] text-lg font-bold text-white/80 transition hover:bg-white/[0.1] active:scale-95"
            aria-label="Weniger"
          >
            −
          </button>
          <div className="flex-1 text-center">
            <span className="text-3xl font-bold tabular-nums">{partySize}</span>
            <span className="ml-2 text-sm text-white/[0.45]">
              {partySize === 1 ? "Person" : "Personen"}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              setPartySize((n) =>
                freeSpots !== null ? Math.min(n + 1, freeSpots) : n + 1,
              )
            }
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] text-lg font-bold text-white/80 transition hover:bg-white/[0.1] active:scale-95"
            aria-label="Mehr"
          >
            +
          </button>
        </div>
        <p className="hint">
          Dich selbst mitzählen.
          {freeSpots !== null && ` Noch ${freeSpots} Plätze frei.`}
        </p>
      </div>

      <div>
        <label className="label">Nachricht an den Host</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Hey! Wir würden gern vorbeikommen…"
          className="field resize-none"
        />
      </div>

      {errorMsg && (
        <p className="rounded-2xl border border-pink-400/40 bg-pink-500/15 px-4 py-3 text-sm text-pink-100">
          {errorMsg}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Wird gesendet…" : "Anfrage senden"}
      </button>
    </form>
  );
}
