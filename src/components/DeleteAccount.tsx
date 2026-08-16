"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CONFIRM_WORD = "LÖSCHEN";

/**
 * Selbstbedienung zur Kontolöschung (DSGVO Art. 17). Zweistufig: erst
 * Klarheit über die Folgen, dann eine Bestätigung, die man nicht aus
 * Versehen abschickt – dafür das Tippen des Bestätigungsworts statt nur
 * eines zweiten Klicks, weil sich das hier nicht rückgängig machen lässt.
 */
export function DeleteAccount() {
  const supabase = createClient();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function reset() {
    setOpen(false);
    setConfirmText("");
    setErrorMsg(null);
  }

  async function handleDelete() {
    setBusy(true);
    setErrorMsg(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setErrorMsg("Deine Sitzung ist abgelaufen – bitte neu einloggen und erneut versuchen.");
      setBusy(false);
      return;
    }

    const res = await fetch("/api/delete-account", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErrorMsg(
        json.error ??
          "Konnte dein Konto nicht löschen. Schreib uns direkt, dann erledigen wir es von Hand.",
      );
      setBusy(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-white/30 underline-offset-4 transition hover:text-pink-200 hover:underline"
      >
        Konto endgültig löschen
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-pink-400/40 bg-pink-500/[0.08] p-4">
      <p className="text-sm font-semibold">Konto wirklich endgültig löschen?</p>
      <p className="text-xs leading-relaxed text-white/60">
        Dein Profil, alle deine Partys samt Fotos und Adressen, deine
        Beitrittsanfragen und alle Bewertungen werden unwiderruflich entfernt.
        Das lässt sich nicht rückgängig machen und nicht wiederherstellen.
      </p>

      <div>
        <label className="label">
          Zur Bestätigung <span className="font-mono">{CONFIRM_WORD}</span> eintippen
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="field text-sm"
          placeholder={CONFIRM_WORD}
          autoComplete="off"
        />
      </div>

      {errorMsg && <p className="text-xs leading-relaxed text-pink-200">{errorMsg}</p>}

      <div className="flex gap-2">
        <button onClick={reset} disabled={busy} className="btn-ghost flex-1 py-2.5 text-sm">
          Abbrechen
        </button>
        <button
          onClick={handleDelete}
          disabled={busy || confirmText.trim().toUpperCase() !== CONFIRM_WORD}
          className="flex-1 rounded-2xl bg-lobby-pink py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
        >
          {busy ? "Wird gelöscht…" : "Endgültig löschen"}
        </button>
      </div>
    </div>
  );
}
